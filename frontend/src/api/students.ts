import { api } from './client';
import type { StudentResponse } from './types';

export const studentsApi = {
  list: () => api.get<StudentResponse[]>('/api/students'),

  me: () => api.get<StudentResponse>('/api/students/me'),

  get: (id: string) => api.get<StudentResponse>(`/api/students/${id}`),

  byState: (state: string) => api.get<StudentResponse[]>(`/api/students/state/${state}`),

  assignSupervisor: (studentId: string, supervisorId: string) =>
    api.post<StudentResponse>(`/api/students/${studentId}/assign-supervisor`, { supervisorId }),

  transition: (studentId: string, toState: string, note?: string) =>
    api.post<StudentResponse>(`/api/students/${studentId}/transition`, { state: toState, note }),

  submitCaseLetter: (file?: File) => {
    if (file) {
      const form = new FormData();
      form.append('file', file);
      return api.postForm<StudentResponse>('/api/students/me/submit-case-letter', form);
    }
    return api.post<StudentResponse>('/api/students/me/submit-case-letter');
  },

  createStudent: (data: {
    fullName: string; email: string; regNumber: string;
    phone?: string; org?: string; groupLabel?: string; password?: string;
  }) => api.post<StudentResponse>('/api/students/create', data),

  updateMyDetails: (data: { projectTopic?: string; organisation?: string; groupLabel?: string }) =>
    api.patch<StudentResponse>('/api/students/me/details', data),

  rejectCaseLetter: (studentId: string, reason: string) =>
    api.post<StudentResponse>(`/api/students/${studentId}/reject-case-letter`, { reason }),

  signOffBook: (studentId: string) =>
    api.post<StudentResponse>(`/api/students/${studentId}/sign-off-book`),

  markBookSubmitted: (studentId: string) =>
    api.post<StudentResponse>(`/api/students/${studentId}/mark-book-submitted`),

  flag: (studentId: string, flagged: boolean) =>
    api.post<StudentResponse>(`/api/students/${studentId}/flag`, { flagged }),

  withdraw: (studentId: string, reason?: string) =>
    api.post<StudentResponse>(`/api/students/${studentId}/withdraw`, { reason }),

  importExcel: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.postForm<StudentResponse[]>('/api/students/import', form);
  },
};
