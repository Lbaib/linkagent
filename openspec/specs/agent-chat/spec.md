# Purpose
TBD

## Requirements

### Requirement: Context Roaming
The system SHALL automatically load the prior AI conversation history when a human agent accepts a session.

#### Scenario: Agent accepts a chat
- **WHEN** an agent is assigned a customer
- **THEN** they see the full history of the customer's interaction with the AI.

### Requirement: Two-way Real-time Chat
The system SHALL route messages instantly between the human agent and the customer via the Chat-Server.

#### Scenario: Agent replies
- **WHEN** the agent types and sends a message
- **THEN** it is immediately delivered to the customer via WebSocket.
