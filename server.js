require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'placeholder-key'
);

// Verify Supabase JWT token middleware
async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) throw error;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Chat endpoint with streaming
app.post('/api/chat', verifyToken, async (req, res) => {
  const { messages, projectId } = req.body;

  if (!messages || !projectId) {
    return res.status(400).json({ error: 'Messages and projectId required' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  try {
    // Extract system prompt and user message for Responses API
    const systemMessage = messages.find(m => m.role === 'system');
    const systemPrompt = systemMessage?.content || 'You are a helpful assistant.';

    // Get the last user message
    const userMessages = messages.filter(m => m.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';

    // Check if project has files (optional - for enabling file_search)
    const projectHasFiles = false; // TODO: Check database for project files

    // Use Responses API with GPT-5
    const stream = await openai.responses.create({
      model: 'gpt-5-mini',
      instructions: systemPrompt,
      input: lastUserMessage,
      reasoning: { effort: 'minimal' },
      text: { verbosity: 'low' },
      stream: true,
      tools: projectHasFiles ? [{ type: 'file_search' }] : []
    });

    for await (const chunk of stream) {
      // Responses API streaming format - handle different possible formats
      const content = chunk.choices?.[0]?.delta?.content ||
                      chunk.output_text_delta ||
                      chunk.delta?.content ||
                      chunk.text ||
                      chunk.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Chat error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Chat failed' })}\n\n`);
    res.end();
  }
});

// File upload endpoint
app.post('/api/upload', verifyToken, async (req, res) => {
  try {
    const { filename, content, projectId } = req.body;

    if (!filename || !content || !projectId) {
      return res.status(400).json({ error: 'Filename, content, and projectId required' });
    }

    // Create file buffer from base64 content
    const buffer = Buffer.from(content, 'base64');
    const file = new File([buffer], filename, { type: 'application/octet-stream' });

    // Upload to OpenAI
    const openaiFile = await openai.files.create({
      file: file,
      purpose: 'assistants',
    });

    res.json({
      success: true,
      fileId: openaiFile.id,
      filename: filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get file info endpoint
app.get('/api/file/:id', verifyToken, async (req, res) => {
  try {
    const file = await openai.files.retrieve(req.params.id);
    res.json(file);
  } catch (error) {
    console.error('File retrieval error:', error);
    res.status(500).json({ error: 'Could not retrieve file' });
  }
});

// Serve frontend pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});