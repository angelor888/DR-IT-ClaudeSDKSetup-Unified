// Slack API type definitions

export interface SlackChannel {
  id: string;
  name: string;
  is_channel: boolean;
  is_group: boolean;
  is_im: boolean;
  is_private: boolean;
  is_member: boolean;
  created: number;
  creator: string;
  is_archived: boolean;
  is_general: boolean;
  name_normalized: string;
  is_shared: boolean;
  is_org_shared: boolean;
  num_members?: number;
}

export interface SlackMessage {
  type: string;
  subtype?: string;
  channel: string;
  user?: string;
  text: string;
  ts: string;
  thread_ts?: string;
  team?: string;
  blocks?: any[];
  attachments?: any[];
}

export interface SlackUser {
  id: string;
  team_id: string;
  name: string;
  deleted: boolean;
  real_name: string;
  profile: {
    display_name: string;
    display_name_normalized: string;
    email?: string;
    image_original?: string;
    image_512?: string;
    image_192?: string;
    image_72?: string;
    image_48?: string;
    image_32?: string;
    image_24?: string;
  };
  is_admin: boolean;
  is_owner: boolean;
  is_bot: boolean;
  is_app_user: boolean;
}

export interface SlackWebhookEvent {
  type: string;
  event_id: string;
  event_time: number;
  event: {
    type: string;
    channel?: string;
    user?: string;
    text?: string;
    ts?: string;
    thread_ts?: string;
    [key: string]: any;
  };
  team_id: string;
  api_app_id: string;
  is_ext_shared_channel?: boolean;
}

export interface SlackResponse<T = any> {
  ok: boolean;
  error?: string;
  warning?: string;
  response_metadata?: {
    next_cursor?: string;
    warnings?: string[];
  };
  data?: T;
}
