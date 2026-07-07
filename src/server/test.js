import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';

// Setup test environment variables BEFORE importing the app
process.env.PORT = '3005';
process.env.OPENAI_API_KEY = 'placeholder_openai_key';
process.env.NOTION_TOKEN = 'placeholder_notion_token';
process.env.NOTION_API_KEY = 'placeholder_notion_api_key';
process.env.NOTION_DATABASE_ID = 'placeholder_notion_db_id';
process.env.RESEND_API_KEY = 'placeholder_resend_key';

const FALLBACK_FILE_PATH = path.resolve(process.cwd(), 'leads_fallback.json');

// Import server
const { server } = await import('./index.js');
const BASE_URL = 'http://localhost:3005';

// Helper to clear fallback log before/after tests
async function cleanFallbackLog() {
  try {
    await fs.unlink(FALLBACK_FILE_PATH);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('Error cleaning fallback log:', err);
    }
  }
}

test('Dental Clinic Lead Integration Test Suite', async (t) => {

  t.after(async () => {
    // Clean up server resources
    await new Promise((resolve) => server.close(resolve));
    await cleanFallbackLog();
    console.log('Test server closed and logs cleaned.');
  });

  await t.test('4.1 Validation Schema of /api/lead (Invalid Fields)', async () => {
    const invalidPayloads = [
      {}, // empty
      { name: '', company: 'Syntra', email: 'test@example.com', phone: '123', goals: 'Automatización', timeframe: 'Este mes' }, // empty name
      { name: 'John', company: 'Syntra', email: 'not-an-email', phone: '123', goals: 'Automatización', timeframe: 'Este mes' }, // invalid email format
      { name: 'John', company: 'Syntra', email: 'test@example.com', phone: '123', goals: 'Inexistente', timeframe: 'Este mes' }, // invalid goals enum
      { name: 'John', company: 'Syntra', email: 'test@example.com', phone: '123', goals: 'Automatización', timeframe: 'Nunca' } // invalid timeframe enum
    ];

    for (const payload of invalidPayloads) {
      const response = await fetch(`${BASE_URL}/api/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      assert.strictEqual(response.status, 400);
      const data = await response.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.error);
    }
  });

  await t.test('4.2 Notion & Resend Failures Fallback (Local File Log)', async () => {
    // Ensure we start with no fallback log
    await cleanFallbackLog();

    const validPayload = {
      name: 'Test Visitor',
      company: 'Acme Corp',
      email: 'acme@example.com',
      phone: '+34600123456',
      website: 'https://acme.example.com',
      sector: 'Tecnología',
      goals: 'Automatización',
      timeframe: 'Inmediatamente'
    };

    const response = await fetch(`${BASE_URL}/api/lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload)
    });

    // Check response status: should be 201 Created and persisted to fallback
    assert.strictEqual(response.status, 201);
    const data = await response.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.persisted, 'fallback');

    // Confirm that the local file leads_fallback.json was created and has the lead details
    const fileContent = await fs.readFile(FALLBACK_FILE_PATH, 'utf-8');
    const logs = JSON.parse(fileContent);
    
    assert.ok(Array.isArray(logs));
    assert.strictEqual(logs.length, 1);
    assert.strictEqual(logs[0].lead.name, 'Test Visitor');
    assert.strictEqual(logs[0].lead.company, 'Acme Corp');
    assert.ok(logs[0].error.includes('Notion') || logs[0].error.includes('Resend') || logs[0].error.includes('configured'));
  });

  await t.test('4.3 Chat Request Schema & Mocked E2E Tool Call Flow', async () => {
    // Test validation for /api/chat
    const badResponse = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: '',
        history: []
      })
    });

    assert.strictEqual(badResponse.status, 400);
    const badData = await badResponse.json();
    assert.strictEqual(badData.success, false);

    // Test E2E flow with mocked OpenAI tool call
    const openaiInstanceForProto = new OpenAI({ apiKey: 'mocked_openai_key' });
    const Completions = Object.getPrototypeOf(openaiInstanceForProto.chat.completions).constructor;
    const originalCreate = Completions.prototype.create;
    process.env.OPENAI_API_KEY = 'mocked_openai_key';

    Completions.prototype.create = async function(body, options) {
      return {
        choices: [
          {
            message: {
              content: null,
              tool_calls: [
                {
                  function: {
                    name: 'register_lead',
                    arguments: JSON.stringify({
                      name: 'Mock User E2E',
                      company: 'Mock E2E Inc',
                      email: 'mocke2e@example.com',
                      phone: '111222333',
                      website: 'http://mocke2e.com',
                      sector: 'IT',
                      goals: 'Automatización',
                      timeframe: 'Este mes'
                    })
                  }
                }
              ]
            }
          }
        ]
      };
    };

    try {
      const response = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Hola, me gustaría automatizar mis procesos',
          history: []
        })
      });

      assert.strictEqual(response.status, 200);
      const data = await response.json();
      assert.strictEqual(data.leadStatus, 'registered');
      assert.ok(data.response.includes('clínica'));
      assert.ok(data.response.includes('recibido tu solicitud'));

      // Verify that the local fallback file has recorded this mocked lead
      const fileContent = await fs.readFile(FALLBACK_FILE_PATH, 'utf-8');
      const logs = JSON.parse(fileContent);
      assert.ok(logs.some(log => log.lead.name === 'Mock User E2E'));

    } finally {
      // Clean up mock and environment
      Completions.prototype.create = originalCreate;
      process.env.OPENAI_API_KEY = 'placeholder_openai_key';
    }
  });

  await t.test('4.4 createNotionLead sanitization logic of optional/string fields', async () => {
    const { Client } = await import('@notionhq/client');
    const { createNotionLead } = await import('./services/notion.service.js');

    const originalRequest = Client.prototype.request;
    const originalToken = process.env.NOTION_TOKEN;
    const originalApiKey = process.env.NOTION_API_KEY;
    const originalDbId = process.env.NOTION_DATABASE_ID;

    let lastPayload = null;
    Client.prototype.request = async function(args) {
      lastPayload = args.body;
      return { id: 'mocked_page_id' };
    };

    // Set non-placeholder values to bypass the config checks in notion.service.js
    process.env.NOTION_TOKEN = 'valid_mock_token';
    delete process.env.NOTION_API_KEY;
    process.env.NOTION_DATABASE_ID = 'valid_mock_db_id';

    try {
      const leadWithEmptyFields = {
        name: '  John Doe  ',
        company: '   ',
        email: '   ',
        phone: '',
        website: '  ',
        sector: '   ',
        goals: 'Automatización',
        timeframe: 'Este mes'
      };

      await createNotionLead(leadWithEmptyFields);

      assert.ok(lastPayload);
      assert.strictEqual(lastPayload.properties.Nombre.title[0].text.content, 'John Doe');
      assert.deepEqual(lastPayload.properties.Empresa.rich_text, []);
      assert.strictEqual(lastPayload.properties.Teléfono.phone_number, null);
      assert.strictEqual(lastPayload.properties.Email.email, null);
      assert.strictEqual(lastPayload.properties.Sector.rich_text[0].text.content, 'clinica dental');

      // Test with actual populated fields to ensure they are preserved and trimmed
      const leadWithPopulatedFields = {
        name: 'Jane Doe',
        company: ' Acme Corp ',
        email: '  jane@example.com  ',
        phone: ' +34600123456 ',
        website: ' https://example.com ',
        sector: ' Tech ',
        goals: 'Automatización',
        timeframe: 'Este mes'
      };

      await createNotionLead(leadWithPopulatedFields);

      assert.strictEqual(lastPayload.properties.Nombre.title[0].text.content, 'Jane Doe');
      assert.strictEqual(lastPayload.properties.Empresa.rich_text[0].text.content, 'Acme Corp');
      assert.strictEqual(lastPayload.properties.Teléfono.phone_number, '+34600123456');
      assert.strictEqual(lastPayload.properties.Email.email, 'jane@example.com');
      assert.strictEqual(lastPayload.properties.Sector.rich_text[0].text.content, 'clinica dental');

    } finally {
      Client.prototype.request = originalRequest;
      process.env.NOTION_TOKEN = originalToken;
      process.env.NOTION_API_KEY = originalApiKey;
      process.env.NOTION_DATABASE_ID = originalDbId;
    }
  });
});
