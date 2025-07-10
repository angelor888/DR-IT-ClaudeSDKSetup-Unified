# Phase 1: Backend API Development - Detailed Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          BUSINESS DASHBOARD SYSTEM                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐               │
│  │   Frontend  │     │   Mobile    │     │   Slack     │               │
│  │  Dashboard  │     │     App     │     │   Commands  │               │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘               │
│         │                    │                    │                       │
│         └────────────────────┴────────────────────┘                      │
│                              │                                            │
│                              ▼                                            │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                     API GATEWAY (Express.js)                       │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │  │
│  │  │   Auth      │  │ Rate Limiter │  │   Request Logger      │  │  │
│  │  │ Middleware  │  │              │  │                       │  │  │
│  │  └─────────────┘  └──────────────┘  └────────────────────────┘  │  │
│  └───────────────────────────┬───────────────────────────────────────┘  │
│                              │                                            │
│                              ▼                                            │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                      SERVICE LAYER                                 │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐    │  │
│  │  │   Jobber   │ │   Slack    │ │   Google   │ │ QuickBooks │    │  │
│  │  │  Service   │ │  Service   │ │  Services  │ │  Service   │    │  │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘    │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐    │  │
│  │  │  Twilio    │ │  SendGrid  │ │  Airtable  │ │   Cache    │    │  │
│  │  │  Service   │ │  Service   │ │  Service   │ │  Service   │    │  │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘    │  │
│  └───────────────────────────┬───────────────────────────────────────┘  │
│                              │                                            │
│                              ▼                                            │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                      DATA LAYER                                    │  │
│  │  ┌────────────────┐              ┌────────────────┐               │  │
│  │  │  PostgreSQL    │              │     Redis      │               │  │
│  │  │                │              │                │               │  │
│  │  │ • Clients      │              │ • Cache        │               │  │
│  │  │ • Jobs         │              │ • Sessions     │               │  │
│  │  │ • Messages     │              │ • Rate Limits  │               │  │
│  │  │ • Sync Status  │              │ • Job Queue    │               │  │
│  │  └────────────────┘              └────────────────┘               │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## 1. API Gateway Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    EXPRESS.JS SERVER                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  app.ts                                                      │
│  ├── Middleware Pipeline                                     │
│  │   ├── cors()              → Cross-Origin requests        │
│  │   ├── helmet()            → Security headers             │
│  │   ├── morgan()            → HTTP request logging         │
│  │   ├── compression()       → GZIP compression             │
│  │   ├── authMiddleware()    → JWT validation               │
│  │   └── rateLimiter()       → API rate limiting            │
│  │                                                           │
│  ├── Route Modules                                           │
│  │   ├── /api/auth/*         → Authentication endpoints     │
│  │   ├── /api/dashboard/*    → Dashboard data               │
│  │   ├── /api/clients/*      → Client management            │
│  │   ├── /api/jobs/*         → Job tracking                 │
│  │   ├── /api/messages/*     → Communication hub            │
│  │   ├── /api/finances/*     → Financial data               │
│  │   └── /api/webhooks/*     → External webhooks            │
│  │                                                           │
│  └── Error Handling                                          │
│      ├── notFound()          → 404 handler                  │
│      └── errorHandler()      → Global error handler         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

```
Client Request
     │
     ▼
┌─────────────┐
│   CORS      │ → Validate origin
└─────┬───────┘
     │
     ▼
┌─────────────┐
│  Security   │ → Helmet headers, XSS protection
└─────┬───────┘
     │
     ▼
┌─────────────┐
│  Logging    │ → Log request details
└─────┬───────┘
     │
     ▼
┌─────────────┐
│    Auth     │ → Verify JWT token
└─────┬───────┘
     │
     ▼
┌─────────────┐
│Rate Limiter │ → Check API limits
└─────┬───────┘
     │
     ▼
┌─────────────┐
│   Router    │ → Route to handler
└─────┬───────┘
     │
     ▼
┌─────────────┐
│  Handler    │ → Process request
└─────┬───────┘
     │
     ▼
Response
```

## 2. Service Layer Architecture

### Unified Service Interface

Each service implements a common interface for consistency:

```typescript
interface ServiceClient {
  // Authentication
  authenticate(): Promise<void>
  refreshToken(): Promise<void>
  
  // Core operations
  list<T>(resource: string, filters?: any): Promise<T[]>
  get<T>(resource: string, id: string): Promise<T>
  create<T>(resource: string, data: any): Promise<T>
  update<T>(resource: string, id: string, data: any): Promise<T>
  delete(resource: string, id: string): Promise<void>
  
  // Service health
  healthCheck(): Promise<boolean>
}
```

### Service Implementation Details

```
┌──────────────────────────────────────────────────────────────────┐
│                        JOBBER SERVICE                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Class: JobberService                                             │
│  ├── Properties                                                   │
│  │   ├── client: GraphQLClient                                   │
│  │   ├── accessToken: string                                     │
│  │   └── tokenExpiry: Date                                       │
│  │                                                                │
│  ├── Methods                                                      │
│  │   ├── authenticate()                                          │
│  │   │   └── Uses OAuth2 flow or Personal Access Token          │
│  │   ├── getClients()                                            │
│  │   │   └── GraphQL: query { clients { ... } }                 │
│  │   ├── getJobs()                                               │
│  │   │   └── GraphQL: query { jobs { ... } }                    │
│  │   ├── createQuote()                                           │
│  │   │   └── GraphQL: mutation { quoteCreate(...) { ... } }     │
│  │   └── syncData()                                              │
│  │       └── Batch sync with local database                      │
│  │                                                                │
│  └── Error Handling                                               │
│      ├── TokenExpiredError → Trigger refresh                     │
│      ├── RateLimitError → Implement backoff                      │
│      └── NetworkError → Retry with exponential backoff           │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                        SLACK SERVICE                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Class: SlackService                                              │
│  ├── Properties                                                   │
│  │   ├── webClient: WebClient (@slack/web-api)                  │
│  │   ├── eventsClient: EventsApi (@slack/events-api)            │
│  │   └── channels: Map<string, Channel>                          │
│  │                                                                │
│  ├── Methods                                                      │
│  │   ├── sendMessage(channel, text, blocks?)                    │
│  │   ├── getConversationHistory(channel, limit)                 │
│  │   ├── handleWebhook(payload)                                  │
│  │   ├── createThread(channel, message)                          │
│  │   └── uploadFile(channel, file)                               │
│  │                                                                │
│  └── Event Handlers                                               │
│      ├── onMessage → Process incoming messages                   │
│      ├── onMention → Handle bot mentions                         │
│      └── onReaction → Track message reactions                    │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                      GOOGLE SERVICES                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Class: GoogleService                                             │
│  ├── Sub-services                                                 │
│  │   ├── CalendarService                                         │
│  │   │   ├── listEvents(timeMin, timeMax)                       │
│  │   │   ├── createEvent(event)                                  │
│  │   │   └── updateEvent(eventId, updates)                       │
│  │   │                                                            │
│  │   ├── GmailService                                            │
│  │   │   ├── listMessages(query)                                 │
│  │   │   ├── sendEmail(to, subject, body)                       │
│  │   │   └── addLabel(messageId, label)                          │
│  │   │                                                            │
│  │   └── DriveService                                            │
│  │       ├── listFiles(folderId)                                 │
│  │       ├── uploadFile(file, metadata)                          │
│  │       └── shareFile(fileId, permissions)                      │
│  │                                                                │
│  └── OAuth2 Management                                            │
│      ├── refreshAccessToken()                                     │
│      └── validateScopes()                                         │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## 3. Data Flow Architecture

### Client Data Synchronization

```
External Services                    Our System
┌─────────────┐                     ┌─────────────────┐
│   Jobber    │◄───── API Call ────►│  Sync Manager   │
└─────────────┘                     └────────┬────────┘
                                            │
┌─────────────┐                             ▼
│ QuickBooks  │◄───── API Call ────►┌─────────────────┐
└─────────────┘                     │  Data Mapper    │
                                    └────────┬────────┘
┌─────────────┐                             │
│   Google    │◄───── API Call ────►        ▼
└─────────────┘                     ┌─────────────────┐
                                    │  PostgreSQL     │
                                    │                 │
                                    │ ┌─────────────┐ │
                                    │ │  Clients    │ │
                                    │ ├─────────────┤ │
                                    │ │ id          │ │
                                    │ │ name        │ │
                                    │ │ email       │ │
                                    │ │ phone       │ │
                                    │ │ jobber_id   │ │
                                    │ │ qb_id       │ │
                                    │ │ created_at  │ │
                                    │ │ updated_at  │ │
                                    │ │ sync_status │ │
                                    │ └─────────────┘ │
                                    └─────────────────┘
```

### Real-time Event Processing

```
┌─────────────────────────────────────────────────────────────┐
│                   EVENT PROCESSING PIPELINE                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Incoming Events                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │Slack Message│  │Jobber Update│  │ QR Invoice  │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                 │                 │                │
│         └─────────────────┴─────────────────┘               │
│                           │                                  │
│                           ▼                                  │
│                    ┌─────────────┐                          │
│                    │Event Router │                          │
│                    └──────┬──────┘                          │
│                           │                                  │
│         ┌─────────────────┼─────────────────┐              │
│         │                 │                 │              │
│         ▼                 ▼                 ▼              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │  WebSocket  │  │Redis PubSub │  │ Bull Queue  │       │
│  │  Broadcast  │  │             │  │             │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
│         │                 │                 │              │
│         ▼                 ▼                 ▼              │
│    Frontend UI      Other Services    Background Jobs      │
│                                                            │
└─────────────────────────────────────────────────────────────┘
```

## 4. Authentication & Security

### JWT Authentication Flow

```
┌─────────┐     Login Request      ┌─────────────┐
│ Client  │ ─────────────────────► │  Auth API   │
└─────────┘                        └──────┬──────┘
                                          │
                                          ▼
                                   ┌─────────────┐
                                   │Verify Creds │
                                   └──────┬──────┘
                                          │
                              ┌───────────┴───────────┐
                              │                       │
                         Success                  Failure
                              │                       │
                              ▼                       ▼
                       ┌─────────────┐         ┌─────────────┐
                       │Generate JWT │         │Return Error │
                       └──────┬──────┘         └─────────────┘
                              │
                              ▼
                       ┌─────────────┐
                       │ Return JWT  │
                       └──────┬──────┘
                              │
┌─────────┐                   ▼                   ┌─────────────┐
│ Client  │ ◄───── JWT Token + Refresh Token ────│  Auth API   │
└────┬────┘                                       └─────────────┘
     │
     │     API Request + JWT
     ▼
┌─────────────┐
│  Protected  │
│     API     │
└─────────────┘
```

### Security Layers

```
┌──────────────────────────────────────────────────────────┐
│                  SECURITY IMPLEMENTATION                  │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  1. Transport Security                                    │
│     └── HTTPS only (TLS 1.3)                            │
│                                                           │
│  2. Authentication                                        │
│     ├── JWT tokens (15min expiry)                       │
│     ├── Refresh tokens (7 days)                         │
│     └── API keys for webhooks                           │
│                                                           │
│  3. Authorization                                         │
│     ├── Role-based access (Admin, User, Viewer)         │
│     └── Resource-level permissions                       │
│                                                           │
│  4. Rate Limiting                                         │
│     ├── Global: 1000 req/hour                           │
│     ├── Auth endpoints: 5 req/min                       │
│     └── Webhook endpoints: 100 req/min                  │
│                                                           │
│  5. Input Validation                                      │
│     ├── Request schema validation (Joi)                  │
│     ├── SQL injection prevention                         │
│     └── XSS protection                                   │
│                                                           │
│  6. Monitoring                                            │
│     ├── Failed auth attempts                             │
│     ├── Unusual API patterns                             │
│     └── Rate limit violations                            │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## 5. API Endpoints Structure

### RESTful API Design

```
/api
├── /auth
│   ├── POST   /login         → User login
│   ├── POST   /refresh       → Refresh token
│   ├── POST   /logout        → User logout
│   └── GET    /me            → Current user info
│
├── /dashboard
│   ├── GET    /summary       → Dashboard metrics
│   ├── GET    /activity      → Recent activity
│   └── GET    /alerts        → System alerts
│
├── /clients
│   ├── GET    /              → List all clients
│   ├── POST   /              → Create client
│   ├── GET    /:id           → Get client details
│   ├── PUT    /:id           → Update client
│   ├── DELETE /:id           → Delete client
│   ├── GET    /:id/jobs      → Client's jobs
│   └── GET    /:id/invoices  → Client's invoices
│
├── /jobs
│   ├── GET    /              → List all jobs
│   ├── POST   /              → Create job
│   ├── GET    /:id           → Get job details
│   ├── PUT    /:id           → Update job
│   ├── PATCH  /:id/status    → Update job status
│   └── POST   /:id/notes     → Add job note
│
├── /messages
│   ├── GET    /              → List messages
│   ├── POST   /              → Send message
│   ├── GET    /threads       → List threads
│   └── POST   /slack         → Send to Slack
│
├── /finances
│   ├── GET    /invoices      → List invoices
│   ├── GET    /payments      → List payments
│   ├── GET    /expenses      → List expenses
│   └── GET    /reports       → Financial reports
│
└── /webhooks
    ├── POST   /slack         → Slack events
    ├── POST   /jobber        → Jobber webhooks
    ├── POST   /quickbooks    → QuickBooks webhooks
    └── POST   /twilio        → Twilio webhooks
```

## 6. Database Schema

### Core Tables Structure

```sql
-- Clients table (unified customer data)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address JSONB,
    
    -- External IDs
    jobber_id VARCHAR(100),
    quickbooks_id VARCHAR(100),
    airtable_id VARCHAR(100),
    
    -- Metadata
    tags TEXT[],
    custom_fields JSONB,
    
    -- Sync tracking
    last_synced_at TIMESTAMP,
    sync_status VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL,
    priority VARCHAR(20),
    
    -- Scheduling
    scheduled_start TIMESTAMP,
    scheduled_end TIMESTAMP,
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,
    
    -- External references
    jobber_job_id VARCHAR(100),
    jobber_quote_id VARCHAR(100),
    
    -- Financial
    estimated_revenue DECIMAL(10, 2),
    actual_revenue DECIMAL(10, 2),
    
    -- Metadata
    assigned_to TEXT[],
    tags TEXT[],
    custom_fields JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id),
    job_id UUID REFERENCES jobs(id),
    
    -- Message details
    channel VARCHAR(50) NOT NULL, -- 'email', 'sms', 'slack'
    direction VARCHAR(10) NOT NULL, -- 'inbound', 'outbound'
    from_address VARCHAR(255),
    to_address VARCHAR(255),
    subject VARCHAR(255),
    body TEXT,
    
    -- External references
    slack_ts VARCHAR(100),
    twilio_sid VARCHAR(100),
    sendgrid_id VARCHAR(100),
    
    -- Status
    status VARCHAR(50),
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sync log table
CREATE TABLE sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service VARCHAR(50) NOT NULL,
    operation VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    status VARCHAR(50),
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 7. Implementation Timeline

### Week 1: Foundation
```
Day 1-2: Project Setup
├── Initialize TypeScript project
├── Set up Docker environment
├── Configure ESLint, Prettier
└── Create base Express server

Day 3-4: Core Services
├── Implement Jobber service
├── Implement Slack service
└── Create service interfaces

Day 5-7: Authentication & Database
├── JWT authentication
├── Database schema
├── Migration scripts
└── Basic CRUD operations
```

### Week 2: Integration
```
Day 8-9: Additional Services
├── Google services integration
├── QuickBooks integration
└── Twilio/SendGrid setup

Day 10-11: API Endpoints
├── Implement all routes
├── Request validation
└── Error handling

Day 12-14: Testing & Documentation
├── Unit tests
├── Integration tests
├── API documentation
└── Deployment prep
```

## Summary

Phase 1 creates a robust, scalable backend that:
- **Unifies** data from multiple services
- **Standardizes** API interfaces
- **Secures** all endpoints
- **Scales** with Redis caching and job queues
- **Monitors** all operations
- **Syncs** data in real-time

This foundation enables the frontend dashboard to display real-time, unified business data with the ability to take actions across all integrated services.