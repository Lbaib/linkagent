export interface AiAskRequest {
  query: string;
}

export interface AiAskResponse {
  answer: string;
  success: boolean;
  message?: string;
}

// In development, the Vite proxy might not be configured for /api/ai
// Or we can hit the backend directly if CORS allows.
// We'll use the absolute URL for safety during this prototyping phase.
const BASE_URL = 'http://127.0.0.1:8080';

export const askAiAssistant = async (query: string): Promise<string> => {
  try {
    const response = await fetch(`${BASE_URL}/api/ai/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Attempt to parse JSON. Depending on backend implementation, it might be a plain string or JSON.
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return data.answer || data.message || text;
    } catch {
      // If it's not JSON, return the raw text
      return text;
    }
  } catch (error) {
    console.error('AI Assistant API Error:', error);
    throw error;
  }
};
