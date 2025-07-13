#!/usr/bin/env node
// Initialize Firestore collections and indexes for Communications Hub

import { initializeFirebase, getFirestore } from '../config/firebase';
import { COLLECTIONS, REQUIRED_INDEXES } from '../config/firestore-schema';
import { logger } from '../utils/logger';

const log = logger.child('FirestoreInit');

async function initializeFirestore() {
  try {
    log.info('Starting Firestore initialization...');
    
    // Initialize Firebase first
    initializeFirebase();
    const db = getFirestore();
    
    // Create default communication preferences
    await createDefaultPreferences(db);
    
    // Create sample data for development
    if (process.env.NODE_ENV === 'development') {
      await createSampleData(db);
    }
    
    // Log index requirements
    logIndexRequirements();
    
    log.info('Firestore initialization completed successfully');
  } catch (error) {
    log.error('Failed to initialize Firestore', error);
    process.exit(1);
  }
}

async function createDefaultPreferences(db: any) {
  log.info('Creating default communication preferences...');
  
  const defaultPrefs = {
    userId: 'default',
    defaultPlatform: 'slack',
    notifications: {
      desktop: true,
      mobile: true,
      email: false,
      urgentOnly: false,
    },
    autoResponse: {
      enabled: true,
      useAI: true,
      customMessage: 'Thank you for your message. We\'ll get back to you as soon as possible.',
      workingHours: {
        enabled: true,
        timezone: 'America/New_York',
        schedule: [
          { day: 'monday', start: '09:00', end: '17:00' },
          { day: 'tuesday', start: '09:00', end: '17:00' },
          { day: 'wednesday', start: '09:00', end: '17:00' },
          { day: 'thursday', start: '09:00', end: '17:00' },
          { day: 'friday', start: '09:00', end: '17:00' },
        ],
      },
    },
    ai: {
      smartCompose: true,
      autoSuggest: true,
      sentimentAnalysis: true,
      autoCategorie: true,
      summarization: true,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  await db.collection(COLLECTIONS.COMMUNICATION_PREFERENCES)
    .doc('default')
    .set(defaultPrefs);
    
  log.info('Default preferences created');
}

async function createSampleData(db: any) {
  log.info('Creating sample data for development...');
  
  // Sample message templates
  const templates = [
    {
      userId: 'default',
      name: 'Welcome Message',
      content: 'Welcome to DuetRight IT! How can we help you today?',
      category: 'greeting',
      platform: 'all',
      aiGenerated: false,
      usageCount: 0,
      deleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      userId: 'default',
      name: 'Technical Support',
      content: 'Thanks for contacting technical support. Can you please describe the issue you\'re experiencing?',
      category: 'support',
      platform: 'all',
      aiGenerated: false,
      usageCount: 0,
      deleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      userId: 'default',
      name: 'Out of Office',
      content: 'We\'re currently out of the office. We\'ll respond to your message within one business day.',
      category: 'auto-response',
      platform: 'all',
      aiGenerated: false,
      usageCount: 0,
      deleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  
  for (const template of templates) {
    await db.collection(COLLECTIONS.MESSAGE_TEMPLATES).add(template);
  }
  
  // Sample contact
  const sampleContact = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phoneNumbers: ['+1234567890'],
    company: 'Example Corp',
    notes: 'Sample contact for testing',
    tags: ['client', 'test'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  await db.collection(COLLECTIONS.CONTACTS).add(sampleContact);
  
  log.info('Sample data created');
}

function logIndexRequirements() {
  log.info('Firestore index requirements:');
  log.info('Please create these composite indexes in the Firebase Console:');
  
  for (const index of REQUIRED_INDEXES) {
    const fieldsStr = index.fields
      .map(f => `${f.field} (${f.order})`)
      .join(', ');
    log.info(`- ${index.collection}: ${fieldsStr}`);
  }
  
  log.info('');
  log.info('Single-field indexes (auto-created):');
  const singleFields = [
    'messages: conversationId, platform, timestamp, type',
    'conversations: userId, platform, status, lastMessageAt',
    'message_templates: userId, platform, category, deleted',
    'ai_tasks: status, type, messageId, conversationId',
    'grok_usage: userId, date',
    'notifications: status, priority, type',
    'slack_installations: userId, teamId',
    'oauth_states: provider, userId',
    'contacts: email, phoneNumbers, tags',
    'calls: platform, from, to, timestamp',
  ];
  
  for (const field of singleFields) {
    log.info(`- ${field}`);
  }
}

// Security Rules Template
const SECURITY_RULES = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Messages - authenticated users can access their own messages
    match /messages/{messageId} {
      allow read, write: if request.auth != null 
        && (resource.data.userId == request.auth.uid 
            || request.auth.token.email_verified == true);
    }
    
    // Conversations - authenticated users can access their conversations
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null 
        && (resource.data.userId == request.auth.uid 
            || request.auth.token.email_verified == true);
    }
    
    // Message templates - users can manage their templates
    match /message_templates/{templateId} {
      allow read, write: if request.auth != null 
        && resource.data.userId == request.auth.uid;
    }
    
    // Communication preferences - users can manage their preferences
    match /communication_preferences/{userId} {
      allow read, write: if request.auth != null 
        && (userId == request.auth.uid || userId == 'default');
    }
    
    // Slack installations - authenticated users only
    match /slack_installations/{installationId} {
      allow read, write: if request.auth != null 
        && request.auth.token.email_verified == true;
    }
    
    // OAuth states - temporary, allow read/write during auth flow
    match /oauth_states/{stateId} {
      allow read, write: if true; // Temporary for OAuth flow
    }
    
    // Contacts - authenticated users can manage contacts
    match /contacts/{contactId} {
      allow read, write: if request.auth != null 
        && request.auth.token.email_verified == true;
    }
    
    // Calls - authenticated users can access call data
    match /calls/{callId} {
      allow read, write: if request.auth != null 
        && request.auth.token.email_verified == true;
    }
    
    // AI tasks - system use only
    match /ai_tasks/{taskId} {
      allow read, write: if request.auth != null 
        && request.auth.token.email_verified == true;
    }
    
    // Grok usage - authenticated users can view their usage
    match /grok_usage/{usageId} {
      allow read: if request.auth != null 
        && resource.data.userId == request.auth.uid;
      allow write: if request.auth != null 
        && request.auth.token.email_verified == true;
    }
    
    // Notifications - authenticated users can access notifications
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null 
        && request.auth.token.email_verified == true;
    }
    
    // Auto-responses - authenticated users can manage
    match /twilio_auto_responses/{phoneNumber} {
      allow read, write: if request.auth != null 
        && request.auth.token.email_verified == true;
    }
    
    // Slack actions and submissions - system use
    match /slack_actions/{actionId} {
      allow read, write: if request.auth != null;
    }
    
    match /slack_submissions/{submissionId} {
      allow read, write: if request.auth != null;
    }
  }
}
`;

function logSecurityRules() {
  log.info('Firestore Security Rules Template:');
  log.info('Copy this to your firestore.rules file:');
  log.info('');
  log.info(SECURITY_RULES);
}

// Run if called directly
if (require.main === module) {
  initializeFirestore()
    .then(() => {
      log.info('');
      logSecurityRules();
      process.exit(0);
    })
    .catch((error) => {
      log.error('Initialization failed', error);
      process.exit(1);
    });
}

export { initializeFirestore };