import { api } from './client';
import type { PanelAssignmentResponse } from './types';

export const panelsApi = {
  assign: (studentId: string, examinerId: string, panelType: 'PRE_DEFENSE' | 'DEFENSE', scheduledAt?: string) =>
    api.post<PanelAssignmentResponse>('/api/panels/assign', { studentId, examinerId, panelType, scheduledAt }),

  updateSchedule: (assignmentId: string, scheduledAt: string) =>
    api.patch<PanelAssignmentResponse>(`/api/panels/${assignmentId}/schedule`, { scheduledAt }),

  recordOutcome: (
    assignmentId: string,
    outcome: 'CLEARED' | 'PASSED' | 'REFERRED' | 'FAILED',
    outcomeNote?: string
  ) =>
    api.patch<PanelAssignmentResponse>(`/api/panels/${assignmentId}/outcome`, { outcome, outcomeNote }),

  remove: (assignmentId: string) =>
    api.delete<void>(`/api/panels/${assignmentId}`),

  byStudent: (studentId: string) =>
    api.get<PanelAssignmentResponse[]>(`/api/panels/student/${studentId}`),

  mine: () => api.get<PanelAssignmentResponse[]>('/api/panels/me'),
};
