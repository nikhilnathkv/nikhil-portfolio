# ADR-002 — Backend: FastAPI

- **Status:** Accepted
- **Context:** The portfolio is itself part of an AI-engineering showcase and
  will eventually host ML inference, RAG, and agents.
- **Decision:** Use **FastAPI** (Python) as the API layer.
- **Rationale:** A clean Python boundary for ML inference, RAG, agents, and data
  processing; first-class async, typing, and automatic OpenAPI docs.
- **Consequences:** A separate Python runtime alongside the Node frontend;
  worth it for the AI roadmap.
