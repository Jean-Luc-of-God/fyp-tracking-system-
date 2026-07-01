import { api, getToken } from './client';
import type { ProposalAttemptResponse } from './types';

export const proposalsApi = {
  submit: (studentId: string, file?: File) => {
    if (file) {
      const form = new FormData();
      form.append('file', file);
      return api.postForm<ProposalAttemptResponse>(`/api/proposals/${studentId}/submit`, form);
    }
    return api.post<ProposalAttemptResponse>(`/api/proposals/${studentId}/submit`);
  },

  review: (studentId: string, decision: 'ACCEPTED' | 'REJECTED', rejectionReason?: string) =>
    api.post<ProposalAttemptResponse>(`/api/proposals/${studentId}/review`, {
      decision,
      rejectionReason,
    }),

  unlock: (studentId: string) =>
    api.post<void>(`/api/proposals/${studentId}/unlock`),

  history: (studentId: string) =>
    api.get<ProposalAttemptResponse[]>(`/api/proposals/${studentId}/history`),

  fetchLatestFileBlobUrl: async (studentId: string): Promise<string | null> => {
    const token = getToken();
    const res = await fetch(`/api/proposals/${studentId}/latest-file`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return null;
    return URL.createObjectURL(await res.blob());
  },
};
