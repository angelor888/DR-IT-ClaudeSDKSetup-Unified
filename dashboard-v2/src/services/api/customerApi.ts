import { dashboardApi } from './dashboardApi';
import type { 
  Customer, 
  CustomerFilters, 
  CustomerListResponse, 
  CustomerFormData,
  CustomerSyncStatus,
  CustomerImportData
} from '../../types/customer.types';

// Extend the base API with customer-specific endpoints
export const customerApi = dashboardApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get paginated customers with filters
    getCustomerList: builder.query<CustomerListResponse, CustomerFilters>({
      query: (filters) => ({
        url: 'customers',
        params: filters,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.customers.map(({ id }) => ({ type: 'Customer' as const, id })),
              { type: 'Customer', id: 'LIST' },
            ]
          : [{ type: 'Customer', id: 'LIST' }],
    }),

    // Get single customer with properties
    getCustomerDetails: builder.query<Customer, string>({
      query: (id) => `customers/${id}`,
      providesTags: (result, error, id) => [{ type: 'Customer', id }],
    }),

    // Create new customer
    createCustomer: builder.mutation<Customer, CustomerFormData>({
      query: (customer) => ({
        url: 'customers',
        method: 'POST',
        body: customer,
      }),
      invalidatesTags: [{ type: 'Customer', id: 'LIST' }],
    }),

    // Update customer
    updateCustomer: builder.mutation<Customer, { id: string; data: CustomerFormData }>({
      query: ({ id, data }) => ({
        url: `customers/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Customer', id },
        { type: 'Customer', id: 'LIST' },
      ],
    }),

    // Archive/unarchive customer
    archiveCustomer: builder.mutation<Customer, { id: string; isArchived: boolean }>({
      query: ({ id, isArchived }) => ({
        url: `customers/${id}/archive`,
        method: 'PATCH',
        body: { isArchived },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Customer', id },
        { type: 'Customer', id: 'LIST' },
      ],
    }),

    // Delete customer
    deleteCustomer: builder.mutation<void, string>({
      query: (id) => ({
        url: `customers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Customer', id: 'LIST' }],
    }),

    // Sync with Jobber
    syncCustomerWithJobber: builder.mutation<Customer, string>({
      query: (id) => ({
        url: `customers/${id}/sync-jobber`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Customer', id }],
    }),

    // Bulk sync with Jobber
    syncAllCustomersWithJobber: builder.mutation<CustomerSyncStatus, void>({
      query: () => ({
        url: 'customers/sync-jobber',
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Customer', id: 'LIST' }],
    }),

    // Get sync status
    getCustomerSyncStatus: builder.query<CustomerSyncStatus, void>({
      query: () => 'customers/sync-status',
      providesTags: ['CustomerSync'],
    }),

    // Import customers
    importCustomers: builder.mutation<
      { imported: number; skipped: number; errors: string[] },
      CustomerImportData
    >({
      query: (importData) => ({
        url: 'customers/import',
        method: 'POST',
        body: importData,
      }),
      invalidatesTags: [{ type: 'Customer', id: 'LIST' }],
    }),

    // Export customers
    exportCustomers: builder.query<Blob, CustomerFilters>({
      query: (filters) => ({
        url: 'customers/export',
        params: { ...filters, format: 'csv' },
        responseHandler: (response) => response.blob(),
      }),
    }),

    // Get customer tags
    getCustomerTags: builder.query<string[], void>({
      query: () => 'customers/tags',
      providesTags: ['CustomerTags'],
    }),

    // Add customer note
    addCustomerNote: builder.mutation<
      Customer,
      { customerId: string; note: string }
    >({
      query: ({ customerId, note }) => ({
        url: `customers/${customerId}/notes`,
        method: 'POST',
        body: { note },
      }),
      invalidatesTags: (result, error, { customerId }) => [
        { type: 'Customer', id: customerId },
      ],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetCustomerListQuery,
  useGetCustomerDetailsQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useArchiveCustomerMutation,
  useDeleteCustomerMutation,
  useSyncCustomerWithJobberMutation,
  useSyncAllCustomersWithJobberMutation,
  useGetCustomerSyncStatusQuery,
  useImportCustomersMutation,
  useLazyExportCustomersQuery,
  useGetCustomerTagsQuery,
  useAddCustomerNoteMutation,
} = customerApi;