# Proposal: AI Agent Integration

## Intent

Implement a 24/7 AI chat widget on the Syntra Labs website to engage visitors, answer FAQs, qualify leads, and automatically sync them to a Notion CRM while notifying the sales team via Resend.

## Scope

### In Scope
- **Chat Widget**: Premium HTML/CSS/JS frontend widget embedded on the website with smooth transitions and glassmorphism.
- **Node.js Backend**: Express server orchestrating LLM completions, Notion CRM syncing, and email notifications.
- **Lead Capture & Sync**: Captures Name, Company, Email, Phone, Website, Sector, Goals, and Timeframe. Automatically inserts into Notion database with status "NUEVO LEAD".
- **Notifications**: Instant lead details email sent to `info@syntralabs.es` via Resend API.

### Out of Scope
- Direct appointment scheduling or calendar sync.
- Direct automated quote creation.
- WhatsApp automation, voice, or phone calls.

## Approach

- **Frontend**: Lightweight, self-contained custom web component with clean UI, floating icon, and chat panel.
- **Backend (Express)**:
  - `/api/chat`: Communicates with LLM using base prompt instructions and knowledge base.
  - `/api/lead`: Receives qualified leads, pushes to Notion CRM, and sends notification email via Resend.
- **Data Persistence**: Leads are synced to Notion. A local JSON fallback log will be maintained for recovery.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `public/` (or web root) | Modified | Integration of the JS chat widget script on existing pages. |
| `src/widget/` | New | Frontend chat UI components (HTML, CSS, JS). |
| `src/server/` | New | Node.js Express server, Notion, Resend, and LLM routes. |
| `package.json` | Modified | Add dependencies: `express`, `@notionhq/client`, `resend`, `dotenv`, and AI SDK. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| API Outages (Notion/Resend) | Low | Local file log (`leads_fallback.json`) fallback to prevent data loss. |
| Prompt injection / Off-topic abuse | Med | High-rigidity system prompts limiting agent responses strictly to Syntra Labs scope. |

## Rollback Plan

1. Remove the chat widget script tag from the website's HTML templates.
2. Stop the Node.js backend process and remove it from service deployment.

## Dependencies

- Notion Developer API Token & Database ID
- Resend API Key
- LLM API Key (OpenAI or Gemini)

## Success Criteria

- [ ] Chatbot responds to FAQs correctly matching the provided knowledge base.
- [ ] Lead data captured by the agent successfully populates a new row in Notion with "NUEVO LEAD" status.
- [ ] Resend sends email notifications containing lead info to `info@syntralabs.es` within 10 seconds of lead submission.
