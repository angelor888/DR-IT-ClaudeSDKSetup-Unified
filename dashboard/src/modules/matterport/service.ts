// Matterport service layer - business logic
import { getFirestore } from '../../config/firebase';
import { MatterportClient } from './client';
import { 
  MatterportModel,
  MatterportAnnotation,
  MatterportTour,
  MatterportShare
} from './types';
import { logger } from '../../utils/logger';
import { createEvent } from '../../models/Event';

const log = logger.child('MatterportService');

export class MatterportService {
  private client: MatterportClient;
  private db = getFirestore();

  constructor(apiKey?: string) {
    this.client = new MatterportClient(apiKey);
  }

  // Model management
  async syncModels(): Promise<MatterportModel[]> {
    try {
      const allModels: MatterportModel[] = [];
      let page = 1;
      let hasMore = true;

      // Fetch all models
      while (hasMore) {
        const response = await this.client.listModels({ page, limit: 50 });
        
        if (response.data) {
          allModels.push(...response.data);
        }

        hasMore = response.pagination?.hasMore || false;
        page++;
      }

      // Store in Firestore
      const batch = this.db.batch();
      allModels.forEach(model => {
        const docRef = this.db.collection('matterport_models').doc(model.id);
        batch.set(docRef, {
          ...model,
          lastSynced: new Date(),
        });
      });
      await batch.commit();

      // Log sync event
      await this.db.collection('events').add(
        createEvent(
          'sync',
          'matterport',
          'models.synced',
          `Synced ${allModels.length} Matterport models`,
          { source: 'dashboard' },
          { modelCount: allModels.length }
        )
      );

      log.info(`Synced ${allModels.length} models`);
      return allModels;
    } catch (error) {
      log.error('Failed to sync models', error);
      throw error;
    }
  }

  async getModels(options: {
    status?: 'processing' | 'active' | 'inactive';
    visibility?: 'public' | 'private' | 'unlisted';
    tags?: string[];
  } = {}): Promise<MatterportModel[]> {
    try {
      let query = this.db.collection('matterport_models') as FirebaseFirestore.Query;

      if (options.status) {
        query = query.where('status', '==', options.status);
      }
      if (options.visibility) {
        query = query.where('visibility', '==', options.visibility);
      }
      if (options.tags && options.tags.length > 0) {
        query = query.where('tags', 'array-contains-any', options.tags);
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => doc.data() as MatterportModel);
    } catch (error) {
      log.error('Failed to get models from Firestore', error);
      throw error;
    }
  }

  async getModel(modelId: string): Promise<MatterportModel | null> {
    try {
      // Try Firestore first
      const doc = await this.db.collection('matterport_models').doc(modelId).get();
      if (doc.exists && doc.data()?.lastSynced) {
        const data = doc.data() as MatterportModel & { lastSynced: any };
        // If data is less than 1 hour old, use it
        if (data.lastSynced.toDate() > new Date(Date.now() - 60 * 60 * 1000)) {
          return data;
        }
      }

      // Fetch from Matterport API
      const model = await this.client.getModel(modelId);

      if (model) {
        // Cache in Firestore
        await this.db.collection('matterport_models').doc(modelId).set({
          ...model,
          lastSynced: new Date(),
        });
      }

      return model;
    } catch (error) {
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
    }
  ): Promise<MatterportModel> {
    try {
      const model = await this.client.updateModel(modelId, updates);

      // Update in Firestore
      await this.db.collection('matterport_models').doc(modelId).update({
        ...updates,
        modified: new Date().toISOString(),
      });

      // Log update event
      await this.db.collection('events').add(
        createEvent(
          'update',
          'matterport',
          'model.updated',
          `Updated Matterport model: ${model.name}`,
          { source: 'dashboard' },
          { modelId, updates }
        )
      );

      return model;
    } catch (error) {
      log.error(`Failed to update model ${modelId}`, error);
      throw error;
    }
  }

  // Annotation management
  async getAnnotations(modelId: string): Promise<MatterportAnnotation[]> {
    try {
      const annotations = await this.client.listAnnotations(modelId);

      // Cache in Firestore
      const batch = this.db.batch();
      annotations.forEach(annotation => {
        const docRef = this.db
          .collection('matterport_models')
          .doc(modelId)
          .collection('annotations')
          .doc(annotation.id);
        batch.set(docRef, annotation);
      });
      await batch.commit();

      return annotations;
    } catch (error) {
      log.error(`Failed to get annotations for model ${modelId}`, error);
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
    }
  ): Promise<MatterportAnnotation> {
    try {
      const newAnnotation = await this.client.createAnnotation(modelId, annotation);

      // Store in Firestore
      await this.db
        .collection('matterport_models')
        .doc(modelId)
        .collection('annotations')
        .doc(newAnnotation.id)
        .set(newAnnotation);

      // Log creation event
      await this.db.collection('events').add(
        createEvent(
          'create',
          'matterport',
          'annotation.created',
          `Created annotation: ${annotation.title}`,
          { source: 'dashboard' },
          { modelId, annotationId: newAnnotation.id }
        )
      );

      return newAnnotation;
    } catch (error) {
      log.error('Failed to create annotation', error);
      throw error;
    }
  }

