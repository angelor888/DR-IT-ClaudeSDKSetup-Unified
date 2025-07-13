// Customer type definitions aligned with Jobber's client model

export interface Address {
  street1?: string;
  street2?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
}

export interface Customer {
  id: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: Address;
  isArchived: boolean;
  
  // Jobber sync metadata
  jobberId?: string;
  jobberSyncStatus?: 'synced' | 'pending' | 'error' | 'not_synced';
  lastJobberSync?: string;
  jobberSyncError?: string;
  
  // Additional fields
  tags?: string[];
  notes?: string;
  preferredContactMethod?: 'email' | 'phone' | 'text';
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface CustomerProperty {
  id: string;
  customerId: string;
  address?: Address;
  mapUrl?: string;
  taxRate?: number;
  isPrimary: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFilters {
  search?: string;
  isArchived?: boolean;
  jobberSyncStatus?: Customer['jobberSyncStatus'];
  tags?: string[];
  city?: string;
  province?: string;
  sortBy?: 'name' | 'email' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CustomerListResponse {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CustomerFormData {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: Address;
  tags?: string[];
  notes?: string;
  preferredContactMethod?: 'email' | 'phone' | 'text';
}

export interface CustomerImportData {
  source: 'jobber' | 'csv' | 'manual';
  data: CustomerFormData[];
  options?: {
    skipDuplicates?: boolean;
    updateExisting?: boolean;
    dryRun?: boolean;
  };
}

export interface CustomerSyncStatus {
  isRunning: boolean;
  lastSync?: string;
  totalCustomers: number;
  syncedCustomers: number;
  pendingCustomers: number;
  errorCustomers: number;
  errors?: Array<{
    customerId: string;
    error: string;
    timestamp: string;
  }>;
}

// Helper function to get full customer name
export const getCustomerName = (customer: Customer): string => {
  if (customer.companyName) {
    return customer.companyName;
  }
  const parts = [customer.firstName, customer.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Unnamed Customer';
};

// Helper function to format address
export const formatAddress = (address?: Address): string => {
  if (!address) return '';
  
  const parts = [
    address.street1,
    address.street2,
    address.city,
    address.province,
    address.postalCode,
    address.country
  ].filter(Boolean);
  
  return parts.join(', ');
};