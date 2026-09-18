from fastapi import FastAPI
from app.api.routes import classification

app = FastAPI(title="EcoNexus AI Service", version="0.1.0")

app.include_router(classification.router, prefix="/classify", tags=["classification"])


@app.get("/health")
def health():
    return {"status": "ok"}
