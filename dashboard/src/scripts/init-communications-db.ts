#!/usr/bin/env node

// Initialize Firestore collections for the Communications Hub

import { getFirestore } from '../config/firebase';
import { logger } from '../utils/logger';

const log = logger.child('InitCommunicationsDB');
const db = getFirestore();

async function createCollections() {
  try {
    log.info('Initializing Communications Hub collections...');

    // Create conversations collection with sample data
    const conversationsRef = db.collection('conversations');
    await conversationsRef.doc('_init').set({
      _initialized: true,
      _description: 'Unified conversations across all platforms',
      _createdAt: new Date().toISOString(),
    });

    // Create messages collection
    const messagesRef = db.collection('messages');
    await messagesRef.doc('_init').set({
      _initialized: true,
      _description: 'Unified messages from all communication platforms',
      _createdAt: new Date().toISOString(),
    });

    // Create communication_templates collection
    const templatesRef = db.collection('communication_templates');
    await templatesRef.doc('_init').set({
      _initialized: true,
      _description: 'Message templates for quick responses',
      _createdAt: new Date().toISOString(),
    });

    // Create communication_preferences collection
    const preferencesRef = db.collection('communication_preferences');
    await preferencesRef.doc('_init').set({
      _initialized: true,
      _description: 'User preferences for communications',
      _createdAt: new Date().toISOString(),
    });

    // Create communication_stats collection
    const statsRef = db.collection('communication_stats');
    await statsRef.doc('_init').set({
      _initialized: true,
      _description: 'Analytics and statistics for communications',
      _createdAt: new Date().toISOString(),
    });

    log.info('Communications Hub collections initialized successfully');

    // Create indexes
    log.info('Creating Firestore indexes...');

    // Note: Composite indexes need to be created through Firebase Console or CLI
    // Here we document the required indexes:
    const requiredIndexes = [
      {
        collection: 'conversations',
        fields: [
          { field: 'userId', order: 'ASCENDING' },
          { field: 'status', order: 'ASCENDING' },
          { field: 'lastMessageAt', order: 'DESCENDING' },
        ],
      },
      {
        collection: 'messages',
        fields: [
          { field: 'conversationId', order: 'ASCENDING' },
          { field: 'timestamp', order: 'DESCENDING' },
        ],
      },
      {
        collection: 'messages',
        fields: [
          { field: 'userId', order: 'ASCENDING' },
          { field: 'platform', order: 'ASCENDING' },
          { field: 'timestamp', order: 'DESCENDING' },
        ],
      },
    ];

    log.info('Required composite indexes:');
    requiredIndexes.forEach((index, i) => {
      log.info(`${i + 1}. Collection: ${index.collection}`);
      log.info(`   Fields: ${index.fields.map(f => `${f.field} (${f.order})`).join(', ')}`);
    });

    log.info('Please create these indexes in the Firebase Console');
  } catch (error) {
    log.error('Failed to initialize Communications Hub collections:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createCollections()
    .then(() => {
      log.info('Script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      log.error('Script failed:', error);
      process.exit(1);
    });
}

export { createCollections };
