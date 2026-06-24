import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  Student,
  GroupSession,
  NotificationLog,
  AuditLogEntry,
  PendingCoordinationItem,
  WhatsAppGroup,
  Meeting,
  AppState
} from '../types';
import {
  buildMockStudents,
  GROUP_SESSIONS,
  NOTIF_LOG,
  AUDIT_LOG,
  PENDING,
  WA_GROUPS,
  PREDEFENSE_WA,
  AVAILABILITY,
  fmt,
  meetingsFor
} from '../utils/fypData';
import { getToken } from '../api/client';
import { studentsApi } from '../api/students';
import { panelsApi } from '../api/panels';
import { usersApi } from '../api/users';
import { auditApi, notificationsApi } from '../api/logs';
import { INDEX_STATE } from '../api/types';
import { mapStudent, mapSupervisor, mapAuditLog, mapNotificationLog } from '../utils/mappers';
import type { Supervisor } from '../types';

const LOCAL_STORAGE_KEY = 'fyp_tracker_state_v1';

export interface CaseLetterState {
  status: 'none' | 'requested' | 'submitted' | 'approved' | 'rejected';
  requestedTs?: number;
  deadlineTs?: number;
  submittedTs?: number;
  approvedTs?: number;
  rejectedTs?: number;
  batch?: string;
  file?: string;
  rejectionReason?: string;
  requirements?: { name: string; size: string; pages: number };
}

interface AppContextType {
  students: Student[];
  groupSessions: GroupSession[];
  notificationLogs: NotificationLog[];
  auditLogs: AuditLogEntry[];
  pendingItems: PendingCoordinationItem[];
  waGroups: { [supId: string]: WhatsAppGroup[] };
  predefenseWa: { [supId: string]: WhatsAppGroup[] };
  availability: { [supId: string]: { [slot: string]: any } };
  letters: { [stuId: string]: CaseLetterState };
  activeUserRole: 'student' | 'supervisor' | 'facilitator' | 'hod' | 'superadmin';
  activeUserId: string;
  
  // Role switcher
  switchUser: (role: 'student' | 'supervisor' | 'facilitator' | 'hod' | 'superadmin', id: string) => void;
  
  // Timeline/Milestones Transitions
  advanceStudentStage: (studentId: string, targetStageIndex: number, note?: string) => void;
  
  // Case-Letter Actions
  requestCaseLetters: (studentIds: string[], durationDays: number, batchId: string) => void;
  submitCaseLetter: (studentId: string, fileName?: string) => void;
  approveCaseLetter: (studentId: string) => void;
  returnCaseLetter: (studentId: string, reasonHtml: string, resubmitDays: number) => void;
  
  // Supervision & Meetings Actions
  scheduleMeeting: (studentId: string, dateStr: string, type: 'meet' | 'inperson', locationOrLink: string, purpose: string) => void;
  rescheduleMeeting: (studentId: string, meetingId: string, newDateStr: string, reason: string) => void;
  logMeetingAttendance: (studentId: string, meetingId: string, status: string, notes: string) => void;
  signoffBook: (studentId: string) => void;
  
  // Facilitator & HOD Allocations
  assignSupervisor: (studentId: string, supervisorId: string) => void;
  assignExaminer: (studentId: string, examinerId: string, panelType: 'predefense' | 'defense') => void;
  recordPredefenseOutcome: (studentId: string, cleared: boolean) => void;
  recordDefenseOutcome: (studentId: string, outcome: string, panel: string, notes?: string) => void;
  
  // Group Sessions
  addGroupSession: (title: string, dateStr: string, duration: number, type: 'meet' | 'inperson', locationOrLink: string, agenda: string) => void;
  takeGroupAttendance: (sessionId: string, attendanceMap: { [stuId: string]: 'present' | 'absent' | 'late' }) => void;
  
  // Availability Editing
  updateAvailability: (supervisorId: string, slots: { [slot: string]: number }, location: string) => void;
  
  // Helper queries
  getStudentMeetings: (studentId: string) => Meeting[];

