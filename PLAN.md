# Chatbot Platform - Implementation Plan

## Project Overview
A minimal chatbot platform for Yellow.ai internship assignment that allows users to create AI-powered agents with custom prompts, chat interfaces, and file uploads.

## Core Principles
- **Simplicity First**: Build only what's required, no overengineering
- **Minimal Dependencies**: Use existing solutions (Supabase) instead of custom backends
- **Direct Implementation**: No unnecessary abstractions or patterns
- **Follow Requirements**: All features from assignment PDF must be included

## Tech Stack

### Backend
- **Supabase**: Authentication, Database, Row-Level Security
- **Node.js Server**: Simple API proxy for OpenAI (single file, ~150 lines)

### Frontend
- **HTML/CSS/JavaScript**: Plain vanilla, no build tools
- **Bootstrap 5**: UI components via CDN
- **No frameworks**: Direct DOM manipulation

### Deployment
- **Render**: Single deployment for everything

## Database Schema

```sql
-- Supabase PostgreSQL tables

-- Projects/Agents table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  system_prompt TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Conversations table
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Files table
CREATE TABLE files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  openai_file_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Project Structure

```
chatbot-platform/
├── public/                    # Frontend files
│   ├── index.html            # Login/Register page
│   ├── dashboard.html        # Projects list & management
│   ├── chat.html            # Chat interface
│   ├── style.css            # Minimal custom styles
│   └── app.js               # All JavaScript logic
├── server.js                 # Node.js API proxy
├── package.json              # Node dependencies
├── .env.example              # Environment variables template
├── .env                      # Local environment variables (gitignored)
├── .gitignore               # Git ignore file
├── README.md                # Setup instructions
└── PLAN.md                  # This file
```

## Implementation Phases

### Phase 1: Supabase Setup (30 minutes)
1. Create new Supabase project
2. Enable Email/Password authentication
3. Create database tables using SQL editor
4. Configure Row-Level Security policies:
   - Users can only see/edit their own projects
   - Users can only see/edit their own conversations and messages
5. Get project URL and anon key

### Phase 2: API Server (1 hour)
Create `server.js` with three endpoints:

```javascript
// Endpoint structure (pseudocode)

POST /api/chat
- Verify Supabase JWT token
- Get OpenAI API response
- Stream response using Server-Sent Events
- Return streaming chunks to frontend

POST /api/upload
- Verify Supabase JWT token
- Receive file from frontend
- Upload to OpenAI Files API
- Return file ID

GET /api/file/:id
- Verify Supabase JWT token
- Get file info from OpenAI
- Return file metadata
```

### Phase 3: Frontend Pages (3 hours)

#### index.html - Authentication
- Login form (email, password)
- Register form (email, password, name)
- Toggle between forms with JavaScript
- On success, redirect to dashboard
- Store Supabase session in localStorage

#### dashboard.html - Project Management
- List user's projects in Bootstrap cards
- "Create Project" button opens modal:
  - Project name input
  - System prompt textarea
- Each project card shows:
  - Name
  - Created date
  - "Open Chat" button
  - "Upload File" button
  - "Delete" button
- File upload uses FormData to server endpoint

#### chat.html - Chat Interface
- Left sidebar: Conversations list
- Main area: Messages display
- Bottom: Input field + Send button
- Real-time streaming using EventSource
- Auto-save messages to Supabase
- Show uploaded files as context chips

#### app.js - JavaScript Logic
Single file containing all frontend logic (~300 lines):

```javascript
// Core modules structure
const supabaseClient = // Initialize Supabase client

const auth = {
  async login(email, password) {},
  async register(email, password) {},
  async logout() {},
  checkSession() {}
}

const projects = {
  async list() {},
  async create(name, prompt) {},
  async delete(id) {},
  async getById(id) {}
}

const chat = {
  async loadMessages(conversationId) {},
  async sendMessage(content) {},
  streamResponse(message) {}, // Uses EventSource
  async saveMessage(conversationId, role, content) {}
}

const files = {
  async upload(projectId, file) {},
  async list(projectId) {}
}

// Page initialization
if (window.location.pathname.includes('dashboard')) {
  // Load projects
} else if (window.location.pathname.includes('chat')) {
  // Setup chat interface
}
```

### Phase 4: Styling (30 minutes)
- Use Bootstrap 5 from CDN
- Minimal custom CSS in `style.css`:
  - Chat message bubbles
  - Streaming animation
  - File upload area
- Responsive design handled by Bootstrap

### Phase 5: Testing (30 minutes)
Manual testing checklist:
- [ ] User can register
- [ ] User can login
- [ ] User can create project
- [ ] User can set system prompt
- [ ] User can start chat
- [ ] Messages stream in real-time
- [ ] Conversation history persists
- [ ] Files upload successfully
- [ ] Files are associated with projects
- [ ] User can only see their own data

### Phase 6: Deployment (30 minutes)
1. Create GitHub repository
2. Push code
3. Create Render Web Service
4. Set environment variables:
   ```
   OPENAI_API_KEY=sk-...
   SUPABASE_URL=https://...supabase.co
   SUPABASE_SERVICE_KEY=...
   PORT=3000
   ```
5. Deploy and get public URL
6. Test live application

## Features Checklist

### Required Features
- ✅ JWT Authentication (via Supabase)
- ✅ User registration
- ✅ Email/password login
- ✅ Create projects/agents
- ✅ Store prompts with projects
- ✅ Chat interface with streaming
- ✅ OpenAI API integration
- ✅ File uploads via OpenAI Files API

### Non-Functional Requirements
- ✅ **Scalability**: Supabase handles concurrent users
- ✅ **Security**: JWT tokens, RLS policies, API key protection
- ✅ **Extensibility**: Simple structure allows easy additions
- ✅ **Performance**: Streaming responses, CDN assets
- ✅ **Reliability**: Basic error handling, Supabase stability

## Security Measures
1. API keys only on server side
2. Supabase JWT verification on all requests
3. Row-Level Security in database
4. Input sanitization (basic HTML escaping)
5. HTTPS only in production

## Error Handling Strategy
- Try-catch blocks around all async operations
- User-friendly error messages
- Console logging for debugging
- Graceful fallbacks (e.g., show cached data if fetch fails)

## Environment Variables
```bash
# .env.example
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
PORT=3000
```

## Deliverables
1. **Source Code**: GitHub repository with all files
2. **README.md**: Setup and run instructions
3. **Architecture Explanation**: This PLAN.md file
4. **Live Demo**: Deployed on Render with public URL

## Time Estimate
- **Total**: 5-6 hours
- Supabase Setup: 30 min
- API Server: 1 hour
- Frontend: 3 hours
- Styling: 30 min
- Testing: 30 min
- Deployment: 30 min

## Notes
- No TypeScript (unnecessary complexity for this project)
- No testing frameworks (manual testing sufficient)
- No build process (direct browser execution)
- No state management libraries (localStorage + Supabase)
- Bootstrap handles responsive design
- Streaming via Server-Sent Events (simpler than WebSockets)