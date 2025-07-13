import axios, { AxiosInstance } from 'axios';

export interface JobberConfig {
  apiKey: string;
  baseUrl: string;
  userId: string;
}

export interface JobberJob {
  id: string;
  title: string;
  description: string;
  customerId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'active' | 'completed' | 'cancelled' | 'on_hold';
  scheduledDate?: string;
  estimatedDuration?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface JobberCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface JobberInvoice {
  id: string;
  jobId: string;
  customerId: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
}

class JobberService {
  private api: AxiosInstance;
  private config: JobberConfig;

  constructor(config: JobberConfig) {
    this.config = config;
    this.api = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'X-API-Version': '2023-01-01',
      },
    });
  }

  // Job Management
  async createJob(jobData: Partial<JobberJob>): Promise<JobberJob> {
    try {
      const response = await this.api.post('/jobs', {
        job: {
          title: jobData.title,
          description: jobData.description,
          customer_id: jobData.customerId,
          priority: jobData.priority || 'medium',
          scheduled_date: jobData.scheduledDate,
          estimated_duration: jobData.estimatedDuration,
          tags: jobData.tags,
        },
      });
      
      return this.mapJobResponse(response.data.job);
    } catch (error) {
      console.error('Error creating Jobber job:', error);
      throw new Error(`Failed to create job: ${error.message}`);
    }
  }

  async updateJobStatus(jobId: string, status: JobberJob['status'], notes?: string): Promise<JobberJob> {
    try {
      const response = await this.api.patch(`/jobs/${jobId}`, {
        job: {
          status,
          notes,
        },
      });
      
      return this.mapJobResponse(response.data.job);
    } catch (error) {
      console.error('Error updating job status:', error);
      throw new Error(`Failed to update job status: ${error.message}`);
    }
  }

  async getJobs(filters: {
    status?: string[];
    customerId?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  } = {}): Promise<JobberJob[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters.status) {
        filters.status.forEach(s => params.append('status[]', s));
      }
      if (filters.customerId) params.append('customer_id', filters.customerId);
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await this.api.get(`/jobs?${params.toString()}`);
      
      return response.data.jobs.map((job: any) => this.mapJobResponse(job));
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw new Error(`Failed to fetch jobs: ${error.message}`);
    }
  }

  async getJobById(jobId: string): Promise<JobberJob> {
    try {
      const response = await this.api.get(`/jobs/${jobId}`);
      return this.mapJobResponse(response.data.job);
    } catch (error) {
      console.error('Error fetching job:', error);
      throw new Error(`Failed to fetch job: ${error.message}`);
    }
  }

  // Invoice Management
  async createInvoice(invoiceData: {
    jobId: string;
    lineItems: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
    }>;
    dueDate?: string;
    sendToCustomer?: boolean;
  }): Promise<JobberInvoice> {
    try {
      const response = await this.api.post('/invoices', {
        invoice: {
          job_id: invoiceData.jobId,
          line_items: invoiceData.lineItems.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unitPrice,
          })),
          due_date: invoiceData.dueDate,
          send_to_customer: invoiceData.sendToCustomer,
        },
      });
      
      return this.mapInvoiceResponse(response.data.invoice);
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw new Error(`Failed to create invoice: ${error.message}`);
    }
  }

  // Analytics
  async getPerformanceMetrics(timeframe: 'week' | 'month' | 'quarter' | 'year'): Promise<{
    revenue: number;
    jobCount: number;
    completionRate: number;
    customerSatisfaction: number;
  }> {
    try {
      const response = await this.api.get(`/analytics/performance?timeframe=${timeframe}`);
      
      return {
        revenue: response.data.revenue || 0,
        jobCount: response.data.job_count || 0,
        completionRate: response.data.completion_rate || 0,
        customerSatisfaction: response.data.customer_satisfaction || 0,
      };
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      // Return default values if API call fails
      return {
        revenue: 0,
        jobCount: 0,
        completionRate: 0,
        customerSatisfaction: 0,
      };
    }
  }

  // Schedule Optimization
  async optimizeSchedule(date: string, options: {
    considerTraffic?: boolean;
    maxJobsPerDay?: number;
  } = {}): Promise<{
    optimizedJobs: Array<{
      jobId: string;
      suggestedTime: string;
      travelTime: number;
      reasoning: string;
    }>;
    totalTravelTime: number;
    efficiencyScore: number;
  }> {
    try {
      const response = await this.api.post('/schedule/optimize', {
        date,
        consider_traffic: options.considerTraffic,
        max_jobs_per_day: options.maxJobsPerDay,
      });
      
      return {
        optimizedJobs: response.data.optimized_jobs || [],
        totalTravelTime: response.data.total_travel_time || 0,
        efficiencyScore: response.data.efficiency_score || 0,
      };
    } catch (error) {
      console.error('Error optimizing schedule:', error);
      throw new Error(`Failed to optimize schedule: ${error.message}`);
    }
  }

  // Customer Management
  async getCustomers(limit: number = 100): Promise<JobberCustomer[]> {
    try {
      const response = await this.api.get(`/customers?limit=${limit}`);
      return response.data.customers.map((customer: any) => this.mapCustomerResponse(customer));
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw new Error(`Failed to fetch customers: ${error.message}`);
    }
  }

  async getCustomerById(customerId: string): Promise<JobberCustomer> {
    try {
      const response = await this.api.get(`/customers/${customerId}`);
      return this.mapCustomerResponse(response.data.customer);
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw new Error(`Failed to fetch customer: ${error.message}`);
    }
  }

  // Helper methods for mapping API responses
  private mapJobResponse(jobData: any): JobberJob {
    return {
      id: jobData.id,
      title: jobData.title,
      description: jobData.description,
      customerId: jobData.customer_id,
      priority: jobData.priority,
      status: jobData.status,
      scheduledDate: jobData.scheduled_date,
      estimatedDuration: jobData.estimated_duration,
      tags: jobData.tags,
      createdAt: jobData.created_at,
      updatedAt: jobData.updated_at,
    };
  }

  private mapInvoiceResponse(invoiceData: any): JobberInvoice {
    return {
      id: invoiceData.id,
      jobId: invoiceData.job_id,
      customerId: invoiceData.customer_id,
      lineItems: invoiceData.line_items?.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        total: item.total,
      })) || [],
      subtotal: invoiceData.subtotal || 0,
      tax: invoiceData.tax || 0,
      total: invoiceData.total || 0,
      dueDate: invoiceData.due_date,
      status: invoiceData.status,
    };
  }

  private mapCustomerResponse(customerData: any): JobberCustomer {
    return {
      id: customerData.id,
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone,
      address: customerData.address,
    };
  }
}

export default JobberService;