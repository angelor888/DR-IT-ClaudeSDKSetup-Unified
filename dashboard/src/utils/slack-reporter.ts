// Slack reporting utility for automated posting of implementation reports
import { getSlackService } from '../modules/slack';
import { logger } from './logger';

const log = logger.child('SlackReporter');

export interface ReportData {
  title: string;
  summary: string;
  components: Array<{ name: string; description: string }>;
  features: string[];
  qualityMetrics: string[];
  gitDetails: {
    commit: string;
    branch: string;
    message: string;
  };
  nextPhase: string;
  status: string;
}

export class SlackReporter {
  private static instance: SlackReporter;
  private slackService: any;
  private isInitialized = false;

  constructor() {
    this.initializeService();
  }

  static getInstance(): SlackReporter {
    if (!SlackReporter.instance) {
      SlackReporter.instance = new SlackReporter();
    }
    return SlackReporter.instance;
  }

  private async initializeService(): Promise<void> {
    try {
      this.slackService = getSlackService();
      await this.slackService.initialize();
      this.isInitialized = true;
      log.info('Slack reporter initialized successfully');
    } catch (error) {
      log.warn('Failed to initialize Slack service for reporting', { error });
      this.isInitialized = false;
    }
  }

  /**
   * Format report data for Slack posting
   */
  private formatReport(data: ReportData): string {
    const componentsText = data.components
      .map(c => `• \`${c.name}\` - ${c.description}`)
      .join('\n');

    const featuresText = data.features
      .map(f => `• ${f}`)
      .join('\n');

    const qualityText = data.qualityMetrics
      .map(q => `• ${q}`)
      .join('\n');

    return `🎯 **${data.title}**

📋 **Project Summary**
${data.summary}

🏗️ **Components Built**
${componentsText}

⚡ **Technical Features**
${featuresText}

✅ **Quality Assurance**
${qualityText}

📝 **Git Details**
• **Commit**: \`${data.gitDetails.commit}\`
• **Branch**: \`${data.gitDetails.branch}\`
• **Message**: "${data.gitDetails.message}"

🚀 **Next Phase**
${data.nextPhase}

**Status**: ${data.status}`;
  }

  /**
   * Post implementation report to #it-report channel
   */
  async postImplementationReport(data: ReportData): Promise<boolean> {
    if (!this.isInitialized) {
      log.warn('Slack service not initialized, cannot post report');
      return false;
    }

    try {
      const formattedReport = this.formatReport(data);
      const channelId = '#it-report'; // Will be resolved to channel ID by Slack service
      
      await this.slackService.sendMessage(channelId, formattedReport, {
        saveToDb: true,
      });

      log.info('Implementation report posted to Slack successfully', {
        title: data.title,
        commit: data.gitDetails.commit,
      });

      return true;
    } catch (error) {
      log.error('Failed to post implementation report to Slack', { error });
      return false;
    }
  }

  /**
   * Post simple message to #it-report channel
   */
  async postMessage(message: string): Promise<boolean> {
    if (!this.isInitialized) {
      log.warn('Slack service not initialized, cannot post message');
      return false;
    }

    try {
      const channelId = '#it-report';
      await this.slackService.sendMessage(channelId, message, {
        saveToDb: true,
      });

      log.info('Message posted to Slack successfully');
      return true;
    } catch (error) {
      log.error('Failed to post message to Slack', { error });
      return false;
    }
  }

  /**
   * Check if Slack reporting is available
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get health status of Slack integration
   */
  async getHealthStatus(): Promise<{
    available: boolean;
    lastCheck?: Date;
    error?: string;
  }> {
    if (!this.isInitialized) {
      return {
        available: false,
        error: 'Slack service not initialized',
      };
    }

    try {
      const health = await this.slackService.checkHealth();
      return {
        available: health.healthy,
        lastCheck: health.lastCheck,
        error: health.error,
      };
    } catch (error) {
      return {
        available: false,
        error: (error as Error).message,
      };
    }
  }
}

// Singleton instance
export const slackReporter = SlackReporter.getInstance();

// Helper function for quick report posting
export async function postImplementationReport(data: ReportData): Promise<boolean> {
  return slackReporter.postImplementationReport(data);
}

// Helper function for posting simple messages
export async function postToItReport(message: string): Promise<boolean> {
  return slackReporter.postMessage(message);
}