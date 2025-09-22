# Chatbot Platform

A chatbot platform with authentication, project management, and chat capabilities using Supabase and OpenAI API.

**Live Demo:** https://chatbot-platform-9sh8.onrender.com/

## Features

- User authentication with email/password registration and login
- Create and manage multiple AI projects with custom system prompts
- Chat interface with streaming responses from OpenAI API
- File upload using OpenAI Files API for context-aware conversations
- Conversation history with multiple conversation support
- JWT authentication, Row-Level Security, and API key handling

## Tech Stack

- Backend: Supabase (Auth + Database) + Node.js/Express proxy server
- Frontend: HTML, CSS, JavaScript, Bootstrap 5
- AI: OpenAI API
- File Handling: OpenAI Files API
- Deployment: Render (or any Node.js hosting platform)

## Assignment Requirements

This chatbot platform implements the requirements for the Software Engineer Intern assignment:

- Authentication System: JWT/OAuth2 with email/password
- Project/Agent Management: Create and manage multiple projects with custom prompts
- Chat Interface: Interaction using OpenAI API
- File Upload: Files API integration for context-aware conversations
- Scalability: Multi-user support with data isolation
- Security: Row-level security and API handling

## Prerequisites

- Node.js (v14 or higher)
- Supabase account
- OpenAI API key with credits

## Setup Instructions

### 1. Clone Repository

```bash
git clone https://github.com/hifahd/chatbot-platform.git
cd chatbot-platform
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Supabase

1. Create a new project at [Supabase](https://supabase.com)
2. Go to SQL Editor and run the following queries to create tables:

```sql
-- Create projects table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  system_prompt TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create files table
CREATE TABLE files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  openai_file_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for conversations
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = conversations.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = conversations.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Similar policies for messages
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      JOIN projects ON projects.id = conversations.project_id
      WHERE conversations.id = messages.conversation_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      JOIN projects ON projects.id = conversations.project_id
      WHERE conversations.id = messages.conversation_id
      AND projects.user_id = auth.uid()
    )
  );

-- Similar policies for files
CREATE POLICY "Users can view own files" ON files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = files.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload files" ON files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = files.project_id
      AND projects.user_id = auth.uid()
    )
  );
```

3. Go to Settings → API and copy:
   - Project URL
   - anon public key
   - service_role key

### 4. Configure Environment Variables

Create a `.env` file based on `.env.example`:

```bash
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
PORT=3000
```

### 5. Run Locally

```bash
npm start
```

Visit `http://localhost:3000`

## Deployment to Render

1. Push code to GitHub
2. Create a new Web Service on [Render](https://render.com)
3. Connect your GitHub repository
4. Set environment variables in Render dashboard:
   - `OPENAI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
5. Deploy

## Usage

1. **Register/Login**: Create an account or login with email/password
2. **Create Project**: Click "Create New Project" and set a name and system prompt
3. **Chat**: Open a project to start chatting with the AI
4. **Upload Files**: Upload files to provide context to your AI agent
5. **Manage Conversations**: View and switch between different conversations

## Project Structure

```
chatbot-platform/
├── public/                 # Frontend files
│   ├── index.html         # Login/Register page
│   ├── dashboard.html     # Projects management
│   ├── chat.html         # Chat interface
│   ├── app.js            # Frontend JavaScript
│   └── style.css         # Custom styles
├── server.js              # Node.js API proxy
├── package.json           # Dependencies
├── .env                   # Environment variables
├── .gitignore            # Git ignore file
├── README.md             # This file
└── ARCHITECTURE.md       # Architecture documentation
```

## Security Notes

- API keys are stored server-side only
- All database operations use Row-Level Security
- JWT tokens verify user identity
- Input sanitization on all user inputs

## License

MIT