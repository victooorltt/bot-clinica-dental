import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleChat } from './controllers/chat.controller.js';
import { handleManualLeadSubmission } from './controllers/lead.controller.js';
import { handleVapiWebhook, handleConfig } from './controllers/vapi.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Routes to serve the widget assets directly from src/widget
app.get('/js/widget.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.resolve(projectRoot, 'src/widget/widget.js'));
});

app.get('/css/widget.css', (req, res) => {
  res.setHeader('Content-Type', 'text/css');
  res.sendFile(path.resolve(projectRoot, 'src/widget/widget.css'));
});

// Serve static web pages from the public folder
app.use(express.static(path.resolve(projectRoot, 'public')));

// API Endpoints
app.post('/api/chat', handleChat);
app.post('/api/lead', handleManualLeadSubmission);
app.post('/api/vapi-webhook', handleVapiWebhook);
app.get('/api/config', handleConfig);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`[Dental Clinic Bot] Server running at http://localhost:${PORT}`);
});

export { app, server };
export default app;
