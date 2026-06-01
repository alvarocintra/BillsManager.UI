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
