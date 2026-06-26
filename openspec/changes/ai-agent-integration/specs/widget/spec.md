# Widget Specification

## Purpose
Floating premium chat widget embedded on the Syntra Labs website to engage visitors, answer FAQs, and collect lead data.

## Requirements

### Requirement: Floating Chat Interface
The widget MUST display as a floating button at the bottom-right of the page and toggle a glassmorphic chat window.

| Property | Rule |
|----------|------|
| Position | Fixed bottom-right corner (z-index: 1000). |
| Aesthetics | Glassmorphism card (backdrop-filter: blur) with smooth slide-in/fade transitions. |
| Toggle | Clicking the button toggles visibility of the chat panel. |

#### Scenario: Toggle Chat Panel
- GIVEN the chat widget is loaded on the page
- WHEN the user clicks the floating chat button
- THEN the chat panel MUST slide and fade into view
- AND the input field MUST auto-focus

### Requirement: Chat Stream & Interaction
The UI MUST allow users to send messages, see chat history, and view a typing indicator.

#### Scenario: Message Submission
- GIVEN the chat panel is open
- WHEN the user submits a message
- THEN the message MUST appear in the conversation thread
- AND the typing indicator MUST show while awaiting server response
- AND the window MUST auto-scroll to the latest message

---

## Technical Contracts

### DOM Integration
```html
<script src="/js/widget.js" defer></script>
```

### CSS Variables (Theming)
```css
:root {
  --chat-primary: hsl(220, 90%, 56%);
  --chat-bg: rgba(255, 255, 255, 0.7);
  --chat-blur: blur(12px);
  --chat-border: rgba(255, 255, 255, 0.3);
}
```
