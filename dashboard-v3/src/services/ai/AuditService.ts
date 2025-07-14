import { db } from '../../config/firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { auth } from '../../config/firebase';

export interface AuditLog {
  id?: string;
  userId: string;
  action: string;
  category: 'chat' | 'command' | 'automation' | 'query' | 'error';
  metadata: {
    server?: string;
    method?: string;
    params?: any;
    result?: any;
    error?: string;
    duration?: number;
    tokens?: number;
    messageLength?: number;
    responseLength?: number;
    query?: string;
    resultCount?: number;
    [key: string]: any; // Allow additional properties
  };
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditFilter {
  userId?: string;
  category?: AuditLog['category'];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

class AuditService {
  private readonly collectionName = 'ai_audit_logs';
  private batchQueue: AuditLog[] = [];
  private batchTimer: NodeJS.Timeout | null = null;

  // Log an AI action
  async logAction(
    action: string,
    category: AuditLog['category'],
    metadata: AuditLog['metadata'] = {}
  ): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.warn('No authenticated user for audit log');
        return;
      }

      const auditLog: AuditLog = {
        userId: user.uid,
        action,
        category,
        metadata,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
      };

      // Add to batch queue
      this.batchQueue.push(auditLog);

      // Process batch after a delay
      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => this.processBatch(), 1000);
      }
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  }

  // Process batch of audit logs
  private async processBatch(): Promise<void> {
    if (this.batchQueue.length === 0) {
      this.batchTimer = null;
      return;
    }

    const batch = [...this.batchQueue];
    this.batchQueue = [];
    this.batchTimer = null;

    try {
      // In production, this would use batch writes
      for (const log of batch) {
        await addDoc(collection(db, this.collectionName), {
          ...log,
          timestamp: Timestamp.fromDate(log.timestamp),
        });
      }
    } catch (error) {
      console.error('Error processing audit batch:', error);
      // Re-add failed logs to queue
      this.batchQueue.unshift(...batch);
    }
  }

  // Query audit logs
  async queryLogs(filter: AuditFilter = {}): Promise<AuditLog[]> {
    try {
      let q = query(collection(db, this.collectionName));

      // Apply filters
      if (filter.userId) {
        q = query(q, where('userId', '==', filter.userId));
      }

      if (filter.category) {
        q = query(q, where('category', '==', filter.category));
      }

      if (filter.startDate) {
        q = query(q, where('timestamp', '>=', Timestamp.fromDate(filter.startDate)));
      }

      if (filter.endDate) {
        q = query(q, where('timestamp', '<=', Timestamp.fromDate(filter.endDate)));
      }

      // Order by timestamp descending
      q = query(q, orderBy('timestamp', 'desc'));

      // Apply limit
      if (filter.limit) {
        q = query(q, limit(filter.limit));
      }

      const snapshot = await getDocs(q);
      const logs: AuditLog[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        logs.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
        } as AuditLog);
      });

      return logs;
    } catch (error) {
      console.error('Error querying audit logs:', error);
      return [];
    }
  }

  // Get usage statistics
  async getUsageStats(userId?: string, days: number = 30): Promise<{
    totalActions: number;
    byCategory: Record<string, number>;
    byDay: Array<{ date: string; count: number }>;
    topActions: Array<{ action: string; count: number }>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.queryLogs({
      userId,
      startDate,
      limit: 1000, // Reasonable limit for stats
    });

    // Calculate statistics
    const byCategory: Record<string, number> = {};
    const byDay: Record<string, number> = {};
    const actionCounts: Record<string, number> = {};

    logs.forEach((log) => {
      // By category
      byCategory[log.category] = (byCategory[log.category] || 0) + 1;

      // By day
      const day = log.timestamp.toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;

      // Action counts
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });

    // Convert to arrays
    const byDayArray = Object.entries(byDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalActions: logs.length,
      byCategory,
      byDay: byDayArray,
      topActions,
    };
  }

  // Helper methods for common logging scenarios
  async logChatMessage(message: string, responseLength: number, tokens?: number): Promise<void> {
    await this.logAction('chat_message', 'chat', {
      messageLength: message.length,
      responseLength,
      tokens,
    });
  }

  async logCommandExecution(
    server: string,
    method: string,
    params: any,
    result: any,
    duration: number
  ): Promise<void> {
    await this.logAction(`${server}.${method}`, 'command', {
      server,
      method,
      params,
      result,
      duration,
    });
  }

  async logAutomationAction(action: string, metadata: any = {}): Promise<void> {
    await this.logAction(action, 'automation', metadata);
  }

  async logQuery(query: string, resultCount: number, duration: number): Promise<void> {
    await this.logAction('data_query', 'query', {
      query,
      resultCount,
      duration,
    });
  }

  async logError(action: string, error: string, metadata: any = {}): Promise<void> {
    await this.logAction(action, 'error', {
      error,
      ...metadata,
    });
  }

  // Flush any pending logs
  async flush(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    await this.processBatch();
  }
}

export const auditService = new AuditService();
export default AuditService;