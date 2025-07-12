// Google API type definitions

// Common types
export interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
  scope: string;
}

// Gmail types
export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId: string;
  internalDate: string;
  payload: {
    partId: string;
    mimeType: string;
    filename: string;
    headers: Array<{
      name: string;
      value: string;
    }>;
    body: {
      size: number;
      data?: string;
    };
    parts?: any[];
  };
  sizeEstimate: number;
  raw?: string;
}

export interface GmailThread {
  id: string;
  historyId: string;
  messages: GmailMessage[];
}

export interface GmailLabel {
  id: string;
  name: string;
  messageListVisibility?: 'show' | 'hide';
  labelListVisibility?: 'labelShow' | 'labelShowIfUnread' | 'labelHide';
  type?: 'system' | 'user';
  messagesTotal?: number;
  messagesUnread?: number;
  threadsTotal?: number;
  threadsUnread?: number;
  color?: {
    textColor: string;
    backgroundColor: string;
  };
}

// Google Calendar types
export interface CalendarEvent {
  id: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  htmlLink: string;
  created: string;
  updated: string;
  summary: string;
  description?: string;
  location?: string;
  colorId?: string;
  creator: {
    email: string;
    displayName?: string;
    self?: boolean;
  };
  organizer: {
    email: string;
    displayName?: string;
    self?: boolean;
  };
  start: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  end: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  endTimeUnspecified?: boolean;
  recurrence?: string[];
  recurringEventId?: string;
  originalStartTime?: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  transparency?: 'opaque' | 'transparent';
  visibility?: 'default' | 'public' | 'private' | 'confidential';
  attendees?: Array<{
    email: string;
    displayName?: string;
    organizer?: boolean;
    self?: boolean;
    resource?: boolean;
    optional?: boolean;
    responseStatus: 'needsAction' | 'declined' | 'tentative' | 'accepted';
    comment?: string;
    additionalGuests?: number;
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
  attachments?: Array<{
    fileUrl: string;
    title: string;
    mimeType: string;
    iconLink: string;
    fileId: string;
  }>;
}

export interface Calendar {
  kind: string;
  etag: string;
  id: string;
  summary: string;
  description?: string;
  location?: string;
  timeZone: string;
  summaryOverride?: string;
  colorId?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  hidden?: boolean;
  selected?: boolean;
  accessRole: 'none' | 'freeBusyReader' | 'reader' | 'writer' | 'owner';
  defaultReminders?: Array<{
    method: 'email' | 'popup';
    minutes: number;
  }>;
  notificationSettings?: {
    notifications: Array<{
      type: string;
      method: string;
    }>;
  };
  primary?: boolean;
  deleted?: boolean;
  conferenceProperties?: {
    allowedConferenceSolutionTypes: string[];
  };
}

// Google Drive types
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  description?: string;
  starred?: boolean;
  trashed?: boolean;
  parents?: string[];
  properties?: { [key: string]: string };
  appProperties?: { [key: string]: string };
  spaces?: string[];
  version?: string;
  webContentLink?: string;
  webViewLink?: string;
  iconLink?: string;
  hasThumbnail?: boolean;
  thumbnailLink?: string;
  thumbnailVersion?: string;
  viewedByMe?: boolean;
  viewedByMeTime?: string;
  createdTime?: string;
  modifiedTime?: string;
  modifiedByMeTime?: string;
  modifiedByMe?: boolean;
  sharedWithMeTime?: string;
  sharingUser?: {
    displayName: string;
    photoLink?: string;
    me?: boolean;
    permissionId?: string;
    emailAddress?: string;
  };
  owners?: Array<{
    displayName: string;
    photoLink?: string;
    me?: boolean;
    permissionId?: string;
    emailAddress?: string;
  }>;
  teamDriveId?: string;
  driveId?: string;
  lastModifyingUser?: {
    displayName: string;
    photoLink?: string;
    me?: boolean;
    permissionId?: string;
    emailAddress?: string;
  };
  shared?: boolean;
  ownedByMe?: boolean;
  capabilities?: {
    canEdit?: boolean;
    canComment?: boolean;
    canShare?: boolean;
    canCopy?: boolean;
    canReadRevisions?: boolean;
    [key: string]: boolean | undefined;
  };
  viewersCanCopyContent?: boolean;
  copyRequiresWriterPermission?: boolean;
  writersCanShare?: boolean;
  permissions?: any[];
  permissionIds?: string[];
  folderColorRgb?: string;
  originalFilename?: string;
  fullFileExtension?: string;
  fileExtension?: string;
  md5Checksum?: string;
  size?: string;
  quotaBytesUsed?: string;
  headRevisionId?: string;
  contentHints?: {
    thumbnail?: {
      image?: string;
      mimeType?: string;
    };
    indexableText?: string;
  };
  imageMediaMetadata?: {
    width?: number;
    height?: number;
    rotation?: number;
    [key: string]: any;
  };
  videoMediaMetadata?: {
    width?: number;
    height?: number;
    durationMillis?: string;
  };
  isAppAuthorized?: boolean;
  exportLinks?: { [key: string]: string };
  shortcutDetails?: {
    targetId: string;
    targetMimeType: string;
    targetResourceKey?: string;
  };
  contentRestrictions?: Array<{
    readOnly?: boolean;
    reason?: string;
    restrictingUser?: any;
    restrictionTime?: string;
    type?: string;
  }>;
  resourceKey?: string;
  linkShareMetadata?: {
    securityUpdateEligible?: boolean;
    securityUpdateEnabled?: boolean;
  };
}

// Google Maps types
export interface PlaceDetails {
  place_id: string;
  formatted_address: string;
  name?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
    viewport?: {
      northeast: { lat: number; lng: number };
      southwest: { lat: number; lng: number };
    };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  types?: string[];
  url?: string;
  vicinity?: string;
  website?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  opening_hours?: {
    open_now?: boolean;
    periods?: Array<{
      close?: { day: number; time: string };
      open: { day: number; time: string };
    }>;
    weekday_text?: string[];
  };
  photos?: Array<{
    height: number;
    html_attributions: string[];
    photo_reference: string;
    width: number;
  }>;
  rating?: number;
  reviews?: Array<{
    author_name: string;
    author_url?: string;
    language: string;
    profile_photo_url?: string;
    rating: number;
    relative_time_description: string;
    text: string;
    time: number;
  }>;
  user_ratings_total?: number;
}

export interface DirectionsResult {
  geocoded_waypoints: Array<{
    geocoder_status: string;
    place_id: string;
    types: string[];
  }>;
  routes: Array<{
    bounds: {
      northeast: { lat: number; lng: number };
      southwest: { lat: number; lng: number };
    };
    copyrights: string;
    legs: Array<{
      distance: { text: string; value: number };
      duration: { text: string; value: number };
      end_address: string;
      end_location: { lat: number; lng: number };
      start_address: string;
      start_location: { lat: number; lng: number };
      steps: Array<{
        distance: { text: string; value: number };
        duration: { text: string; value: number };
        end_location: { lat: number; lng: number };
        html_instructions: string;
        polyline: { points: string };
        start_location: { lat: number; lng: number };
        travel_mode: string;
      }>;
      traffic_speed_entry: any[];
      via_waypoint: any[];
    }>;
    overview_polyline: { points: string };
    summary: string;
    warnings: string[];
    waypoint_order: number[];
  }>;
  status: string;
}
