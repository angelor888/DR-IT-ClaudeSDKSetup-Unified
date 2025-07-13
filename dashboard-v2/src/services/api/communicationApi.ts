import { dashboardApi } from './dashboardApi';
import type { 
  Message, 
  MessageFilters, 
  MessagesResponse,
  Conversation,
  ConversationsResponse,
  SendMessageRequest,
  MessageTemplate,
  CommunicationStats
} from '../../types/communication.types';

// Extend the base API with communication-specific endpoints
export const communicationApi = dashboardApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get messages with filters
    getMessages: builder.query<MessagesResponse, MessageFilters>({
      query: (filters) => ({
        url: 'communications/messages',
        params: filters,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.messages.map(({ id }) => ({ type: 'Message' as const, id })),
              { type: 'Message', id: 'LIST' },
            ]
          : [{ type: 'Message', id: 'LIST' }],
    }),

    // Get conversations
    getConversations: builder.query<ConversationsResponse, { platform?: string; status?: string }>({
      query: (params) => ({
        url: 'communications/conversations',
        params,
      }),
      providesTags: ['Conversation'],
    }),

    // Get single conversation with messages
    getConversation: builder.query<{ conversation: Conversation; messages: Message[] }, string>({
      query: (id) => `communications/conversations/${id}`,
      providesTags: (result, error, id) => [{ type: 'Conversation' as const, id }],
    }),

    // Send message
    sendMessage: builder.mutation<Message, SendMessageRequest>({
      query: (data) => ({
        url: 'communications/messages/send',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Message', id: 'LIST' }, 'Conversation', 'Stats'],
    }),

    // Mark messages as read
    markMessagesAsRead: builder.mutation<void, string[]>({
      query: (messageIds) => ({
        url: 'communications/messages/read',
        method: 'POST',
        body: { messageIds },
      }),
      invalidatesTags: (result, error, messageIds) => [
        ...messageIds.map(id => ({ type: 'Message' as const, id })),
        'Conversation',
      ],
    }),

    // Get message templates
    getMessageTemplates: builder.query<MessageTemplate[], { platform?: string }>({
      query: (params) => ({
        url: 'communications/templates',
        params,
      }),
      providesTags: ['Template'],
    }),

    // Create message template
    createMessageTemplate: builder.mutation<MessageTemplate, Omit<MessageTemplate, 'id' | 'usageCount' | 'lastUsed'>>({
      query: (template) => ({
        url: 'communications/templates',
        method: 'POST',
        body: template,
      }),
      invalidatesTags: ['Template'],
    }),

    // Get communication stats
    getCommunicationStats: builder.query<CommunicationStats, { period?: string }>({
      query: (params) => ({
        url: 'communications/stats',
        params,
      }),
      providesTags: ['Stats'],
    }),

    // Delete message
    deleteMessage: builder.mutation<void, string>({
      query: (id) => ({
        url: `communications/messages/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Message', id: 'LIST' }, 'Conversation', 'Stats'],
    }),

    // Archive conversation
    archiveConversation: builder.mutation<void, string>({
      query: (id) => ({
        url: `communications/conversations/${id}/archive`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Conversation', id },
        'Conversation',
      ],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetMessagesQuery,
  useGetConversationsQuery,
  useGetConversationQuery,
  useSendMessageMutation,
  useMarkMessagesAsReadMutation,
  useGetMessageTemplatesQuery,
  useCreateMessageTemplateMutation,
  useGetCommunicationStatsQuery,
  useDeleteMessageMutation,
  useArchiveConversationMutation,
} = communicationApi;