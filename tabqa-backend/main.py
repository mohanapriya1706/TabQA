from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

app = FastAPI()

# Load embedding model
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# Global in-memory store (MVP)
documents = []
embeddings = None
index = None


class IndexRequest(BaseModel):
    text: str


class AskRequest(BaseModel):
    question: str


@app.post("/index")
def index_text(req: IndexRequest):
    global documents, embeddings, index

    # Simple chunking (MVP)
    chunks = req.text.split("\n")
    chunks = [c.strip() for c in chunks if len(c.strip()) > 50]

    if not chunks:
        return {"status": "no valid text"}

    documents = chunks
    print(chunks)
    print(f"Indexing {len(chunks)} chunks.")

    # Generate embeddings
    embeddings = embedding_model.encode(chunks)
    embeddings = np.array(embeddings).astype("float32")

    # Create FAISS index
    dim = embeddings.shape[1]
    print(f"Embedding dimension: {dim}")
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)

    return {"status": "indexed", "chunks": len(chunks)}


@app.post("/ask")
def ask_question(req: AskRequest):
    if index is None:
        return {"answer": "No page indexed yet."}

    # Embed question
    q_embedding = embedding_model.encode([req.question])
    q_embedding = np.array(q_embedding).astype("float32")

    # Search
    D, I = index.search(q_embedding, k=3)

    results = [documents[i] for i in I[0]]

    # Simple answer (MVP)
    answer = "\n\n".join(results)

    return {"answer": answer}
