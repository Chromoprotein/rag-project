import csv
from sentence_transformers import SentenceTransformer, util
import torch
from openai import OpenAI

client = OpenAI()

# Load embeddings and embeddings model
bi_encoder = SentenceTransformer('paraphrase-multilingual-mpnet-base-v2')
semantic_search_model = torch.load('semantic_search_model.pt')

# Load facts dataset
passages = []
with open('ragdata.csv') as csv_file:
    csv_reader = csv.reader(csv_file)
    for row in csv_reader:
        passages.append(row[0])

def generate_answer(user_prompt: str) -> str:

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

    # clean up model output
    query_text = query_response.choices[0].message.content.strip()
    queries = [q.strip("- ").strip() for q in query_text.split("\n") if q.strip()]
    print("\nGenerated queries:", queries)

    # --- 2. Retrieve relevant context ---

    retrieved_passages = []

    for query in queries:
        question_embedding = bi_encoder.encode_query(query, convert_to_tensor=True)

        hits = util.semantic_search(question_embedding, semantic_search_model, top_k=5)[0]

        for hit in hits:
            retrieved_passages.append(passages[hit["corpus_id"]])

    # remove duplicates by turning into a dictionary and merge into context
    context = "\n".join(list(dict.fromkeys(retrieved_passages)))

    print(retrieved_passages)

    # --- 3. Generate writing with retrieved context ---
    writing_prompt = f"""
    You may use the context below to stay consistent with story facts, but write naturally. If the context seems irrelevant, you may ignore them.
    Context:
    {context}

    User prompt:
    {user_prompt}
    """

    writing_response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a writing assistant for a sci-fi novel."},
            {"role": "user", "content": writing_prompt}
        ]
    )

    result = writing_response.choices[0].message.content.strip()
    return result