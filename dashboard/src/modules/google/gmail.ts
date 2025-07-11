// Gmail API service
import { google, gmail_v1 } from 'googleapis';
import { GoogleAuth } from './auth';
import { GmailMessage, GmailThread, GmailLabel } from './types';
import { logger } from '../../utils/logger';
import { getFirestore } from '../../config/firebase';
import { createEvent } from '../../models/Event';

const log = logger.child('GmailService');

export class GmailService {
  private auth: GoogleAuth;
  private db = getFirestore();

  constructor() {
    this.auth = new GoogleAuth();
  }

  // Get Gmail API client
  private async getGmailClient(userId?: string): Promise<gmail_v1.Gmail> {
    const authClient = await this.auth.getAuthClient(userId);
    return google.gmail({ version: 'v1', auth: authClient });
  }

  // List messages
  async listMessages(options: {
    userId?: string;
    q?: string;
    labelIds?: string[];
    maxResults?: number;
    pageToken?: string;
  } = {}): Promise<{
    messages: GmailMessage[];
    nextPageToken?: string;
  }> {
    try {
      const gmail = await this.getGmailClient(options.userId);
      
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: options.q,
        labelIds: options.labelIds,
        maxResults: options.maxResults || 20,
        pageToken: options.pageToken,
      });

      const messages: GmailMessage[] = [];
      
      if (response.data.messages) {
        // Fetch full message details
        const messagePromises = response.data.messages.map(msg =>
          gmail.users.messages.get({
            userId: 'me',
            id: msg.id!,
          })
        );
        
        const fullMessages = await Promise.all(messagePromises);
        messages.push(...fullMessages.map(res => res.data as GmailMessage));
      }

      return {
        messages,
        nextPageToken: response.data.nextPageToken || undefined,
      };
    } catch (error) {
      log.error('Failed to list messages', error);
      throw error;
    }
  }

  // Get message by ID
  async getMessage(messageId: string, userId?: string): Promise<GmailMessage | null> {
    try {
      const gmail = await this.getGmailClient(userId);
      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
      });
      
      return response.data as GmailMessage;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      log.error(`Failed to get message ${messageId}`, error);
      throw error;
    }
  }

  // Send email
  async sendEmail(options: {
    to: string | string[];
    subject: string;
    body: string;
    html?: boolean;
    cc?: string | string[];
    bcc?: string | string[];
    attachments?: Array<{
      filename: string;
      content: string | Buffer;
      encoding?: string;
    }>;
    userId?: string;
  }): Promise<GmailMessage> {
    try {
      const gmail = await this.getGmailClient(options.userId);
      
      // Create email content
      const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;
      const cc = options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : '';
      const bcc = options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : '';
      
      let email = [
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `To: ${to}`,
        cc ? `Cc: ${cc}` : '',
        bcc ? `Bcc: ${bcc}` : '',
        `Subject: ${options.subject}`,
        '',
        options.html ? options.body : options.body.replace(/\n/g, '<br>'),
      ].filter(line => line).join('\n');

      // TODO: Handle attachments if provided

      // Encode email
      const encodedEmail = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Send email
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail,
        },
      });

      // Log event
      await this.db.collection('events').add(
        createEvent(
          'email',
          'gmail',
          'email.sent',
          `Sent email to ${to}`,
          { source: 'dashboard' },
          { 
            messageId: response.data.id,
            to,
            subject: options.subject,
          }
        )
      );

      return response.data as GmailMessage;
    } catch (error) {
      log.error('Failed to send email', error);
      throw error;
    }
  }

  // Get labels
  async getLabels(userId?: string): Promise<GmailLabel[]> {
    try {
      const gmail = await this.getGmailClient(userId);
      const response = await gmail.users.labels.list({
        userId: 'me',
      });

      return response.data.labels as GmailLabel[] || [];
    } catch (error) {
      log.error('Failed to get labels', error);
      throw error;
    }
  }

  // Create label
  async createLabel(name: string, userId?: string): Promise<GmailLabel> {
    try {
      const gmail = await this.getGmailClient(userId);
      const response = await gmail.users.labels.create({
        userId: 'me',
        requestBody: {
          name,
          labelListVisibility: 'labelShow',
          messageListVisibility: 'show',
        },
      });

      return response.data as GmailLabel;
    } catch (error) {
      log.error('Failed to create label', error);
      throw error;
    }
  }

  // Search emails
  async searchEmails(query: string, userId?: string): Promise<GmailMessage[]> {
    const { messages } = await this.listMessages({
      userId,
      q: query,
      maxResults: 50,
    });
    return messages;
  }

  // Get unread count
  async getUnreadCount(userId?: string): Promise<number> {
    try {
      const gmail = await this.getGmailClient(userId);
      const response = await gmail.users.labels.get({
        userId: 'me',
        id: 'INBOX',
      });

      return response.data.messagesUnread || 0;
    } catch (error) {
      log.error('Failed to get unread count', error);
      return 0;
    }
  }

  // Mark as read
  async markAsRead(messageIds: string[], userId?: string): Promise<void> {
    try {
      const gmail = await this.getGmailClient(userId);
      await gmail.users.messages.batchModify({
        userId: 'me',
        requestBody: {
          ids: messageIds,
          removeLabelIds: ['UNREAD'],
        },
      });
    } catch (error) {
      log.error('Failed to mark messages as read', error);
      throw error;
    }
  }

  // Archive messages
  async archiveMessages(messageIds: string[], userId?: string): Promise<void> {
    try {
      const gmail = await this.getGmailClient(userId);
      await gmail.users.messages.batchModify({
        userId: 'me',
        requestBody: {
          ids: messageIds,
          removeLabelIds: ['INBOX'],
        },
      });
    } catch (error) {
      log.error('Failed to archive messages', error);
      throw error;
    }
  }

  // Delete messages
  async deleteMessages(messageIds: string[], userId?: string): Promise<void> {
    try {
      const gmail = await this.getGmailClient(userId);
      
      // Delete each message
      await Promise.all(
        messageIds.map(id =>
          gmail.users.messages.delete({
            userId: 'me',
            id,
          })
        )
      );
    } catch (error) {
      log.error('Failed to delete messages', error);
      throw error;
    }
  }

  // Get thread
  async getThread(threadId: string, userId?: string): Promise<GmailThread | null> {
    try {
      const gmail = await this.getGmailClient(userId);
      const response = await gmail.users.threads.get({
        userId: 'me',
        id: threadId,
      });

      return response.data as GmailThread;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      log.error(`Failed to get thread ${threadId}`, error);
      throw error;
    }
  }
}