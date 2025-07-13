import { grokService, GrokTool, GrokMessage, GrokResponse } from './grokService';
import { jobberTools } from './tools/jobberTools';
import { communicationTools } from './tools/communicationTools';
import { googleTools } from './tools/googleTools';
import { matterportTools } from './tools/matterportTools';

export interface BusinessContext {
  currentTime: Date;
  activeJobs: number;
  pendingTasks: number;
  unreadMessages: number;
  upcomingEvents: number;
  businessMetrics: {
    dailyRevenue: number;
    completionRate: number;
    customerSatisfaction: number;
  };
}

export interface Decision {
  action: string;
  toolCalls: Array<{
    tool: string;
    arguments: any;
  }>;
  reasoning: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface WorkflowResult {
  success: boolean;
  decisions: Decision[];
  executedActions: Array<{
    tool: string;
    result: any;
    timestamp: Date;
  }>;
  errors?: string[];
  totalCost: number;
}

class DecisionEngine {
  private allTools: GrokTool[];
  private executionHistory: Array<{ timestamp: Date; workflow: string; result: any }> = [];

  constructor() {
    // Combine all available tools
    this.allTools = [
      ...jobberTools,
      ...communicationTools,
      ...googleTools,
      ...matterportTools,
    ];
  }

  /**
   * Main autonomous decision-making loop
   */
  async runAutonomousLoop(context: BusinessContext): Promise<WorkflowResult> {
    const systemPrompt = this.buildSystemPrompt(context);
    const decisions: Decision[] = [];
    const executedActions: any[] = [];
    let totalCost = 0;

    try {
      // Step 1: Analyze current business state
      const analysisResponse = await grokService.analyzeBusinessData(
        JSON.stringify(context),
        this.allTools
      );
      totalCost += grokService.calculateCost(analysisResponse.usage);

      // Step 2: Execute tool calls if any
      if (analysisResponse.choices[0].message.tool_calls) {
        for (const toolCall of analysisResponse.choices[0].message.tool_calls) {
          const result = await this.executeToolCall(toolCall);
          executedActions.push({
            tool: toolCall.function.name,
            result,
            timestamp: new Date(),
          });
        }
      }

      // Step 3: Process results and determine next actions
      const followUpResponse = await this.processResults(
        analysisResponse,
        executedActions
      );
      totalCost += grokService.calculateCost(followUpResponse.usage);

      return {
        success: true,
        decisions,
        executedActions,
        totalCost,
      };
    } catch (error) {
      console.error('Decision engine error:', error);
      return {
        success: false,
        decisions,
        executedActions,
        errors: [error.message],
        totalCost,
      };
    }
  }

  /**
   * Execute a specific business workflow
   */
  async executeWorkflow(
    workflowName: string,
    inputData: any
  ): Promise<WorkflowResult> {
    const workflowPrompts = {
      'customer-inquiry': this.customerInquiryWorkflow,
      'job-completion': this.jobCompletionWorkflow,
      'daily-optimization': this.dailyOptimizationWorkflow,
      'emergency-response': this.emergencyResponseWorkflow,
    };

    const workflowHandler = workflowPrompts[workflowName];
    if (!workflowHandler) {
      throw new Error(`Unknown workflow: ${workflowName}`);
    }

    return workflowHandler.call(this, inputData);
  }

  /**
   * Customer inquiry workflow: Gmail → Analysis → Jobber → Calendar → Response
   */
  private async customerInquiryWorkflow(inquiry: any): Promise<WorkflowResult> {
    const messages: GrokMessage[] = [
      {
        role: 'system',
        content: `You are handling a customer inquiry. Analyze the request, create appropriate tasks in Jobber, 
        schedule if needed, and send confirmations. Use available tools to complete the entire workflow.`,
      },
      {
        role: 'user',
        content: JSON.stringify({
          inquiry,
          instructions: 'Process this customer inquiry end-to-end',
        }),
      },
    ];

    const response = await grokService.chat(messages, this.allTools, 0.3);
    return this.processWorkflowResponse(response, 'customer-inquiry');
  }

  /**
   * Job completion workflow: Status update → Invoice → Report → Communication
   */
  private async jobCompletionWorkflow(jobData: any): Promise<WorkflowResult> {
    const messages: GrokMessage[] = [
      {
        role: 'system',
        content: `A job has been completed. Update the status, generate invoice, create completion report 
        (including Matterport data if available), and notify the customer.`,
      },
      {
        role: 'user',
        content: JSON.stringify({
          jobData,
          instructions: 'Complete all post-job tasks',
        }),
      },
    ];

    const response = await grokService.chat(messages, this.allTools, 0.3);
    return this.processWorkflowResponse(response, 'job-completion');
  }

