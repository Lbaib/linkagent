# Purpose
TBD

## Requirements

### Requirement: Message Reception and Persistence
The system SHALL asynchronously persist user messages received via WebSocket to PostgreSQL via Redis buffering.

#### Scenario: Receiving a message
- **WHEN** a user sends a chat message
- **THEN** the message is quickly buffered in Redis and asynchronously saved to PostgreSQL.

### Requirement: Knowledge Retrieval (RAG)
The system SHALL convert queries to embeddings and retrieve relevant knowledge chunks from pgvector.

#### Scenario: Question asking
- **WHEN** the AI receives a user query
- **THEN** it performs a vector search to find relevant context before prompting the LLM.

### Requirement: Streaming Responses
The system SHALL stream LLM responses back to the client using pure WebSocket frames.

#### Scenario: AI generates a response
- **WHEN** the LLM generates tokens
- **THEN** they are immediately sent over the WebSocket to create a typewriter effect on the frontend.
