// Backend API response types — mirrors the Java DTOs exactly

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  fullName: string;
  role: 'STUDENT' | 'SUPERVISOR' | 'FACILITATOR' | 'HOD' | 'EXAMINER' | 'SUPERADMIN';
}

export interface StudentResponse {
  id: string;
  userId: string;
  regNumber: string;
  fullName: string;
  email: string;
  phone: string | null;
  organisation: string | null;
  projectTopic: string | null;
  groupLabel: string | null;
  state: StudentState;
  stateEnteredAt: string;
  supervisorId: string | null;
  supervisorName: string | null;
  supervisorEmail: string | null;
  supervisorPhone: string | null;
  bookSignedOff: boolean;
  bookSignedOffAt: string | null;
  protoAttempts: number;
  defenseAttempts: number;
  proposalLocked: boolean;
  flagged: boolean;
  note: string | null;
  letterRejectionReason: string | null;
  letterFileName: string | null;
  requirementsFileName: string | null;
}

export type StudentState =
  | 'REGISTERED'
  | 'CASE_LETTER_SUBMITTED'
  | 'CASE_LETTER_APPROVED'
  | 'PROTOTYPE_REVIEW'
  | 'PROTOTYPE_GRANTED'
  | 'PROPOSAL_UNDER_REVIEW'
  | 'PROPOSAL_ACCEPTED'
  | 'SUPERVISION'
  | 'BOOK_SUBMITTED'
  | 'PRE_DEFENSE'
  | 'DEFENSE'
  | 'COMPLETED'
  | 'WITHDRAWN';

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  enabled: boolean;
  eligibleExaminer: boolean;
}

export interface ProposalAttemptResponse {
  id: string;
  studentId: string;
  attemptNumber: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  rejectionReason: string | null;
  reviewedBy: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  proposalFileName: string | null;
}

export interface PanelAssignmentResponse {
  id: string;
  studentId: string;
  examinerId: string;
  examinerName: string;
  panelType: 'PRE_DEFENSE' | 'DEFENSE';
  scheduledAt: string | null;
  attemptNumber: number;
  outcome: 'CLEARED' | 'PASSED' | 'REFERRED' | 'FAILED' | null;
  outcomeNote: string | null;
  outcomeRecordedAt: string | null;
  assignedByName: string;
  assignedAt: string;
}

export interface AuditLogResponse {
  id: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  detail: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface NotificationLogResponse {
  id: string;
  templateKey: string;
  recipientId: string;
  recipientEmail: string;
  studentId: string | null;
  subject: string | null;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'RETRIED';
  errorMessage: string | null;
  retryCount: number;
  sentAt: string | null;
  createdAt: string;
}

export interface AvailabilitySlotResponse {
  id: string;
  supervisorId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  location: string | null;
  active: boolean;
}

export interface MeetingResponse {
  id: string;
  studentId: string;
  supervisorId: string;
  scheduledAt: string;
  confirmed: boolean;
  confirmedAt: string | null;
  attended: boolean | null;
  topic: string | null;
  notes: string | null;
  meetingType: string;
  location: string | null;
  meetLink: string | null;
}

// State → index mapping (used to bridge backend strings to frontend numeric stages)
export const STATE_INDEX: Record<StudentState, number> = {
  REGISTERED:            0,
  CASE_LETTER_SUBMITTED: 1,
  CASE_LETTER_APPROVED:  2,
  PROTOTYPE_REVIEW:      3,
  PROTOTYPE_GRANTED:     4,
  PROPOSAL_UNDER_REVIEW: 5,
  PROPOSAL_ACCEPTED:     6,
  SUPERVISION:           7,
  BOOK_SUBMITTED:        8,
  PRE_DEFENSE:           9,
  DEFENSE:               10,
  COMPLETED:             11,
  WITHDRAWN:             12,
};

export const INDEX_STATE: Record<number, StudentState> = Object.fromEntries(
  Object.entries(STATE_INDEX).map(([k, v]) => [v, k as StudentState])
) as Record<number, StudentState>;
