import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { auth } from '../../config/firebase';
import { Workflow, WorkflowExecution, WorkflowLog } from '../../types/workflow';
import { auditService } from '../ai/AuditService';
import { mcpService } from '../mcp/MCPService';
import GrokService from '../grok/GrokService';

class WorkflowService {
  private grokService: GrokService;

  constructor() {
    this.grokService = new GrokService();
  }

  // Create a new workflow
  async createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<Workflow> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const newWorkflow = {
        ...workflow,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.uid,
        runCount: 0,
        errorCount: 0,
      };

      const docRef = await addDoc(collection(db, 'workflows'), newWorkflow);
      
      await auditService.logAction('workflow_created', 'automation', {
        workflowId: docRef.id,
        name: workflow.name,
      });

      return {
        ...newWorkflow,
        id: docRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Workflow;
    } catch (error: any) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  }

  // Get all workflows for the current user
  async getWorkflows(filters?: { status?: string; tag?: string }): Promise<Workflow[]> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      let q = query(
        collection(db, 'workflows'),
        where('createdBy', '==', user.uid),
        orderBy('updatedAt', 'desc')
      );

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        lastRun: doc.data().lastRun?.toDate(),
      } as Workflow));
    } catch (error: any) {
      console.error('Error fetching workflows:', error);
      throw error;
    }
  }

  // Get a single workflow by ID
  async getWorkflow(workflowId: string): Promise<Workflow | null> {
    try {
      const docRef = doc(db, 'workflows', workflowId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
        lastRun: docSnap.data().lastRun?.toDate(),
      } as Workflow;
    } catch (error: any) {
      console.error('Error fetching workflow:', error);
      throw error;
    }
  }

  // Update a workflow
  async updateWorkflow(workflowId: string, updates: Partial<Workflow>): Promise<void> {
    try {
      const docRef = doc(db, 'workflows', workflowId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      await auditService.logAction('workflow_updated', 'automation', {
        workflowId,
        updates: Object.keys(updates),
      });
    } catch (error: any) {
      console.error('Error updating workflow:', error);
      throw error;
    }
  }

  // Delete a workflow
  async deleteWorkflow(workflowId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'workflows', workflowId));
      
      await auditService.logAction('workflow_deleted', 'automation', {
        workflowId,
      });
    } catch (error: any) {
      console.error('Error deleting workflow:', error);
      throw error;
    }
  }

  // Execute a workflow
  async executeWorkflow(workflowId: string, context?: Record<string, any>): Promise<WorkflowExecution> {
    const execution: WorkflowExecution = {
      id: `exec_${Date.now()}`,
      workflowId,
      status: 'running',
      startTime: new Date(),
      context: context || {},
      logs: [],
    };

    try {
      // Get the workflow
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      // Log execution start
      this.addLog(execution, 'start', 'info', 'Workflow execution started');

      // Update workflow last run
      await this.updateWorkflow(workflowId, {
        lastRun: new Date(),
        runCount: (workflow.runCount || 0) + 1,
      });

      // Execute nodes in order
      await this.executeNodes(workflow, execution);

      // Mark as completed
      execution.status = 'completed';
      execution.endTime = new Date();
      
      this.addLog(execution, 'end', 'info', 'Workflow execution completed successfully');

      // Log to audit
      await auditService.logAction('workflow_executed', 'automation', {
        workflowId,
        executionId: execution.id,
        duration: execution.endTime.getTime() - execution.startTime.getTime(),
      });

      return execution;
    } catch (error: any) {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.error = error.message;
      
      this.addLog(execution, 'error', 'error', `Workflow execution failed: ${error.message}`);

      // Update error count
      const workflow = await this.getWorkflow(workflowId);
      if (workflow) {
        await this.updateWorkflow(workflowId, {
          errorCount: (workflow.errorCount || 0) + 1,
        });
      }

      await auditService.logError('workflow_execution_failed', error.message, {
        workflowId,
        executionId: execution.id,
      });

      throw error;
    }
  }

  // Execute workflow nodes
  private async executeNodes(workflow: Workflow, execution: WorkflowExecution): Promise<void> {
    // Find trigger node
    const triggerNode = workflow.nodes.find(n => n.type === 'trigger');
    if (!triggerNode) {
      throw new Error('No trigger node found in workflow');
    }

    // Start from trigger and follow edges
    await this.executeNode(triggerNode, workflow, execution);
  }

  // Execute a single node
  private async executeNode(
    node: any, 
    workflow: Workflow, 
    execution: WorkflowExecution,
    fromEdge?: string
  ): Promise<void> {
    execution.currentNode = node.id;
    this.addLog(execution, node.id, 'info', `Executing node: ${node.data.label}`);

    try {
      let result: any;

      switch (node.type) {
        case 'trigger':
          // Triggers are already satisfied when execution starts
          result = execution.context;
          break;

        case 'action':
          result = await this.executeAction(node, execution);
          break;

        case 'condition':
          result = await this.evaluateCondition(node, execution);
          break;

        case 'delay':
          await this.executeDelay(node, execution);
          result = execution.context;
          break;
      }

      // Update context with result
      execution.context[node.id] = result;

      // Find next nodes
      const nextEdges = workflow.edges.filter(e => {
        if (node.type === 'condition') {
          // For conditions, follow the appropriate branch
          const conditionResult = result as boolean;
          return e.source === node.id && 
                 ((conditionResult && e.sourceHandle === 'true') || 
                  (!conditionResult && e.sourceHandle === 'false'));
        }
        return e.source === node.id;
      });

      // Execute next nodes
      for (const edge of nextEdges) {
        const nextNode = workflow.nodes.find(n => n.id === edge.target);
        if (nextNode) {
          await this.executeNode(nextNode, workflow, execution, edge.id);
        }
      }
    } catch (error: any) {
      if (!node.data.continueOnError) {
        throw error;
      }
      this.addLog(execution, node.id, 'warning', `Node failed but continuing: ${error.message}`);
    }
  }

  // Execute action node
  private async executeAction(node: any, execution: WorkflowExecution): Promise<any> {
    const actionType = node.data.actionType || 'mcp';
    
    switch (actionType) {
      case 'mcp':
        return await this.executeMCPAction(node.data, execution);
      
      case 'email':
        return await this.executeEmailAction(node.data, execution);
      
      case 'ai':
        return await this.executeAIAction(node.data, execution);
      
      case 'http':
        return await this.executeHTTPAction(node.data, execution);
      
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  }

  // Execute MCP tool
  private async executeMCPAction(data: any, execution: WorkflowExecution): Promise<any> {
    const tool = data.mcpTool;
    const params = this.resolveVariables(data.mcpParams || '{}', execution.context);

    this.addLog(execution, 'mcp', 'info', `Executing MCP tool: ${tool}`);

    try {
      const result = await mcpService.executeTool(tool, JSON.parse(params));
      return result;
    } catch (error: any) {
      throw new Error(`MCP tool execution failed: ${error.message}`);
    }
  }

  // Execute email action
  private async executeEmailAction(data: any, execution: WorkflowExecution): Promise<any> {
    const to = this.resolveVariables(data.emailTo, execution.context);
    const subject = this.resolveVariables(data.emailSubject, execution.context);
    const body = this.resolveVariables(data.emailBody, execution.context);

    this.addLog(execution, 'email', 'info', `Sending email to: ${to}`);

    // In production, this would use SendGrid or another email service
    console.log('Email sent:', { to, subject, body });

    return { sent: true, to, subject };
  }

  // Execute AI action
  private async executeAIAction(data: any, execution: WorkflowExecution): Promise<any> {
    const prompt = this.resolveVariables(data.aiPrompt, execution.context);
    const model = data.aiModel || 'grok-2';

    this.addLog(execution, 'ai', 'info', `Processing with AI model: ${model}`);

    const response = await this.grokService.chatCompletion([
      { role: 'user', content: prompt }
    ]);

    return response.choices[0]?.message?.content || '';
  }

  // Execute HTTP action
  private async executeHTTPAction(data: any, execution: WorkflowExecution): Promise<any> {
    const url = this.resolveVariables(data.httpEndpoint, execution.context);
    const method = data.httpMethod || 'GET';
    const headers = data.httpHeaders || {};
    const body = data.httpBody ? this.resolveVariables(JSON.stringify(data.httpBody), execution.context) : undefined;

    this.addLog(execution, 'http', 'info', `Making HTTP ${method} request to: ${url}`);

    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    return await response.json();
  }

  // Evaluate condition
  private async evaluateCondition(node: any, execution: WorkflowExecution): Promise<boolean> {
    const conditionType = node.data.conditionType || 'comparison';

    switch (conditionType) {
      case 'comparison':
        return this.evaluateComparison(node.data, execution);
      
      case 'javascript':
        return this.evaluateJavaScript(node.data, execution);
      
      case 'ai':
        return await this.evaluateAICondition(node.data, execution);
      
      default:
        throw new Error(`Unknown condition type: ${conditionType}`);
    }
  }

  // Evaluate comparison condition
  private evaluateComparison(data: any, execution: WorkflowExecution): boolean {
    const left = this.resolveVariables(data.leftValue, execution.context);
    const right = this.resolveVariables(data.rightValue, execution.context);
    const operator = data.operator || 'equals';

    switch (operator) {
      case 'equals':
        return left === right;
      case 'not_equals':
        return left !== right;
      case 'greater_than':
        return Number(left) > Number(right);
      case 'less_than':
        return Number(left) < Number(right);
      case 'contains':
        return String(left).includes(String(right));
      case 'starts_with':
        return String(left).startsWith(String(right));
      case 'ends_with':
        return String(left).endsWith(String(right));
      default:
        return false;
    }
  }

  // Evaluate JavaScript condition
  private evaluateJavaScript(data: any, execution: WorkflowExecution): boolean {
    const code = data.jsExpression || 'return true;';
    const context = execution.context;

    try {
      // Create a function with the context as parameter
      const func = new Function('context', code);
      return func(context);
    } catch (error: any) {
      throw new Error(`JavaScript evaluation failed: ${error.message}`);
    }
  }

  // Evaluate AI condition
  private async evaluateAICondition(data: any, execution: WorkflowExecution): Promise<boolean> {
    const prompt = this.resolveVariables(data.aiDecisionPrompt, execution.context);
    
    const systemPrompt = `You are a decision-making assistant. Based on the provided context and question, respond with only "true" or "false".`;
    
    const response = await this.grokService.chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Context: ${JSON.stringify(execution.context)}\n\nQuestion: ${prompt}` }
    ]);

    const result = response.choices[0]?.message?.content?.toLowerCase().trim();
    return result === 'true';
  }

  // Execute delay
  private async executeDelay(node: any, execution: WorkflowExecution): Promise<void> {
    const duration = node.data.duration || 1000;
    const unit = node.data.unit || 'ms';

    let delayMs = duration;
    switch (unit) {
      case 's':
        delayMs = duration * 1000;
        break;
      case 'm':
        delayMs = duration * 60 * 1000;
        break;
      case 'h':
        delayMs = duration * 60 * 60 * 1000;
        break;
      case 'd':
        delayMs = duration * 24 * 60 * 60 * 1000;
        break;
    }

    this.addLog(execution, node.id, 'info', `Delaying for ${duration}${unit}`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  // Resolve variables in a string
  private resolveVariables(template: string, context: Record<string, any>): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const keys = path.trim().split('.');
      let value = context;
      
      for (const key of keys) {
        value = value?.[key];
      }
      
      return value !== undefined ? String(value) : match;
    });
  }

  // Add log entry
  private addLog(execution: WorkflowExecution, nodeId: string, level: WorkflowLog['level'], message: string, data?: any): void {
    execution.logs.push({
      timestamp: new Date(),
      nodeId,
      level,
      message,
      data,
    });
  }

  // Get workflow executions
  async getExecutions(workflowId: string, limit = 10): Promise<WorkflowExecution[]> {
    // In production, this would fetch from Firestore
    return [];
  }

  // Schedule a workflow
  async scheduleWorkflow(workflowId: string, schedule: string): Promise<void> {
    // In production, this would use Cloud Scheduler or similar
    await this.updateWorkflow(workflowId, {
      status: 'active',
    });
  }

  // Pause a workflow
  async pauseWorkflow(workflowId: string): Promise<void> {
    await this.updateWorkflow(workflowId, {
      status: 'paused',
    });
  }

  // Resume a workflow
  async resumeWorkflow(workflowId: string): Promise<void> {
    await this.updateWorkflow(workflowId, {
      status: 'active',
    });
  }
}

export const workflowService = new WorkflowService();
export default WorkflowService;