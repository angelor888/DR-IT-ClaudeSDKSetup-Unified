# TODO Before Starting Phase 1 Dashboard

## 1. Service Authentication Status
- ✅ Slack - Working
- ✅ Jobber - Working (but token may expire)
- ❌ QuickBooks - Needs re-authentication
- ✅ Google Calendar - Working
- ✅ Airtable - Working
- ✅ SendGrid - Working
- ⚠️ Twilio - No credentials configured

## 2. Environment Preparation
- [ ] Refresh Jobber token if needed
- [ ] Re-authenticate QuickBooks OAuth
- [ ] Set up Twilio credentials (if needed)
- [ ] Verify all API keys in ~/.config/claude/environment

## 3. Firebase Project Setup
- [ ] Create new Firebase project for dashboard
- [ ] Enable Firestore
- [ ] Enable Authentication
- [ ] Enable Cloud Run API
- [ ] Get Firebase config for frontend

## 4. Development Tools Check
- [ ] Node.js 18+ installed
- [ ] Docker Desktop running
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] TypeScript knowledge refresher

## 5. Project Decisions Made
- ✅ Using Firebase Auth (not custom JWT)
- ✅ Using Firestore (not PostgreSQL)
- ✅ Using Cloud Tasks (not Redis)
- ✅ Modular monolith (not microservices)
- ✅ Vue.js for frontend

## 6. First Day Focus
1. Create project structure
2. Basic Express + TypeScript setup
3. Health check endpoint
4. Firebase project initialization
5. Deploy early to Cloud Run

## Notes
- We have working test scripts to convert to modules
- Sky AI is configured for notifications
- All Slack channels are accessible
- Comprehensive plan in docs/phase1-dashboard-implementation-plan.md

---
*Created: July 10, 2025*
*Start Date: July 11, 2025*