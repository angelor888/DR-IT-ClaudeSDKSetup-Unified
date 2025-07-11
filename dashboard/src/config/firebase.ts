import * as admin from 'firebase-admin';
import { logger } from '../utils/logger';
import path from 'path';

const log = logger.child('Firebase');

// Initialize Firebase Admin SDK
let app: admin.app.App;
let db: admin.firestore.Firestore;

export function initializeFirebase(): void {
  try {
    // Path to service account key
    const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');
    
    // Initialize with service account
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
      projectId: 'duetright-dashboard'
    });

    // Get Firestore instance
    db = admin.firestore();
    
    // Configure Firestore settings
    db.settings({
      ignoreUndefinedProperties: true,
      timestampsInSnapshots: true
    });

    log.info('Firebase Admin SDK initialized successfully');
  } catch (error) {
    log.error('Failed to initialize Firebase Admin SDK', error);
    throw error;
  }
}

// Get Firestore instance
export function getFirestore(): admin.firestore.Firestore {
  if (!db) {
    throw new Error('Firestore not initialized. Call initializeFirebase() first.');
  }
  return db;
}

// Get Firebase Auth instance
export function getAuth(): admin.auth.Auth {
  if (!app) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return admin.auth();
}

// Collections
export const collections = {
  users: 'users',
  tasks: 'tasks',
  events: 'events',
  jobs: 'jobs',
  automations: 'automations'
} as const;

// Helper to get collection reference
export function getCollection(name: keyof typeof collections): admin.firestore.CollectionReference {
  return getFirestore().collection(collections[name]);
}

// Helper to create timestamps
export const timestamp = admin.firestore.FieldValue.serverTimestamp;
export const FieldValue = admin.firestore.FieldValue;

// Export createUser helper
export { createUser } from '../models/User';