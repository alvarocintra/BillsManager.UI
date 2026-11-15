export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginResponse {
  token: string;
  email: string;
  userId: string;
  firstName?: string;
  lastName?: string;
}

export interface UserInfo {
  email: string;
  userId: string;
  firstName?: string;
  lastName?: string;
}

export interface TenantAccess {
  id: string;
  role?: string;
}

export interface Tenant {
  id: string;
  title: string;
  description?: string;
  isActive: boolean;
  members?: string[];
}

export interface TenantUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'Admin' | 'Editor' | 'Viewer' | string;
}
