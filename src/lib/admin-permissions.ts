import { UserRole } from '@prisma/client';

export const ADMIN_ROLES = {
  USER: 'USER' as UserRole,
  SUPPORT_ADMIN: 'SUPPORT_ADMIN' as UserRole,
  CONTENT_ADMIN: 'CONTENT_ADMIN' as UserRole,
  SUPER_ADMIN: 'SUPER_ADMIN' as UserRole,
};

export const ADMIN_PERMISSIONS = {
  // User Management
  VIEW_USERS: ['SUPPORT_ADMIN', 'CONTENT_ADMIN', 'SUPER_ADMIN'],
  EDIT_USERS: ['CONTENT_ADMIN', 'SUPER_ADMIN'],
  DELETE_USERS: ['SUPER_ADMIN'],
  MANAGE_ROLES: ['SUPER_ADMIN'],
  
  // Recipe Management
  VIEW_ALL_RECIPES: ['SUPPORT_ADMIN', 'CONTENT_ADMIN', 'SUPER_ADMIN'],
  EDIT_ANY_RECIPE: ['CONTENT_ADMIN', 'SUPER_ADMIN'],
  DELETE_ANY_RECIPE: ['CONTENT_ADMIN', 'SUPER_ADMIN'],
  FEATURE_RECIPES: ['CONTENT_ADMIN', 'SUPER_ADMIN'],
  
  // Content Moderation
  MODERATE_CONTENT: ['CONTENT_ADMIN', 'SUPER_ADMIN'],
  BAN_CONTENT: ['CONTENT_ADMIN', 'SUPER_ADMIN'],
  
  // System Settings
  VIEW_SETTINGS: ['SUPER_ADMIN'],
  EDIT_SETTINGS: ['SUPER_ADMIN'],
  MANAGE_API_KEYS: ['SUPER_ADMIN'],
  
  // Analytics
  VIEW_ANALYTICS: ['SUPPORT_ADMIN', 'CONTENT_ADMIN', 'SUPER_ADMIN'],
  EXPORT_DATA: ['CONTENT_ADMIN', 'SUPER_ADMIN'],
  
  // Audit Logs
  VIEW_AUDIT_LOGS: ['CONTENT_ADMIN', 'SUPER_ADMIN'],
  EXPORT_AUDIT_LOGS: ['SUPER_ADMIN'],
  
  // Database
  VIEW_DATABASE: ['SUPER_ADMIN'],
  MANAGE_DATABASE: ['SUPER_ADMIN'],
};

export function hasPermission(userRole: UserRole, permission: keyof typeof ADMIN_PERMISSIONS): boolean {
  const allowedRoles = ADMIN_PERMISSIONS[permission];
  return allowedRoles.includes(userRole);
}

export function isAdmin(userRole: UserRole): boolean {
  return userRole !== 'USER';
}

export function isSuperAdmin(userRole: UserRole): boolean {
  return userRole === 'SUPER_ADMIN';
}

export function isContentAdmin(userRole: UserRole): boolean {
  return userRole === 'CONTENT_ADMIN' || userRole === 'SUPER_ADMIN';
}

export function isSupportAdmin(userRole: UserRole): boolean {
  return userRole === 'SUPPORT_ADMIN' || userRole === 'CONTENT_ADMIN' || userRole === 'SUPER_ADMIN';
}

export const ROLE_LABELS: Record<UserRole, string> = {
  USER: 'User',
  SUPPORT_ADMIN: 'Support Admin',
  CONTENT_ADMIN: 'Content Admin',
  SUPER_ADMIN: 'Super Admin',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  USER: 'Standard user with basic access',
  SUPPORT_ADMIN: 'Can view users and recipes, provide support',
  CONTENT_ADMIN: 'Can manage recipes, users, and moderate content',
  SUPER_ADMIN: 'Full access to all features and settings',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  USER: 'gray',
  SUPPORT_ADMIN: 'blue',
  CONTENT_ADMIN: 'purple',
  SUPER_ADMIN: 'red',
};
