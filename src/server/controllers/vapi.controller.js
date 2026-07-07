import { createNotionLead } from '../services/notion.service.js';
import { sendLeadEmailAlert } from '../services/resend.service.js';

// Conceptual wrappers to match exact request requirements
const notionService = {
  createLead: (leadData) => createNotionLead(leadData)
};

const resendService = {
  sendEmailAlert: (leadData) => sendLeadEmailAlert(leadData)
};

/**
 * Handle Vapi webhook for tool execution requests.
 */
export async function handleVapiWebhook(req, res) {
  console.log('Received request from Vapi webhook:', JSON.stringify(req.body, null, 2));

  try {
    const message = req.body?.message;
    if (!message || message.type !== 'tool-calls') {
      return res.status(400).json({ success: false, error: 'Invalid message type. Expected tool-calls.' });
    }

    const toolCalls = message.toolCalls;
    if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
      return res.status(400).json({ success: false, error: 'No tool calls found in the request.' });
    }

    // Find the register_lead tool call
    const registerLeadCall = toolCalls.find(tc => tc.function?.name === 'register_lead');

    if (!registerLeadCall) {
      return res.status(400).json({ success: false, error: 'register_lead function call not found.' });
    }

    let args = registerLeadCall.function.arguments;
    if (typeof args === 'string') {
      try {
        args = JSON.parse(args);
      } catch (err) {
        console.error('Failed to parse tool call arguments string:', err);
        return res.status(400).json({ success: false, error: 'Invalid JSON in arguments.' });
      }
    }

    if (!args) {
      return res.status(400).json({ success: false, error: 'Missing function arguments.' });
    }

    const { name, phone, email, notes } = args;

    // Create the lead object with signatures required by notion/resend services
    const leadData = {
      name: name || 'Sin nombre',
      company: 'Llamada Vapi',
      email: email || '',
      phone: phone || '',
      goals: notes || 'Consulta por voz',
      timeframe: 'Inmediatamente',
      sector: 'clinica dental'
    };

    // Run both services in parallel using Promise.all
    await Promise.all([
      notionService.createLead(leadData),
      resendService.sendEmailAlert(leadData)
    ]);

    // Respond with the specific structure required by Vapi
    return res.status(200).json({
      results: [
        {
          toolCallId: registerLeadCall.id,
          result: "Lead registrado en Notion y notificado por email exitosamente."
        }
      ]
    });

  } catch (error) {
    console.error('Error handling Vapi webhook:', error);
    
    // Even if it fails, let's extract the toolCallId if possible to respond to Vapi
    const toolCallId = req.body?.message?.toolCalls?.[0]?.id || 'unknown';
    
    return res.status(500).json({
      results: [
        {
          toolCallId: toolCallId,
          result: `Error al procesar el lead: ${error.message || error}`
        }
      ]
    });
  }
}

/**
 * Handle config endpoint returning Vapi public credentials.
 */
export function handleConfig(req, res) {
  return res.status(200).json({
    VAPI_PUBLIC_KEY: process.env.VAPI_PUBLIC_KEY || '',
    VAPI_ASSISTANT_ID: process.env.VAPI_ASSISTANT_ID || ''
  });
}
