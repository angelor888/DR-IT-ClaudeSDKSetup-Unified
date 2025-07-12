import { Router, Request, Response } from 'express';
import { getCollection, getFirestore, timestamp } from '../../config/firebase';
import { createTask, Task } from '../../models/Task';
import { createEvent, Event } from '../../models/Event';
import { logger } from '../../utils/logger';

const router = Router();
const log = logger.child('FirestoreTest');

// Test write to Firestore
router.post('/write', async (_req: Request, res: Response) => {
  try {
    // Create a test task
    const testTask = createTask('custom', 'Test Task - ' + new Date().toLocaleString(), 'system', {
      description: 'This is a test task created to verify Firestore write functionality',
    });

    // Write to Firestore
    const docRef = await getCollection('tasks').add(testTask);
    log.info('Test task created', { id: docRef.id });

    // Also create an event log
    const event = createEvent(
      'info',
      'system',
      'test.firestore.write',
      'Test write to Firestore successful',
      { source: 'api' },
      { entityId: docRef.id, entityType: 'task' }
    );

    await getCollection('events').add(event);

    res.json({
      success: true,
      message: 'Test data written to Firestore',
      taskId: docRef.id,
      data: {
        ...testTask,
        id: docRef.id,
      },
    });
  } catch (error) {
    log.error('Firestore write test failed', error);
    res.status(500).json({
      success: false,
      error: 'Failed to write to Firestore',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Test read from Firestore
router.get('/read', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    // Read recent tasks
    const tasksSnapshot = await getCollection('tasks')
      .orderBy('metadata.createdAt', 'desc')
      .limit(limit)
      .get();

    const tasks: (Task & { id: string })[] = [];
    tasksSnapshot.forEach(doc => {
      tasks.push({
        ...(doc.data() as Task),
        id: doc.id,
      });
    });

    // Read recent events
    const eventsSnapshot = await getCollection('events')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const events: (Event & { id: string })[] = [];
    eventsSnapshot.forEach(doc => {
      events.push({
        ...(doc.data() as Event),
        id: doc.id,
      });
    });

    log.info('Firestore read test completed', {
      tasksCount: tasks.length,
      eventsCount: events.length,
    });

    res.json({
      success: true,
      message: 'Data read from Firestore successfully',
      data: {
        tasks,
        events,
        counts: {
          tasks: tasks.length,
          events: events.length,
        },
      },
    });
  } catch (error) {
    log.error('Firestore read test failed', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read from Firestore',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Test Firestore connection
router.get('/status', async (_req: Request, res: Response) => {
  try {
    // Try to read server time
    const db = getFirestore();
    const testDoc = await db.collection('_test').add({
      timestamp: timestamp(),
      test: true,
    });

    // Clean up test document
    await testDoc.delete();

    res.json({
      success: true,
      message: 'Firestore connection is healthy',
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } catch (error) {
    log.error('Firestore connection test failed', error);
    res.status(500).json({
      success: false,
      error: 'Firestore connection failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
