// Communications API with Slack, Twilio, and AI integration

import { dashboardApi } from './dashboardApi';
import type {
  UnifiedMessage,
  Conversation,
  CommunicationPreferences,
  MessageTemplate,
  CommunicationStats,
  SendMessageRequest,
  GetMessagesRequest,
  AIMessageRequest,
  AIMessageResponse,
} from '@features/communications/types';

export const communicationsApi = dashboardApi.injectEndpoints({
  endpoints: (builder) => ({
    // Unified message endpoints
    getMessages: builder.query<
      { messages: UnifiedMessage[]; total: number },
      GetMessagesRequest
    >({
      query: (params) => ({
        url: '/communications/messages',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.messages.map(({ id }) => ({
                type: 'Message' as const,
                id,
              })),
              { type: 'Message', id: 'LIST' },
            ]
          : [{ type: 'Message', id: 'LIST' }],
    }),

    getMessage: builder.query<UnifiedMessage, string>({
      query: (id) => `/communications/messages/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Message', id }],
    }),

    sendMessage: builder.mutation<UnifiedMessage, SendMessageRequest>({
      query: (data) => ({
        url: '/communications/messages/send',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [
        { type: 'Message', id: 'LIST' },
        { type: 'Conversation', id: 'LIST' },
        { type: 'Stats', id: 'CURRENT' },
      ],
    }),

    // Conversation endpoints
    getConversations: builder.query<
      { conversations: Conversation[]; total: number },
      { platform?: string; status?: string; limit?: number; offset?: number }
    >({
      query: (params) => ({
        url: '/communications/conversations',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.conversations.map(({ id }) => ({
                type: 'Conversation' as const,
                id,
              })),
              { type: 'Conversation', id: 'LIST' },
            ]
          : [{ type: 'Conversation', id: 'LIST' }],
    }),

    getConversation: builder.query<Conversation, string>({
      query: (id) => `/communications/conversations/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Conversation', id }],
    }),

    archiveConversation: builder.mutation<void, string>({
      query: (id) => ({
        url: `/communications/conversations/${id}/archive`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Conversation', id },
        { type: 'Conversation', id: 'LIST' },
      ],
    }),

    // AI-powered features
    getAISuggestion: builder.mutation<AIMessageResponse, AIMessageRequest>({
      query: (data) => ({
        url: '/communications/ai/suggest',
        method: 'POST',
        body: data,
      }),
    }),

    improveMessage: builder.mutation<
      AIMessageResponse,
      { content: string; tone?: string }
    >({
      query: (data) => ({
        url: '/communications/ai/improve',
        method: 'POST',
        body: data,
      }),
    }),

    summarizeConversation: builder.mutation<
      { summary: string; keyPoints: string[]; nextSteps?: string[] },
      string
    >({
      query: (conversationId) => ({
        url: '/communications/ai/summarize',
        method: 'POST',
        body: { conversationId },
      }),
    }),

    analyzeMessageSentiment: builder.mutation<
      {
        sentiment: 'positive' | 'neutral' | 'negative';
        confidence: number;
        emotions?: string[];
      },
      string
    >({
      query: (messageId) => ({
        url: '/communications/ai/analyze-sentiment',
        method: 'POST',
        body: { messageId },
      }),
    }),

    // Slack-specific endpoints
    getSlackChannels: builder.query<
      Array<{ id: string; name: string; memberCount: number; isPrivate: boolean }>,
      void
    >({
      query: () => '/slack/channels',
    }),

    joinSlackChannel: builder.mutation<void, string>({
      query: (channelId) => ({
        url: `/slack/channels/${channelId}/join`,
        method: 'POST',
      }),
    }),

    // Twilio-specific endpoints
    getTwilioNumbers: builder.query<
      Array<{ phoneNumber: string; friendlyName: string; capabilities: string[] }>,
      void
    >({
      query: () => '/twilio/phone-numbers',
    }),

    sendSMS: builder.mutation<
      { sid: string; status: string },
      { to: string; body: string; mediaUrl?: string }
    >({
      query: (data) => ({
        url: '/twilio/sms/send',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [
        { type: 'Message', id: 'LIST' },
        { type: 'Stats', id: 'CURRENT' },
      ],
    }),

    // Template management
    getTemplates: builder.query<
      MessageTemplate[],
      { platform?: string; category?: string }
    >({
      query: (params) => ({
        url: '/communications/templates',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: 'Template' as const,
                id,
              })),
              { type: 'Template', id: 'LIST' },
            ]
          : [{ type: 'Template', id: 'LIST' }],
    }),

    createTemplate: builder.mutation<
      MessageTemplate,
      Omit<MessageTemplate, 'id' | 'usageCount' | 'lastUsed'>
    >({
      query: (data) => ({
        url: '/communications/templates',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Template', id: 'LIST' }],
    }),

    generateAITemplate: builder.mutation<
      MessageTemplate,
      {
        category: string;
        intent: string;
        tone: 'professional' | 'friendly' | 'casual';
        examples?: string[];
      }
    >({
      query: (data) => ({
        url: '/communications/templates/generate',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Template', id: 'LIST' }],
    }),

    // Preferences and settings
    getPreferences: builder.query<CommunicationPreferences, void>({
      query: () => '/communications/preferences',
      providesTags: [{ type: 'Preferences', id: 'CURRENT' }],
    }),

    updatePreferences: builder.mutation<
      CommunicationPreferences,
      Partial<CommunicationPreferences>
    >({
      query: (data) => ({
        url: '/communications/preferences',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: [{ type: 'Preferences', id: 'CURRENT' }],
    }),

    // Statistics and analytics
    getCommunicationStats: builder.query<
      CommunicationStats,
      { startDate?: Date; endDate?: Date }
    >({
      query: (params) => ({
        url: '/communications/stats',
        params,
      }),
      providesTags: [{ type: 'Stats', id: 'CURRENT' }],
    }),

    // Bulk operations
    markMessagesAsRead: builder.mutation<void, string[]>({
      query: (messageIds) => ({
        url: '/communications/messages/mark-read',
        method: 'POST',
        body: { messageIds },
      }),
      invalidatesTags: (result, error, messageIds) =>
        messageIds.map((id) => ({ type: 'Message' as const, id })),
    }),

    bulkCategorizeMessages: builder.mutation<
      Array<{ messageId: string; category: string; confidence: number }>,
      string[]
    >({
      query: (messageIds) => ({
        url: '/communications/ai/categorize',
        method: 'POST',
        body: { messageIds },
      }),
      invalidatesTags: (result, error, messageIds) =>
        messageIds.map((id) => ({ type: 'Message' as const, id })),
    }),
  }),
});

export const {
  // Messages
  useGetMessagesQuery,
  useGetMessageQuery,
  useSendMessageMutation,
  
  // Conversations
  useGetConversationsQuery,
  useGetConversationQuery,
  useArchiveConversationMutation,
  
  // AI features
  useGetAISuggestionMutation,
  useImproveMessageMutation,
  useSummarizeConversationMutation,
  useAnalyzeMessageSentimentMutation,
  
  // Slack
  useGetSlackChannelsQuery,
  useJoinSlackChannelMutation,
  
  // Twilio
  useGetTwilioNumbersQuery,
  useSendSMSMutation,
  
  // Templates
  useGetTemplatesQuery,
  useCreateTemplateMutation,
  useGenerateAITemplateMutation,
  
  // Preferences
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
  
  // Stats
  useGetCommunicationStatsQuery,
  
  // Bulk operations
  useMarkMessagesAsReadMutation,
  useBulkCategorizeMessagesMutation,
} = communicationsApi;