# Knowledge Base Management Design

## Overview
This feature completes the RAG (Retrieval-Augmented Generation) Admin Console by providing a user interface to view and manage (delete) uploaded documents, backed by real APIs from the `ai-rag-service`.

## Architecture

### Backend (`ai-rag-service`)
We will extend `AiController.java` to support two new endpoints, interacting with `DocumentChunkRepository`:
1. **List Documents:** `GET /api/ai/doc/list`
   - **Data Flow:** The repository will query PGVector for unique `document_name` entries and the count of their associated chunks.
   - **Response:** `[{"name": "file.pdf", "chunkCount": 42}]`
2. **Delete Document:** `DELETE /api/ai/doc?name={documentName}`
   - **Data Flow:** The repository will execute a delete query for all `DocumentChunk` entities matching the provided `document_name`.

### Frontend (`linkedagent-frontend`)
1. **API Layer (`src/api/adminApi.ts`)**
   - Implement `fetchDocuments()` and `deleteDocument(name: string)`.
   - Update tests.
2. **UI Component (`src/pages/AdminConsole/AdminConsole.tsx`)**
   - **State:** `documents` (array), `isLoadingDocs` (boolean).
   - **Lifecycle:** Fetch documents on mount, and re-fetch after a successful document upload or deletion.
   - **Layout:** The Admin Console will present a two-column layout. The left column will house the `FileUpload` component. The right column will transition from a static "How it works" banner to a dynamic "Uploaded Documents" list. Each list item will display the document name, chunk count, and a delete button (Trash icon).

## Data Flow
1. User uploads a file -> `POST /api/ai/doc/upload` -> On success, frontend triggers `fetchDocuments()`.
2. Frontend calls `GET /api/ai/doc/list` -> Renders list of documents.
3. User clicks delete on "file.pdf" -> `DELETE /api/ai/doc?name=file.pdf` -> On success, frontend triggers `fetchDocuments()`.

## Error Handling
- Backend will return `500 Internal Server Error` with a message if DB queries fail.
- Frontend will catch API errors and display a toast/inline error message on the Admin Console if fetching or deleting fails.

## Testing
- Backend: Relies on manual testing/integration testing.
- Frontend: Vitest (`AdminConsole.test.tsx`) will mock the new API calls and verify that the list renders and that the delete button triggers the API. TDD principles will be applied.
