# DuetRight Dashboard Backend API

This is the backend API server for the DuetRight Dashboard application.

## Features

- RESTful API with Express.js
- JWT-based authentication
- Mock data for testing (ready for database integration)
- CORS enabled for frontend integration
- Environment-based configuration

## Prerequisites

- Node.js 16+ and npm
- Port 5001 available

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file (already created with defaults)

## Running the Server

### Development Mode
```bash
npm run dev
```
This uses nodemon for auto-restarting on file changes.

### Production Mode
```bash
npm start
```

### Run in Background
```bash
nohup npm start > server.log 2>&1 &
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login (accepts any email/password in demo mode)
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/logout` - Logout

### Customers
- `GET /api/customers` - Get all customers (paginated)
- `GET /api/customers/:id` - Get single customer
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `PATCH /api/customers/:id/archive` - Archive/unarchive customer
- `DELETE /api/customers/:id` - Delete customer

### Jobs
- `GET /api/jobs` - Get all jobs (paginated)
- `GET /api/jobs/:id` - Get single job
- `POST /api/jobs` - Create job
- `PUT /api/jobs/:id` - Update job
- `PATCH /api/jobs/:id/status` - Update job status
- `POST /api/jobs/:id/archive` - Archive job
- `DELETE /api/jobs/:id` - Delete job
- `GET /api/jobs/stats` - Get job statistics

### Communications
- `GET /api/communications/messages` - Get messages
- `GET /api/communications/conversations` - Get conversations
- `POST /api/communications/messages/send` - Send message
- `POST /api/communications/messages/read` - Mark messages as read
- `GET /api/communications/stats` - Get communication statistics
- `DELETE /api/communications/messages/:id` - Delete message

### Health Check
- `GET /api/health` - Server health status

## Environment Variables

```env
PORT=5001
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## Authentication

All endpoints except `/api/auth/login` and `/api/health` require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Demo Mode

Currently, the server uses in-memory mock data. In production, you would:
1. Connect to a real database (PostgreSQL, MongoDB, etc.)
2. Implement proper password hashing
3. Add input validation
4. Set up proper error logging
5. Configure rate limiting

## Next Steps

1. Add database integration
2. Implement real Jobber API integration
3. Add Twilio SMS functionality
4. Add Slack integration
5. Implement WebSocket for real-time updates
6. Add comprehensive test suite