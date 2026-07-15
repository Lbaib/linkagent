## Why

To dramatically improve enterprise customer service efficiency by building a next-generation intelligent customer service platform. This system leverages RAG and large language models (LLMs) to intercept common inquiries, while providing a seamless fallback to human agents for complex issues.

## What Changes

- Initialize the microservice architecture based on Spring Cloud (API Gateway, Chat-Server, Customer-Service, AI-RAG-Service, System-Management).
- Implement an independent WebSocket Chat-Server to handle long connections, isolating them from HTTP traffic.
- Integrate PostgreSQL with `pgvector` for both relational data and high-dimensional vector storage for knowledge retrieval.
- Establish a Redis-based caching and message broker layer for routing, queuing, and high-frequency state management.
- Develop the core business flows including AI intelligent Q&A, human agent routing, and real-time chat with context roaming.

## Capabilities

### New Capabilities
- `client-auth`: Handles visitor identity initialization and WebSocket connection establishment with JWT.
- `ai-chat`: Covers the AI intelligent Q&A flow, including message processing, knowledge retrieval (RAG), and streaming model responses.
- `agent-routing`: Manages the logic for human agent takeover, load-based round-robin allocation, and customer queuing.
- `agent-chat`: Enables real-time two-way communication between human agents and customers with seamless context roaming.
- `system-management`: Provides backend management for knowledge base documents, agent accounts, and system configurations.

### Modified Capabilities

## Impact

- Establishes the foundational architecture and infrastructure for the entire LinkedAgent platform.
- Introduces new microservices that will act as the baseline for all future development.
- Sets up the core database schemas in PostgreSQL and caching structures in Redis.
