// Matterport API type definitions

export interface MatterportModel {
  id: string;
  name: string;
  description?: string;
  created: string;
  modified: string;
  status: 'processing' | 'active' | 'inactive';
  visibility: 'public' | 'private' | 'unlisted';
  url: string;
  embedUrl: string;
  thumbnailUrl?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  stats?: {
    views: number;
    uniqueVisitors: number;
    averageTime: number;
  };
  tags?: string[];
  metadata?: { [key: string]: any };
}

export interface MatterportSpace {
  id: string;
  modelId: string;
  name: string;
  type: 'room' | 'floor' | 'area';
  level?: number;
  area?: number;
  tags?: string[];
}

export interface MatterportMeasurement {
  id: string;
  modelId: string;
  type: 'distance' | 'area' | 'volume';
  value: number;
  unit: 'meters' | 'feet' | 'square_meters' | 'square_feet' | 'cubic_meters' | 'cubic_feet';
  points: Array<{
    x: number;
    y: number;
    z: number;
  }>;
  label?: string;
  created: string;
}

export interface MatterportAnnotation {
  id: string;
  modelId: string;
  type: 'note' | 'link' | 'media';
  position: {
    x: number;
    y: number;
    z: number;
  };
  title: string;
  description?: string;
  content?: {
    text?: string;
    url?: string;
    mediaUrl?: string;
    mediaType?: string;
  };
  visibility: 'always' | 'hover' | 'click';
  created: string;
  modified: string;
}

export interface MatterportTour {
  id: string;
  modelId: string;
  name: string;
  description?: string;
  stops: Array<{
    id: string;
    position: {
      x: number;
      y: number;
      z: number;
      rotation?: number;
    };
    title: string;
    description?: string;
    duration?: number;
    transition?: 'fly' | 'fade' | 'cut';
  }>;
  autoPlay: boolean;
  loop: boolean;
  created: string;
  modified: string;
}

export interface MatterportShare {
  id: string;
  modelId: string;
  type: 'link' | 'embed' | 'download';
  url: string;
  password?: string;
  expiresAt?: string;
  permissions: {
    view: boolean;
    measure: boolean;
    annotate: boolean;
    download: boolean;
  };
  created: string;
  createdBy: string;
}

export interface MatterportWebhook {
  id: string;
  url: string;
  events: Array<
    | 'model.created'
    | 'model.processed'
    | 'model.deleted'
    | 'annotation.created'
    | 'annotation.updated'
    | 'annotation.deleted'
  >;
  active: boolean;
  secret?: string;
  created: string;
  modified: string;
}

export interface MatterportApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
