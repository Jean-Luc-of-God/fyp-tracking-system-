import { api } from './client';
import type { AuditLogResponse, NotificationLogResponse } from './types';

export const auditApi = {
  list: (page = 0, size = 50) =>
    api.get<{ content: AuditLogResponse[]; totalElements: number }>(`/api/audit?page=${page}&size=${size}`),

  byActor: (actorId: string) =>
    api.get<AuditLogResponse[]>(`/api/audit/actor/${actorId}`),

  byEntity: (entityType: string, entityId: string) =>
    api.get<AuditLogResponse[]>(`/api/audit/entity/${entityType}/${entityId}`),

  byAction: (action: string) =>
    api.get<AuditLogResponse[]>(`/api/audit/action/${action}`),
};

export const notificationsApi = {
  mine: () => api.get<NotificationLogResponse[]>('/api/notifications/me'),

  byStudent: (studentId: string) =>
    api.get<NotificationLogResponse[]>(`/api/notifications/student/${studentId}`),

  failed: () => api.get<NotificationLogResponse[]>('/api/notifications/failed'),

  byRecipient: (recipientId: string) =>
    api.get<NotificationLogResponse[]>(`/api/notifications/recipient/${recipientId}`),
};
