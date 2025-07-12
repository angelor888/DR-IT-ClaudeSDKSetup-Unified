# DuetRight Dashboard

Integrated business automation dashboard with enterprise-grade reliability, monitoring, and scalability.

## 🏗️ Architecture

- **Backend**: Express.js with TypeScript (Modular Monolith)
- **Database**: Firestore with health monitoring
- **Authentication**: Firebase Auth with JWT tokens
- **Infrastructure**: Docker, Cloud Run, Redis
- **Monitoring**: Health checks, circuit breakers, structured logging
- **API Documentation**: OpenAPI/Swagger
- **Testing**: Jest with 80%+ coverage

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

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Firebase project with Admin SDK
- (Optional) Docker for containerized development

### Development Setup

1. **Clone and install**
   ```bash
   cd dashboard
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example ../.env
   # Edit ../.env with your credentials
   ```

3. **Run locally**
   ```bash
   npm run dev
   ```

4. **Run with Docker**
   ```bash
   npm run docker:build
   npm run docker:run
   ```

### Production Build
```bash
npm run build
NODE_ENV=production npm start
```

## 📜 Available Scripts

### Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production server

### Quality Assurance
- `npm run typecheck` - TypeScript type checking
- `npm run lint` - ESLint code analysis
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run test:integration` - Run integration tests only
- `npm run validate` - Run all checks (types, lint, format, tests)

### Operations
- `npm run monitor` - Monitor health endpoints
- `npm run docker:build` - Build Docker image
- `npm run docker:run` - Run with docker-compose
- `npm run docker:stop` - Stop containers
- `npm run docker:logs` - View container logs

## 🔌 API Endpoints

### Documentation
- `GET /api/v1/docs` - Interactive Swagger UI
- `GET /api/v1/docs/spec` - OpenAPI specification

### Health & Monitoring
- `GET /health` - Basic health check
- `GET /api/health/live` - Kubernetes liveness probe
- `GET /api/health/ready` - Kubernetes readiness probe
- `GET /api/health/detailed` - Detailed system health
- `GET /api/health/services` - All service statuses
- `GET /api/health/services/:name` - Specific service health

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

## 🛡️ Security Features

- **Input Validation**: All endpoints validated with express-validator
- **Rate Limiting**: Configurable limits per endpoint type
- **Authentication**: Firebase Auth with JWT verification
- **Request Sanitization**: Automatic XSS prevention
- **Environment Validation**: Startup checks for required configs
- **Error Handling**: No sensitive data in error responses

## 📊 Monitoring & Reliability

- **Circuit Breakers**: Prevent cascading failures
- **Retry Logic**: Exponential backoff with jitter
- **Health Checks**: Comprehensive system monitoring
- **Request IDs**: Full request tracing
- **Structured Logging**: JSON logs with context
- **Performance Metrics**: Response times, memory usage

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Watch mode for development
npm run test:watch
```

Current coverage: ~80% (target: 90%)

## 🚢 Deployment

### Docker
```bash
# Build image
docker build -t duetright/dashboard:latest .

# Run locally
docker-compose up -d

# View logs
docker-compose logs -f dashboard
```

### Cloud Run
Deployment is automated via GitHub Actions on push to main branch.

### Manual deployment
```bash
gcloud run deploy dashboard \
  --image gcr.io/PROJECT_ID/dashboard:latest \
  --platform managed \
  --region us-central1
```

## 🔧 Configuration

See `.env.example` for all configuration options. Key settings:

- **Server**: Port, environment, API version
- **Firebase**: Project ID, credentials
- **Services**: Individual service credentials and feature flags
- **Monitoring**: Log levels, Sentry DSN
- **Rate Limits**: Request limits and windows

## 🏗️ Project Structure

```
dashboard/
├── src/
│   ├── core/              # Core infrastructure
│   │   ├── config/        # Configuration management
│   │   ├── errors/        # Error classes
│   │   ├── logging/       # Structured logging
│   │   ├── middleware/    # Express middleware
│   │   └── services/      # Base service classes
│   ├── api/               # API endpoints
│   │   ├── health/        # Health checks
│   │   ├── auth/          # Authentication
│   │   └── documentation/ # Swagger docs
│   ├── services/          # External service integrations
│   ├── models/            # Data models
│   └── utils/             # Utilities
├── tests/                 # Test files
├── scripts/               # Utility scripts
├── .github/workflows/     # CI/CD pipelines
└── docker-compose.yml     # Local development
```

## 🤝 Contributing

1. Create feature branch from `develop`
2. Write tests for new functionality
3. Ensure all checks pass: `npm run validate`
4. Submit PR with clear description

## 📝 License

Proprietary - DuetRight © 2025