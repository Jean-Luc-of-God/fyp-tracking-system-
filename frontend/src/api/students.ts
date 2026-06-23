import { api } from './client';
import type { StudentResponse } from './types';

export const studentsApi = {
  list: () => api.get<StudentResponse[]>('/api/students'),

  get: (id: string) => api.get<StudentResponse>(`/api/students/${id}`),

  byState: (state: string) => api.get<StudentResponse[]>(`/api/students/state/${state}`),

  assignSupervisor: (studentId: string, supervisorId: string) =>
    api.post<StudentResponse>(`/api/students/${studentId}/assign-supervisor`, { supervisorId }),

  transition: (studentId: string, toState: string, note?: string) =>
    api.post<StudentResponse>(`/api/students/${studentId}/transition`, { toState, note }),

  signOffBook: (studentId: string) =>
    api.patch<StudentResponse>(`/api/students/${studentId}/sign-off-book`),

  flag: (studentId: string, flagged: boolean) =>
    api.patch<StudentResponse>(`/api/students/${studentId}/flag`, { flagged }),

  withdraw: (studentId: string, reason?: string) =>
    api.post<StudentResponse>(`/api/students/${studentId}/withdraw`, { reason }),
};
