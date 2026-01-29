

# Update API URL to LocalTunnel

A simple configuration change to point the frontend to your LocalTunnel URL.

---

## Change

**File:** `src/lib/api.ts`

**Current:**
```typescript
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
```

**New:**
```typescript
export const API_BASE_URL = import.meta.env.VITE_API_URL || "https://slimy-eels-drop.loca.lt";
```

---

## What This Does

- Routes all API calls through your LocalTunnel URL
- Allows the Lovable preview to connect to your local backend
- Falls back to environment variable if set (for production deployments)

