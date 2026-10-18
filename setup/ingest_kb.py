"""Carga la base de conocimiento de UFit (data/kb/*.md) en Qdrant.

Misma lógica que setup/qdrant-db.ipynb del curso: chunking por headers de
markdown, contenido enriquecido con [Documento]/[Titulo]/[Subtitulo] y
embeddings text-embedding-3-small.

Uso (desde la raíz del repo):
    backend/.venv/bin/python setup/ingest_kb.py
Lee OPENAI_API_KEY, QDRANT_URL, QDRANT_KEY y QDRANT_COLLECTION_NAME de backend/.env.
"""
import os
from pathlib import Path
from typing import Any, Dict, List

from dotenv import load_dotenv
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from langchain_text_splitters import MarkdownHeaderTextSplitter

ROOT = Path(__file__).resolve().parents[1]
KB_DIR = ROOT / "data" / "kb"
load_dotenv(ROOT / "backend" / ".env")

HEADERS = [("#", "Header 1"), ("##", "Header 2"), ("###", "Header 3")]


def build_enriched_content(content: str, metadata: dict, document_name: str) -> str:
    """Antepone documento y headers al chunk para mejorar la búsqueda semántica."""
    parts = [f"[Documento: {document_name}]"]
    for i in range(1, 4):
        header = metadata.get(f"Header {i}")
        if header:
            parts.append(f"[Titulo: {header}]" if i == 1 else f"[Subtitulo: {header}]")
    return "".join(parts) + " " + content


def load_chunks() -> List[Dict[str, Any]]:
    splitter = MarkdownHeaderTextSplitter(HEADERS)
    chunks = []
    for md_file in sorted(KB_DIR.glob("*.md")):
        splits = splitter.split_text(md_file.read_text(encoding="utf-8"))
        for i, doc in enumerate(splits):
            chunks.append(
                {
                    "content": build_enriched_content(doc.page_content, doc.metadata, md_file.stem),
                    "metadata": {
                        **doc.metadata,
                        "source_file": md_file.name,
                        "document_name": md_file.stem,
                        "chunk_index": i,
                    },
                }
            )
        print(f"Procesado: {md_file.name} - {len(splits)} chunks")
    return chunks


def main() -> None:
    collection = os.environ["QDRANT_COLLECTION_NAME"]
    chunks = load_chunks()
    docs = [Document(page_content=c["content"], metadata=c["metadata"]) for c in chunks]

    QdrantVectorStore.from_documents(
        docs,
        OpenAIEmbeddings(model="text-embedding-3-small"),
        url=os.environ["QDRANT_URL"],
        api_key=os.environ["QDRANT_KEY"],
        collection_name=collection,
        force_recreate=True,  # re-ejecutable: recrea la colección desde cero
    )
    print(f"\n{len(docs)} chunks cargados en la colección '{collection}'")


if __name__ == "__main__":
    main()
