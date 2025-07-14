import axios, { AxiosInstance } from 'axios';
import { auth } from '../../config/firebase';

// Jobber API Types
interface JobberClient {
  id: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  email: string;
  phoneNumber?: string;
  address?: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface JobberJob {
  id: string;
  title: string;
  description?: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
  };
  jobStatus: 'active' | 'completed' | 'cancelled' | 'quoted';
  startAt?: string;
  endAt?: string;
  totalAmount?: number;
  createdAt: string;
  updatedAt: string;
  lineItems?: Array<{
    id: string;
    name: string;
    description?: string;
    quantity: number;
    unitCost: number;
    total: number;
  }>;
}

interface JobberInvoice {
  id: string;
  invoiceNumber: string;
  subject: string;
  message?: string;
  sentAt?: string;
  total: number;
  amountPaid: number;
  amountDue: number;
  status: 'draft' | 'sent' | 'viewed' | 'approved' | 'paid' | 'overdue';
  job?: {
    id: string;
    title: string;
  };
  client: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  dueDate?: string;
}

interface JobberQuote {
  id: string;
  quoteNumber: string;
  subject: string;
  message?: string;
  sentAt?: string;
  total: number;
  status: 'draft' | 'sent' | 'viewed' | 'approved' | 'converted' | 'declined';
  client: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  expiryDate?: string;
}

interface JobberMetrics {
  totalRevenue: number;
  completedJobs: number;
  activeJobs: number;
  totalClients: number;
  outstandingInvoices: number;
  overdueinvoices: number;
  monthlyRevenue: number;
  averageJobValue: number;
}

class JobberService {
  private functionsClient: AxiosInstance;
  private functionsURL: string;

  constructor() {
    this.functionsURL = import.meta.env.VITE_FIREBASE_FUNCTIONS_BASE_URL || 
      (import.meta.env.DEV 
        ? 'http://localhost:5001/duetright-dashboard/us-central1'
        : 'https://us-central1-duetright-dashboard.cloudfunctions.net');

    this.functionsClient = axios.create({
      baseURL: this.functionsURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  // Get current auth token
  private async getAuthToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    return await user.getIdToken();
  }

  // Initialize Jobber OAuth flow
  async initializeOAuth(): Promise<string> {
    try {
      const token = await this.getAuthToken();
      const response = await this.functionsClient.post('/jobberOAuth', {
        action: 'initiate',
        userId: auth.currentUser?.uid,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        return response.data.authUrl;
      } else {
        throw new Error(response.data.error || 'Failed to initialize OAuth');
      }
    } catch (error) {
      console.error('Jobber OAuth initialization failed:', error);
      throw error;
    }
  }

  // Handle OAuth callback
  async handleOAuthCallback(code: string, state: string): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      const response = await this.functionsClient.post('/jobberOAuth', {
        action: 'callback',
        code,
        state,
        userId: auth.currentUser?.uid,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.data.success === true;
    } catch (error) {
      console.error('Jobber OAuth callback failed:', error);
      throw error;
    }
  }

  // Check if user has connected Jobber
  async isConnected(): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      const response = await this.functionsClient.get('/jobberStatus', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.data.connected === true;
    } catch (error) {
      console.error('Jobber connection check failed:', error);
      return false;
    }
  }

  // Get all clients from Jobber
  async getClients(): Promise<JobberClient[]> {
    try {
      const token = await this.getAuthToken();
      const response = await this.functionsClient.get('/jobberClients', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        return response.data.clients || [];
      } else {
        throw new Error(response.data.error || 'Failed to fetch clients');
      }
    } catch (error) {
      console.error('Failed to fetch Jobber clients:', error);
      throw error;
    }
  }

  // Get all jobs from Jobber
  async getJobs(): Promise<JobberJob[]> {
    try {
      const token = await this.getAuthToken();
      const response = await this.functionsClient.get('/jobberJobs', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        return response.data.jobs || [];
      } else {
        throw new Error(response.data.error || 'Failed to fetch jobs');
      }
    } catch (error) {
      console.error('Failed to fetch Jobber jobs:', error);
      throw error;
    }
  }

  // Get jobs for a specific client
  async getJobsForClient(clientId: string): Promise<JobberJob[]> {
    try {
      const token = await this.getAuthToken();
      const response = await this.functionsClient.get(`/jobberJobs?clientId=${clientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        return response.data.jobs || [];
      } else {
        throw new Error(response.data.error || 'Failed to fetch client jobs');
      }
    } catch (error) {
      console.error('Failed to fetch client jobs:', error);
      throw error;
    }
  }

  // Get all invoices from Jobber
  async getInvoices(): Promise<JobberInvoice[]> {
    try {
      const token = await this.getAuthToken();
      const response = await this.functionsClient.get('/jobberInvoices', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        return response.data.invoices || [];
      } else {
        throw new Error(response.data.error || 'Failed to fetch invoices');
      }
    } catch (error) {
      console.error('Failed to fetch Jobber invoices:', error);
      throw error;
    }
  }

  // Get all quotes from Jobber
  async getQuotes(): Promise<JobberQuote[]> {
    try {
      const token = await this.getAuthToken();
      const response = await this.functionsClient.get('/jobberQuotes', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        return response.data.quotes || [];
      } else {
        throw new Error(response.data.error || 'Failed to fetch quotes');
      }
    } catch (error) {
      console.error('Failed to fetch Jobber quotes:', error);
      throw error;
    }
  }

  // Get business metrics from Jobber data
  async getMetrics(): Promise<JobberMetrics> {
    try {
      const token = await this.getAuthToken();
      const response = await this.functionsClient.get('/jobberMetrics', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        return response.data.metrics;
      } else {
        throw new Error(response.data.error || 'Failed to fetch metrics');
      }
    } catch (error) {
      console.error('Failed to fetch Jobber metrics:', error);
      throw error;
    }
  }

  // Sync all Jobber data to Firestore
  async syncAllData(): Promise<void> {
    try {
      const token = await this.getAuthToken();
      const response = await this.functionsClient.post('/jobberSync', {
        userId: auth.currentUser?.uid,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Failed to sync Jobber data:', error);
      throw error;
    }
  }

  // Test Jobber API connection
  async testConnection(): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      const response = await this.functionsClient.get('/jobberTest', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.data.success === true;
    } catch (error) {
      console.error('Jobber connection test failed:', error);
      return false;
    }
  }
}

export default JobberService;
export type { JobberClient, JobberJob, JobberInvoice, JobberQuote, JobberMetrics };