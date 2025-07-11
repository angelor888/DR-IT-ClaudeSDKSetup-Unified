// Jobber service layer - business logic
import { getFirestore } from '../../config/firebase';
import { JobberClient } from './client';
import { JobberAuth } from './auth';
import { 
  JobberClient as JobberClientType,
  JobberRequest,
  JobberQuote,
  JobberJob,
  JobberInvoice,
  JobberConnection
} from './types';
import { logger } from '../../utils/logger';
import { createEvent } from '../../models/Event';

const log = logger.child('JobberService');

export class JobberService {
  private client: JobberClient;
  private auth: JobberAuth;
  private db = getFirestore();

  constructor() {
    this.auth = new JobberAuth();
    this.client = new JobberClient();
  }

  // Initialize client with fresh token
  private async getClient(): Promise<JobberClient> {
    const accessToken = await this.auth.getAccessToken();
    return new JobberClient(accessToken);
  }

  // Client operations
  async syncClients(limit = 100): Promise<JobberClientType[]> {
    try {
      const client = await this.getClient();
      const allClients: JobberClientType[] = [];
      let hasNextPage = true;
      let after: string | undefined;

      while (hasNextPage && allClients.length < limit) {
        const result = await client.getClients({
          first: Math.min(20, limit - allClients.length),
          after,
        });

        for (const edge of result.edges) {
          allClients.push(edge.node);
        }

        hasNextPage = result.pageInfo.hasNextPage;
        after = result.pageInfo.endCursor;
      }

      // Store in Firestore
      const batch = this.db.batch();
      allClients.forEach(jobberClient => {
        const docRef = this.db.collection('jobber_clients').doc(jobberClient.id);
        batch.set(docRef, {
          ...jobberClient,
          lastSynced: new Date(),
        });
      });
      await batch.commit();

      // Log sync event
      await this.db.collection('events').add(
        createEvent(
          'sync',
          'jobber',
          'clients.synced',
          `Synced ${allClients.length} Jobber clients`,
          { source: 'dashboard' },
          { clientCount: allClients.length }
        )
      );

      log.info(`Synced ${allClients.length} clients`);
      return allClients;
    } catch (error) {
      log.error('Failed to sync clients', error);
      throw error;
    }
  }

  async getClient(id: string): Promise<JobberClientType | null> {
    try {
      // Try Firestore first
      const doc = await this.db.collection('jobber_clients').doc(id).get();
      if (doc.exists && doc.data()?.lastSynced) {
        const data = doc.data() as JobberClientType & { lastSynced: any };
        // If data is less than 1 hour old, use it
        if (data.lastSynced.toDate() > new Date(Date.now() - 60 * 60 * 1000)) {
          return data;
        }
      }

      // Fetch from Jobber API
      const client = await this.getClient();
      const jobberClient = await client.getClient(id);

      if (jobberClient) {
        // Cache in Firestore
        await this.db.collection('jobber_clients').doc(id).set({
          ...jobberClient,
          lastSynced: new Date(),
        });
      }

      return jobberClient;
    } catch (error) {
      log.error(`Failed to get client ${id}`, error);
      throw error;
    }
  }

  async createClient(input: {
    firstName?: string;
    lastName?: string;
    companyName?: string;
    email?: string;
    phone?: string;
    address?: any;
  }): Promise<JobberClientType> {
    try {
      const client = await this.getClient();
      const newClient = await client.createClient(input);

      if (!newClient) {
        throw new Error('Failed to create client');
      }

      // Store in Firestore
      await this.db.collection('jobber_clients').doc(newClient.id).set({
        ...newClient,
        lastSynced: new Date(),
      });

      // Log event
      await this.db.collection('events').add(
        createEvent(
          'create',
          'jobber',
          'client.created',
          `Created new client: ${newClient.firstName} ${newClient.lastName || newClient.companyName}`,
          { source: 'dashboard' },
          { clientId: newClient.id }
        )
      );

      return newClient;
    } catch (error) {
      log.error('Failed to create client', error);
      throw error;
    }
  }