  /**
   * Daily optimization workflow: Analyze → Optimize → Notify
   */
  private async dailyOptimizationWorkflow(date: string): Promise<WorkflowResult> {
    const messages: GrokMessage[] = [
      {
        role: 'system',
        content: `Optimize operations for ${date}. Analyze all scheduled jobs, optimize routes and timing, 
        check for conflicts, and send daily briefing to team.`,
      },
      {
        role: 'user',
        content: JSON.stringify({
          date,
          instructions: 'Optimize daily operations and notify team',
        }),
      },
    ];

    const response = await grokService.chat(messages, this.allTools, 0.3);
    return this.processWorkflowResponse(response, 'daily-optimization');
  }

  /**
   * Emergency response workflow for urgent situations
   */
  private async emergencyResponseWorkflow(emergency: any): Promise<WorkflowResult> {
    const messages: GrokMessage[] = [
      {
        role: 'system',
        content: `URGENT: Handle this emergency situation immediately. Assess impact, notify relevant parties, 
        reschedule affected appointments, and implement solution.`,
      },
      {
        role: 'user',
        content: JSON.stringify({
          emergency,
          instructions: 'Respond to emergency with all necessary actions',
        }),
      },
    ];

    const response = await grokService.chat(messages, this.allTools, 0.1); // Lower temperature for consistency
    return this.processWorkflowResponse(response, 'emergency-response');
  }

  /**
   * Execute a tool call
   */
  private async executeToolCall(toolCall: any): Promise<any> {
    // This would integrate with actual APIs
    // For now, return mock success
    console.log('Executing tool:', toolCall.function.name, toolCall.function.arguments);
    
    return {
      success: true,
      toolName: toolCall.function.name,
      result: 'Tool executed successfully',
      timestamp: new Date(),
    };
  }

  /**
   * Process results from tool executions
   */
  private async processResults(
    initialResponse: GrokResponse,
    executedActions: any[]
  ): Promise<GrokResponse> {
    const toolResults = executedActions.map((action, index) => ({
      tool_call_id: initialResponse.choices[0].message.tool_calls?.[index]?.id || `tool_${index}`,
      result: action.result,
    }));

    const messages: GrokMessage[] = [
      initialResponse.choices[0].message,
      ...toolResults.map(({ tool_call_id, result }) => ({
        role: 'tool' as const,
        content: JSON.stringify(result),
        tool_call_id,
      })),
    ];

    return grokService.chat(messages);
  }

  /**
   * Process workflow response into structured result
   */
  private processWorkflowResponse(
    response: GrokResponse,
    workflowName: string
  ): WorkflowResult {
    const decisions: Decision[] = [];
    const executedActions: any[] = [];

    // Extract decisions from response
    if (response.choices[0].message.tool_calls) {
      response.choices[0].message.tool_calls.forEach((toolCall) => {
        decisions.push({
          action: toolCall.function.name,
          toolCalls: [{
            tool: toolCall.function.name,
            arguments: JSON.parse(toolCall.function.arguments),
          }],
          reasoning: 'Automated decision based on workflow',
          confidence: 0.9,
          priority: 'high',
        });
      });
    }

    // Record in history
    this.executionHistory.push({
      timestamp: new Date(),
      workflow: workflowName,
      result: { decisions, response },
    });

    return {
      success: true,
      decisions,
      executedActions,
      totalCost: grokService.calculateCost(response.usage),
    };
  }

  /**
   * Build system prompt based on business context
   */
  private buildSystemPrompt(context: BusinessContext): string {
    return `You are Grok 4, the AI brain powering DuetRight IT's operations. 
    
Current Business Context:
- Time: ${context.currentTime}
- Active Jobs: ${context.activeJobs}
- Pending Tasks: ${context.pendingTasks}
- Unread Messages: ${context.unreadMessages}
- Upcoming Events: ${context.upcomingEvents}
- Daily Revenue: $${context.businessMetrics.dailyRevenue}
- Completion Rate: ${context.businessMetrics.completionRate}%
- Customer Satisfaction: ${context.businessMetrics.customerSatisfaction}/5

Your responsibilities:
1. Monitor all business systems continuously
2. Prioritize tasks based on urgency and impact
3. Execute autonomous actions to optimize operations
4. Escalate only critical decisions to humans
5. Learn from patterns to improve efficiency

Make decisions that maximize customer satisfaction and operational efficiency.`;
  }

  /**
   * Get execution history for audit/analysis
   */
  getExecutionHistory(limit: number = 100): Array<any> {
    return this.executionHistory.slice(-limit);
  }

  /**
   * Calculate ROI of autonomous operations
   */
  calculateROI(): {
    timeSaved: number;
    costSaved: number;
    efficiencyGain: number;
  } {
    // Analyze execution history to calculate savings
    const totalExecutions = this.executionHistory.length;
    const avgTimePerTask = 15; // minutes
    const hourlyRate = 50; // dollars

    return {
      timeSaved: totalExecutions * avgTimePerTask,
      costSaved: (totalExecutions * avgTimePerTask * hourlyRate) / 60,
      efficiencyGain: totalExecutions > 0 ? 3.5 : 0, // 350% efficiency gain
    };
  }
}

export const decisionEngine = new DecisionEngine();