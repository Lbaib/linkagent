# Purpose
TBD

## Requirements

### Requirement: Anonymous Visitor Initialization
The system SHALL provide an API to initialize anonymous visitors with a temporary JWT token.

#### Scenario: First time visit
- **WHEN** a visitor loads the chat widget without being logged in
- **THEN** the system generates and returns a temporary anonymous JWT.

### Requirement: WebSocket Connection Authentication
The system SHALL authenticate WebSocket connections directly at the Chat-Server using the provided JWT.

#### Scenario: Connecting with valid JWT
- **WHEN** a client initiates a WebSocket connection with a valid JWT in the query parameters
- **THEN** the Chat-Server accepts the connection and establishes a session.
