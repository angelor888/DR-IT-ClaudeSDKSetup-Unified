# DuetRight Dashboard

Integrated business automation dashboard connecting Jobber, Slack, QuickBooks, and Google services.

## Architecture

- **Backend**: Express.js with TypeScript (Modular Monolith)
- **Database**: Firestore (real-time updates)
- **Authentication**: Firebase Auth (planned)
- **Hosting**: Cloud Run via Firebase
- **Queue**: Cloud Tasks for async jobs

## Project Structure

```
dashboard/
├── src/
│   ├── modules/          # Service integrations
│   │   ├── jobber/       # Jobber API integration
│   │   ├── slack/        # Slack bot and webhooks
│   │   ├── quickbooks/   # QuickBooks sync
│   │   └── google/       # Calendar, Drive, etc.
│   ├── api/              # Express routes
│   ├── models/           # Data models
│   ├── middleware/       # Auth, validation, etc.
│   └── index.ts          # Main app entry
├── frontend/             # Vue.js dashboard
└── public/               # Static assets
```

## Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment variables**
   - Copy `.env.example` to `.env` in parent directory
   - Fill in all required API credentials

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production server
- `npm run lint` - Check TypeScript types

## API Endpoints

### Public Endpoints
- `GET /` - API info
- `GET /health` - Health check

### Authentication Endpoints
- `POST /api/auth/register` - Create new user account
- `GET /api/auth/user` - Get current user (requires auth)
- `PATCH /api/auth/user` - Update user profile (requires auth)
- `DELETE /api/auth/user` - Soft delete account (requires auth)
- `POST /api/auth/reset-password` - Send password reset email
- `GET /api/auth/health` - Auth service health check

### Test Endpoints
- `POST /api/test/firestore/write` - Test Firestore write
- `GET /api/test/firestore/read` - Test Firestore read
- `GET /api/test/firestore/status` - Check Firestore connection

### Service Endpoints (Coming Soon)
- `/api/slack/*` - Slack integration
- `/api/jobber/*` - Jobber integration
- `/api/quickbooks/*` - QuickBooks integration

## Phase 1 Status

- ✅ TypeScript/Express setup
- ✅ Basic project structure
- ✅ Health check endpoint
- ✅ Firebase project setup & Firestore connected
- ✅ Basic data models (User, Task, Event)
- ✅ Firestore test endpoints working
- ✅ Authentication implementation (Firebase Auth)
- ✅ Auth middleware for protected routes
- ⏳ Service module migration
- ⏳ Frontend development
- ⏳ Firestore security rules

## Firebase Setup

1. **Service Account**: Place `firebase-service-account.json` in dashboard directory
2. **Environment**: Firebase project ID is configured in `.env`
3. **Collections**: Using `users`, `tasks`, `events`, `jobs`, `automations`
4. **Authentication**: Firebase Auth enabled with Email/Password
5. **Client Config**: Available in `src/config/firebase-client.ts`

## Authentication

The API uses Firebase Authentication with Bearer token authorization:

```bash
# Get a token using Firebase client SDK, then:
curl -H "Authorization: Bearer <token>" http://localhost:8080/api/auth/user
```

Test authentication with: `npx ts-node src/scripts/test-auth.ts`

## Next Steps

1. Migrate existing service scripts to modules
2. Implement Firebase Authentication
3. Build Vue.js frontend with real-time updates
4. Deploy to Cloud Run via Firebase