import csv
from sentence_transformers import SentenceTransformer
from openai import OpenAI
import os
import numpy as np
import faiss

client = OpenAI()

# Load embeddings model
bi_encoder = SentenceTransformer("all-MiniLM-L6-v2")

# Load facts dataset
dataset_path = os.path.join(os.path.dirname(__file__), "ragdata.csv")
passages = []
with open(dataset_path) as csv_file:
    csv_reader = csv.reader(csv_file)
    for row in csv_reader:
        passages.append(row[0])

#Precompute or load embeddings
embeddings_path = os.path.join(os.path.dirname(__file__), "embeddings.npy")
if not os.path.exists(embeddings_path):
    embeddings = bi_encoder.encode(
        passages, batch_size=32, convert_to_tensor=False, show_progress_bar=True)

    np.save(embeddings_path, embeddings)
else:
    embeddings = np.load(embeddings_path)

# Convert to float32 for FAISS
embeddings = embeddings.astype("float32")

index_path = os.path.join(os.path.dirname(__file__), "faiss_index.index")

if not os.path.exists(index_path):
    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)

    faiss.write_index(index, index_path)
else:
    index = faiss.read_index(index_path)

def retrieve(query, top_k=5):
    query_vec = bi_encoder.encode(
        query,
        convert_to_tensor=False
    ).astype("float32").reshape(1, -1)

    distances, indices = index.search(query_vec, top_k)

    return [passages[i] for i in indices[0]]

def generate_queries_and_context(user_prompt: str):

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

    # --- 2. Retrieve relevant context ---
    retrieved_passages = []
    for q in queries:
        retrieved_passages.extend(retrieve(q))

    context = "\n".join(list(dict.fromkeys(retrieved_passages))[:20])
    return queries, context

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