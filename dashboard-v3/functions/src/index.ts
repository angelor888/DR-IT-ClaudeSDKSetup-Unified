import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as cors from 'cors';
import axios from 'axios';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize CORS
const corsHandler = cors.default({ origin: true });

// Types
interface GrokChatRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  userId: string;
  conversationId?: string;
  options?: {
    maxTokens?: number;
    temperature?: number;
    stream?: boolean;
  };
}

interface MCPExecuteRequest {
  server: string;
  method: string;
  params: Record<string, any>;
  userId: string;
}

// Grok Chat Endpoint
export const grokChat = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      // Verify authentication
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).send('Unauthorized');
        return;
      }

      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      const userId = decodedToken.uid;

      const { messages, conversationId, options } = req.body as GrokChatRequest;

      // Get Grok API key from environment
      const grokApiKey = functions.config().grok?.api_key;
      if (!grokApiKey) {
        throw new Error('Grok API key not configured');
      }

      // Save conversation to Firestore
      const conversationRef = conversationId 
        ? admin.firestore().collection('conversations').doc(conversationId)
        : admin.firestore().collection('conversations').doc();

      await conversationRef.set({
        userId,
        messages,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      // Call Grok API
      const grokResponse = await axios.post(
        'https://api.x.ai/v1/chat/completions',
        {
          model: 'grok-4',
          messages,
          max_tokens: options?.maxTokens || 4000,
          temperature: options?.temperature || 0.7,
          stream: false, // Streaming not supported in Firebase Functions
        },
        {
          headers: {
            'Authorization': `Bearer ${grokApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 60 seconds
        }
      );

      // Log usage for analytics
      await admin.firestore().collection('ai_usage').add({
        userId,
        type: 'chat',
        model: 'grok-4',
        promptTokens: grokResponse.data.usage?.prompt_tokens || 0,
        completionTokens: grokResponse.data.usage?.completion_tokens || 0,
        totalTokens: grokResponse.data.usage?.total_tokens || 0,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({
        success: true,
        data: grokResponse.data,
        conversationId: conversationRef.id,
      });
    } catch (error: any) {
      console.error('Grok chat error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  });
});

// MCP Execute Endpoint
export const mcpExecute = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      // Verify authentication
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).send('Unauthorized');
        return;
      }

      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      const userId = decodedToken.uid;

      // Check user permissions
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      const userData = userDoc.data();
      
      if (!userData?.roles?.includes('admin') && !userData?.roles?.includes('ai_user')) {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions for AI operations',
        });
        return;
      }

      const { server, method, params } = req.body as MCPExecuteRequest;

      // Validate server and method
      const allowedServers = [
        'slack', 'jobber', 'gmail', 'twilio', 'google-calendar',
        'matterport', 'google-drive', 'airtable', 'sendgrid'
      ];

      if (!allowedServers.includes(server)) {
        res.status(400).json({
          success: false,
          error: `Invalid server: ${server}`,
        });
        return;
      }

      // Log the command execution
      const commandRef = await admin.firestore().collection('ai_commands').add({
        userId,
        server,
        method,
        params: params || {},
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Here you would integrate with actual MCP servers
      // For now, we'll simulate the execution
      let result: any;
      
      try {
        // Route to appropriate service handler
        switch (server) {
          case 'slack':
            result = await executeSlackCommand(method, params);
            break;
          case 'jobber':
            result = await executeJobberCommand(method, params);
            break;
          case 'gmail':
            result = await executeGmailCommand(method, params);
            break;
          case 'twilio':
            result = await executeTwilioCommand(method, params);
            break;
          default:
            result = { message: `Executed ${server}.${method}`, params };
        }

        // Update command status
        await commandRef.update({
          status: 'completed',
          result,
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.json({
          success: true,
          commandId: commandRef.id,
          result,
        });
      } catch (error: any) {
        // Update command status
        await commandRef.update({
          status: 'failed',
          error: error.message,
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        throw error;
      }
    } catch (error: any) {
      console.error('MCP execute error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  });
});

// Service handlers (implement based on your actual integrations)
async function executeSlackCommand(method: string, params: any) {
  const slackToken = functions.config().slack?.bot_token;
  // TODO: Implement Slack API integration
  console.log('Slack token configured:', !!slackToken);
  
  switch (method) {
    case 'send_message':
      // Implement Slack message sending
      return { sent: true, channel: params.channel, message: params.message };
    default:
      throw new Error(`Unknown Slack method: ${method}`);
  }
}

async function executeJobberCommand(method: string, params: any) {
  const jobberClientId = functions.config().jobber?.client_id;
  const jobberClientSecret = functions.config().jobber?.client_secret;
  console.log('Jobber credentials configured:', !!jobberClientId && !!jobberClientSecret);
  
  switch (method) {
    case 'create_job':
      // Implement Jobber job creation
      return { created: true, jobId: 'job_' + Date.now(), ...params };
    case 'create_client':
      // Implement Jobber client creation
      return { created: true, clientId: 'client_' + Date.now(), ...params };
    default:
      throw new Error(`Unknown Jobber method: ${method}`);
  }
}

async function executeGmailCommand(method: string, params: any) {
  switch (method) {
    case 'send_email':
      // Implement Gmail sending
      return { sent: true, to: params.to, subject: params.subject };
    default:
      throw new Error(`Unknown Gmail method: ${method}`);
  }
}

async function executeTwilioCommand(method: string, params: any) {
  const twilioSid = functions.config().twilio?.account_sid;
  const twilioToken = functions.config().twilio?.auth_token;
  // TODO: Implement Twilio API integration
  console.log('Twilio credentials configured:', !!twilioSid && !!twilioToken);
  
  switch (method) {
    case 'send_sms':
      // Implement Twilio SMS sending
      return { sent: true, to: params.to, message: params.message };
    default:
      throw new Error(`Unknown Twilio method: ${method}`);
  }
}

// Conversation History Endpoint
export const getConversations = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'GET') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      // Verify authentication
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).send('Unauthorized');
        return;
      }

      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      const userId = decodedToken.uid;

      // Get user's conversations
      const conversationsSnapshot = await admin.firestore()
        .collection('conversations')
        .where('userId', '==', userId)
        .orderBy('updatedAt', 'desc')
        .limit(20)
        .get();

      const conversations = conversationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.json({
        success: true,
        conversations,
      });
    } catch (error: any) {
      console.error('Get conversations error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  });
});

// AI Usage Analytics Endpoint
export const getAIUsage = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'GET') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      // Verify authentication
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).send('Unauthorized');
        return;
      }

      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      const userId = decodedToken.uid;

      // Check admin permissions
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      const userData = userDoc.data();
      
      if (!userData?.roles?.includes('admin')) {
        // Return only user's own usage
        const userUsageSnapshot = await admin.firestore()
          .collection('ai_usage')
          .where('userId', '==', userId)
          .orderBy('timestamp', 'desc')
          .limit(100)
          .get();

        const usage = userUsageSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        res.json({
          success: true,
          usage,
          isPersonal: true,
        });
        return;
      }

      // Admin can see all usage
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const usageSnapshot = await admin.firestore()
        .collection('ai_usage')
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate)
        .orderBy('timestamp', 'desc')
        .get();

      const usage = usageSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Calculate totals
      const totals = usage.reduce((acc, item: any) => {
        acc.totalTokens += item.totalTokens || 0;
        acc.promptTokens += item.promptTokens || 0;
        acc.completionTokens += item.completionTokens || 0;
        acc.requests += 1;
        return acc;
      }, {
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        requests: 0,
      });

      res.json({
        success: true,
        usage,
        totals,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      });
    } catch (error: any) {
      console.error('Get AI usage error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  });
});

// Slack reporting endpoint
export const sendSlackReport = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const { channel, text, username } = req.body;
      
      const slackToken = functions.config().slack?.bot_token;
      if (!slackToken) {
        console.log('Slack token not configured, logging message instead:', text);
        res.json({
          success: true,
          message: 'Report logged (Slack not configured)',
          data: { channel, text }
        });
        return;
      }

      // Send to Slack
      const slackResponse = await axios.post(
        'https://slack.com/api/chat.postMessage',
        {
          channel: channel || '#it-report',
          text,
          username: username || 'DuetRight Dashboard',
        },
        {
          headers: {
            'Authorization': `Bearer ${slackToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      res.json({
        success: true,
        message: 'Report sent to Slack',
        slackResponse: slackResponse.data,
      });
    } catch (error: any) {
      console.error('Slack report error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  });
});

// Jobber OAuth Flow
export const jobberOAuth = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).send('Unauthorized');
        return;
      }

      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      const userId = decodedToken.uid;

      const { action, code, state } = req.body;
      const jobberClientId = functions.config().jobber?.client_id;
      const jobberClientSecret = functions.config().jobber?.client_secret;

      if (!jobberClientId || !jobberClientSecret) {
        res.status(500).json({
          success: false,
          error: 'Jobber credentials not configured',
        });
        return;
      }

      if (action === 'initiate') {
        // Generate state for security
        const oauthState = `${userId}_${Date.now()}`;
        const redirectUri = `${req.get('origin')}/jobber-callback`;
        
        const authUrl = `https://api.getjobber.com/api/oauth/authorize?` +
          `client_id=${jobberClientId}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `response_type=code&` +
          `state=${oauthState}&` +
          `scope=clients:read jobs:read invoices:read quotes:read`;

        // Store state in Firestore for validation
        await admin.firestore().collection('oauth_states').doc(oauthState).set({
          userId,
          service: 'jobber',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.json({
          success: true,
          authUrl,
        });
      } else if (action === 'callback') {
        // Validate state
        const stateDoc = await admin.firestore().collection('oauth_states').doc(state).get();
        if (!stateDoc.exists || stateDoc.data()?.userId !== userId) {
          res.status(400).json({
            success: false,
            error: 'Invalid state parameter',
          });
          return;
        }

        // Exchange code for access token
        const tokenResponse = await axios.post('https://api.getjobber.com/api/oauth/token', {
          client_id: jobberClientId,
          client_secret: jobberClientSecret,
          code,
          grant_type: 'authorization_code',
        });

        const { access_token, refresh_token } = tokenResponse.data;

        // Store tokens securely
        await admin.firestore().collection('user_integrations').doc(userId).set({
          jobber: {
            access_token,
            refresh_token,
            connected_at: admin.firestore.FieldValue.serverTimestamp(),
          },
        }, { merge: true });

        // Clean up state
        await admin.firestore().collection('oauth_states').doc(state).delete();

        res.json({
          success: true,
        });
      }
    } catch (error: any) {
      console.error('Jobber OAuth error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'OAuth failed',
      });
    }
  });
});

// Get Jobber connection status
export const jobberStatus = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'GET') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).send('Unauthorized');
        return;
      }

      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      const userId = decodedToken.uid;

      const integrationDoc = await admin.firestore().collection('user_integrations').doc(userId).get();
      const connected = !!(integrationDoc.exists && integrationDoc.data()?.jobber?.access_token);

      res.json({
        success: true,
        connected,
      });
    } catch (error: any) {
      console.error('Jobber status check error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Status check failed',
      });
    }
  });
});

// Get Jobber clients
export const jobberClients = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'GET') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).send('Unauthorized');
        return;
      }

      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      const userId = decodedToken.uid;

      const integrationDoc = await admin.firestore().collection('user_integrations').doc(userId).get();
      const jobberToken = integrationDoc.data()?.jobber?.access_token;

      if (!jobberToken) {
        res.status(400).json({
          success: false,
          error: 'Jobber not connected',
        });
        return;
      }

      const jobberResponse = await axios.get('https://api.getjobber.com/api/graphql', {
        headers: {
          'Authorization': `Bearer ${jobberToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          query: `
            query GetClients {
              clients {
                nodes {
                  id
                  firstName
                  lastName
                  companyName
                  email
                  phoneNumber
                  billingAddress {
                    street
                    city
                    province
                    postalCode
                  }
                  createdAt
                  updatedAt
                }
              }
            }
          `,
        },
      });

      res.json({
        success: true,
        clients: jobberResponse.data.data.clients.nodes,
      });
    } catch (error: any) {
      console.error('Jobber clients fetch error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch clients',
      });
    }
  });
});

