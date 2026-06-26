(function () {
  // Prevent duplicate initialization
  if (window.SyntraChatInitialized) return;
  window.SyntraChatInitialized = true;

  // Extract the backend URL dynamically using document.currentScript.src
  let backendUrl = '';
  if (document.currentScript && document.currentScript.src) {
    try {
      const urlObj = new URL(document.currentScript.src);
      backendUrl = urlObj.origin;
    } catch (e) {
      console.error('Error parsing script source URL:', e);
    }
  }

  // Load styling dynamically
  const linkElement = document.createElement('link');
  linkElement.rel = 'stylesheet';
  linkElement.href = backendUrl + '/css/widget.css';
  document.head.appendChild(linkElement);

  // HTML templates for the widget
  const triggerHtml = `
    <div class="syntra-chat-trigger" id="syntra-trigger">
      <!-- Chat icon (bubble) -->
      <svg class="syntra-icon-chat" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <!-- Close icon (X) -->
      <svg class="syntra-icon-close" viewBox="0 0 24 24">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </div>
  `;

  const windowHtml = `
    <div class="syntra-chat-window" id="syntra-window">
      <div class="syntra-chat-header">
        <div class="syntra-chat-logo">S</div>
        <div class="syntra-chat-info">
          <h3 class="syntra-chat-title">Syntra Labs</h3>
          <div class="syntra-chat-status">
            <span class="syntra-status-dot"></span>
            <span>Agente IA online</span>
          </div>
        </div>
      </div>
      <div class="syntra-chat-messages" id="syntra-messages"></div>
      <form class="syntra-chat-input-form" id="syntra-input-form">
        <input type="text" class="syntra-chat-input" id="syntra-input" placeholder="Escribe un mensaje..." autocomplete="off" />
        <button type="submit" class="syntra-chat-send-btn" id="syntra-send-btn" disabled>
          <!-- Paper plane send icon -->
          <svg viewBox="0 0 24 24">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  `;

  // Inject widget container on DOM load
  function initWidget() {
    const container = document.createElement('div');
    container.id = 'syntra-chat-container';
    container.innerHTML = triggerHtml + windowHtml;
    document.body.appendChild(container);

    const trigger = document.getElementById('syntra-trigger');
    const chatWindow = document.getElementById('syntra-window');
    const input = document.getElementById('syntra-input');
    const sendBtn = document.getElementById('syntra-send-btn');
    const form = document.getElementById('syntra-input-form');
    const messagesContainer = document.getElementById('syntra-messages');

    let history = [];
    let isOpen = false;
    let isLoading = false;
    let isLeadRegistered = false;

    // Set greeting
    const greetingText = "¡Hola! Bienvenido a Syntra Labs. Soy tu asistente virtual. ¿En qué podemos ayudarte hoy? (Diseño web, Agentes IA, Automatizaciones...)";
    appendMessage('bot', greetingText);

    // Toggle Chat Window Open/Close
    trigger.addEventListener('click', () => {
      isOpen = !isOpen;
      if (isOpen) {
        trigger.classList.add('open');
        chatWindow.classList.add('open');
        setTimeout(() => input.focus(), 150);
      } else {
        trigger.classList.remove('open');
        chatWindow.classList.remove('open');
      }
    });

    // Toggle Send Button visibility/status
    input.addEventListener('input', () => {
      sendBtn.disabled = input.value.trim().length === 0 || isLoading;
    });

    // Form Submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const message = input.value.trim();
      if (!message || isLoading) return;

      // Add user message
      appendMessage('user', message);
      input.value = '';
      sendBtn.disabled = true;

      // Show loader
      isLoading = true;
      showTypingIndicator();

      try {
        const response = await fetch(backendUrl + '/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            history
          }),
        });

        const data = await response.json();
        hideTypingIndicator();

        if (response.ok && data.response) {
          appendMessage('bot', data.response);

          // Update conversation history for next exchange
          history.push({ role: 'user', content: message });
          history.push({ role: 'assistant', content: data.response });

          // If lead registered, handle special states
          if (data.leadStatus === 'registered') {
            isLeadRegistered = true;
            input.placeholder = '¡Tu solicitud ha sido registrada!';
            input.disabled = true;
            sendBtn.disabled = true;
            
            // Add a visual tag in the conversation
            appendSystemNotice('Contacto Registrado ✔');
          }
        } else {
          appendMessage('bot', data.error || 'Disculpa, hubo un problema al procesar el mensaje. Por favor intenta de nuevo.');
        }
      } catch (error) {
        console.error('Widget chat submission error:', error);
        hideTypingIndicator();
        appendMessage('bot', 'No he podido conectarme con el servidor. Revisa tu conexión.');
      } finally {
        isLoading = false;
      }
    });

    /**
     * Helper to append message bubbles.
     */
    function appendMessage(sender, text) {
      const row = document.createElement('div');
      row.className = `syntra-message-row ${sender}`;

      const bubble = document.createElement('div');
      bubble.className = 'syntra-message-bubble';
      bubble.innerHTML = formatMessageText(text);

      row.appendChild(bubble);
      messagesContainer.appendChild(row);
      scrollToBottom();
    }

    /**
     * Helper to show system alerts/notices inside conversation list.
     */
    function appendSystemNotice(text) {
      const notice = document.createElement('div');
      notice.style.textAlign = 'center';
      notice.style.fontSize = '12px';
      notice.style.color = '#10b981';
      notice.style.fontWeight = '600';
      notice.style.margin = '8px 0';
      notice.style.letterSpacing = '0.5px';
      notice.textContent = text.toUpperCase();
      messagesContainer.appendChild(notice);
      scrollToBottom();
    }

    /**
     * Shows a pulsing typing indicator bubble.
     */
    function showTypingIndicator() {
      const row = document.createElement('div');
      row.className = 'syntra-message-row bot';
      row.id = 'syntra-typing-bubble';

      const indicator = document.createElement('div');
      indicator.className = 'syntra-typing-indicator';
      indicator.innerHTML = '<span></span><span></span><span></span>';

      row.appendChild(indicator);
      messagesContainer.appendChild(row);
      scrollToBottom();
    }

    /**
     * Removes the typing indicator bubble.
     */
    function hideTypingIndicator() {
      const typingBubble = document.getElementById('syntra-typing-bubble');
      if (typingBubble) {
        typingBubble.remove();
      }
    }

    /**
     * Safely scrolls to the bottom of the container.
     */
    function scrollToBottom() {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * Formats incoming LLM text response into HTML paragraphs and lists.
     */
    function formatMessageText(text) {
      // Escape HTML to prevent XSS injection
      let escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
      
      // Formatting markdown bold tags **text** -> <strong>text</strong>
      escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      const lines = escaped.split('\n');
      let html = '';
      let inList = false;

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          if (!inList) {
            html += '<ul style="margin: 6px 0; padding-left: 20px;">';
            inList = true;
          }
          // Slice the bullet marker
          const listText = trimmed.substring(2);
          html += `<li style="margin-bottom: 4px;">${listText}</li>`;
        } else {
          if (inList) {
            html += '</ul>';
            inList = false;
          }
          if (trimmed === '') {
            html += '<div style="height: 6px;"></div>';
          } else {
            html += `<p style="margin: 0 0 8px 0;">${line}</p>`;
          }
        }
      }
      
      if (inList) {
        html += '</ul>';
      }

      return html;
    }
  }

  // Load widget when page is fully structured
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
})();
