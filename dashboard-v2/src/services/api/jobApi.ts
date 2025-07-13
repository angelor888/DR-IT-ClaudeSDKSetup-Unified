import { dashboardApi } from './dashboardApi';
import type { 
  Job, 
  JobFilters, 
  JobListResponse, 
  JobFormData,
  JobStats
} from '../../types/job.types';

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

    // Get single job details
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
      invalidatesTags: [{ type: 'Job', id: 'LIST' }, 'JobStats'],
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
        'JobStats',
      ],
    }),

    // Update job status
    updateJobStatus: builder.mutation<Job, { id: string; status: Job['status'] }>({
      query: ({ id, status }) => ({
        url: `jobs/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Job', id },
        { type: 'Job', id: 'LIST' },
        'JobStats',
      ],
    }),

    // Archive job
    archiveJob: builder.mutation<Job, string>({
      query: (id) => ({
        url: `jobs/${id}/archive`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Job', id },
        { type: 'Job', id: 'LIST' },
        'JobStats',
      ],
    }),

    // Delete job
    deleteJob: builder.mutation<void, string>({
      query: (id) => ({
        url: `jobs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Job', id: 'LIST' }, 'JobStats'],
    }),

    // Get job statistics
    getJobStats: builder.query<JobStats, void>({
      query: () => 'jobs/stats',
      providesTags: ['JobStats'],
    }),

    // Sync with Jobber
    syncJobWithJobber: builder.mutation<Job, string>({
      query: (id) => ({
        url: `jobs/${id}/sync-jobber`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Job', id }],
    }),

    // Bulk sync with Jobber
    syncAllJobsWithJobber: builder.mutation<{ synced: number; errors: number }, void>({
      query: () => ({
        url: 'jobs/sync-jobber',
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Job', id: 'LIST' }, 'JobStats'],
    }),

    // Reschedule job
    rescheduleJob: builder.mutation<Job, { id: string; startAt: string; endAt?: string }>({
      query: ({ id, ...dates }) => ({
        url: `jobs/${id}/reschedule`,
        method: 'PATCH',
        body: dates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Job', id },
        { type: 'Job', id: 'LIST' },
      ],
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
  useGetJobStatsQuery,
  useSyncJobWithJobberMutation,
  useSyncAllJobsWithJobberMutation,
  useRescheduleJobMutation,
} = jobApi;