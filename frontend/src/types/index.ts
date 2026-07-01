export interface MilestoneState {
  i: number;
  key: string;
  label: string;
  short: string;
  color: string;
  external?: boolean;
  focus?: boolean;
  terminal?: boolean;
}

export interface Supervisor {
  id: string;
  name: string;
  full: string;
  email: string;
  phone: string;
  title: string;
  examiner: boolean;
}

export interface Facilitator {
  id: string;
  name: string;
  full: string;
  email: string;
  phone: string;
  title: string;
}

export interface HOD {
  id: string;
  name: string;
  full: string;
  email: string;
  phone: string;
  title: string;
  examiner: boolean;
}

export interface Superadmin {
  id: string;
  name: string;
  full: string;
  email: string;
  phone: string;
  title: string;
}

export interface WhatsAppGroup {
  id: string;
  team: string;
  link: string;
}

export interface Meeting {
  id: string;
  ts: string;
  setTs: string;
  confirmed: boolean;
  logged: boolean;
  topic: string;
  attendance: string;
  notes: string;
  type?: 'meet' | 'inperson';
  location?: string;
}

export interface GroupSession {
  id: string;
  supervisorId: string;
  title: string;
  ts: string;
  durationMin: number;
  type: 'meet' | 'inperson';
  location?: string;
  link?: string;
  agenda: string;
  attendanceTaken: boolean;
  attendance?: { [studentId: string]: 'present' | 'absent' | 'late' };
}

export interface ProposalAttempt {
  n: number;
  ts: string;
  status: 'pending' | 'accepted' | 'rejected';
  reason?: string;
}

export interface StudentDefense {
  outcome: string;
  panel: string;
  ts: string;
}

export interface Student {
  id: string;
  userId: string;
  reg: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  group: string;
  org: string;
  topic: string;
  stateIndex: number;
  supervisorId: string | null;
  supervisorName: string | null;
  supervisorEmail: string | null;
  supervisorPhone: string | null;
  examinerPreId: string | null;
  examinerDefId: string | null;
  protoPres: number;
  attempts: ProposalAttempt[];
  nextMeeting: { ts: string; confirmed: boolean } | null;
  bookSignedOff: boolean;
  proposalLocked: boolean;
  flagged: boolean;
  defense: StudentDefense | null;
  predefenseStatus: 'Scheduled' | 'Cleared to defend' | null;
  enteredStageTs: string;
  bookRegisteredTs: string;
  note: string | null;
  letterRejectionReason: string | null;
  letterFileName: string | null;
}

export interface NotificationLog {
  id: string;
  template: string;
  to: string;
  toName: string;
  toRole: string;
  ts: string;
  status: 'sent' | 'failed' | 'retried';
  studentId: string;
  error?: string;
  note?: string;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  role: string;
  action: string;
  ts: string;
  ip: string;
}

export interface PendingCoordinationItem {
  id: string;
  kind: 'assign-examiner' | 'email' | 'assign-supervisor' | 'stalled';
  label: string;
  student: string;
  detail: string;
  age: string;
  sev: 'high' | 'med' | 'low';
}

export interface AppState {
  students: Student[];
  groupSessions: GroupSession[];
  notificationLogs: NotificationLog[];
  auditLogs: AuditLogEntry[];
  pendingItems: PendingCoordinationItem[];
  waGroups: { [supervisorId: string]: WhatsAppGroup[] };
  predefenseWa: { [supervisorId: string]: WhatsAppGroup[] };
  availability: { [supervisorId: string]: { [slot: string]: any } };
  activeUserRole: 'student' | 'supervisor' | 'facilitator' | 'hod' | 'superadmin';
  activeUserId: string;
}
