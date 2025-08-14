export interface UserRow {
    id: number;
    email: string;
    password: string;
    role: 'client' | 'admin';
  }

export interface RegisterInput {
  email: string;
  password: string;
  role?: 'client' | 'admin';
}

export interface AuthResponse {
  id: number;
  email: string;
  token: string;
  role: 'client' | 'admin';
}

export interface LoginInput {
  email: string;
  password: string;
}