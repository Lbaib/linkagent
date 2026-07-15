## 1. Project Initialization

- [x] 1.1 Create Spring Cloud multi-module project structure
- [x] 1.2 Initialize API Gateway, Chat-Server, Customer-Service, AI-RAG-Service, and System-Management services
- [x] 1.3 Setup Nacos discovery and configuration across all services

## 2. Infrastructure Integration

- [x] 2.1 Set up PostgreSQL and enable `pgvector` extension
- [x] 2.2 Configure Redis for caching, pub/sub, and queues
- [x] 2.3 Implement base OpenFeign clients for inter-service communication

## 3. Client Auth & Connection

- [x] 3.1 Implement anonymous JWT token generation API
- [x] 3.2 Implement WebSocket authentication via JWT in Chat-Server
- [x] 3.3 Create the independent WebSocket routing layer in Chat-Server

## 4. AI Chat Capabilities

- [x] 4.1 Implement message reception and Redis buffering
- [x] 4.2 Create async task to save buffered messages to PostgreSQL
- [x] 4.3 Integrate LLM external API client
- [x] 4.4 Implement knowledge chunk retrieval using `pgvector`
- [x] 4.5 Set up pure WebSocket streaming response from AI to client

## 5. Agent Routing & Queuing

- [x] 5.1 Create session state management (AI -> Queuing -> Agent)
- [x] 5.2 Implement round-robin agent allocation logic
- [x] 5.3 Build queue management in Redis for customers waiting
- [x] 5.4 Implement real-time queue position updates

## 6. Agent Chat Experience

- [x] 6.1 Implement API to fetch conversation context (AI chat history) for the agent
- [x] 6.2 Set up bidirectional routing for messages between agent and customer via Chat-Server
- [x] 6.3 Implement Ping/Pong keep-alive for agent and customer WebSocket connections

## 7. System Management

- [x] 7.1 Create agent account CRUD APIs
- [x] 7.2 Implement knowledge base document upload API
- [x] 7.3 Build the document parser, chunker, and vector embedding pipeline
