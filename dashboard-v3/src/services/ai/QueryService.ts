import { postgresService } from '../database/PostgreSQLService';
import GrokService from '../grok/GrokService';
import { auditService } from './AuditService';
import { Customer, Job, Communication } from '../../types';

export interface QueryRequest {
  query: string;
  context?: {
    userId?: string;
    dataSource?: 'firebase' | 'postgresql' | 'all';
    limit?: number;
    timeRange?: {
      start: Date;
      end: Date;
    };
  };
}

export interface QueryResponse {
  query: string;
  sql?: string;
  type: 'table' | 'chart' | 'metric' | 'list' | 'timeline';
  data: any;
  columns?: string[];
  summary?: string;
  metadata: {
    totalCount: number;
    executionTime: number;
    dataSource: string;
    confidence?: number;
  };
  suggestions?: string[];
}

class QueryService {
  private grokService: GrokService;

  constructor() {
    this.grokService = new GrokService();
  }

  // Process natural language query
  async processQuery(request: QueryRequest): Promise<QueryResponse> {
    const startTime = Date.now();

    try {
      // Step 1: Use Grok to understand the query and generate SQL
      const sqlGeneration = await this.generateSQL(request.query);

      // Step 2: Execute the query
      let result: any;
      let dataSource = request.context?.dataSource || 'postgresql';

      if (sqlGeneration.sql && dataSource !== 'firebase') {
        // Execute SQL query
        result = await this.executeSQLQuery(sqlGeneration.sql, request.context?.limit);
      } else {
        // Fallback to predefined queries
        result = await this.executePredefinedQuery(request.query);
        dataSource = 'firebase';
      }

      // Step 3: Format and return results
      const response: QueryResponse = {
        query: request.query,
        sql: sqlGeneration.sql,
        type: this.determineResultType(result.data),
        data: result.data,
        columns: result.columns,
        summary: sqlGeneration.summary || this.generateSummary(result.data),
        metadata: {
          totalCount: result.count || (Array.isArray(result.data) ? result.data.length : 1),
          executionTime: Date.now() - startTime,
          dataSource,
          confidence: sqlGeneration.confidence,
        },
        suggestions: sqlGeneration.suggestions,
      };

      // Log the query execution
      await auditService.logQuery(
        request.query,
        response.metadata.totalCount,
        response.metadata.executionTime
      );

      return response;
    } catch (error: any) {
      // Log error
      await auditService.logError('query_error', error.message, {
        query: request.query,
        duration: Date.now() - startTime,
      });

      throw error;
    }
  }

  // Generate SQL from natural language using Grok
  private async generateSQL(query: string): Promise<{
    sql?: string;
    summary?: string;
    confidence?: number;
    suggestions?: string[];
  }> {
    try {
      const systemPrompt = `You are a SQL query generator for a construction business management system.
      
Available tables and columns:
- customers: id, name, email, phone, address, status, tags, created_at, updated_at
- jobs: id, customer_id, title, description, status, priority, scheduled_date, completed_date, estimated_hours, actual_hours, cost, tags
- communications: id, customer_id, job_id, type, direction, subject, content, from_address, to_address, status, created_at

Generate a PostgreSQL query for the following natural language request. Respond with JSON:
{
  "sql": "SELECT query here",
  "summary": "Brief explanation of what the query does",
  "confidence": 0.0-1.0,
  "suggestions": ["Related queries the user might want"]
}

If the query cannot be converted to SQL, set sql to null and explain in the summary.`;

      const response = await this.grokService.chatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ]);

      const content = response.choices[0]?.message?.content || '{}';
      