  // Tour management
  async getTours(modelId: string): Promise<MatterportTour[]> {
    try {
      const tours = await this.client.listTours(modelId);

      // Cache in Firestore
      const batch = this.db.batch();
      tours.forEach(tour => {
        const docRef = this.db
          .collection('matterport_models')
          .doc(modelId)
          .collection('tours')
          .doc(tour.id);
        batch.set(docRef, tour);
      });
      await batch.commit();

      return tours;
    } catch (error) {
      log.error(`Failed to get tours for model ${modelId}`, error);
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
    }
  ): Promise<MatterportTour> {
    try {
      const newTour = await this.client.createTour(modelId, tour);

      // Store in Firestore
      await this.db
        .collection('matterport_models')
        .doc(modelId)
        .collection('tours')
        .doc(newTour.id)
        .set(newTour);

      // Log creation event
      await this.db.collection('events').add(
        createEvent(
          'create',
          'matterport',
          'tour.created',
          `Created tour: ${tour.name}`,
          { source: 'dashboard' },
          { modelId, tourId: newTour.id }
        )
      );

      return newTour;
    } catch (error) {
      log.error('Failed to create tour', error);
      throw error;
    }
  }

  // Share management
  async createShare(
    modelId: string,
    options: {
      type: 'link' | 'embed' | 'download';
      password?: string;
      expiresAt?: string;
    }
  ): Promise<MatterportShare> {
    try {
      const share = await this.client.createShare(modelId, options);

      // Store in Firestore
      await this.db
        .collection('matterport_models')
        .doc(modelId)
        .collection('shares')
        .doc(share.id)
        .set(share);

      // Log share event
      await this.db.collection('events').add(
        createEvent(
          'share',
          'matterport',
          'model.shared',
          `Created ${options.type} share for model`,
          { source: 'dashboard' },
          { modelId, shareId: share.id, shareType: options.type }
        )
      );

      return share;
    } catch (error) {
      log.error('Failed to create share', error);
      throw error;
    }
  }

  // Get embed code
  getEmbedCode(modelId: string, options?: {
    width?: number;
    height?: number;
    autoplay?: boolean;
    tour?: string;
  }): string {
    return this.client.generateEmbedCode(modelId, options);
  }

  // Search models
  async searchModels(query: string): Promise<MatterportModel[]> {
    try {
      // Search in Firestore first
      const snapshot = await this.db
        .collection('matterport_models')
        .where('name', '>=', query)
        .where('name', '<=', query + '\uf8ff')
        .limit(10)
        .get();

      if (!snapshot.empty) {
        return snapshot.docs.map(doc => doc.data() as MatterportModel);
      }

      // If not found, search via API
      const response = await this.client.listModels({ search: query });
      return response.data || [];
    } catch (error) {
      log.error('Failed to search models', error);
      throw error;
    }
  }

  // Get models for a specific address
  async getModelsByAddress(address: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  }): Promise<MatterportModel[]> {
    try {
      let query = this.db.collection('matterport_models') as FirebaseFirestore.Query;

      if (address.street) {
        query = query.where('address.street', '==', address.street);
      }
      if (address.city) {
        query = query.where('address.city', '==', address.city);
      }
      if (address.state) {
        query = query.where('address.state', '==', address.state);
      }
      if (address.postalCode) {
        query = query.where('address.postalCode', '==', address.postalCode);
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => doc.data() as MatterportModel);
    } catch (error) {
      log.error('Failed to get models by address', error);
      throw error;
    }
  }

  // Link Matterport model to Jobber property
  async linkToJobberProperty(
    modelId: string,
    jobberPropertyId: string
  ): Promise<void> {
    try {
      await this.db.collection('matterport_models').doc(modelId).update({
        'metadata.jobberPropertyId': jobberPropertyId,
        'metadata.linkedAt': new Date(),
      });

      log.info(`Linked Matterport model ${modelId} to Jobber property ${jobberPropertyId}`);
    } catch (error) {
      log.error('Failed to link model to Jobber property', error);
      throw error;
    }
  }
}