// Matterport API client wrapper
import axios, { AxiosInstance } from 'axios';
import { logger } from '../../utils/logger';
import { 
  MatterportModel,
  MatterportSpace,
  MatterportMeasurement,
  MatterportAnnotation,
  MatterportTour,
  MatterportShare,
  MatterportWebhook,
  MatterportApiResponse
} from './types';

const log = logger.child('MatterportClient');

export class MatterportClient {
  private api: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string = process.env.MATTERPORT_API_KEY || '') {
    this.apiKey = apiKey;
    this.api = axios.create({
      baseURL: 'https://api.matterport.com/api/v1',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      response => response,
      error => {
        log.error('Matterport API error', {
          status: error.response?.status,
          data: error.response?.data,
        });
        throw error;
      }
    );
  }

  // Model operations
  async listModels(options: {
    page?: number;
    limit?: number;
    status?: 'processing' | 'active' | 'inactive';
    visibility?: 'public' | 'private' | 'unlisted';
    search?: string;
    tags?: string[];
  } = {}): Promise<MatterportApiResponse<MatterportModel[]>> {
    try {
      const response = await this.api.get('/models', {
        params: {
          page: options.page || 1,
          limit: options.limit || 20,
          status: options.status,
          visibility: options.visibility,
          q: options.search,
          tags: options.tags?.join(','),
        },
      });
      return response.data;
    } catch (error) {
      log.error('Failed to list models', error);
      throw error;
    }
  }

  async getModel(modelId: string): Promise<MatterportModel | null> {
    try {
      const response = await this.api.get(`/models/${modelId}`);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      log.error(`Failed to get model ${modelId}`, error);
      throw error;
    }
  }

  async updateModel(
    modelId: string,
    updates: {
      name?: string;
      description?: string;
      visibility?: 'public' | 'private' | 'unlisted';
      tags?: string[];
      address?: any;
      metadata?: any;
    }
  ): Promise<MatterportModel> {
    try {
      const response = await this.api.patch(`/models/${modelId}`, updates);
      return response.data.data;
    } catch (error) {
      log.error(`Failed to update model ${modelId}`, error);
      throw error;
    }
  }

  async deleteModel(modelId: string): Promise<void> {
    try {
      await this.api.delete(`/models/${modelId}`);
    } catch (error) {
      log.error(`Failed to delete model ${modelId}`, error);
      throw error;
    }
  }

  // Space operations
  async listSpaces(modelId: string): Promise<MatterportSpace[]> {
    try {
      const response = await this.api.get(`/models/${modelId}/spaces`);
      return response.data.data || [];
    } catch (error) {
      log.error(`Failed to list spaces for model ${modelId}`, error);
      throw error;
    }
  }

  // Measurement operations
  async listMeasurements(modelId: string): Promise<MatterportMeasurement[]> {
    try {
      const response = await this.api.get(`/models/${modelId}/measurements`);
      return response.data.data || [];
    } catch (error) {
      log.error(`Failed to list measurements for model ${modelId}`, error);
      throw error;
    }
  }

  async createMeasurement(
    modelId: string,
    measurement: {
      type: 'distance' | 'area' | 'volume';
      points: Array<{ x: number; y: number; z: number }>;
      label?: string;
    }
  ): Promise<MatterportMeasurement> {
    try {
      const response = await this.api.post(`/models/${modelId}/measurements`, measurement);
      return response.data.data;
    } catch (error) {
      log.error(`Failed to create measurement for model ${modelId}`, error);
      throw error;
    }
  }

  async deleteMeasurement(modelId: string, measurementId: string): Promise<void> {
    try {
      await this.api.delete(`/models/${modelId}/measurements/${measurementId}`);
    } catch (error) {
      log.error(`Failed to delete measurement ${measurementId}`, error);
      throw error;
    }
  }

  // Annotation operations
  async listAnnotations(modelId: string): Promise<MatterportAnnotation[]> {
    try {
      const response = await this.api.get(`/models/${modelId}/annotations`);
      return response.data.data || [];
    } catch (error) {
      log.error(`Failed to list annotations for model ${modelId}`, error);
      throw error;
    }
  }

  async createAnnotation(
    modelId: string,
    annotation: {
      type: 'note' | 'link' | 'media';
      position: { x: number; y: number; z: number };
      title: string;
      description?: string;
      content?: any;
      visibility?: 'always' | 'hover' | 'click';
    }
  ): Promise<MatterportAnnotation> {
    try {
      const response = await this.api.post(`/models/${modelId}/annotations`, annotation);
      return response.data.data;
    } catch (error) {
      log.error(`Failed to create annotation for model ${modelId}`, error);
      throw error;
    }
  }

  async updateAnnotation(
    modelId: string,
    annotationId: string,
    updates: Partial<MatterportAnnotation>
  ): Promise<MatterportAnnotation> {
    try {
      const response = await this.api.patch(
        `/models/${modelId}/annotations/${annotationId}`,
        updates
      );
      return response.data.data;
    } catch (error) {
      log.error(`Failed to update annotation ${annotationId}`, error);
      throw error;
    }
  }

  async deleteAnnotation(modelId: string, annotationId: string): Promise<void> {
    try {
      await this.api.delete(`/models/${modelId}/annotations/${annotationId}`);
    } catch (error) {
      log.error(`Failed to delete annotation ${annotationId}`, error);
      throw error;
    }
  }

  // Tour operations
  async listTours(modelId: string): Promise<MatterportTour[]> {
    try {
      const response = await this.api.get(`/models/${modelId}/tours`);
      return response.data.data || [];
    } catch (error) {
      log.error(`Failed to list tours for model ${modelId}`, error);
      throw error;
    }
  }

  async createTour(
    modelId: string,
    tour: {
      name: string;
      description?: string;
      stops: any[];
      autoPlay?: boolean;
      loop?: boolean;
    }
  ): Promise<MatterportTour> {
    try {
      const response = await this.api.post(`/models/${modelId}/tours`, tour);
      return response.data.data;
    } catch (error) {
      log.error(`Failed to create tour for model ${modelId}`, error);
      throw error;
    }
  }

  async updateTour(
    modelId: string,
    tourId: string,
    updates: Partial<MatterportTour>
  ): Promise<MatterportTour> {
    try {
      const response = await this.api.patch(
        `/models/${modelId}/tours/${tourId}`,
        updates
      );
      return response.data.data;
    } catch (error) {
      log.error(`Failed to update tour ${tourId}`, error);
      throw error;
    }
  }

  async deleteTour(modelId: string, tourId: string): Promise<void> {
    try {
      await this.api.delete(`/models/${modelId}/tours/${tourId}`);
    } catch (error) {
      log.error(`Failed to delete tour ${tourId}`, error);
      throw error;
    }
  }

  // Share operations
  async createShare(
    modelId: string,
    share: {
      type: 'link' | 'embed' | 'download';
      password?: string;
      expiresAt?: string;
      permissions?: {
        view?: boolean;
        measure?: boolean;
        annotate?: boolean;
        download?: boolean;
      };
    }
  ): Promise<MatterportShare> {
    try {
      const response = await this.api.post(`/models/${modelId}/shares`, share);
      return response.data.data;
    } catch (error) {
      log.error(`Failed to create share for model ${modelId}`, error);
      throw error;
    }
  }

  async listShares(modelId: string): Promise<MatterportShare[]> {
    try {
      const response = await this.api.get(`/models/${modelId}/shares`);
      return response.data.data || [];
    } catch (error) {
      log.error(`Failed to list shares for model ${modelId}`, error);
      throw error;
    }
  }

  async deleteShare(modelId: string, shareId: string): Promise<void> {
    try {
      await this.api.delete(`/models/${modelId}/shares/${shareId}`);
    } catch (error) {
      log.error(`Failed to delete share ${shareId}`, error);
      throw error;
    }
  }

  // Webhook operations
  async listWebhooks(): Promise<MatterportWebhook[]> {
    try {
      const response = await this.api.get('/webhooks');
      return response.data.data || [];
    } catch (error) {
      log.error('Failed to list webhooks', error);
      throw error;
    }
  }

  async createWebhook(webhook: {
    url: string;
    events: string[];
    secret?: string;
  }): Promise<MatterportWebhook> {
    try {
      const response = await this.api.post('/webhooks', webhook);
      return response.data.data;
    } catch (error) {
      log.error('Failed to create webhook', error);
      throw error;
    }
  }

  async updateWebhook(
    webhookId: string,
    updates: Partial<MatterportWebhook>
  ): Promise<MatterportWebhook> {
    try {
      const response = await this.api.patch(`/webhooks/${webhookId}`, updates);
      return response.data.data;
    } catch (error) {
      log.error(`Failed to update webhook ${webhookId}`, error);
      throw error;
    }
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    try {
      await this.api.delete(`/webhooks/${webhookId}`);
    } catch (error) {
      log.error(`Failed to delete webhook ${webhookId}`, error);
      throw error;
    }
  }

  // Generate embed code
  generateEmbedCode(modelId: string, options: {
    width?: number;
    height?: number;
    autoplay?: boolean;
    tour?: string;
    start?: string;
    brand?: boolean;
    help?: boolean;
    qs?: boolean;
  } = {}): string {
    const params = new URLSearchParams({
      m: modelId,
      ...(options.autoplay && { autoplay: '1' }),
      ...(options.tour && { tour: options.tour }),
      ...(options.start && { start: options.start }),
      ...(options.brand === false && { brand: '0' }),
      ...(options.help === false && { help: '0' }),
      ...(options.qs === false && { qs: '0' }),
    });

    const width = options.width || 800;
    const height = options.height || 600;

    return `<iframe width="${width}" height="${height}" src="https://my.matterport.com/show/?${params.toString()}" frameborder="0" allowfullscreen allow="xr-spatial-tracking"></iframe>`;
  }
}