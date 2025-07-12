// Jobber GraphQL API client wrapper
import { BaseService, BaseServiceOptions } from '../../core/services/base.service';
import {
  JobberGraphQLResponse,
  JobberConnection,
  JobberClient as JobberClientType,
  JobberRequest,
  JobberQuote,
  JobberJob,
  JobberInvoice,
  JobberUser,
} from './types';

export class JobberClient extends BaseService {
  constructor(accessToken: string, options: Partial<BaseServiceOptions> = {}) {
    if (!accessToken) {
      throw new Error('Jobber access token is required');
    }

    super({
      name: 'jobber',
      baseURL: 'https://api.getjobber.com/api',
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-JOBBER-GRAPHQL-VERSION': '2025-01-20',
      },
      healthCheckEndpoint: '/graphql',
      auth: {
        type: 'bearer',
        credentials: { token: accessToken },
      },
      circuitBreaker: {
        failureThreshold: 3,
        resetTimeout: 30000,
      },
      retry: {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        factor: 2,
      },
      ...options,
    });
  }

  // Execute GraphQL query
  private async query<T>(query: string, variables?: any): Promise<JobberGraphQLResponse<T>> {
    const response = await this.post('/graphql', {
      query,
      variables,
    });
    return response.data;
  }

  // Current user
  async getCurrentUser(): Promise<JobberUser | null> {
    const query = `
      query {
        currentUser {
          id
          email
          firstName
          lastName
        }
      }
    `;

    const response = await this.query<{ currentUser: JobberUser }>(query);
    return response.data?.currentUser || null;
  }

  // Client operations
  async getClients(
    options: {
      first?: number;
      after?: string;
      searchTerm?: string;
      includeArchived?: boolean;
    } = {}
  ): Promise<JobberConnection<JobberClientType>> {
    const query = `
      query GetClients($first: Int, $after: String, $searchTerm: String, $filter: ClientFilterInput) {
        clients(first: $first, after: $after, searchTerm: $searchTerm, filter: $filter) {
          edges {
            cursor
            node {
              id
              firstName
              lastName
              companyName
              email
              phone
              isArchived
              createdAt
              updatedAt
              address {
                street1
                street2
                city
                province
                postalCode
                country
              }
            }
          }
          pageInfo {
            endCursor
            hasNextPage
            hasPreviousPage
            startCursor
          }
          totalCount
        }
      }
    `;

    const variables = {
      first: options.first || 20,
      after: options.after,
      searchTerm: options.searchTerm,
      filter: options.includeArchived ? {} : { isArchived: false },
    };

    const response = await this.query<{ clients: JobberConnection<JobberClientType> }>(
      query,
      variables
    );
    return (
      response.data?.clients || {
        edges: [],
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        totalCount: 0,
      }
    );
  }

  async getClient(id: string): Promise<JobberClientType | null> {
    const query = `
      query GetClient($id: ID!) {
        client(id: $id) {
          id
          firstName
          lastName
          companyName
          email
          phone
          isArchived
          createdAt
          updatedAt
          address {
            street1
            street2
            city
            province
            postalCode
            country
          }
          properties {
            edges {
              node {
                id
                address {
                  street1
                  street2
                  city
                  province
                  postalCode
                  country
                }
                mapUrl
                taxRate
              }
            }
          }
        }
      }
    `;

    const response = await this.query<{ client: JobberClientType }>(query, { id });
    return response.data?.client || null;
  }

  async createClient(input: {
    firstName?: string;
    lastName?: string;
    companyName?: string;
    email?: string;
    phone?: string;
    address?: {
      street1?: string;
      street2?: string;
      city?: string;
      province?: string;
      postalCode?: string;
      country?: string;
    };
  }): Promise<JobberClientType | null> {
    const mutation = `
      mutation CreateClient($input: ClientCreateInput!) {
        clientCreate(input: $input) {
          client {
            id
            firstName
            lastName
            companyName
            email
            phone
            createdAt
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await this.query<{
      clientCreate: {
        client: JobberClientType;
        userErrors: Array<{ field: string; message: string }>;
      };
    }>(mutation, { input });

    if (response.data?.clientCreate.userErrors.length) {
      const errors = response.data.clientCreate.userErrors;
      this.log.error('Failed to create client', { errors });
      throw new Error(errors.map(e => e.message).join(', '));
    }

    return response.data?.clientCreate.client || null;
  }

  // Request operations
  async getRequests(
    options: {
      first?: number;
      after?: string;
      status?: 'new' | 'converted' | 'closed';
    } = {}
  ): Promise<JobberConnection<JobberRequest>> {
    const query = `
      query GetRequests($first: Int, $after: String, $filter: RequestFilterInput) {
        requests(first: $first, after: $after, filter: $filter) {
          edges {
            cursor
            node {
              id
              title
              status
              description
              createdAt
              updatedAt
              client {
                id
                firstName
                lastName
                companyName
                email
              }
              property {
                id
                address {
                  street1
                  city
                  province
                }
              }
            }
          }
          pageInfo {
            endCursor
            hasNextPage
          }
          totalCount
        }
      }
    `;

    const variables = {
      first: options.first || 20,
      after: options.after,
      filter: options.status ? { status: options.status } : {},
    };

    const response = await this.query<{ requests: JobberConnection<JobberRequest> }>(
      query,
      variables
    );
    return (
      response.data?.requests || {
        edges: [],
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        totalCount: 0,
      }
    );
  }

  // Quote operations
  async getQuotes(
    options: {
      first?: number;
      after?: string;
      status?: 'draft' | 'awaiting_response' | 'approved' | 'rejected';
    } = {}
  ): Promise<JobberConnection<JobberQuote>> {
    const query = `
      query GetQuotes($first: Int, $after: String, $filter: QuoteFilterInput) {
        quotes(first: $first, after: $after, filter: $filter) {
          edges {
            cursor
            node {
              id
              quoteNumber
              quoteStatus
              title
              message
              subtotal
              total
              createdAt
              updatedAt
              sentAt
              viewedAt
              client {
                id
                firstName
                lastName
                companyName
                email
              }
              property {
                id
                address {
                  street1
                  city
                  province
                }
              }
            }
          }
          pageInfo {
            endCursor
            hasNextPage
          }
          totalCount
        }
      }
    `;

    const variables = {
      first: options.first || 20,
      after: options.after,
      filter: options.status ? { quoteStatus: options.status } : {},
    };

    const response = await this.query<{ quotes: JobberConnection<JobberQuote> }>(query, variables);
    return (
      response.data?.quotes || {
        edges: [],
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        totalCount: 0,
      }
    );
  }

  // Job operations
  async getJobs(
    options: {
      first?: number;
      after?: string;
      status?: 'active' | 'completed' | 'cancelled';
    } = {}
  ): Promise<JobberConnection<JobberJob>> {
    const query = `
      query GetJobs($first: Int, $after: String, $filter: JobFilterInput) {
        jobs(first: $first, after: $after, filter: $filter) {
          edges {
            cursor
            node {
              id
              jobNumber
              title
              status
              description
              total
              startAt
              endAt
              createdAt
              updatedAt
              client {
                id
                firstName
                lastName
                companyName
                email
              }
              property {
                id
                address {
                  street1
                  city
                  province
                }
              }
            }
          }
          pageInfo {
            endCursor
            hasNextPage
          }
          totalCount
        }
      }
    `;

    const variables = {
      first: options.first || 20,
      after: options.after,
      filter: options.status ? { status: options.status } : {},
    };

    const response = await this.query<{ jobs: JobberConnection<JobberJob> }>(query, variables);
    return (
      response.data?.jobs || {
        edges: [],
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        totalCount: 0,
      }
    );
  }

  // Invoice operations
  async getInvoices(
    options: {
      first?: number;
      after?: string;
      status?: 'draft' | 'awaiting_payment' | 'paid' | 'past_due';
    } = {}
  ): Promise<JobberConnection<JobberInvoice>> {
    const query = `
      query GetInvoices($first: Int, $after: String, $filter: InvoiceFilterInput) {
        invoices(first: $first, after: $after, filter: $filter) {
          edges {
            cursor
            node {
              id
              invoiceNumber
              status
              subtotal
              total
              balance
              sentAt
              dueAt
              paidAt
              createdAt
              updatedAt
              client {
                id
                firstName
                lastName
                companyName
                email
              }
            }
          }
          pageInfo {
            endCursor
            hasNextPage
          }
          totalCount
        }
      }
    `;

    const variables = {
      first: options.first || 20,
      after: options.after,
      filter: options.status ? { status: options.status } : {},
    };

    const response = await this.query<{ invoices: JobberConnection<JobberInvoice> }>(
      query,
      variables
    );
    return (
      response.data?.invoices || {
        edges: [],
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        totalCount: 0,
      }
    );
  }

  /**
   * Health check implementation for Jobber GraphQL API
   */
  async checkHealth() {
    try {
      const startTime = Date.now();
      
      // Use a simple introspection query to check if GraphQL API is accessible
      const introspectionQuery = `
        query {
          __schema {
            types {
              name
            }
          }
        }
      `;
      
      await this.query(introspectionQuery);
      
      const responseTime = Date.now() - startTime;
      
      return {
        name: 'jobber',
        status: 'healthy' as const,
        message: 'Jobber GraphQL API accessible',
        lastCheck: new Date(),
        responseTime,
        details: {
          baseURL: this.options.baseURL,
          hasValidToken: true,
        },
      };
    } catch (error) {
      return {
        name: 'jobber',
        status: 'unhealthy' as const,
        message: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date(),
        details: {
          baseURL: this.options.baseURL,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}
