// Google Drive API service
import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';
import { GoogleAuth } from './auth';
import { DriveFile } from './types';
import { logger } from '../../utils/logger';
import { getFirestore } from '../../config/firebase';
import { createEvent } from '../../models/Event';

const log = logger.child('DriveService');

export class DriveService {
  private auth: GoogleAuth;
  private db = getFirestore();

  constructor() {
    this.auth = new GoogleAuth();
  }

  // Get Drive API client
  private async getDriveClient(userId?: string): Promise<drive_v3.Drive> {
    const authClient = await this.auth.getAuthClient(userId);
    return google.drive({ version: 'v3', auth: authClient });
  }

  // List files
  async listFiles(options: {
    q?: string;
    fields?: string;
    pageSize?: number;
    pageToken?: string;
    orderBy?: string;
    userId?: string;
  } = {}): Promise<{
    files: DriveFile[];
    nextPageToken?: string;
  }> {
    try {
      const drive = await this.getDriveClient(options.userId);
      
      const response = await drive.files.list({
        q: options.q,
        fields: options.fields || 'nextPageToken, files(id, name, mimeType, size, modifiedTime, parents, webViewLink, iconLink, thumbnailLink, createdTime, owners, shared)',
        pageSize: options.pageSize || 50,
        pageToken: options.pageToken,
        orderBy: options.orderBy || 'modifiedTime desc',
      });

      return {
        files: response.data.files as DriveFile[] || [],
        nextPageToken: response.data.nextPageToken || undefined,
      };
    } catch (error) {
      log.error('Failed to list files', error);
      throw error;
    }
  }

  // Get file by ID
  async getFile(fileId: string, userId?: string): Promise<DriveFile | null> {
    try {
      const drive = await this.getDriveClient(userId);
      const response = await drive.files.get({
        fileId,
        fields: '*',
      });
      
      return response.data as DriveFile;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      log.error(`Failed to get file ${fileId}`, error);
      throw error;
    }
  }

  // Upload file
  async uploadFile(options: {
    name: string;
    mimeType: string;
    content: string | Buffer | Readable;
    parents?: string[];
    description?: string;
    userId?: string;
  }): Promise<DriveFile> {
    try {
      const drive = await this.getDriveClient(options.userId);
      
      // Create file metadata
      const fileMetadata: drive_v3.Schema$File = {
        name: options.name,
        parents: options.parents,
        description: options.description,
      };

      // Create media
      const media = {
        mimeType: options.mimeType,
        body: typeof options.content === 'string' 
          ? Readable.from([options.content])
          : options.content instanceof Buffer
          ? Readable.from(options.content)
          : options.content,
      };

      const response = await drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id, name, mimeType, size, modifiedTime, parents, webViewLink',
      });

      const file = response.data as DriveFile;

      // Log file upload
      await this.db.collection('events').add(
        createEvent(
          'file',
          'drive',
          'file.uploaded',
          `Uploaded file: ${options.name}`,
          { source: 'dashboard' },
          { 
            fileId: file.id,
            fileName: options.name,
            mimeType: options.mimeType,
            size: file.size,
          }
        )
      );

