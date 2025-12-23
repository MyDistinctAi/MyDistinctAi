# API Reference

## Authentication

All API routes require authentication via Supabase session cookies (except auth routes).

---

## Auth Routes

### POST /api/auth/login
Login with email/password.

### POST /api/auth/register  
Create new account.

### POST /api/auth/logout
End session.

---

## Models

### GET /api/models
List all user's models.

**Response**:
```json
[
  {
    "id": "uuid",
    "name": "My Model",
    "description": "...",
    "status": "ready",
    "documentCount": 5,
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

### POST /api/models
Create new model.

### GET /api/models/[id]
Get model details.

### DELETE /api/models/[id]
Delete model and all associated data.

---

## Training Data

### POST /api/training/upload
Upload training file.

**Request**: `multipart/form-data`
- `file`: File (PDF, DOCX, TXT, MD, CSV)
- `modelId`: UUID

### GET /api/training/files?modelId=...
List files for model.

### DELETE /api/training/files/[id]
Delete training file.

---

## Chat

### POST /api/chat
Send chat message (streaming).

**Request**:
```json
{
  "modelId": "uuid",
  "message": "Hello",
  "sessionId": "uuid"
}
```

**Response**: Server-Sent Events (SSE)

---

## Conversations

### GET /api/conversations
List all conversations.

### GET /api/conversations/[id]
Get conversation with messages.

### PATCH /api/conversations/[id]
Update conversation title.

### DELETE /api/conversations/[id]
Delete conversation.

### GET /api/conversations/[id]/export
Export conversation (JSON, TXT, or MD format).

---

## User Settings

### GET /api/user/settings
Get user settings.

### PATCH /api/user/settings
Update settings.

---

## Branding

### GET /api/branding
Get branding config for domain.

### PATCH /api/branding
Update branding settings.
