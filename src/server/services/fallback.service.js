import fs from 'fs/promises';
import path from 'path';

const FALLBACK_FILE_PATH = path.resolve(process.cwd(), 'leads_fallback.json');

/**
 * Appends a lead that failed to sync to Notion or Resend to a local fallback file.
 * @param {object} lead - The lead data object.
 * @param {Error|string} error - The error description.
 * @returns {Promise<boolean>}
 */
export async function saveToFallback(lead, error) {
  try {
    let fallbackLeads = [];
    
    try {
      const data = await fs.readFile(FALLBACK_FILE_PATH, 'utf-8');
      if (data.trim()) {
        fallbackLeads = JSON.parse(data);
        if (!Array.isArray(fallbackLeads)) {
          fallbackLeads = [];
        }
      }
    } catch (readError) {
      // If file doesn't exist, we start with an empty array. Otherwise, throw.
      if (readError.code !== 'ENOENT') {
        console.error('Error reading fallback file:', readError);
      }
    }

    const fallbackEntry = {
      timestamp: new Date().toISOString(),
      lead,
      error: error instanceof Error ? error.message : String(error)
    };

    fallbackLeads.push(fallbackEntry);

    // Save back formatted with spacing
    await fs.writeFile(FALLBACK_FILE_PATH, JSON.stringify(fallbackLeads, null, 2), 'utf-8');
    return true;
  } catch (writeError) {
    console.error('Failed to write to fallback log:', writeError);
    return false;
  }
}