  async searchClients(searchTerm: string): Promise<JobberClientType[]> {
    try {
      const client = await this.getClient();
      const result = await client.getClients({ searchTerm, first: 10 });
      return result.edges.map(edge => edge.node);
    } catch (error) {
      log.error('Failed to search clients', error);
      throw error;
    }
  }

  // Request operations
  async getRequests(status?: 'new' | 'converted' | 'closed'): Promise<JobberRequest[]> {
    try {
      const client = await this.getClient();
      const result = await client.getRequests({ status, first: 50 });
      
      const requests = result.edges.map(edge => edge.node);

      // Update cache
      const batch = this.db.batch();
      requests.forEach(request => {
        const docRef = this.db.collection('jobber_requests').doc(request.id);
        batch.set(docRef, {
          ...request,
          lastSynced: new Date(),
        });
      });
      await batch.commit();

      return requests;
    } catch (error) {
      log.error('Failed to get requests', error);
      throw error;
    }
  }

  // Quote operations
  async getQuotes(status?: 'draft' | 'awaiting_response' | 'approved' | 'rejected'): Promise<JobberQuote[]> {
    try {
      const client = await this.getClient();
      const result = await client.getQuotes({ status, first: 50 });
      
      const quotes = result.edges.map(edge => edge.node);

      // Update cache
      const batch = this.db.batch();
      quotes.forEach(quote => {
        const docRef = this.db.collection('jobber_quotes').doc(quote.id);
        batch.set(docRef, {
          ...quote,
          lastSynced: new Date(),
        });
      });
      await batch.commit();

      return quotes;
    } catch (error) {
      log.error('Failed to get quotes', error);
      throw error;
    }
  }

  // Job operations
  async getJobs(status?: 'active' | 'completed' | 'cancelled'): Promise<JobberJob[]> {
    try {
      const client = await this.getClient();
      const result = await client.getJobs({ status, first: 50 });
      
      const jobs = result.edges.map(edge => edge.node);

      // Update cache
      const batch = this.db.batch();
      jobs.forEach(job => {
        const docRef = this.db.collection('jobber_jobs').doc(job.id);
        batch.set(docRef, {
          ...job,
          lastSynced: new Date(),
        });
      });
      await batch.commit();

      return jobs;
    } catch (error) {
      log.error('Failed to get jobs', error);
      throw error;
    }
  }

  // Invoice operations
  async getInvoices(status?: 'draft' | 'awaiting_payment' | 'paid' | 'past_due'): Promise<JobberInvoice[]> {
    try {
      const client = await this.getClient();
      const result = await client.getInvoices({ status, first: 50 });
      
      const invoices = result.edges.map(edge => edge.node);

      // Update cache
      const batch = this.db.batch();
      invoices.forEach(invoice => {
        const docRef = this.db.collection('jobber_invoices').doc(invoice.id);
        batch.set(docRef, {
          ...invoice,
          lastSynced: new Date(),
        });
      });
      await batch.commit();

      return invoices;
    } catch (error) {
      log.error('Failed to get invoices', error);
      throw error;
    }
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    totalClients: number;
    activeJobs: number;
    pendingQuotes: number;
    unpaidInvoices: number;
    revenue30Days: number;
  }> {
    try {
      const [jobs, quotes, invoices] = await Promise.all([
        this.getJobs('active'),
        this.getQuotes('awaiting_response'),
        this.getInvoices('awaiting_payment'),
      ]);

      // Calculate 30-day revenue from paid invoices
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const paidInvoicesSnapshot = await this.db
        .collection('jobber_invoices')
        .where('status', '==', 'paid')
        .where('paidAt', '>=', thirtyDaysAgo.toISOString())
        .get();

      const revenue30Days = paidInvoicesSnapshot.docs.reduce((sum, doc) => {
        return sum + (doc.data().total || 0);
      }, 0);

      // Get total clients count
      const clientsSnapshot = await this.db
        .collection('jobber_clients')
        .where('isArchived', '==', false)
        .count()
        .get();

      return {
        totalClients: clientsSnapshot.data().count,
        activeJobs: jobs.length,
        pendingQuotes: quotes.length,
        unpaidInvoices: invoices.length,
        revenue30Days,
      };
    } catch (error) {
      log.error('Failed to get dashboard stats', error);
      throw error;
    }
  }
}