import type { Student, Supervisor, ProposalAttempt, Meeting, AuditLogEntry, NotificationLog } from '../types';
import type {
  StudentResponse,
  UserResponse,
  ProposalAttemptResponse,
  MeetingResponse,
  AuditLogResponse,
  NotificationLogResponse,
} from '../api/types';
import { STATE_INDEX } from '../api/types';

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// Derive a short display name ("Dr. Habimana", "Ms. Uwimana") from a full name
function shortName(full: string): string {
  const parts = full.trim().split(' ');
  if (parts.length <= 2) return full;
  // Keep title (Dr./Ms./Mr.) + last name
  const hasTitle = /^(Dr\.|Ms\.|Mr\.|Prof\.)$/i.test(parts[0]);
  return hasTitle ? `${parts[0]} ${parts[parts.length - 1]}` : parts[parts.length - 1];
}

export function mapStudent(s: StudentResponse): Student {
  const stateIndex = STATE_INDEX[s.state] ?? 0;

  // Approximate bookRegisteredTs from stateEnteredAt (backend doesn't track this separately)
  const bookRegisteredTs = s.stateEnteredAt ?? new Date().toISOString();

  return {
    id: s.id,
    userId: s.userId,
    reg: s.regNumber,
    name: s.fullName,
    initials: initials(s.fullName),
    email: s.email,
    phone: s.phone ?? '',
    group: s.groupLabel ? `Group ${s.groupLabel}` : '',
    org: s.organisation ?? '',
    topic: s.projectTopic ?? '',
    stateIndex,
    supervisorId: s.supervisorId ?? null,
    supervisorName: s.supervisorName ?? null,
    supervisorEmail: s.supervisorEmail ?? null,
    supervisorPhone: s.supervisorPhone ?? null,
    examinerPreId: null,   // loaded lazily via panels API
    examinerDefId: null,   // loaded lazily via panels API
    protoPres: s.protoAttempts,
    attempts: [],           // loaded lazily via proposals API
    nextMeeting: null,      // loaded lazily via meetings API
    bookSignedOff: s.bookSignedOff,
    proposalLocked: s.proposalLocked,
    flagged: s.flagged,
    defense: null,          // derived from panel outcomes
    predefenseStatus: stateIndex >= 9 ? 'Scheduled' : null,
    enteredStageTs: s.stateEnteredAt,
    bookRegisteredTs,
    note: s.note,
  };
}

export function mapSupervisor(u: UserResponse): Supervisor {
  return {
    id: u.id,
    name: shortName(u.fullName),
    full: u.fullName,
    email: u.email,
    phone: u.phone ?? '',
    title: u.role === 'HOD' ? 'Head of Department' : 'Lecturer',
    examiner: u.eligibleExaminer,
  };
}

export function mapProposalAttempt(a: ProposalAttemptResponse): ProposalAttempt {
  return {
    n: a.attemptNumber,
    ts: a.submittedAt,
    status: a.status.toLowerCase() as 'pending' | 'accepted' | 'rejected',
    reason: a.rejectionReason ?? undefined,
  };
}

export function mapMeeting(m: MeetingResponse): Meeting {
  return {
    id: m.id,
    ts: m.scheduledAt,
    setTs: m.scheduledAt,
    confirmed: m.confirmed,
    logged: m.attended !== null,
    topic: m.topic ?? '',
    attendance: m.attended === true ? 'Present' : m.attended === false ? 'Absent' : '—',
    notes: m.notes ?? '',
    type: m.meetingType === 'ONLINE' ? 'meet' : 'inperson',
    location: m.location ?? undefined,
  };
}

export function mapAuditLog(a: AuditLogResponse): AuditLogEntry {
  return {
    id: a.id,
    actor: a.actorEmail,
    role: a.actorRole,
    action: a.detail ? `${a.action} — ${a.detail}` : a.action,
    ts: a.createdAt,
    ip: a.ipAddress ?? '',
  };
}

export function mapNotificationLog(n: NotificationLogResponse): NotificationLog {
  return {
    id: n.id,
    template: n.templateKey,
    to: n.recipientEmail,
    toName: n.recipientEmail,
    toRole: '',
    ts: n.createdAt,
    status: n.status.toLowerCase() as 'sent' | 'failed' | 'retried',
    studentId: n.studentId ?? '',
    error: n.errorMessage ?? undefined,
    note: n.subject ?? undefined,
  };
}
