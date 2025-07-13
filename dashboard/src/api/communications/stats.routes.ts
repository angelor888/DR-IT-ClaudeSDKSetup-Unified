// Communication statistics API routes

/// <reference path="../../types/express.d.ts" />

import { Router } from 'express';
import { query } from 'express-validator';
import { validateRequest } from '../../middleware/validation';
import { requireAuth } from '../../middleware/auth';
import { getFirestore } from '../../config/firebase';
import { logger } from '../../utils/logger';
import type { Request, Response, NextFunction } from 'express';

const router = Router();
const log = logger.child('StatsRoutes');
const db = getFirestore();

// Apply authentication to all routes
router.use(requireAuth);

// Get communication statistics
router.get(
  '/',
  [query('startDate').optional().isISO8601(), query('endDate').optional().isISO8601()],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.uid;
      const { startDate, endDate } = req.query;

      // Default to last 30 days if not specified
      const end = endDate ? new Date(endDate as string) : new Date();
      const start = startDate
        ? new Date(startDate as string)
        : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get messages in date range
      const messagesSnapshot = await db
        .collection('messages')
        .where('userId', '==', userId)
        .where('timestamp', '>=', start)
        .where('timestamp', '<=', end)
        .get();

      const messages = messagesSnapshot.docs.map(doc => doc.data());

      // Calculate stats
      const totalMessages = messages.length;

      // Platform breakdown
      const platforms = {
        slack: messages.filter(m => m.platform === 'slack').length,
        twilio: messages.filter(m => m.platform === 'twilio').length,
        email: messages.filter(m => m.platform === 'email').length,
      };

      // Sentiment analysis (if available)
      const sentimentMessages = messages.filter(m => m.ai?.sentiment);
      const sentiment = {
        positive: sentimentMessages.filter(m => (m as any).ai.sentiment === 'positive').length,
        neutral: sentimentMessages.filter(m => (m as any).ai.sentiment === 'neutral').length,
        negative: sentimentMessages.filter(m => (m as any).ai.sentiment === 'negative').length,
      };

      // Response time calculation
      const responseTimesMs: number[] = [];
      messages.forEach(msg => {
        if (
          (msg as any).type === 'outgoing' &&
          (msg as any).replyToTimestamp &&
          (msg as any).timestamp
        ) {
          const responseTime =
            new Date((msg as any).timestamp).getTime() -
            new Date((msg as any).replyToTimestamp).getTime();
          responseTimesMs.push(responseTime);
        }
      });

      const responseTimeMinutes = responseTimesMs.map(ms => ms / 1000 / 60);
      responseTimeMinutes.sort((a, b) => a - b);

      const responseTime = {
        fastest: responseTimeMinutes[0] || 0,
        average:
          responseTimeMinutes.length > 0
            ? responseTimeMinutes.reduce((a, b) => a + b, 0) / responseTimeMinutes.length
            : 0,
        median: responseTimeMinutes[Math.floor(responseTimeMinutes.length / 2)] || 0,
        slowest: responseTimeMinutes[responseTimeMinutes.length - 1] || 0,
      };

      // AI assistance stats
      const aiMessages = messages.filter(m => (m as any).ai?.enhanced);
      const aiAssistance = {
        suggestionsUsed: aiMessages.filter(m => (m as any).ai.suggestionUsed).length,
        autoResponsesSent: messages.filter(m => (m as any).ai?.autoResponse).length,
        summariesGenerated: 0, // Would need to query summaries collection
      };

      // Top contacts
      const contactMap = new Map<string, { count: number; name: string; lastContact: Date }>();
      messages.forEach(msg => {
        const contactId =
          (msg as any).type === 'incoming' ? (msg as any).sender?.id : (msg as any).recipient?.id;
        const contactName =
          (msg as any).type === 'incoming'
            ? (msg as any).sender?.name
            : (msg as any).recipient?.name;

        if (contactId) {
          const existing = contactMap.get(contactId);
          if (existing) {
            existing.count++;
            if ((msg as any).timestamp > existing.lastContact) {
              existing.lastContact = (msg as any).timestamp;
            }
          } else {
            contactMap.set(contactId, {
              count: 1,
              name: contactName || 'Unknown',
              lastContact: (msg as any).timestamp,
            });
          }
        }
      });

      const topContacts = Array.from(contactMap.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Message volume by day
      const volumeByDay = new Map<string, number>();
      messages.forEach(msg => {
        const day = new Date((msg as any).timestamp).toISOString().split('T')[0];
        volumeByDay.set(day, (volumeByDay.get(day) || 0) + 1);
      });

      const dailyVolume = Array.from(volumeByDay.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      res.json({
        status: 'success',
        data: {
          totalMessages,
          platforms,
          sentiment,
          responseTime,
          aiAssistance,
          topContacts,
          dailyVolume,
          dateRange: {
            start,
            end,
          },
        },
      });
    } catch (error) {
      log.error('Failed to get stats', error);
      next(error);
    }
  }
);

// Get AI usage stats
router.get(
  '/ai-usage',
  [query('startDate').optional().isISO8601(), query('endDate').optional().isISO8601()],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.uid;
      const { startDate, endDate } = req.query;

      // Default to last 30 days if not specified
      const end = endDate ? new Date(endDate as string) : new Date();
      const start = startDate
        ? new Date(startDate as string)
        : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Query Grok usage stats
      const usageSnapshot = await db
        .collection('grok_usage')
        .where('userId', '==', userId)
        .where('date', '>=', start)
        .where('date', '<=', end)
        .orderBy('date', 'asc')
        .get();

      let totalTokens = 0;
      let totalRequests = 0;
      const byFeature: Record<string, number> = {};
      const dailyUsage: Array<{ date: string; tokens: number; requests: number }> = [];

      usageSnapshot.docs.forEach(doc => {
        const usage = doc.data();
        totalTokens += usage.tokensUsed || 0;
        totalRequests += usage.requestCount || 0;

        Object.entries(usage.features || {}).forEach(([feature, count]) => {
          byFeature[feature] = (byFeature[feature] || 0) + (count as number);
        });

        dailyUsage.push({
          date: usage.date.toDate().toISOString().split('T')[0],
          tokens: usage.tokensUsed || 0,
          requests: usage.requestCount || 0,
        });
      });

      res.json({
        status: 'success',
        data: {
          totalTokens,
          totalRequests,
          byFeature,
          dailyUsage,
          averageTokensPerRequest: totalRequests > 0 ? totalTokens / totalRequests : 0,
          dateRange: {
            start,
            end,
          },
        },
      });
    } catch (error) {
      log.error('Failed to get AI usage stats', error);
      next(error);
    }
  }
);

export { router as statsRoutes };