      try {
        return JSON.parse(content);
      } catch {
        return {
          summary: 'Unable to generate SQL for this query',
          confidence: 0,
        };
      }
    } catch (error) {
      console.error('SQL generation failed:', error);
      return {
        summary: 'Failed to process query',
        confidence: 0,
      };
    }
  }

  // Execute SQL query
  private async executeSQLQuery(sql: string, limit?: number): Promise<any> {
    // For now, use mock data since PostgreSQL might not be fully set up
    // In production, this would use the actual PostgreSQL service
    
    // Sanitize and limit the query
    let finalSQL = sql;
    if (limit && !sql.toLowerCase().includes('limit')) {
      finalSQL += ` LIMIT ${limit}`;
    }

    console.log('Executing SQL:', finalSQL);

    // Mock implementation - replace with actual PostgreSQL execution
    return this.getMockSQLResult(sql);
  }

  // Execute predefined queries
  private async executePredefinedQuery(query: string): Promise<any> {
    const lowerQuery = query.toLowerCase();

    // Revenue queries
    if (lowerQuery.includes('revenue') && lowerQuery.includes('month')) {
      return this.getMonthlyRevenue();
    }

    // Customer queries
    if (lowerQuery.includes('customer') && lowerQuery.includes('active')) {
      return this.getActiveCustomers();
    }

    // Job queries
    if (lowerQuery.includes('job') && (lowerQuery.includes('pending') || lowerQuery.includes('scheduled'))) {
      return this.getPendingJobs();
    }

    // Default: return all customers
    return this.getAllCustomers();
  }

  // Determine the best visualization type for the result
  private determineResultType(data: any): QueryResponse['type'] {
    if (!data) return 'table';

    // Single value - metric
    if (typeof data === 'number' || typeof data === 'string') {
      return 'metric';
    }

    // Object with few properties - metric
    if (typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length <= 4) {
      return 'metric';
    }

    // Array of data
    if (Array.isArray(data) && data.length > 0) {
      const firstItem = data[0];
      
      // Check if it has date/time data - timeline
      if (firstItem.date || firstItem.timestamp || firstItem.created_at) {
        return 'timeline';
      }

      // Check if it's suitable for charts
      const hasNumericData = Object.values(firstItem).some(val => typeof val === 'number');
      if (hasNumericData && data.length < 20) {
        return 'chart';
      }
    }

    // Default to table
    return 'table';
  }

  // Generate a summary of the results
  private generateSummary(data: any): string {
    if (!data) return 'No data found';

    if (typeof data === 'number') {
      return `Result: ${data}`;
    }

    if (Array.isArray(data)) {
      return `Found ${data.length} records`;
    }

    if (typeof data === 'object') {
      const keys = Object.keys(data);
      return `Retrieved ${keys.length} data points`;
    }

    return 'Query completed successfully';
  }

  // Mock SQL result for demo
  private getMockSQLResult(sql: string): any {
    const lowerSQL = sql.toLowerCase();

    if (lowerSQL.includes('count(')) {
      return {
        data: { count: 42 },
        columns: ['count'],
      };
    }

    if (lowerSQL.includes('sum(') && lowerSQL.includes('cost')) {
      return {
        data: { total_revenue: 125000 },
        columns: ['total_revenue'],
      };
    }

    // Default table result
    return {
      data: [
        { id: 1, name: 'Smith Residence', status: 'active', value: 15000 },
        { id: 2, name: 'Johnson Property', status: 'pending', value: 8500 },
        { id: 3, name: 'Brown Construction', status: 'active', value: 22000 },
      ],
      columns: ['id', 'name', 'status', 'value'],
      count: 3,
    };
  }

  // Predefined query handlers
  private async getMonthlyRevenue() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return {
      data: {
        current_month: 124000,
        last_month: 105000,
        growth: '18%',
        average_job_value: 8500,
      },
      columns: ['current_month', 'last_month', 'growth', 'average_job_value'],
    };
  }

  private async getActiveCustomers() {
    // Get all customers and filter for active ones
    const customers = await postgresService.getCustomers(100);
    const activeCustomers = customers.filter((c: any) => c.status === 'active' || !c.status);
    
    return {
      data: activeCustomers,
      columns: ['id', 'name', 'email', 'phone', 'created_at'],
      count: activeCustomers.length,
    };
  }

  private async getPendingJobs() {
    const jobs = await postgresService.getJobs('scheduled');
    
    return {
      data: jobs,
      columns: ['id', 'title', 'customer_id', 'scheduled_date', 'priority'],
      count: jobs.length,
    };
  }

  private async getAllCustomers() {
    const customers = await postgresService.getCustomers();
    
    return {
      data: customers,
      columns: ['id', 'name', 'email', 'created_at'],
      count: customers.length,
    };
  }

  // Save query to history
  async saveQueryToHistory(query: string, result: QueryResponse): Promise<void> {
    try {
      // In a real implementation, this would save to Firestore
      const historyItem = {
        query,
        timestamp: new Date(),
        resultCount: result.metadata.totalCount,
        executionTime: result.metadata.executionTime,
        dataSource: result.metadata.dataSource,
        userId: 'current-user', // Get from auth context
      };

      console.log('Saving to history:', historyItem);
    } catch (error) {
      console.error('Failed to save query to history:', error);
    }
  }

  // Get query suggestions based on context
  async getQuerySuggestions(context?: string): Promise<string[]> {
    const baseSuggestions = [
      'Show me all active customers',
      'What is our revenue this month?',
      'List all pending jobs',
      'Show overdue invoices',
      'Which projects are scheduled this week?',
      'Top 10 customers by revenue',
      'Average job completion time',
      'Customer satisfaction ratings',
    ];

    if (!context) return baseSuggestions;

    // Use Grok to generate contextual suggestions
    try {
      const response = await this.grokService.chatCompletion([
        {
          role: 'system',
          content: 'Generate 5 relevant data query suggestions for a construction business based on the context. Return as a JSON array of strings.',
        },
        {
          role: 'user',
          content: `Context: ${context}`,
        },
      ]);

      const content = response.choices[0]?.message?.content || '[]';
      const suggestions = JSON.parse(content);
      
      return Array.isArray(suggestions) ? suggestions : baseSuggestions;
    } catch {
      return baseSuggestions;
    }
  }
}

export const queryService = new QueryService();
export default QueryService;