from sentence_transformers import SentenceTransformer
import csv
import torch

model_name = 'paraphrase-multilingual-mpnet-base-v2'
encoded_model_path = 'semantic_search_model.pt'
dataset_path = 'ragdata.csv'

bi_encoder = SentenceTransformer(model_name)

passages = []
with open(dataset_path) as csv_file:
    csv_reader = csv.reader(csv_file)
    for row in csv_reader:
        passages.append(row[0])
        
corpus_embeddings = bi_encoder.encode_document(
    passages, batch_size=32, convert_to_tensor=True, show_progress_bar=True)

torch.save(corpus_embeddings, encoded_model_path)