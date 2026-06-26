# Server Specification

## Purpose
Backend Node.js Express API that manages AI completions, validates and registers leads in Notion CRM, sends email alerts via Resend, and implements local fallback logs.

## Requirements

### Requirement: FAQ Chat Completion (`/api/chat`)
The server MUST expose a `/api/chat` POST endpoint to process user messages using LLM.

#### Scenario: Normal Chat Exchange
- GIVEN the LLM API is active and healthy
- WHEN a POST request is received at `/api/chat` with valid message and history
- THEN the system MUST return HTTP 200 with the AI-generated reply matching the knowledge base

### Requirement: Lead Syncing & Notifications (`/api/lead`)
The server MUST expose a `/api/lead` POST endpoint to process, validate, sync leads to Notion CRM, and trigger Resend email alerts.

| Step | Action |
|------|--------|
| Validation | MUST enforce non-empty Name, Company, Email, Phone, Goals, and Timeframe. |
| Notion Sync | MUST insert lead into Notion CRM with status "NUEVO LEAD". |
| Email Alert | MUST send lead details to `info@syntralabs.es` via Resend API within 10s. |

#### Scenario: Successful Lead Registration
- GIVEN Notion and Resend APIs are online
- WHEN a POST request is received at `/api/lead` with valid lead data
- THEN the system MUST return HTTP 201 with success status
- AND Notion database MUST contain the new row and Resend MUST send the email alert

#### Scenario: Fallback Storage on API Failure
- GIVEN Notion CRM or Resend API is offline
- WHEN a POST request is received at `/api/lead` with valid lead data
- THEN the system MUST append the payload and error log to `leads_fallback.json`
- AND return HTTP 201 with `persisted: "fallback"` to prevent data loss

---

## Technical Contracts & Validations

### `/api/chat` Contract
- **Method**: POST
- **Request Schema**:
  ```json
  {
    "type": "object",
    "required": ["message", "history"],
    "properties": {
      "message": { "type": "string", "minLength": 1 },
      "history": {
        "type": "array",
        "items": {
          "type": "object",
          "required": ["role", "content"],
          "properties": {
            "role": { "type": "string", "enum": ["user", "assistant"] },
            "content": { "type": "string" }
          }
        }
      }
    }
  }
  ```
- **Response Schema (200 OK)**:
  ```json
  { "response": "string" }
  ```

### `/api/lead` Contract
- **Method**: POST
- **Request Schema**:
  ```json
  {
    "type": "object",
    "required": ["name", "company", "email", "phone", "goals", "timeframe"],
    "properties": {
      "name": { "type": "string", "minLength": 1 },
      "company": { "type": "string", "minLength": 1 },
      "email": { "type": "string", "format": "email" },
      "phone": { "type": "string", "minLength": 1 },
      "website": { "type": "string" },
      "sector": { "type": "string" },
      "goals": { "type": "string", "enum": ["Más clientes", "Más ventas", "Automatización", "Mejor imagen digital", "Otro"] },
      "timeframe": { "type": "string", "enum": ["Inmediatamente", "Este mes", "Próximos 3 meses"] }
    }
  }
  ```
- **Response Schema (201 Created)**:
  ```json
  {
    "success": true,
    "persisted": "notion" | "fallback"
  }
  ```
- **Response Schema (400 Bad Request)**:
  ```json
  { "success": false, "error": "string" }
  ```
