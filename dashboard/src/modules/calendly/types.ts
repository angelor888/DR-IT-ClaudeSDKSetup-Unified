// Calendly API types and interfaces
export interface CalendlyUser {
  uri: string;
  name: string;
  slug: string;
  email: string;
  scheduling_url: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  current_organization: string;
  timezone: string;
}

export interface CalendlyOrganization {
  uri: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface CalendlyEventType {
  uri: string;
  name: string;
  slug: string;
  active: boolean;
  booking_method: 'instant' | 'poll';
  color: string;
  created_at: string;
  updated_at: string;
  description_html?: string;
  description_plain?: string;
  duration: number;
  internal_note?: string;
  kind: 'solo' | 'group';
  pooling_type?: 'round_robin' | 'collective';
  profile: {
    name: string;
    owner: string;
    type: 'User' | 'Team';
  };
  scheduling_url: string;
  secret: boolean;
  type: 'StandardEventType' | 'AdhocEventType';
}

export interface CalendlyEvent {
  uri: string;
  name: string;
  meeting_notes_html?: string;
  meeting_notes_plain?: string;
  status: 'active' | 'canceled';
  start_time: string;
  end_time: string;
  event_type: string;
  location?: {
    type:
      | 'physical'
      | 'gotomeeting'
      | 'inbound_call'
      | 'outbound_call'
      | 'zoom'
      | 'google_conference'
      | 'microsoft_teams'
      | 'webex'
      | 'custom';
    location?: string;
    join_url?: string;
    phone_number?: string;
    additional_info?: string;
  };
  invitees_counter: {
    total: number;
    active: number;
    limit: number;
  };
  created_at: string;
  updated_at: string;
  event_memberships: Array<{
    user: string;
    user_email: string;
    user_name: string;
  }>;
  event_guests: Array<{
    email: string;
    created_at: string;
    updated_at: string;
  }>;
}

export interface CalendlyInvitee {
  uri: string;
  name: string;
  email: string;
  status: 'active' | 'canceled';
  timezone: string;
  event: string;
  created_at: string;
  updated_at: string;
  cancel_url: string;
  reschedule_url: string;
  routing_form_submission?: string;
  questions_and_answers?: Array<{
    question: string;
    answer: string;
    position: number;
  }>;
  tracking?: {
    utm_campaign?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_content?: string;
    utm_term?: string;
    salesforce_uuid?: string;
  };
  text_reminder_number?: string;
  rescheduled: boolean;
  old_invitee?: string;
  new_invitee?: string;
  cancel_reason?: string;
  cancellation?: {
    canceled_by: string;
    reason: string;
    canceler_type: 'invitee' | 'host';
  };
}

export interface CalendlyWebhook {
  uri: string;
  callback_url: string;
  created_at: string;
  updated_at: string;
  retry_started_at?: string;
  state: 'active' | 'disabled';
  events: string[]; // webhook event types
  organization: string;
  user?: string;
  scope: 'organization' | 'user';
}

export interface CalendlyWebhookPayload {
  created_at: string;
  created_by: string;
  event:
    | 'invitee.created'
    | 'invitee.canceled'
    | 'invitee_no_show.created'
    | 'invitee_no_show.deleted';
  payload: {
    event_type?: CalendlyEventType;
    event?: CalendlyEvent;
    invitee?: CalendlyInvitee;
    questions_and_answers?: Array<{
      question: string;
      answer: string;
      position: number;
    }>;
    questions_and_responses?: Array<{
      question: string;
      response: string;
      position: number;
    }>;
    tracking?: {
      utm_campaign?: string;
      utm_source?: string;
      utm_medium?: string;
      utm_content?: string;
      utm_term?: string;
      salesforce_uuid?: string;
    };
    old_resource?: CalendlyInvitee;
    new_resource?: CalendlyInvitee;
  };
}

export interface CalendlyAPIResponse<T> {
  collection: T[];
  pagination: {
    count: number;
    next_page?: string;
    previous_page?: string;
    next_page_token?: string;
    previous_page_token?: string;
  };
}

export interface CalendlyAPIError {
  title: string;
  message: string;
  details?: Array<{
    parameter: string;
    message: string;
  }>;
}

// Internal types for integration
export interface CalendlyJobEvent {
  id: string;
  calendlyEventUri: string;
  jobId?: string;
  customerId?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status: 'scheduled' | 'completed' | 'canceled' | 'no_show';
  attendees: Array<{
    name: string;
    email: string;
    status: 'confirmed' | 'tentative' | 'declined';
  }>;
  location?: {
    type: string;
    details: string;
  };
  meetingNotes?: string;
  followUpRequired: boolean;
  syncedWithGoogle: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendlySchedulingPreferences {
  timezone: string;
  workingHours: Array<{
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
  }>;
  bufferTime: {
    before: number; // minutes
    after: number; // minutes
  };
  minimumNotice: number; // hours
  maximumNotice: number; // days
  autoSync: boolean;
  defaultEventType?: string;
}
