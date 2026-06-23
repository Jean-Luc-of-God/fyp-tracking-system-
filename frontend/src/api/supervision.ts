import { api } from './client';
import type { AvailabilitySlotResponse, MeetingResponse } from './types';

export const supervisionApi = {
  addSlot: (data: {
    dayOfWeek: string; startTime: string; endTime: string; location?: string;
  }) => api.post<AvailabilitySlotResponse>('/api/supervision/slots', data),

  mySlots: () => api.get<AvailabilitySlotResponse[]>('/api/supervision/slots/me'),

  slotsBySupervisor: (supervisorId: string) =>
    api.get<AvailabilitySlotResponse[]>(`/api/supervision/slots/${supervisorId}`),

  deleteSlot: (slotId: string) =>
    api.delete<void>(`/api/supervision/slots/${slotId}`),

  scheduleMeeting: (data: {
    studentId: string; scheduledAt: string; topic?: string;
    meetingType?: string; location?: string; meetLink?: string;
  }) => api.post<MeetingResponse>('/api/supervision/meetings', data),

  confirmMeeting: (meetingId: string) =>
    api.patch<MeetingResponse>(`/api/supervision/meetings/${meetingId}/confirm`),

  recordOutcome: (meetingId: string, attended: boolean, notes?: string) =>
    api.patch<MeetingResponse>(`/api/supervision/meetings/${meetingId}/outcome`, { attended, notes }),

  myMeetings: () => api.get<MeetingResponse[]>('/api/supervision/meetings/me'),

  meetingsByStudent: (studentId: string) =>
    api.get<MeetingResponse[]>(`/api/supervision/meetings/student/${studentId}`),
};