// Get Jobber jobs
export const jobberJobs = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'GET') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).send('Unauthorized');
        return;
      }

      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      const userId = decodedToken.uid;

      const integrationDoc = await admin.firestore().collection('user_integrations').doc(userId).get();
      const jobberToken = integrationDoc.data()?.jobber?.access_token;

      if (!jobberToken) {
        res.status(400).json({
          success: false,
          error: 'Jobber not connected',
        });
        return;
      }

      const clientId = req.query.clientId as string;
      const clientFilter = clientId ? `client: {id: "${clientId}"}` : '';

      const jobberResponse = await axios.post('https://api.getjobber.com/api/graphql', {
        query: `
          query GetJobs {
            jobs(${clientFilter}) {
              nodes {
                id
                title
                description
                jobStatus
                startAt
                endAt
                totalAmount
                createdAt
                updatedAt
                client {
                  id
                  firstName
                  lastName
                }
                lineItems {
                  nodes {
                    id
                    name
                    description
                    quantity
                    unitCost
                    total
                  }
                }
              }
            }
          }
        `,
      }, {
        headers: {
          'Authorization': `Bearer ${jobberToken}`,
          'Content-Type': 'application/json',
        },
      });

      res.json({
        success: true,
        jobs: jobberResponse.data.data.jobs.nodes,
      });
    } catch (error: any) {
      console.error('Jobber jobs fetch error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch jobs',
      });
    }
  });
});

// Webhook for autonomous actions
export const autonomousWebhook = functions.pubsub.schedule('every 60 minutes').onRun(async (context) => {
  try {
    console.log('Running autonomous check...');
    
    // Get all users with automation enabled
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('automationEnabled', '==', true)
      .get();

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      // Check for pending tasks, unread communications, etc.
      // This is where you'd implement the autonomous business logic
      
      console.log(`Checking automation for user ${userId}`, userData?.email);
    }

    return null;
  } catch (error) {
    console.error('Autonomous webhook error:', error);
    return null;
  }
});