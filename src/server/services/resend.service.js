import { Resend } from 'resend';

let resendClient = null;

function getResendClient() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || apiKey === 'placeholder_resend_key') {
      throw new Error('Resend API key (RESEND_API_KEY) is not configured.');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * Sends an email notification to the sales team with the lead details.
 * @param {object} lead - The lead details.
 * @returns {Promise<object>} - Resend API response.
 */
export async function sendLeadEmailAlert(lead) {
  const resend = getResendClient();
  const fromEmail = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const toEmail = process.env.EMAIL_TO || process.env.RESEND_TO_EMAIL || 'info@syntralabs.es';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Nuevo Lead Captado</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: #f4f5f6;
          color: #333333;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          border: 1px solid #e1e4e6;
        }
        .header {
          background-color: #1a1f2c;
          padding: 24px;
          text-align: center;
          color: #ffffff;
        }
        .header h1 {
          margin: 0;
          font-size: 20px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .content {
          padding: 32px;
        }
        .lead-detail-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }
        .lead-detail-table td {
          padding: 12px 0;
          border-bottom: 1px solid #f0f2f5;
        }
        .lead-detail-table td.label {
          font-weight: 600;
          color: #667085;
          width: 35%;
        }
        .lead-detail-table td.value {
          color: #1d2939;
        }
        .footer {
          background-color: #f9fafb;
          padding: 16px;
          text-align: center;
          font-size: 12px;
          color: #667085;
          border-top: 1px solid #e1e4e6;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Nuevo Lead Registrado</h1>
          <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.8;">Agente de IA Web - Clínica Dental</p>
        </div>
        <div class="content">
          <table class="lead-detail-table">
            <tr>
              <td class="label">Nombre</td>
              <td class="value">${lead.name}</td>
            </tr>
            <tr>
              <td class="label">Clínica</td>
              <td class="value">${lead.company}</td>
            </tr>
            <tr>
              <td class="label">Email</td>
              <td class="value"><a href="mailto:${lead.email}">${lead.email}</a></td>
            </tr>
            <tr>
              <td class="label">Teléfono</td>
              <td class="value"><a href="tel:${lead.phone}">${lead.phone}</a></td>
            </tr>
            <tr>
              <td class="label">Sector</td>
              <td class="value">${lead.sector || 'clinica dental'}</td>
            </tr>
            <tr>
              <td class="label">Objetivos</td>
              <td class="value">${lead.goals}</td>
            </tr>
            <tr>
              <td class="label">Plazo de inicio</td>
              <td class="value">${lead.timeframe}</td>
            </tr>
          </table>
          <p style="font-size: 14px; color: #475467; line-height: 1.5;">
            Este lead ha sido cualificado y registrado automáticamente en el Notion CRM con el estado <strong>NUEVO LEAD</strong>.
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Clínica Dental. Todos los derechos reservados.
        </div>
      </div>
    </body>
    </html>
  `;

  return await resend.emails.send({
    from: fromEmail,
    to: toEmail,
    subject: `🔥 Nuevo Lead: ${lead.name} (${lead.company})`,
    html: htmlContent,
  });
}
