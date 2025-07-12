import { dashboardApi } from './dashboardApi';
import type { 
  Job, 
  JobFilters, 
  JobListResponse, 
  JobFormData,
  JobStats,
  JobSyncStatus,
  JobTemplate,
  JobCalendarEvent,
  JobMilestone,
  JobVisit
} from '@/types/job.types';

// Extend the base API with job-specific endpoints
export const jobApi = dashboardApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get paginated jobs with filters
    getJobList: builder.query<JobListResponse, JobFilters>({
      query: (filters) => ({
        url: 'jobs',
        params: filters,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.jobs.map(({ id }) => ({ type: 'Job' as const, id })),
              { type: 'Job', id: 'LIST' },
            ]
          : [{ type: 'Job', id: 'LIST' }],
    }),

    // Get single job with full details
    getJobDetails: builder.query<Job, string>({
      query: (id) => `jobs/${id}`,
      providesTags: (result, error, id) => [{ type: 'Job', id }],
    }),

    // Create new job
    createJob: builder.mutation<Job, JobFormData>({
      query: (job) => ({
        url: 'jobs',
        method: 'POST',
        body: job,
      }),
      invalidatesTags: [{ type: 'Job', id: 'LIST' }, { type: 'JobStats' }],
    }),

    // Update job
    updateJob: builder.mutation<Job, { id: string; data: Partial<JobFormData> }>({
      query: ({ id, data }) => ({
        url: `jobs/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Job', id },
        { type: 'Job', id: 'LIST' },
        { type: 'JobStats' },
      ],
    }),

    // Update job status
    updateJobStatus: builder.mutation<Job, { id: string; status: Job['status']; notes?: string }>({
      query: ({ id, status, notes }) => ({
        url: `jobs/${id}/status`,
        method: 'PATCH',
        body: { status, notes },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Job', id },
        { type: 'Job', id: 'LIST' },
        { type: 'JobStats' },
      ],
    }),

    // Archive/unarchive job
    archiveJob: builder.mutation<Job, { id: string; isArchived: boolean }>({
      query: ({ id, isArchived }) => ({
        url: `jobs/${id}/archive`,
        method: 'PATCH',
        body: { isArchived },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Job', id },
        { type: 'Job', id: 'LIST' },
        { type: 'JobStats' },
      ],
    }),

    // Delete job
    deleteJob: builder.mutation<void, string>({
      query: (id) => ({
        url: `jobs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Job', id: 'LIST' }, { type: 'JobStats' }],
    }),

    // Duplicate job
    duplicateJob: builder.mutation<Job, { id: string; title?: string }>({
      query: ({ id, title }) => ({
        url: `jobs/${id}/duplicate`,
        method: 'POST',
        body: { title },
      }),
      invalidatesTags: [{ type: 'Job', id: 'LIST' }, { type: 'JobStats' }],
    }),

    // Job scheduling operations
    rescheduleJob: builder.mutation<Job, { id: string; startAt: string; endAt?: string }>({
      query: ({ id, startAt, endAt }) => ({
        url: `jobs/${id}/reschedule`,
        method: 'PATCH',
        body: { startAt, endAt },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Job', id },
        { type: 'Job', id: 'LIST' },
        { type: 'JobCalendar' },
      ],
    }),

    // Get jobs for calendar view
    getJobsForCalendar: builder.query<JobCalendarEvent[], { start: string; end: string; filters?: Partial<JobFilters> }>({
      query: ({ start, end, filters }) => ({
        url: 'jobs/calendar',
        params: { start, end, ...filters },
      }),
      providesTags: ['JobCalendar'],
    }),

    // Job statistics
    getJobStats: builder.query<JobStats, { period?: 'week' | 'month' | 'quarter' | 'year'; customerId?: string }>({
      query: (params) => ({
        url: 'jobs/stats',
        params,
      }),
      providesTags: ['JobStats'],
    }),

    // Job templates
    getJobTemplates: builder.query<JobTemplate[], void>({
      query: () => 'jobs/templates',
      providesTags: ['JobTemplate'],
    }),

    createJobFromTemplate: builder.mutation<Job, { templateId: string; customerId: string; overrides?: Partial<JobFormData> }>({
      query: ({ templateId, customerId, overrides }) => ({
        url: `jobs/templates/${templateId}/create`,
        method: 'POST',
        body: { customerId, ...overrides },
      }),
      invalidatesTags: [{ type: 'Job', id: 'LIST' }, { type: 'JobStats' }],
    }),

    // Job milestones
    updateJobMilestone: builder.mutation<JobMilestone, { jobId: string; milestoneId: string; data: Partial<JobMilestone> }>({
      query: ({ jobId, milestoneId, data }) => ({
        url: `jobs/${jobId}/milestones/${milestoneId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { jobId }) => [{ type: 'Job', id: jobId }],
    }),

    // Job visits
    createJobVisit: builder.mutation<JobVisit, { jobId: string; visit: Omit<JobVisit, 'id'> }>({
      query: ({ jobId, visit }) => ({
        url: `jobs/${jobId}/visits`,
        method: 'POST',
        body: visit,
      }),
      invalidatesTags: (result, error, { jobId }) => [
        { type: 'Job', id: jobId },
        { type: 'JobCalendar' },
      ],
    }),

    updateJobVisit: builder.mutation<JobVisit, { jobId: string; visitId: string; data: Partial<JobVisit> }>({
      query: ({ jobId, visitId, data }) => ({
        url: `jobs/${jobId}/visits/${visitId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { jobId }) => [
        { type: 'Job', id: jobId },
        { type: 'JobCalendar' },
      ],
    }),

    deleteJobVisit: builder.mutation<void, { jobId: string; visitId: string }>({
      query: ({ jobId, visitId }) => ({
        url: `jobs/${jobId}/visits/${visitId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { jobId }) => [
        { type: 'Job', id: jobId },
        { type: 'JobCalendar' },
      ],
    }),

    // Jobber sync operations
    syncJobWithJobber: builder.mutation<Job, string>({
      query: (id) => ({
        url: `jobs/${id}/sync-jobber`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Job', id }],
    }),

    syncAllJobsWithJobber: builder.mutation<JobSyncStatus, void>({
      query: () => ({
        url: 'jobs/sync-jobber',
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Job', id: 'LIST' }, { type: 'JobSync' }],
    }),

    getJobSyncStatus: builder.query<JobSyncStatus, void>({
      query: () => 'jobs/sync-status',
      providesTags: ['JobSync'],
    }),

    // Bulk operations
    bulkUpdateJobs: builder.mutation<{ updated: number; errors: string[] }, { jobIds: string[]; updates: Partial<JobFormData> }>({
      query: ({ jobIds, updates }) => ({
        url: 'jobs/bulk-update',
        method: 'PATCH',
        body: { jobIds, updates },
      }),
      invalidatesTags: [{ type: 'Job', id: 'LIST' }, { type: 'JobStats' }],
    }),

    bulkDeleteJobs: builder.mutation<{ deleted: number; errors: string[] }, string[]>({
      query: (jobIds) => ({
        url: 'jobs/bulk-delete',
        method: 'DELETE',
        body: { jobIds },
      }),
      invalidatesTags: [{ type: 'Job', id: 'LIST' }, { type: 'JobStats' }],
    }),

    // Job search
    searchJobs: builder.query<Job[], { query: string; limit?: number }>({
      query: ({ query, limit = 10 }) => ({
        url: 'jobs/search',
        params: { q: query, limit },
      }),
    }),

    // Job export
    exportJobs: builder.query<Blob, JobFilters>({
      query: (filters) => ({
        url: 'jobs/export',
        params: { ...filters, format: 'csv' },
        responseHandler: (response) => response.blob(),
      }),
    }),

    // Job tags
    getJobTags: builder.query<string[], void>({
      query: () => 'jobs/tags',
      providesTags: ['JobTags'],
    }),

    // Job categories
    getJobCategories: builder.query<string[], void>({
      query: () => 'jobs/categories',
      providesTags: ['JobCategories'],
    }),

    // Job notes
    addJobNote: builder.mutation<Job, { jobId: string; note: string; isInternal?: boolean }>({
      query: ({ jobId, note, isInternal = false }) => ({
        url: `jobs/${jobId}/notes`,
        method: 'POST',
        body: { note, isInternal },
      }),
      invalidatesTags: (result, error, { jobId }) => [{ type: 'Job', id: jobId }],
    }),

    // Time tracking
    startJobTimer: builder.mutation<{ timerId: string }, { jobId: string; userId: string }>({
      query: ({ jobId, userId }) => ({
        url: `jobs/${jobId}/timer/start`,
        method: 'POST',
        body: { userId },
      }),
      invalidatesTags: (result, error, { jobId }) => [{ type: 'Job', id: jobId }],
    }),

    stopJobTimer: builder.mutation<{ duration: number }, { jobId: string; timerId: string }>({
      query: ({ jobId, timerId }) => ({
        url: `jobs/${jobId}/timer/stop`,
        method: 'POST',
        body: { timerId },
      }),
      invalidatesTags: (result, error, { jobId }) => [{ type: 'Job', id: jobId }],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetJobListQuery,
  useGetJobDetailsQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useUpdateJobStatusMutation,
  useArchiveJobMutation,
  useDeleteJobMutation,
  useDuplicateJobMutation,
  useRescheduleJobMutation,
  useGetJobsForCalendarQuery,
  useGetJobStatsQuery,
  useGetJobTemplatesQuery,
  useCreateJobFromTemplateMutation,
  useUpdateJobMilestoneMutation,
  useCreateJobVisitMutation,
  useUpdateJobVisitMutation,
  useDeleteJobVisitMutation,
  useSyncJobWithJobberMutation,
  useSyncAllJobsWithJobberMutation,
  useGetJobSyncStatusQuery,
  useBulkUpdateJobsMutation,
  useBulkDeleteJobsMutation,
  useSearchJobsQuery,
  useLazyExportJobsQuery,
  useGetJobTagsQuery,
  useGetJobCategoriesQuery,
  useAddJobNoteMutation,
  useStartJobTimerMutation,
  useStopJobTimerMutation,
} = jobApi;