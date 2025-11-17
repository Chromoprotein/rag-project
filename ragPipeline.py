import os
import json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from openai import OpenAI
from fact_utils import load_facts
import logging

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s',
    datefmt='%H:%M:%S'
)

client = OpenAI()
bi_encoder = SentenceTransformer("all-MiniLM-L6-v2")

# Paths
BASE = os.path.dirname(__file__)
EMBED_PATH = os.path.join(BASE, "embeddings.npy")
INDEX_PATH = os.path.join(BASE, "faiss_index.index")

passages = []
embeddings = None
index = None

def build_embeddings_and_index():
    # Rebuild embeddings and FAISS index from scratch.
    global passages, embeddings, index

    logging.info("Loading facts and rebuilding embeddings/index…")
    facts = load_facts()
    passages = [f["text"] for f in facts if f["text"]]

    if not passages:
        embeddings = np.zeros((0, bi_encoder.get_sentence_embedding_dimension()), dtype="float32")
        index = faiss.IndexHNSWFlat(embeddings.shape[1], 32)  # empty HNSW index
        return

    # Compute embeddings
    embeddings = bi_encoder.encode(passages, batch_size=32, convert_to_tensor=False)
    embeddings = embeddings.astype("float32")
    np.save(EMBED_PATH, embeddings)

    # Build HNSW index
    dim = embeddings.shape[1]
    index = faiss.IndexHNSWFlat(dim, 32)  # 32 neighbors in HNSW graph
    index.hnsw.efConstruction = 200
    index.add(embeddings)
    faiss.write_index(index, INDEX_PATH)

    logging.info(f"Built index with {len(passages)} passages.")

def ensure_embeddings_up_to_date():
    # Check if CSV changed; rebuild embeddings/index if needed.
    global passages

    facts = load_facts()
    current_texts = [f["text"] for f in facts if f["text"]]

    if passages != current_texts or embeddings is None or index is None:
        build_embeddings_and_index()
    else:
        logging.info("No changes in facts. Using cached embeddings/index.")

def retrieve(query, top_k=5):

    if len(passages) == 0:
        return []

    query_vec = bi_encoder.encode(
        query,
        convert_to_tensor=False
    ).astype("float32").reshape(1, -1)

    distances, indices = index.search(query_vec, top_k)
    results = []
    for i in indices[0]:
        if i < len(passages):
            results.append(passages[i])
    return results

def generate_queries_and_context_stream(user_prompt: str):

    ensure_embeddings_up_to_date()

    # --- 1. Generate related queries using GPT ---
    query_prompt = f"""
    The user is writing a sci-fi novel. Based on their writing prompt, write up to 3 short factual search queries that would help find relevant background information about the story's characters, universe, or plot.
    Keep them concise and simple.

    Writing prompt: "{user_prompt}"
    """
    query_response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You have access to a data set containing facts about a sci-fi novel, including facts about the characters, the setting, and the plot. You write search queries that help find useful context and details from the database to fill in information missing from the user's writing prompt. The search queries can, for example, ask who a character is, what the characters' relationship is like, or what a place or an item is like."},
            {"role": "user", "content": query_prompt}
        ]
    )

    query_text = query_response.choices[0].message.content.strip()
    queries = [q.strip("- ").strip() for q in query_text.split("\n") if q.strip()]
    if not queries:
        queries = [user_prompt]

    # stream the queries
    yield ("queries", queries)

    # --- 2. Retrieve relevant context (streamed) ---
    seen = set()
    count = 0

    for q in queries:
        for passage in retrieve(q):
            if passage not in seen:
                seen.add(passage)
                yield ("context", passage)
                count += 1

            if count >= 20:
                return

def stream_generated_text(user_prompt, context):

    writing_prompt = f"""
    You may use the context below to stay consistent with story facts.
    Context:
    {context}

    User prompt:
    {user_prompt}
    """

    response_stream = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a writing assistant for a sci-fi novel. Format your writing using markdown."},
            {"role": "user", "content": writing_prompt}
        ],
        stream=True
    )

    for chunk in response_stream:
        delta = chunk.choices[0].delta
        text = getattr(delta, "content", "")
        if text:
            yield text