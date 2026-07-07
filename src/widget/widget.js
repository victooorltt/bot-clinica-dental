(function () {
  // Prevent duplicate initialization
  if (window.LuxChatInitialized) return;
  window.LuxChatInitialized = true;

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
    <div class="lux-chat-trigger" id="lux-trigger">
      <!-- Chat icon (bubble) -->
      <svg class="lux-icon-chat" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <!-- Close icon (X) -->
      <svg class="lux-icon-close" viewBox="0 0 24 24">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </div>
  `;

  const windowHtml = `
    <div class="lux-chat-window" id="lux-window">
      <div class="lux-chat-header">
        <div class="lux-chat-logo">
          <img src="${backendUrl}/logo.png" alt="Logo" />
        </div>
        <div class="lux-chat-info">
          <h3 class="lux-chat-title">Clínica Dental</h3>
          <div class="lux-chat-status">
            <span class="lux-status-dot"></span>
            <span>Agente IA online</span>
          </div>
        </div>
        <button class="lux-chat-close-btn" id="lux-close-btn" aria-label="Cerrar chat">
          <svg viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="lux-chat-toggle-container">
        <button class="lux-chat-toggle-btn active" id="lux-toggle-text">Texto 💬</button>
        <button class="lux-chat-toggle-btn" id="lux-toggle-voice">Voz 📞</button>
      </div>
      <div class="lux-chat-messages" id="lux-messages"></div>
      
      <!-- Voice Call Interface -->
      <div class="lux-voice-container" id="lux-voice-container" style="display: none;">
        <div class="lux-voice-status" id="lux-voice-status">Llamada no iniciada</div>
        <div class="lux-voice-visualizer" id="lux-voice-visualizer">
          <div class="lux-pulse-circle"></div>
          <div class="lux-phone-icon-wrapper">
             <svg class="lux-voice-phone-icon" viewBox="0 0 24 24" width="40" height="40" stroke="currentColor" fill="none" stroke-width="2">
               <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
             </svg>
          </div>
        </div>
        <button class="lux-voice-action-btn" id="lux-voice-btn">Iniciar Llamada</button>
      </div>

      <form class="lux-chat-input-form" id="lux-input-form">
        <input type="text" class="lux-chat-input" id="lux-input" placeholder="Escribe un mensaje..." autocomplete="off" />
        <button type="submit" class="lux-chat-send-btn" id="lux-send-btn" disabled>
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
    container.id = 'lux-chat-container';
    container.innerHTML = triggerHtml + windowHtml;
    document.body.appendChild(container);

    const trigger = document.getElementById('lux-trigger');
    const chatWindow = document.getElementById('lux-window');
    const input = document.getElementById('lux-input');
    const sendBtn = document.getElementById('lux-send-btn');
    const form = document.getElementById('lux-input-form');
    const messagesContainer = document.getElementById('lux-messages');
    const closeBtn = document.getElementById('lux-close-btn');

    // Toggle Text/Voice elements
    const toggleTextBtn = document.getElementById('lux-toggle-text');
    const toggleVoiceBtn = document.getElementById('lux-toggle-voice');
    const voiceContainer = document.getElementById('lux-voice-container');
    const voiceStatus = document.getElementById('lux-voice-status');
    const voiceBtn = document.getElementById('lux-voice-btn');

    let history = [];
    let isOpen = false;
    let isLoading = false;
    let isLeadRegistered = false;

    // Vapi State Variables
    let vapiInstance = null;
    let vapiConfig = null;
    let callState = 'idle'; // idle, connecting, active, error

    // Update Vapi Call state UI
    function setCallState(state, errorMsg = '') {
      callState = state;
      voiceContainer.className = `lux-voice-container ${state}`;
      
      if (state === 'idle') {
        voiceStatus.textContent = 'Llamada no iniciada';
        voiceStatus.className = 'lux-voice-status';
        voiceBtn.textContent = 'Iniciar Llamada';
        voiceBtn.className = 'lux-voice-action-btn';
        voiceBtn.disabled = false;
      } else if (state === 'connecting') {
        voiceStatus.textContent = 'Conectando...';
        voiceStatus.className = 'lux-voice-status connecting';
        voiceBtn.textContent = 'Conectando';
        voiceBtn.className = 'lux-voice-action-btn';
        voiceBtn.disabled = true;
      } else if (state === 'active') {
        voiceStatus.textContent = 'Llamada activa';
        voiceStatus.className = 'lux-voice-status active';
        voiceBtn.textContent = 'Finalizar Llamada';
        voiceBtn.className = 'lux-voice-action-btn active';
        voiceBtn.disabled = false;
      } else if (state === 'error') {
        voiceStatus.textContent = errorMsg || 'Error en la llamada';
        voiceStatus.className = 'lux-voice-status error';
        voiceBtn.textContent = 'Volver a Intentar';
        voiceBtn.className = 'lux-voice-action-btn';
        voiceBtn.disabled = false;
      }
    }

    // Function to dynamically load Vapi SDK
    function loadVapiSdk() {
      if (window.Vapi) {
        return Promise.resolve();
      }
      return import('https://cdn.jsdelivr.net/npm/@vapi-ai/web@1/+esm')
        .then((module) => {
          let constructor = null;
          if (module) {
            if (module.default && module.default.default && typeof module.default.default === 'function') {
              constructor = module.default.default;
            } else if (module.default && typeof module.default === 'function') {
              constructor = module.default;
            } else if (module.Vapi && typeof module.Vapi === 'function') {
              constructor = module.Vapi;
            } else if (typeof module === 'function') {
              constructor = module;
            }
          }

          if (constructor) {
            window.Vapi = constructor;
          } else {
            throw new Error('El constructor de Vapi no se encontró en el módulo.');
          }
        })
        .catch((err) => {
          console.error('Error al cargar el SDK de Vapi:', err);
          throw new Error('Error al cargar el SDK de Vapi.');
        });
    }

    // Function to fetch config
    async function fetchVapiConfig() {
      if (vapiConfig) return vapiConfig;
      const res = await fetch(backendUrl + '/api/config');
      if (!res.ok) {
        throw new Error('No se pudo obtener la configuración del servidor.');
      }
      vapiConfig = await res.json();
      return vapiConfig;
    }

    // Function to start call
    async function startCall() {
      setCallState('connecting');
      try {
        const [config] = await Promise.all([
          fetchVapiConfig(),
          loadVapiSdk()
        ]);

        if (!config.VAPI_PUBLIC_KEY || !config.VAPI_ASSISTANT_ID) {
          throw new Error('Configuración de Vapi incompleta.');
        }

        if (!vapiInstance) {
          vapiInstance = new window.Vapi(config.VAPI_PUBLIC_KEY);

          vapiInstance.on('call-start', () => {
            console.log('Vapi Call started');
            setCallState('active');
          });

          vapiInstance.on('call-end', () => {
            console.log('Vapi Call ended');
            setCallState('idle');
          });

          vapiInstance.on('error', (err) => {
            console.error('Vapi Error:', err);
            setCallState('error', 'Error en la llamada');
          });
        }

        await vapiInstance.start(config.VAPI_ASSISTANT_ID);
      } catch (err) {
        console.error('Failed to start call:', err);
        setCallState('error', err.message || 'Error al iniciar llamada');
      }
    }

    // Function to stop call
    function stopCall() {
      if (vapiInstance) {
        try {
          vapiInstance.stop();
        } catch (err) {
          console.error('Error stopping Vapi call:', err);
        }
      }
      setCallState('idle');
    }

    // Toggle interface event listeners
    toggleTextBtn.addEventListener('click', () => {
      toggleTextBtn.classList.add('active');
      toggleVoiceBtn.classList.remove('active');
      messagesContainer.style.display = 'flex';
      form.style.display = 'flex';
      voiceContainer.style.display = 'none';
    });

    toggleVoiceBtn.addEventListener('click', () => {
      toggleVoiceBtn.classList.add('active');
      toggleTextBtn.classList.remove('active');
      messagesContainer.style.display = 'none';
      form.style.display = 'none';
      voiceContainer.style.display = 'flex';
    });

    // Voice button event listener
    voiceBtn.addEventListener('click', async () => {
      if (callState === 'idle' || callState === 'error') {
        await startCall();
      } else if (callState === 'active') {
        stopCall();
      }
    });

    // Set greeting
    const greetingText = "Hola. Soy el asistente digital de Luxdental. Estoy aquí para ayudarte. ¿En qué tratamiento estás interesado o qué necesitas mejorar de tu sonrisa?";
    appendMessage('bot', greetingText);

    // Toggle Chat Window Open/Close
    trigger.addEventListener('click', () => {
      isOpen = !isOpen;
      if (isOpen) {
        trigger.classList.add('open');
        chatWindow.classList.add('open');
        if (toggleTextBtn.classList.contains('active')) {
          setTimeout(() => input.focus(), 150);
        }
      } else {
        trigger.classList.remove('open');
        chatWindow.classList.remove('open');
        // Stop active call if window is closed
        if (callState === 'active' || callState === 'connecting') {
          stopCall();
        }
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isOpen = false;
        trigger.classList.remove('open');
        chatWindow.classList.remove('open');
        // Stop active call if window is closed
        if (callState === 'active' || callState === 'connecting') {
          stopCall();
        }
      });
    }

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
      row.className = `lux-message-row ${sender}`;

      const bubble = document.createElement('div');
      bubble.className = 'lux-message-bubble';
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
      row.className = 'lux-message-row bot';
      row.id = 'lux-typing-bubble';

      const indicator = document.createElement('div');
      indicator.className = 'lux-typing-indicator';
      indicator.innerHTML = '<span></span><span></span><span></span>';

      row.appendChild(indicator);
      messagesContainer.appendChild(row);
      scrollToBottom();
    }

    /**
     * Removes the typing indicator bubble.
     */
    function hideTypingIndicator() {
      const typingBubble = document.getElementById('lux-typing-bubble');
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
