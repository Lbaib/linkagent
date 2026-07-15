## Context

This project initializes the LinkedAgent intelligent customer service platform. The platform connects customers with services by utilizing modern frontend UI, a robust Java microservices backend, and LLMs via RAG. It handles both AI-driven Q&A and human agent fallback seamlessly, preventing long waits and improving agent efficiency.

## Goals / Non-Goals

**Goals:**
- Implement a multi-service architecture using Spring Cloud.
- Provide a scalable WebSocket-based connection manager (Chat-Server) independent of the HTTP gateway.
- Create an AI RAG engine leveraging PostgreSQL's `pgvector`.
- Enable seamless transfer of chat contexts between AI and human agents.

**Non-Goals:**
- Self-hosting the base LLM models (we will use external public API models).
- Complex multi-tenant SaaS features for the initial release (focus on single-tenant high availability first).

## Decisions

- **Independent Chat-Server**: The WebSocket connections will connect directly to an independent `Chat-Server` bypassing the HTTP API Gateway. *Rationale*: Prevents long-lived connections from exhausting the main HTTP routing gateway resources.
- **PostgreSQL with pgvector**: Using PostgreSQL for both relational data and vector storage. *Rationale*: Simplifies operations and reduces the number of databases to maintain, compared to using a separate vector database.
- **Redis for State and Message Queuing**: Used for high-frequency routing, session states, and asynchronous task decoupling. *Rationale*: Fast and lightweight, with an option to migrate to Kafka/RocketMQ if traffic scales significantly.
- **OpenFeign for Internal Communication**: Synchronous internal calls will use OpenFeign. *Rationale*: Reduces development complexity and increases iteration speed.

## Risks / Trade-offs

- **Risk: Redis as a Message Broker**: At extremely high loads, Redis might not provide the durability of a dedicated message queue like Kafka.
  - *Mitigation*: The code is designed with abstract interfaces, allowing a smooth migration to RocketMQ/Kafka when needed.
- **Risk: LLM API Rate Limits or Outages**: Depending on external LLMs exposes the system to third-party availability.
  - *Mitigation*: Implementation of circuit breakers (e.g., Sentinel) and a fallback directly to the human agent queue when the AI service is degraded.
