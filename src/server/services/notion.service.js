import { Client } from '@notionhq/client';

let notionClient = null;

function getNotionClient() {
  if (!notionClient) {
    const token = process.env.NOTION_API_KEY || process.env.NOTION_TOKEN;
    if (!token || token === 'placeholder_notion_token' || token === 'placeholder_notion_api_key') {
      throw new Error('Notion API token (NOTION_API_KEY or NOTION_TOKEN) is not configured.');
    }
    notionClient = new Client({ auth: token });
  }
  return notionClient;
}

/**
 * Maps goals to service options.
 * @param {string} goals 
 * @returns {string}
 */
function mapGoalsToService(goals) {
  if (!goals) return 'Otro';
  
  const lowerGoals = goals.toLowerCase();
  if (lowerGoals.includes('automatización') || lowerGoals.includes('automatizacion')) {
    return 'Automatización';
  }
  if (lowerGoals.includes('imagen digital') || lowerGoals.includes('diseño') || lowerGoals.includes('diseno') || lowerGoals.includes('web')) {
    return 'Diseño web';
  }
  if (lowerGoals.includes('clientes') || lowerGoals.includes('ventas') || lowerGoals.includes('agente') || lowerGoals.includes('ia')) {
    return 'Agente IA';
  }
  return 'Otro';
}

/**
 * Sanitizes optional string fields by trimming whitespace.
 * Returns null if the value is not a string, is empty, or contains only whitespace.
 * @param {*} value 
 * @returns {string|null}
 */
function sanitizeOptionalString(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

/**
 * Creates a new lead row in the Notion database.
 * @param {object} lead - The lead details.
 * @returns {Promise<object>} - Notion API response.
 */
export async function createNotionLead(lead) {
  const client = getNotionClient();
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!databaseId || databaseId === 'placeholder_notion_db_id') {
    throw new Error('Notion Database ID (NOTION_DATABASE_ID) is not configured.');
  }

  const serviceName = lead.service || mapGoalsToService(lead.goals);

  const nameValue = sanitizeOptionalString(lead.name) || "Sin nombre";
  const companySanitized = sanitizeOptionalString(lead.company);
  const sectorSanitized = sanitizeOptionalString(lead.sector);

  const notionPayload = {
    parent: { database_id: databaseId },
    properties: {
      "Nombre": {
        title: [
          {
            text: {
              content: nameValue
            }
          }
        ]
      },
      "Empresa": {
        rich_text: companySanitized ? [
          {
            text: {
              content: companySanitized
            }
          }
        ] : []
      },
      "Teléfono": {
        phone_number: sanitizeOptionalString(lead.phone)
      },
      "Email": {
        email: sanitizeOptionalString(lead.email)
      },
      "Página web actual": {
        url: sanitizeOptionalString(lead.website)
      },
      "Sector": {
        rich_text: sectorSanitized ? [
          {
            text: {
              content: sectorSanitized
            }
          }
        ] : []
      },
      "Servicio solicitado": {
        select: {
          name: serviceName
        }
      },
      "Estado comercial": {
        status: {
          name: "NUEVO LEAD"
        }
      },
      "Origen del lead": {
        select: {
          name: "Agente IA"
        }
      },
      "Observaciones": {
        rich_text: [
          {
            text: {
              content: `Objetivos: ${lead.goals || ""}\nPlazo: ${lead.timeframe || ""}`
            }
          }
        ]
      }
    }
  };

  return await client.pages.create(notionPayload);
}
