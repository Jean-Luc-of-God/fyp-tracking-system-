import { api } from './client';
import type { ProposalAttemptResponse } from './types';

export const proposalsApi = {
  submit: (studentId: string) =>
    api.post<ProposalAttemptResponse>(`/api/proposals/${studentId}/submit`),

  review: (studentId: string, decision: 'ACCEPTED' | 'REJECTED', rejectionReason?: string) =>
    api.post<ProposalAttemptResponse>(`/api/proposals/${studentId}/review`, {
      decision,
      rejectionReason,
    }),

  unlock: (studentId: string) =>
    api.post<void>(`/api/proposals/${studentId}/unlock`),

  history: (studentId: string) =>
    api.get<ProposalAttemptResponse[]>(`/api/proposals/${studentId}/history`),
};
