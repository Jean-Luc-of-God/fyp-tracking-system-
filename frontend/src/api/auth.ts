import { api } from './client';
import type { AuthResponse } from './types';

export function login(email: string, password: string): Promise<AuthResponse> {
  return api.postPublic<AuthResponse>('/api/auth/login', { email, password });
}
