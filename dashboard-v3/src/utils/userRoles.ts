// User role management utilities
export type UserRole = 'admin' | 'manager' | 'user' | 'guest';

// Authorized DuetRight team members (EXACT LIST - NO OTHER EMAILS ALLOWED)
export const AUTHORIZED_EMAILS = [
  'angelo@duetright.com',
  'info@duetright.com',
  'stantheman@duetright.com',
  'austin@duetright.com',
] as const;

// Admin users (full access to all features)
export const ADMIN_EMAILS = [
  'angelo@duetright.com',
  'info@duetright.com', 
  'stantheman@duetright.com',
  'austin@duetright.com',
] as const;

/**
 * Check if email is authorized to access the dashboard
 */
export function isAuthorizedEmail(email: string): boolean {
  return AUTHORIZED_EMAILS.includes(email as any);
}

/**
 * Get user role based on email address
 */
export function getUserRoleFromEmail(email: string): UserRole {
  if (!email) return 'guest';
  
  // Check if admin
  if (ADMIN_EMAILS.includes(email as any)) {
    return 'admin';
  }
  
  // Check if authorized DuetRight email
  if (isAuthorizedEmail(email)) {
    return 'user';
  }
  
  // Not authorized
  return 'guest';
}

/**
 * Check if user has specific role or higher
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    guest: 0,
    user: 1,
    manager: 2,
    admin: 3,
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Get permissions for a user role
 */
export function getRolePermissions(role: UserRole) {
  const permissions = {
    // Basic permissions
    viewDashboard: false,
    viewCustomers: false,
    viewJobs: false,
    viewCommunications: false,
    
    // AI permissions
    useAI: false,
    viewAnalytics: false,
    createWorkflows: false,
    viewSecurity: false,
    
    // Admin permissions
    manageUsers: false,
    manageSettings: false,
    viewAuditLogs: false,
    manageIntegrations: false,
  };
  
  switch (role) {
    case 'admin':
      return {
        ...permissions,
        viewDashboard: true,
        viewCustomers: true,
        viewJobs: true,
        viewCommunications: true,
        useAI: true,
        viewAnalytics: true,
        createWorkflows: true,
        viewSecurity: true,
        manageUsers: true,
        manageSettings: true,
        viewAuditLogs: true,
        manageIntegrations: true,
      };
      
    case 'manager':
      return {
        ...permissions,
        viewDashboard: true,
        viewCustomers: true,
        viewJobs: true,
        viewCommunications: true,
        useAI: true,
        viewAnalytics: true,
        createWorkflows: true,
        viewSecurity: false,
      };
      
    case 'user':
      return {
        ...permissions,
        viewDashboard: true,
        viewCustomers: true,
        viewJobs: true,
        viewCommunications: true,
        useAI: true,
        viewAnalytics: false,
        createWorkflows: false,
      };
      
    case 'guest':
    default:
      return permissions; // All false
  }
}

/**
 * Create user data for new authorized user
 */
export function createUserData(firebaseUser: any) {
  const email = firebaseUser.email || '';
  const role = getUserRoleFromEmail(email);
  
  if (role === 'guest') {
    throw new Error(`Unauthorized email address: ${email}. Only DuetRight team members can access this dashboard.`);
  }
  
  return {
    id: firebaseUser.uid,
    email,
    name: firebaseUser.displayName || email.split('@')[0] || 'DuetRight User',
    role,
    avatar: firebaseUser.photoURL || undefined,
    permissions: getRolePermissions(role),
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}