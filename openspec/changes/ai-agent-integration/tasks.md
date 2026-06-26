# Tasks: AI Agent Integration

## Phase 1: Infrastructure & Services
- [x] 1.1 Add dependencies to `package.json` (`express`, `@google/generative-ai`, `@notionhq/client`, `resend`, `dotenv`).
- [x] 1.2 Create `.env` and `.env.example` defining API keys for Gemini, Notion, and Resend.
- [x] 1.3 Create `src/server/services/fallback.service.js` to append failing leads to `leads_fallback.json`.
- [x] 1.4 Create `src/server/services/notion.service.js` to format and insert leads into Notion CRM.
- [x] 1.5 Create `src/server/services/resend.service.js` to email lead alerts to `info@syntralabs.es`.

## Phase 2: Core Express API & LLM
- [x] 2.1 Create `src/server/index.js` to initialize Express, parse JSON, and define routes.
- [x] 2.2 Create `src/server/controllers/lead.controller.js` for `/api/lead` manual submission and validation.
- [x] 2.3 Create `src/server/controllers/chat.controller.js` for `/api/chat` with Gemini SDK.
- [x] 2.4 Integrate system prompts and `register_lead` tool definitions in `chat.controller.js`.
- [x] 2.5 Wire Notion/Resend/Fallback services into the LLM `register_lead` tool invocation path.

## Phase 3: Frontend Widget
- [x] 3.1 Create `src/widget/widget.css` with a floating button and glassmorphic chat window layout.
- [x] 3.2 Create `src/widget/widget.js` managing chat UI state, message stream, and `/api/chat` calls.
- [x] 3.3 Add `register_lead` check in `widget.js` to handle lead state and response rendering.
- [x] 3.4 Modify `public/index.html` to inject `/js/widget.js` script and test element.

## Phase 4: Verification & Testing
- [x] 4.1 Test validation schema of `/api/lead` by posting empty fields and asserting HTTP 400.
- [x] 4.2 Test Notion / Resend failures by mocking API errors and verifying fallback logs in `leads_fallback.json`.
- [x] 4.3 Test end-to-end conversational flow, ensuring Gemini triggers `register_lead` and registers a lead correctly.
