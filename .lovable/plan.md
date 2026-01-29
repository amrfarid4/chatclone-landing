

# Connect Chat Interface to Backend API

Connect the Dyne Copilot frontend to your FastAPI backend running at `localhost:8000`.

---

## Overview

| Current State | After Changes |
|---------------|---------------|
| Mock AI responses (hardcoded text) | Real API calls to `/ask` endpoint |
| No error handling | Graceful error messages |
| No conversation history sent | Full conversation context included |

---

## Changes Required

### 1. Update ChatInterface.tsx

Replace the mock response logic with real API calls:

- Send POST request to `http://localhost:8000/ask`
- Include question, branch_id, and conversation history
- Parse the `answer` field from response
- Add error handling with user-friendly message

### 2. Create API Configuration

Add a config file for the API base URL:
- Default to `localhost:8000` for development
- Easy to update when deploying to production

---

## API Integration Details

**Endpoint:** `POST /ask`

**Request body:**
```json
{
  "question": "Why is GMV down this week?",
  "branch_id": "all",
  "conversation_history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response:**
```json
{
  "answer": "## Yesterday's GMV...",
  "evidence": { ... },
  "timestamp": "2026-01-29T23:44:50"
}
```

---

## Error Handling

| Scenario | User Sees |
|----------|-----------|
| Network error | "Sorry, I couldn't connect to the server. Please check your connection." |
| API error (500) | "Sorry, I encountered an error. Please try again." |
| Empty response | "I couldn't generate a response. Please try rephrasing." |

---

## Files to Modify

1. **src/lib/api.ts** (new) - API configuration and helper functions
2. **src/components/chat/ChatInterface.tsx** - Replace mock logic with API calls

---

## Important Notes

**Localhost Limitation:**
- Lovable's preview runs in a sandboxed iframe
- It cannot directly call `localhost:8000` on your machine
- For testing, you'll need to either:
  - Use **ngrok** to expose your local API (`ngrok http 8000`)
  - Deploy the backend to Railway/Render first

**CORS:**
Your backend already has CORS configured for `*.lovable.app` and `*.lovable.dev`, so once deployed, it should work seamlessly.

---

## Technical Implementation

The `handleSendMessage` function will:

1. Create user message and add to state immediately
2. Set loading state to true
3. Call the API with fetch()
4. Parse JSON response and extract `answer` field
5. Create assistant message with the answer
6. Handle errors gracefully
7. Reset loading state

