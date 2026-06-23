import { useState, useCallback } from 'react';
import { login as apiLogin } from '../api/auth';
import { saveToken, clearToken, getToken } from '../api/client';
import type { AuthResponse } from '../api/types';

export type FrontendRole = 'student' | 'supervisor' | 'facilitator' | 'hod' | 'superadmin';

export interface AuthUser {
  userId: string;
  email: string;
  fullName: string;
  role: FrontendRole;
}

// Map backend role string → frontend role
function toFrontendRole(backendRole: AuthResponse['role']): FrontendRole {
  switch (backendRole) {
    case 'SUPERADMIN':   return 'superadmin';
    case 'HOD':          return 'hod';
    case 'FACILITATOR':  return 'facilitator';
    case 'SUPERVISOR':   return 'supervisor';
    case 'EXAMINER':     return 'supervisor'; // examiners use the supervisor dashboard
    case 'STUDENT':      return 'student';
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email: string, password: string): Promise<AuthUser | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiLogin(email, password);
      saveToken(res.token);
      const authUser: AuthUser = {
        userId: res.userId,
        email: res.email,
        fullName: res.fullName,
        role: toFrontendRole(res.role),
      };
      setUser(authUser);
      return authUser;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Login failed';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setError(null);
  }, []);

  // Re-hydrate from stored token on page reload (token present = consider logged in)
  const isTokenPresent = !!getToken();

  return { user, error, loading, login, logout, isTokenPresent };
}