  // Data loading
  refreshStudents: () => Promise<void>;
  dataSource: 'mock' | 'api';

  // Real supervisors from API (empty until authenticated)
  supervisors: Supervisor[];
  supervisorById: Record<string, Supervisor>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState & { letters: { [stuId: string]: CaseLetterState } }>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error reading state from localStorage:", e);
      }
    }
    
    // Seed default letters matching prototype store.js
    const DAY = 86400000;
    const now = Date.now();
    const defaultLetters: { [stuId: string]: CaseLetterState } = {
      "STU-2026-041": { status: "requested", requestedTs: now - 1.6 * DAY, deadlineTs: now + 3.4 * DAY, batch: "B-2026-01" },
      "STU-2026-042": { status: "requested", requestedTs: now - 6.8 * DAY, deadlineTs: now + 0.22 * DAY, batch: "B-2026-01" },
      "STU-2026-043": { status: "requested", requestedTs: now - 9 * DAY, deadlineTs: now - 0.5 * DAY, batch: "B-2026-01" },
      "STU-2026-044": { status: "submitted", requestedTs: now - 5 * DAY, deadlineTs: now + 2 * DAY, submittedTs: now - 1.1 * DAY, batch: "B-2026-01", file: "case-letter-rssb.pdf" },
      "STU-2026-045": { status: "submitted", requestedTs: now - 6 * DAY, deadlineTs: now + 1 * DAY, submittedTs: now - 0.4 * DAY, batch: "B-2026-01", file: "case-letter-zipline.pdf" },
    };



    return {
      students: buildMockStudents(),
      groupSessions: GROUP_SESSIONS,
      notificationLogs: NOTIF_LOG,
      auditLogs: AUDIT_LOG,
      pendingItems: PENDING,
      waGroups: WA_GROUPS,
      predefenseWa: PREDEFENSE_WA,
      availability: AVAILABILITY,
      letters: defaultLetters,
      activeUserRole: 'student',
      activeUserId: 'STU-2026-014', // Keza Ihirwe
    };
  });

  const [dataSource, setDataSource] = useState<'mock' | 'api'>('mock');
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);

  // Persist to localStorage (only mock/local state — API data is re-fetched on load)
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Load real students, supervisors, and logs from the API whenever a token is available
  const refreshStudents = useCallback(async () => {
    if (!getToken()) return;
    try {
      const [apiStudents, apiSups, auditPage, failedNotifs] = await Promise.allSettled([
        studentsApi.list(),
        usersApi.byRole('SUPERVISOR'),
        auditApi.list(0, 100),
        notificationsApi.failed(),
      ]);

      const mapped = apiStudents.status === 'fulfilled'
        ? apiStudents.value.map(mapStudent)
        : null;

      if (apiSups.status === 'fulfilled') {
        setSupervisors(apiSups.value.map(mapSupervisor));
      }

      const mappedAudit = auditPage.status === 'fulfilled'
        ? auditPage.value.content.map(mapAuditLog)
        : null;

      const mappedNotifs = failedNotifs.status === 'fulfilled'
        ? failedNotifs.value.map(mapNotificationLog)
        : null;

      if (mapped) {
        setState(prev => ({
          ...prev,
          students: mapped,
          ...(mappedAudit ? { auditLogs: mappedAudit } : {}),
          ...(mappedNotifs ? { notificationLogs: mappedNotifs } : {}),
        }));
        setDataSource('api');
      }
    } catch {
      // Backend unreachable — keep mock data silently
    }
  }, []);

  // Auto-load from API on mount if already authenticated
  useEffect(() => {
    refreshStudents();
  }, [refreshStudents]);

  // Logging helper
  const addAuditLog = (action: string, actor: string, role: string) => {
    const newLog: AuditLogEntry = {
      id: "A-" + Math.floor(1000 + Math.random() * 9000),
      actor,
      role,
      action,
      ts: new Date().toISOString(),
      ip: "196.12.4.99"
    };
    setState(prev => ({
      ...prev,
      auditLogs: [newLog, ...prev.auditLogs]
    }));
  };

  const addNotification = (template: string, to: string, toName: string, toRole: string, studentId: string, note?: string) => {
    const newNotif: NotificationLog = {
      id: "N-" + Math.floor(2000 + Math.random() * 8000),
      template,
      to,
      toName,
      toRole,
      ts: new Date().toISOString(),
      status: 'sent',
      studentId,
      note
    };
    setState(prev => ({
      ...prev,
      notificationLogs: [newNotif, ...prev.notificationLogs]
    }));
  };

  // 1. Role switcher
  const switchUser = (role: 'student' | 'supervisor' | 'facilitator' | 'hod' | 'superadmin', id: string) => {
    setState(prev => ({
      ...prev,
      activeUserRole: role,
      activeUserId: id
    }));
  };

  // 2. Timeline Stage transition
  const advanceStudentStage = async (studentId: string, targetStageIndex: number, note?: string) => {
    const toState = INDEX_STATE[targetStageIndex];
    if (getToken() && toState) {
      try {
        const updated = await studentsApi.transition(studentId, toState, note);
        setState(prev => ({
          ...prev,
          students: prev.students.map(s =>
            s.id === studentId
              ? { ...s, stateIndex: targetStageIndex, enteredStageTs: updated.stateEnteredAt }
              : s
          ),
        }));
        return;
      } catch { /* fall through to local update */ }
    }
    // Local fallback (mock / offline)
    setState(prev => ({
      ...prev,
      students: prev.students.map(s =>
        s.id === studentId
          ? { ...s, stateIndex: targetStageIndex, enteredStageTs: new Date().toISOString() }
          : s
      ),
    }));
    const student = state.students.find(s => s.id === studentId);
    if (student) addAuditLog(`Transitioned ${student.name} to index ${targetStageIndex}`, state.activeUserId, state.activeUserRole.toUpperCase());
  };

  // 3. Request Case Study Letters (HOD)
  const requestCaseLetters = (studentIds: string[], durationDays: number, batchId: string) => {
    const durationMs = durationDays * 24 * 60 * 60 * 1000;
    const dl = Date.now() + durationMs;
    
    setState(prev => {
      const updatedLetters = { ...prev.letters };
      studentIds.forEach(id => {
        const prevL = updatedLetters[id] || {};
        updatedLetters[id] = {
          ...prevL,
          status: "requested",
          requestedTs: Date.now(),
          deadlineTs: dl,
          batch: batchId || "B-2026-01"
        };
      });
      return {
        ...prev,
        letters: updatedLetters
      };
    });

    studentIds.forEach(id => {
      const student = state.students.find(s => s.id === id);
      if (student) {
        addAuditLog(`Requested case-study letter for ${student.name}`, "Dr. Bizimungu", "HOD");
        addNotification("case-requested", student.email, student.name, "Student", id);
      }
    });
  };

  // 4. Student Submits Case Study Letter
  const submitCaseLetter = (studentId: string, fileName: string = "case-letter.pdf") => {
    setState(prev => {
      const l = prev.letters[studentId] || {};
      const updatedLetters = {
        ...prev.letters,
        [studentId]: {
          ...l,
          status: "submitted" as const,
          submittedTs: Date.now(),
          file: fileName
        }
      };

      const updatedStudents = prev.students.map(s => {
        if (s.id === studentId && s.stateIndex === 0) {
          return { ...s, stateIndex: 1, enteredStageTs: new Date().toISOString() };
        }
        return s;
      });

      return {
        ...prev,
        letters: updatedLetters,
        students: updatedStudents
      };
    });

    const student = state.students.find(s => s.id === studentId);
    if (student) {
      addAuditLog(`Student ${student.name} submitted case-study letter`, studentId, "STUDENT");
    }
  };

  // 5. HOD Approves Case Study Letter
  const approveCaseLetter = async (studentId: string) => {
    if (getToken()) {
      try {
        const updated = await studentsApi.transition(studentId, 'CASE_LETTER_APPROVED');
        setState(prev => ({
          ...prev,
          letters: {
            ...prev.letters,
            [studentId]: {
              ...(prev.letters[studentId] || {}),
              status: 'approved' as const,
              approvedTs: Date.now(),
              requirements: { name: "fyp-requirements-class-2026.docx", size: "46 KB", pages: 3 },
              rejectionReason: undefined,
            }
          },
          students: prev.students.map(s =>
            s.id === studentId ? { ...s, stateIndex: 2, enteredStageTs: updated.stateEnteredAt } : s
          ),
        }));
        return;
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Failed to approve case letter');
        return;
      }
    }
    // Local fallback (unauthenticated)
    setState(prev => {
      const l = prev.letters[studentId] || {};
      const updatedLetters = {
        ...prev.letters,
        [studentId]: {
          ...l,
          status: "approved" as const,
          approvedTs: Date.now(),
          requirements: { name: "fyp-requirements-class-2026.docx", size: "46 KB", pages: 3 },
          rejectionReason: undefined
        }
      };
      const updatedStudents = prev.students.map(s => {
        if (s.id === studentId && s.stateIndex === 1) {
          return { ...s, stateIndex: 2, enteredStageTs: new Date().toISOString() };
        }
        return s;
      });
      return { ...prev, letters: updatedLetters, students: updatedStudents };
    });
    const student = state.students.find(s => s.id === studentId);
    if (student) {
      addAuditLog(`Approved case-study letter for ${student.name}`, "Dr. Bizimungu", "HOD");
      addNotification("case-approved", student.email, student.name, "Student", studentId);
    }
  };

  // 6. HOD Rejects / Returns Case Study Letter
  const returnCaseLetter = async (studentId: string, reasonHtml: string, _resubmitDays: number) => {
    try {
      const plainReason = reasonHtml.replace(/<[^>]*>/g, '').trim();
      const updated = await studentsApi.rejectCaseLetter(studentId, plainReason);
      setState(prev => ({
        ...prev,
        students: prev.students.map(s => s.id === studentId ? mapStudent(updated) : s),
      }));
    } catch (e) {
      console.error('returnCaseLetter failed', e);
    }
  };

  // 7. Schedule supervision meeting (Supervisor)
  const scheduleMeeting = (studentId: string, dateStr: string, type: 'meet' | 'inperson', locationOrLink: string, purpose: string) => {
    // Add meeting record locally
    const meetingKey = `fyp_meetings_${studentId}`;
    const savedMeetings = localStorage.getItem(meetingKey);
    let meetingsList: Meeting[] = savedMeetings ? JSON.parse(savedMeetings) : meetingsFor(state.students.find(s => s.id === studentId)!);
    
    const newMeeting: Meeting = {
      id: "m-" + Math.floor(100 + Math.random() * 900),
      ts: dateStr,
      setTs: new Date().toISOString(),
      confirmed: false,
      logged: false,
      topic: purpose,
      attendance: "—",
      type,
      location: locationOrLink,
      notes: ""
    };

    meetingsList.push(newMeeting);
    localStorage.setItem(meetingKey, JSON.stringify(meetingsList));

    // Update nextMeeting property on student
    setState(prev => {
      const updatedStudents = prev.students.map(s => {
        if (s.id === studentId) {
          return {
            ...s,
            nextMeeting: { ts: dateStr, confirmed: false }
          };
        }
        return s;
      });
      return {
        ...prev,
        students: updatedStudents
      };
    });

    const student = state.students.find(s => s.id === studentId);
    if (student) {
      addAuditLog(`Scheduled meeting with ${student.name} on ${fmt(dateStr)}`, state.activeUserId, "SUPERVISOR");
    }
  };

  // 8. Reschedule meeting (with strict 30-min block window)
  const rescheduleMeeting = (studentId: string, meetingId: string, newDateStr: string, reason: string) => {
    const meetingKey = `fyp_meetings_${studentId}`;
    const savedMeetings = localStorage.getItem(meetingKey);
    let meetingsList: Meeting[] = savedMeetings ? JSON.parse(savedMeetings) : meetingsFor(state.students.find(s => s.id === studentId)!);

    const meetingIndex = meetingsList.findIndex(m => m.id === meetingId);
    if (meetingIndex > -1) {
      const meeting = meetingsList[meetingIndex];
      const scheduledTime = new Date(meeting.ts).getTime();
      const timeDiffMins = (scheduledTime - Date.now()) / (60 * 1000);
      
      if (timeDiffMins <= 30) {
        alert("Action blocked: Meetings cannot be rescheduled within 30 minutes of the starting time.");
        return;
      }

      meeting.ts = newDateStr;
      meeting.notes = (meeting.notes || "") + `\n[Rescheduled: ${reason}]`;
      meeting.confirmed = false;
      meetingsList[meetingIndex] = meeting;
      localStorage.setItem(meetingKey, JSON.stringify(meetingsList));

      // Update nextMeeting if it was this one
      setState(prev => {
        const updatedStudents = prev.students.map(s => {
          if (s.id === studentId && s.nextMeeting && s.nextMeeting.ts === meeting.ts) {
            return {
              ...s,
              nextMeeting: { ts: newDateStr, confirmed: false }
            };
          }
          return s;
        });
        return {
          ...prev,
          students: updatedStudents
        };
      });

      const student = state.students.find(s => s.id === studentId);
      if (student) {
        addAuditLog(`Rescheduled meeting with ${student.name} to ${fmt(newDateStr)}`, state.activeUserId, "SUPERVISOR");
        addNotification("sup-assigned", student.email, student.name, "Student", studentId, `Rescheduled to ${fmt(newDateStr)}: ${reason}`);
      }
    }
  };

  // 9. Log supervision meeting attendance (Supervisor)
  const logMeetingAttendance = (studentId: string, meetingId: string, attendanceStatus: string, notes: string) => {
    const meetingKey = `fyp_meetings_${studentId}`;
    const savedMeetings = localStorage.getItem(meetingKey);
    let meetingsList: Meeting[] = savedMeetings ? JSON.parse(savedMeetings) : meetingsFor(state.students.find(s => s.id === studentId)!);

    const meetingIndex = meetingsList.findIndex(m => m.id === meetingId);
    if (meetingIndex > -1) {
      meetingsList[meetingIndex] = {
        ...meetingsList[meetingIndex],
        attendance: attendanceStatus,
        notes,
        logged: true,
        confirmed: true
      };
      localStorage.setItem(meetingKey, JSON.stringify(meetingsList));
      
      // Clear nextMeeting since it's now completed
      setState(prev => {
        const updatedStudents = prev.students.map(s => {
          if (s.id === studentId) {
            return {
              ...s,
              nextMeeting: null
            };
          }
          return s;
        });
        return {
          ...prev,
          students: updatedStudents
        };
      });

      const student = state.students.find(s => s.id === studentId);
      if (student) {
        addAuditLog(`Logged attendance (${attendanceStatus}) for meeting with ${student.name}`, state.activeUserId, "SUPERVISOR");
      }
    }
  };

  // 10. Book sign-off (pre-defense submission)
  const signoffBook = async (studentId: string) => {
    if (getToken()) {
      try {
        const updated = await studentsApi.signOffBook(studentId);
        setState(prev => ({
          ...prev,
          students: prev.students.map(s =>
            s.id === studentId
              ? { ...s, bookSignedOff: true, stateIndex: 8, enteredStageTs: updated.stateEnteredAt }
              : s
          ),
        }));
        return;
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Sign-off failed');
        return;
      }
    }
    // Local fallback
    const meetingKey = `fyp_meetings_${studentId}`;
    const savedMeetings = localStorage.getItem(meetingKey);
    const meetingsList: Meeting[] = savedMeetings ? JSON.parse(savedMeetings) : meetingsFor(state.students.find(s => s.id === studentId)!);
    if (!meetingsList.some(m => m.logged && m.attendance === "Present")) {
      alert("Validation Error: Cannot sign off on final book. The student must have at least one successfully logged supervisor meeting.");
      return;
    }
    setState(prev => ({
      ...prev,
      students: prev.students.map(s =>
        s.id === studentId ? { ...s, bookSignedOff: true, stateIndex: 8, enteredStageTs: new Date().toISOString() } : s
      ),
    }));
    const student = state.students.find(s => s.id === studentId);
    if (student) {
      addAuditLog(`Signed off final year book for ${student.name}`, state.activeUserId, "SUPERVISOR");
      addNotification("reached-predefense", student.email, student.name, "Student", studentId);
    }
  };

  // 11. Assign supervisor (HOD)
  const assignSupervisor = async (studentId: string, supervisorId: string) => {
    if (getToken()) {
      try {
        const updated = await studentsApi.assignSupervisor(studentId, supervisorId);
        setState(prev => ({
          ...prev,
          students: prev.students.map(s =>
            s.id === studentId
              ? { ...s, supervisorId: updated.supervisorId, stateIndex: 7, enteredStageTs: updated.stateEnteredAt }
              : s
          ),
        }));
        return;
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Assign supervisor failed');
        return;
      }
    }
    // Local fallback
    setState(prev => ({
      ...prev,
      students: prev.students.map(s =>
        s.id === studentId ? { ...s, supervisorId, stateIndex: 7, enteredStageTs: new Date().toISOString() } : s
      ),
    }));
    const student = state.students.find(s => s.id === studentId);
    if (student) addAuditLog(`Assigned supervisor to ${student.name}`, state.activeUserId, "HOD");
  };

  // 12. Assign examiner (Facilitator)
  const assignExaminer = async (studentId: string, examinerId: string, panelType: 'predefense' | 'defense') => {
    const student = state.students.find(s => s.id === studentId);
    if (student && student.supervisorId === examinerId) {
      alert("Conflict of Interest Blocked: A student's supervisor cannot be assigned as their examiner.");
      return;
    }

    if (getToken()) {
      try {
        const backendType = panelType === 'predefense' ? 'PRE_DEFENSE' : 'DEFENSE';
        await panelsApi.assign(studentId, examinerId, backendType);
        setState(prev => ({
          ...prev,
          students: prev.students.map(s => {
            if (s.id !== studentId) return s;
            return panelType === 'predefense'
              ? { ...s, examinerPreId: examinerId, predefenseStatus: 'Scheduled' as const }
              : { ...s, examinerDefId: examinerId };
          }),
        }));
        return;
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Assign examiner failed');
        return;
      }
    }
    // Local fallback
    setState(prev => ({
      ...prev,
      students: prev.students.map(s => {
        if (s.id !== studentId) return s;
        return panelType === 'predefense'
          ? { ...s, examinerPreId: examinerId, predefenseStatus: 'Scheduled' as const, stateIndex: 9, enteredStageTs: new Date().toISOString() }
          : { ...s, examinerDefId: examinerId };
      }),
    }));
    if (student) addAuditLog(`Assigned examiner to ${student.name} for ${panelType}`, state.activeUserId, "FACILITATOR");
  };

  // 13. Record pre-defense outcome (Examiner)
  const recordPredefenseOutcome = (studentId: string, cleared: boolean) => {
    setState(prev => {
      const updatedStudents = prev.students.map(s => {
        if (s.id === studentId) {
          return {
            ...s,
            predefenseStatus: cleared ? ('Cleared to defend' as const) : null,
            stateIndex: cleared ? 10 : 9,
            enteredStageTs: new Date().toISOString()
          };
        }
        return s;
      });
      return {
        ...prev,
        students: updatedStudents
      };
    });

    const student = state.students.find(s => s.id === studentId);
    if (student) {
      addAuditLog(`Recorded pre-defense outcome (Cleared = ${cleared}) for ${student.name}`, state.activeUserId, "EXAMINER");
    }
  };

  // 14. Record defense outcome (Examiner Panel)
  const recordDefenseOutcome = (studentId: string, outcome: string, panel: string, notes: string = "") => {
    setState(prev => {
      const updatedStudents = prev.students.map(s => {
        if (s.id === studentId) {
          return {
            ...s,
            defense: {
              outcome,
              panel,
              ts: new Date().toISOString()
            },
            note: notes || s.note
          };
        }
        return s;
      });
      return {
        ...prev,
        students: updatedStudents
      };
    });

    const student = state.students.find(s => s.id === studentId);
    if (student) {
      addAuditLog(`Recorded final defense outcome (${outcome}) for ${student.name}`, state.activeUserId, "EXAMINER");
      addNotification("defense-result", student.email, student.name, "Student", studentId);
    }
  };

  // 15. Create group session (Supervisor)
  const addGroupSession = (title: string, dateStr: string, duration: number, type: 'meet' | 'inperson', locationOrLink: string, agenda: string) => {
    const newSession: GroupSession = {
      id: "gs-" + Math.floor(100 + Math.random() * 900),
      supervisorId: state.activeUserId,
      title,
      ts: dateStr,
      durationMin: duration,
      type,
      location: type === 'inperson' ? locationOrLink : undefined,
      link: type === 'meet' ? locationOrLink : undefined,
      agenda,
      attendanceTaken: false
    };

    setState(prev => ({
      ...prev,
      groupSessions: [...prev.groupSessions, newSession]
    }));

    addAuditLog(`Created group session: "${title}"`, state.activeUserId, "SUPERVISOR");
  };

  // 16. Record group session attendance
  const takeGroupAttendance = (sessionId: string, attendanceMap: { [stuId: string]: 'present' | 'absent' | 'late' }) => {
    setState(prev => {
      const updatedSessions = prev.groupSessions.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            attendanceTaken: true,
            attendance: attendanceMap
          };
        }
        return s;
      });
      return {
        ...prev,
        groupSessions: updatedSessions
      };
    });

    addAuditLog(`Recorded attendance for group session ${sessionId}`, state.activeUserId, "SUPERVISOR");
  };

  // 17. Update availability slots and location
  const updateAvailability = (supervisorId: string, slots: { [slot: string]: number }, location: string) => {
    setState(prev => {
      const updatedAvail = {
        ...prev.availability,
        [supervisorId]: {
          ...slots,
          location
        }
      };
      return {
        ...prev,
        availability: updatedAvail
      };
    });

    addAuditLog(`Updated weekly office hours and office location`, supervisorId, "SUPERVISOR");
  };

  // 18. Helper to query student specific meetings
  const getStudentMeetings = (studentId: string): Meeting[] => {
    const meetingKey = `fyp_meetings_${studentId}`;
    const saved = localStorage.getItem(meetingKey);
    if (saved) return JSON.parse(saved);
    
    // Default mock meetings from fypData
    const student = state.students.find(s => s.id === studentId);
    if (student) {
      return meetingsFor(student);
    }
    return [];
  };

  return (
    <AppContext.Provider value={{
      students: state.students,
      groupSessions: state.groupSessions,
      notificationLogs: state.notificationLogs,
      auditLogs: state.auditLogs,
      pendingItems: state.pendingItems,
      waGroups: state.waGroups,
      predefenseWa: state.predefenseWa,
      availability: state.availability,
      letters: state.letters,
      activeUserRole: state.activeUserRole,
      activeUserId: state.activeUserId,
      switchUser,
      advanceStudentStage,
      requestCaseLetters,
      submitCaseLetter,
      approveCaseLetter,
      returnCaseLetter,
      scheduleMeeting,
      rescheduleMeeting,
      logMeetingAttendance,
      signoffBook,
      assignSupervisor,
      assignExaminer,
      recordPredefenseOutcome,
      recordDefenseOutcome,
      addGroupSession,
      takeGroupAttendance,
      updateAvailability,
      getStudentMeetings,
      refreshStudents,
      dataSource,
      supervisors,
      supervisorById: Object.fromEntries(supervisors.map(s => [s.id, s])),
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
