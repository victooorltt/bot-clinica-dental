import { createNotionLead } from '../services/notion.service.js';
import { sendLeadEmailAlert } from '../services/resend.service.js';
import { saveToFallback } from '../services/fallback.service.js';

// Regular expression for basic email validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VALID_GOALS = ["Más clientes", "Más ventas", "Automatización", "Mejor imagen digital", "Otro"];
const VALID_TIMEFRAMES = ["Inmediatamente", "Este mes", "Próximos 3 meses"];

/**
 * Validates lead data payload.
 * @param {object} data - The request body data.
 * @returns {string|null} - Error message if invalid, null if valid.
 */
export function validateLeadData(data) {
  if (!data) return "Missing request body";

  const { name, company, email, phone, goals, timeframe } = data;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return "Missing or invalid 'name'";
  }
  if (!company || typeof company !== 'string' || company.trim().length === 0) {
    return "Missing or invalid 'company'";
  }
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
    return "Missing or invalid 'email'";
  }
  if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
    return "Missing or invalid 'phone'";
  }
  if (!goals || !VALID_GOALS.includes(goals)) {
    return `Invalid 'goals'. Must be one of: ${VALID_GOALS.join(', ')}`;
  }
  if (!timeframe || !VALID_TIMEFRAMES.includes(timeframe)) {
    return `Invalid 'timeframe'. Must be one of: ${VALID_TIMEFRAMES.join(', ')}`;
  }

  return null;
}

/**
 * Process lead submission: tries Notion database insert and Resend email alert.
 * If any fails, appends to fallback file.
 * @param {object} leadData 
 * @returns {Promise<{success: boolean, persisted: 'notion' | 'fallback'}>}
 */
export async function processLead(leadData) {
  const [notionResult, resendResult] = await Promise.allSettled([
    createNotionLead(leadData),
    sendLeadEmailAlert(leadData)
  ]);

  let notionError = null;
  let resendError = null;

  if (notionResult.status === 'rejected') {
    notionError = notionResult.reason;
    console.error('Notion creation failed:', notionError);
  }

  if (resendResult.status === 'rejected') {
    resendError = resendResult.reason;
    console.error('Resend email alert failed:', resendError);
  }

  if (notionError || resendError) {
    const errorMsg = notionError || resendError;
    const combinedError = notionError && resendError
      ? new Error(`Notion error: ${notionError.message || notionError}. Resend error: ${resendError.message || resendError}`)
      : errorMsg;

    console.error('Lead processing failed, writing to fallback storage:', combinedError);
    await saveToFallback(leadData, combinedError);
    return { success: true, persisted: 'fallback' };
  }

  return { success: true, persisted: 'notion' };
}

/**
 * Express controller for manual lead submission.
 */
export async function handleManualLeadSubmission(req, res) {
  const errorMsg = validateLeadData(req.body);
  if (errorMsg) {
    return res.status(400).json({ success: false, error: errorMsg });
  }

  const result = await processLead(req.body);
  return res.status(201).json(result);
}
