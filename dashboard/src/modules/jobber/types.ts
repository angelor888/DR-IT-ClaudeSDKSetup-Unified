// Jobber API type definitions

export interface JobberClient {
  id: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: JobberAddress;
  properties?: JobberProperty[];
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobberAddress {
  street1?: string;
  street2?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
}

export interface JobberProperty {
  id: string;
  address?: JobberAddress;
  mapUrl?: string;
  taxRate?: number;
  client?: JobberClient;
}

export interface JobberRequest {
  id: string;
  title: string;
  status: 'new' | 'converted' | 'closed';
  client?: JobberClient;
  property?: JobberProperty;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobberQuote {
  id: string;
  quoteNumber: string;
  quoteStatus: 'draft' | 'awaiting_response' | 'approved' | 'changes_requested' | 'rejected' | 'archived';
  title: string;
  client?: JobberClient;
  property?: JobberProperty;
  message?: string;
  subtotal: number;
  total: number;
  lineItems?: JobberLineItem[];
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  viewedAt?: string;
}

export interface JobberJob {
  id: string;
  jobNumber: string;
  title: string;
  status: 'active' | 'completed' | 'cancelled' | 'on_hold' | 'archived';
  client?: JobberClient;
  property?: JobberProperty;
  description?: string;
  startAt?: string;
  endAt?: string;
  total: number;
  visits?: JobberVisit[];
  lineItems?: JobberLineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface JobberLineItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface JobberVisit {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  anytime: boolean;
  allDay: boolean;
  status: 'scheduled' | 'in_progress' | 'complete' | 'cancelled';
  assignedUsers?: JobberUser[];
}

export interface JobberUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

export interface JobberInvoice {
  id: string;
  invoiceNumber: string;
  status: 'draft' | 'awaiting_payment' | 'paid' | 'past_due' | 'bad_debt';
  client?: JobberClient;
  job?: JobberJob;
  subtotal: number;
  total: number;
  balance: number;
  lineItems?: JobberLineItem[];
  sentAt?: string;
  dueAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobberWebhookEvent {
  id: string;
  topic: string;
  occurredAt: string;
  data: {
    id: string;
    [key: string]: any;
  };
}

export interface JobberPageInfo {
  endCursor?: string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
}

export interface JobberConnection<T> {
  edges: Array<{
    cursor: string;
    node: T;
  }>;
  pageInfo: JobberPageInfo;
  totalCount: number;
}

export interface JobberGraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    path?: string[];
    extensions?: any;
  }>;
}