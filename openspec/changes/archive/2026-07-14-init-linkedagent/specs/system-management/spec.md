## ADDED Requirements

### Requirement: Knowledge Base Document Upload
The system SHALL allow administrators to upload documents for the knowledge base.

#### Scenario: Admin uploads a PDF
- **WHEN** an admin uploads a support manual
- **THEN** the system parses, slices, and vectors the text into PostgreSQL.

### Requirement: Agent Account Management
The system SHALL provide CRUD operations for customer service agent accounts.

#### Scenario: Creating a new agent
- **WHEN** an admin creates a new agent profile
- **THEN** the agent can log in and accept customer sessions.
