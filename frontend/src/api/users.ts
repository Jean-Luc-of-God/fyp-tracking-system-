import { api } from './client';
import type { UserResponse } from './types';

export const usersApi = {
  list: () => api.get<UserResponse[]>('/api/users'),

  byRole: (role: string) => api.get<UserResponse[]>(`/api/users/role/${role}`),

  examiners: () => api.get<UserResponse[]>('/api/users/examiners'),

  create: (data: {
    email: string; password: string; fullName: string;
    phone?: string; role: string; eligibleExaminer?: boolean;
  }) => api.post<UserResponse>('/api/users', data),

  setEnabled: (id: string, enabled: boolean) =>
    api.patch<UserResponse>(`/api/users/${id}/enabled`, { enabled }),

  resetPassword: (id: string, newPassword: string) =>
    api.post<void>(`/api/users/${id}/reset-password`, { newPassword }),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<{ message: string }>('/api/users/me/change-password', { currentPassword, newPassword }),
};
