# Visitor Chat Experience Design

## Overview
This document specifies the design for connecting the frontend `VisitorClient` component to the actual backend systems, transitioning away from the simulated frontend data context (`SimulationContext`). It implements a real-time WebSocket connection using `Zustand` for state management, enabling AI streaming text, manual and automatic "Transfer to Agent" routing, and persistent chat states.

## Architecture

### Frontend State Management (Zustand)
Given the high-frequency UI updates caused by AI streaming responses (typewriter effect), `Zustand` will be used as the state management library. This prevents the widespread React Component re-renders that occur when relying entirely on a global React Context.

**Store structure (`useChatStore`)**:
- `wsStatus`: 'connecting' | 'connected' | 'disconnected'
- `sessionStatus`: 'ai_chat' | 'queuing' | 'agent_chat' | 'offline_leave'
- `messages`: Array of message objects (includes `isStreaming` flag for UI animation)
- Actions: `connect()`, `disconnect()`, `sendMessage()`, `requestTransfer()`

### Communication Protocol
All communication (AI Q&A and Human Agent Chat) will occur over a single, persistent WebSocket connection established when the visitor opens the widget or visits the page. 

**WebSocket Payload Format**:
```json
{
  "type": "<ACTION_TYPE>",
  "payload": { ... }
}
```

**Client -> Server Actions**:
- `CHAT`: Send a message to the AI or current human agent.
- `TRANSFER_AGENT`: Explicit request from the visitor to speak to a human.

**Server -> Client Actions**:
- `AI_STREAM`: Incoming stream chunks from the AI RAG service (contains `isDone` boolean to signal stream completion).
- `STATUS_UPDATE`: Notification of session state changes (e.g., entered queue, queue position updated, agent joined).

## Core Workflows

### 1. AI Streaming Chat
1. Visitor types a query and submits.
2. `useChatStore` sends a `CHAT` message over WebSocket.
3. Server routes this to `ai-rag-service` which queries PostgreSQL (pgvector).
4. Server streams back `AI_STREAM` events.
5. Zustand store appends chunks to the last AI message in the `messages` array, triggering granular updates in `VisitorClient`.

### 2. Transfer to Agent (Routing)
**Triggers**:
- **Manual**: Visitor clicks the "转人工" (Transfer) button.
- **Automatic**: AI determines its confidence is too low or explicitly decides to transfer the user based on intent.

**Flow**:
1. Client sends `TRANSFER_AGENT` (if manual) or Server initiates transfer (if automatic).
2. Server responds with `STATUS_UPDATE` `payload: { status: 'queuing', position: N }`.
3. Client disables input and displays the Queue UI.
4. When an agent accepts, Server sends `STATUS_UPDATE` `payload: { status: 'agent_chat' }`.
5. Client restores input, updates the UI header to indicate Human Agent, and all subsequent `CHAT` payloads are routed to the human agent.

## Components Affected
- `src/components/VisitorClient.tsx`: Needs refactoring to replace `useSimulation()` with `useChatStore()`.
- `src/store/chatStore.ts` (NEW): Zustand store implementation.
- `package.json`: Add `zustand` as a dependency.

## Error Handling & Edge Cases
- **Connection Loss**: If the WebSocket drops, the store transitions to `disconnected`. A reconnection mechanism (with exponential backoff) will attempt to restore the socket. The UI will disable input and show a "Disconnected/Reconnecting" state.
- **Offline Agents**: If a transfer is requested but no agents are online, the Server sends `STATUS_UPDATE` `payload: { status: 'offline_leave' }`. The Client renders the offline ticket submission form.
