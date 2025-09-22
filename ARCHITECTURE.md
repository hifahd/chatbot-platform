# System Architecture

This document describes the architecture and design of the chatbot platform implementation.

**Live Demo:** https://chatbot-platform-9sh8.onrender.com/
**Repository:** https://github.com/hifahd/chatbot-platform

## Overview

The chatbot platform is a full-stack web application that enables users to create and manage AI-powered chatbots with custom system prompts. The system supports multi-user environments with conversation history, file uploads, and secure data isolation.

## System Architecture

### High-Level Design

The application follows a three-tier architecture:

1. **Presentation Layer**: Static HTML/CSS/JavaScript frontend
2. **Application Layer**: Node.js/Express API server
3. **Data Layer**: Supabase (PostgreSQL + Authentication)

### Component Interaction

```
Frontend (Browser) → Express Server → Supabase Database
                   ↓
                OpenAI API (Chat + Files)
```

## Technology Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Bootstrap 5 for responsive design
- Supabase JavaScript client for authentication

### Backend
- Node.js runtime environment
- Express.js web framework
- Supabase JavaScript SDK for database operations
- OpenAI JavaScript SDK for AI interactions

### Database
- Supabase (hosted PostgreSQL)
- Row-Level Security (RLS) for data isolation
- JWT-based authentication

### External Services
- OpenAI API for chat completions
- OpenAI Files API for document processing
- Render for application hosting

## Database Design

### Schema Structure

The database consists of four main tables with the following relationships:

```
users (Supabase Auth)
  ↓ one-to-many
projects
  ↓ one-to-many
conversations
  ↓ one-to-many
messages

projects
  ↓ one-to-many
files
```

### Table Definitions

**projects**
- `id`: UUID primary key
- `user_id`: Foreign key to auth.users
- `name`: Project name
- `system_prompt`: Custom AI instructions
- `created_at`: Timestamp

**conversations**
- `id`: UUID primary key
- `project_id`: Foreign key to projects
- `title`: Conversation title
- `created_at`: Timestamp

**messages**
- `id`: UUID primary key
- `conversation_id`: Foreign key to conversations
- `role`: Message role (user/assistant/system)
- `content`: Message text content
- `created_at`: Timestamp

**files**
- `id`: UUID primary key
- `project_id`: Foreign key to projects
- `filename`: Original file name
- `openai_file_id`: OpenAI file reference
- `created_at`: Timestamp

## API Design

### Authentication
All API endpoints require JWT authentication via Authorization header.

### Core Endpoints

**POST /api/chat**
- Streams chat responses using Server-Sent Events
- Accepts message history and project ID
- Returns streaming content chunks

**POST /api/upload**
- Handles file uploads to OpenAI Files API
- Accepts base64-encoded file content
- Returns OpenAI file ID

**GET /api/file/:id**
- Retrieves file metadata from OpenAI
- Returns file information object

### Database Operations
Database interactions use Supabase client with automatic RLS enforcement.

## Security Implementation

### Authentication
- JWT tokens issued by Supabase Auth
- Server-side token validation on all API routes
- Automatic token refresh handling

### Data Isolation
- Row-Level Security policies enforce user data separation
- All database queries filtered by authenticated user ID
- Nested security policies for related tables

### API Security
- OpenAI API keys stored server-side only
- Input validation on all endpoints
- CORS configuration for cross-origin requests

## Deployment Architecture

### Hosting Environment
- **Platform**: Render Web Service
- **Runtime**: Node.js 14+
- **Build Process**: npm install
- **Start Command**: npm start

### Environment Configuration
- `OPENAI_API_KEY`: OpenAI API authentication
- `SUPABASE_URL`: Supabase project endpoint
- `SUPABASE_SERVICE_KEY`: Supabase service role key

### Network Architecture
```
Internet → Render Load Balancer → Node.js Application
                                      ↓
                                 Supabase Database
                                      ↓
                                 OpenAI API
```

## Performance Considerations

### Chat Streaming
- Server-Sent Events for real-time response delivery
- Chunked response processing to minimize latency
- Connection keep-alive for sustained conversations

### Database Optimization
- Indexed foreign key relationships
- Efficient query patterns with proper joins
- Row-level security with minimal overhead

### Caching Strategy
- Static assets served by Express
- Database connections pooled by Supabase
- No additional caching layer required for MVP

## Scalability Design

### Horizontal Scaling
- Stateless application server design
- External database and authentication services
- Load balancer support via Render platform

### Data Partitioning
- User-based data isolation via RLS
- Project-scoped conversations and files
- Independent scaling of compute and storage

## Error Handling

### Client-Side
- Graceful fallback for network failures
- User feedback for authentication errors
- Retry logic for transient failures

### Server-Side
- Comprehensive error logging
- Structured error responses
- Graceful degradation for external service failures