      return file;
    } catch (error) {
      log.error('Failed to upload file', error);
      throw error;
    }
  }

  // Update file
  async updateFile(
    fileId: string,
    options: {
      name?: string;
      description?: string;
      content?: string | Buffer | Readable;
      mimeType?: string;
      addParents?: string[];
      removeParents?: string[];
      userId?: string;
    }
  ): Promise<DriveFile> {
    try {
      const drive = await this.getDriveClient(options.userId);
      
      const updateData: any = {
        fileId,
        fields: 'id, name, mimeType, size, modifiedTime, parents, webViewLink',
      };

      // Update metadata if provided
      if (options.name || options.description) {
        updateData.requestBody = {
          name: options.name,
          description: options.description,
        };
      }

      // Update content if provided
      if (options.content && options.mimeType) {
        updateData.media = {
          mimeType: options.mimeType,
          body: typeof options.content === 'string'
            ? Readable.from([options.content])
            : options.content instanceof Buffer
            ? Readable.from(options.content)
            : options.content,
        };
      }

      // Handle parent changes
      if (options.addParents) {
        updateData.addParents = options.addParents.join(',');
      }
      if (options.removeParents) {
        updateData.removeParents = options.removeParents.join(',');
      }

      const response = await drive.files.update(updateData);
      return response.data as DriveFile;
    } catch (error) {
      log.error(`Failed to update file ${fileId}`, error);
      throw error;
    }
  }

  // Delete file
  async deleteFile(fileId: string, userId?: string): Promise<void> {
    try {
      const drive = await this.getDriveClient(userId);
      await drive.files.delete({ fileId });

      // Log file deletion
      await this.db.collection('events').add(
        createEvent(
          'file',
          'drive',
          'file.deleted',
          `Deleted file`,
          { source: 'dashboard' },
          { fileId }
        )
      );
    } catch (error) {
      log.error(`Failed to delete file ${fileId}`, error);
      throw error;
    }
  }

  // Download file
  async downloadFile(fileId: string, userId?: string): Promise<Buffer> {
    try {
      const drive = await this.getDriveClient(userId);
      
      // Get file metadata first
      const file = await this.getFile(fileId, userId);
      if (!file) {
        throw new Error('File not found');
      }

      // Download based on mime type
      let response: any;
      if (file.mimeType?.startsWith('application/vnd.google-apps.')) {
        // Google Docs/Sheets/Slides need to be exported
        const exportMimeType = this.getExportMimeType(file.mimeType);
        response = await drive.files.export({
          fileId,
          mimeType: exportMimeType,
        }, { responseType: 'stream' });
      } else {
        // Regular files can be downloaded directly
        response = await drive.files.get({
          fileId,
          alt: 'media',
        }, { responseType: 'stream' });
      }

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      return new Promise((resolve, reject) => {
        response.data
          .on('data', (chunk: Buffer) => chunks.push(chunk))
          .on('end', () => resolve(Buffer.concat(chunks)))
          .on('error', reject);
      });
    } catch (error) {
      log.error(`Failed to download file ${fileId}`, error);
      throw error;
    }
  }

  // Create folder
  async createFolder(options: {
    name: string;
    parents?: string[];
    description?: string;
    userId?: string;
  }): Promise<DriveFile> {
    return this.uploadFile({
      ...options,
      mimeType: 'application/vnd.google-apps.folder',
      content: '',
    });
  }

  // Search files
  async searchFiles(query: string, userId?: string): Promise<DriveFile[]> {
    const { files } = await this.listFiles({
      q: `name contains '${query}' and trashed = false`,
      pageSize: 20,
      userId,
    });
    return files;
  }

  // Get files in folder
  async getFilesInFolder(folderId: string, userId?: string): Promise<DriveFile[]> {
    const { files } = await this.listFiles({
      q: `'${folderId}' in parents and trashed = false`,
      userId,
    });
    return files;
  }

  // Share file
  async shareFile(
    fileId: string,
    options: {
      type: 'user' | 'group' | 'domain' | 'anyone';
      role: 'owner' | 'organizer' | 'fileOrganizer' | 'writer' | 'commenter' | 'reader';
      emailAddress?: string;
      domain?: string;
      allowFileDiscovery?: boolean;
      sendNotificationEmail?: boolean;
      emailMessage?: string;
      userId?: string;
    }
  ): Promise<any> {
    try {
      const drive = await this.getDriveClient(options.userId);
      
      const permission: drive_v3.Schema$Permission = {
        type: options.type,
        role: options.role,
        emailAddress: options.emailAddress,
        domain: options.domain,
        allowFileDiscovery: options.allowFileDiscovery,
      };

      const response = await drive.permissions.create({
        fileId,
        requestBody: permission,
        sendNotificationEmail: options.sendNotificationEmail,
        emailMessage: options.emailMessage,
      });

      return response.data;
    } catch (error) {
      log.error(`Failed to share file ${fileId}`, error);
      throw error;
    }
  }

  // Copy file
  async copyFile(
    fileId: string,
    options: {
      name?: string;
      parents?: string[];
      description?: string;
      userId?: string;
    } = {}
  ): Promise<DriveFile> {
    try {
      const drive = await this.getDriveClient(options.userId);
      
      const response = await drive.files.copy({
        fileId,
        requestBody: {
          name: options.name,
          parents: options.parents,
          description: options.description,
        },
        fields: 'id, name, mimeType, size, modifiedTime, parents, webViewLink',
      });

      return response.data as DriveFile;
    } catch (error) {
      log.error(`Failed to copy file ${fileId}`, error);
      throw error;
    }
  }

  // Get export mime type for Google Docs
  private getExportMimeType(googleMimeType: string): string {
    const exportMap: { [key: string]: string } = {
      'application/vnd.google-apps.document': 'application/pdf',
      'application/vnd.google-apps.spreadsheet': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.google-apps.presentation': 'application/pdf',
      'application/vnd.google-apps.drawing': 'image/png',
    };
    return exportMap[googleMimeType] || 'application/pdf';
  }
}