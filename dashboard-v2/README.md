# DuetRight Dashboard V2

A clean, modern dashboard for managing customers, jobs, and communications for DuetRight IT.

## Features

- **Customer Management**: Track and manage customer information
- **Job Tracking**: Monitor active jobs and projects
- **Communications Hub**: Centralized messaging with Twilio and Slack integration
- **Analytics Dashboard**: Real-time metrics and insights
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **React 17**: Stable version avoiding React 18 compatibility issues
- **TypeScript**: Type-safe development
- **Redux Toolkit**: State management
- **Material-UI v5**: Component library
- **React Router v6**: Routing
- **Axios**: API communication
- **Create React App**: Build tooling

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Backend API running on port 5001 (or configured in .env)

### Installation

1. Clone the repository
2. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm start
   ```

The app will open at [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── common/      # Generic components
│   └── layout/      # Layout components
├── features/        # Feature-specific components
│   ├── auth/       # Authentication
│   ├── dashboard/  # Dashboard overview
│   ├── customers/  # Customer management
│   ├── jobs/       # Job management
│   └── communications/ # Messaging features
├── services/       # API and external services
│   └── api/       # API configuration and calls
├── store/         # Redux store configuration
├── utils/         # Utility functions and helpers
└── types/         # TypeScript type definitions
```

## Available Scripts

- `npm start` - Run development server
- `npm test` - Run tests
- `npm run build` - Build for production
- `npm run eject` - Eject from Create React App (irreversible)

## Environment Variables

See `.env.example` for all available configuration options:

- `REACT_APP_API_URL` - Backend API URL
- Firebase configuration (optional)
- Twilio configuration (optional)
- Slack configuration (optional)

## Authentication

The app uses JWT token-based authentication. Tokens are stored in localStorage and automatically included in API requests.

## Deployment

### Build for production:
```bash
npm run build
```

The build folder will contain optimized static files ready for deployment.

### Deploy to Firebase Hosting:
```bash
firebase init hosting
firebase deploy
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

Private - DuetRight IT