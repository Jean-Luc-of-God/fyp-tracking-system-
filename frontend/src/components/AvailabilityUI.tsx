import React from 'react';
import { useAppContext } from '../context/AppContext';
import type { Student, GroupSession, Supervisor } from '../types';
import { Icon, Badge, Avatar, EmptyState, SectionTitle } from './SharedUI';
import { fmtFull, supById, SUPERVISORS } from '../utils/fypData';

export const AVAIL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
export const AVAIL_SLOTS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];

// Maps "Mon" → "MONDAY" for the API; backend stores/returns the full day name.
export const DAY_MAP: Record<string, string> = {
  Mon: 'MONDAY', Tue: 'TUESDAY', Wed: 'WEDNESDAY', Thu: 'THURSDAY', Fri: 'FRIDAY',
};

/* ---------------- Weekly Availability Grid Component ---------------- */
interface WeeklyAvailabilityGridProps {
  slots: { [slot: string]: number };
  readOnly?: boolean;
  onToggle?: (slot: string) => void;
}

export const WeeklyAvailabilityGrid: React.FC<WeeklyAvailabilityGridProps> = ({ slots, readOnly, onToggle }) => {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "58px repeat(5,1fr)", gap: 6 }}>
      <div></div>
      {AVAIL_DAYS.map(d => (
        <div key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: "var(--ink-2)", paddingBottom: 4 }}>
          {d}
        </div>
      ))}
      {AVAIL_SLOTS.map(t => (
        <React.Fragment key={t}>
          <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 7 }}>
            {t}
          </div>
          {AVAIL_DAYS.map(d => {
            const k = d + "-" + t;
            const on = !!slots[k];
            if (readOnly) {
              return (
                <div key={k} style={{
                  height: 34,
                  borderRadius: 7,
                  border: "1px solid " + (on ? "var(--amber)" : "var(--line-soft)"),
                  background: on ? "var(--amber)" : "var(--surface)",
                  color: on ? "var(--navy-900)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10.5,
                  fontWeight: 600
                }}>
                  {on ? "Free" : ""}
                </div>
              );
            }
            return (
              <button key={k} onClick={() => onToggle && onToggle(k)} style={{
                height: 38,
                borderRadius: 8,
                border: "1px solid " + (on ? "var(--amber)" : "var(--line)"),
                background: on ? "var(--amber)" : "var(--white)",
                color: on ? "var(--navy-900)" : "var(--ink-4)",
                cursor: "pointer",
                fontSize: 11.5,
                fontWeight: 600,
                transition: "all .1s"
              }}>
                {on ? "Available" : ""}
              </button>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
};

export function defaultAttendance(session: GroupSession, students: Student[]): { [stuId: string]: 'present' | 'absent' | 'late' } {
  const map: { [stuId: string]: 'present' | 'absent' | 'late' } = {};
  students.forEach((s, i) => {
    const h = (s.id.charCodeAt(s.id.length - 1) + session.id.length + i) % 10;
    map[s.id] = h < 7 ? "present" : h < 9 ? "absent" : "late";
  });
  return map;
}

/* ---------------- Group Session Card Component ---------------- */
interface GroupSessionCardProps {
  session: GroupSession;
  viewer: 'supervisor' | 'student' | 'staff' | string;
  students?: Student[];
  studentId?: string;
  onTakeAttendance?: (session: GroupSession) => void;
}

export const GroupSessionCard: React.FC<GroupSessionCardProps> = ({ 
  session, 
  viewer, 
  students = [], 
  studentId, 
  onTakeAttendance 
}) => {
  const past = new Date(session.ts) < new Date();
  const att = session.attendance || (session.attendanceTaken ? defaultAttendance(session, students) : null);
  const present = att ? Object.values(att).filter(status => status === "present").length : 0;
  const total = students ? students.length : 0;
  const mine = studentId && att ? att[studentId] : null;

  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 11, overflow: "hidden", background: "#fff" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 13, padding: "13px 15px" }}>
        <div style={{ 
          width: 46, 
          height: 46, 
          borderRadius: 10, 
          background: past ? "var(--surface-2)" : "var(--navy)", 
          color: past ? "var(--ink-2)" : "#fff", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center", 
          flex: "none" 
        }}>
          <span className="mono" style={{ fontSize: 16, fontWeight: 700, lineHeight: 1 }}>{new Date(session.ts).getDate()}</span>
          <span style={{ fontSize: 9, textTransform: "uppercase" }}>{new Date(session.ts).toLocaleString("en", { month: "short" })}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{session.title}</span>
            {!past && <Badge tone="amber" dot>Upcoming</Badge>}
            <span className="badge badge-grey" style={{ height: 18 }}>All students</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 5, fontSize: 12, color: "var(--ink-3)", flexWrap: "wrap" }}>
            <span className="mono">{fmtFull(session.ts)}</span>
            <span>· {session.durationMin} min</span>
            {session.type === "meet" ? (
              <span style={{ color: "var(--blue)", display: "flex", alignItems: "center", gap: 4 }}>
                <Icon name="link" size={12} /> Google Meet
              </span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Icon name="building" size={12} /> {session.location}
              </span>
            )}
          </div>
          {session.agenda && <div className="muted" style={{ fontSize: 12, marginTop: 7, lineHeight: 1.5 }}>{session.agenda}</div>}

          {/* student viewer */}
          {viewer === "student" && (
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 10 }}>
              {past ? (
                mine ? (
                  <Badge tone={mine === "present" ? "green" : mine === "late" ? "amber" : "red"} dot>
                    You were marked {mine}
                  </Badge>
                ) : (
                  <Badge tone="grey">Attendance pending</Badge>
                )
              ) : (
                session.type === "meet" ? (
                  <a className="btn btn-sm" style={{ background: "#2A6FB5", color: "#fff" }} href={"https://" + session.link} target="_blank" rel="noreferrer">
                    <Icon name="link" size={13} /> Join Meet
                  </a>
                ) : (
                  <span style={{ fontSize: 12, color: "var(--ink-2)" }}>
                    <Icon name="building" size={13} style={{ verticalAlign: -2, marginRight: 4 }} />{session.location}
                  </span>
                )
              )}
            </div>
          )}

          {/* staff/supervisor viewer */}
          {viewer !== "student" && past && att && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
              <Badge tone="green" dot>{present} present</Badge>
              <Badge tone="red" dot>{total - present} absent</Badge>
              {viewer === "supervisor" && (
                <button className="btn btn-ghost btn-sm" onClick={() => onTakeAttendance && onTakeAttendance(session)}>
                  <Icon name="edit" size={13} /> Edit attendance
                </button>
              )}
            </div>
          )}
          {viewer === "supervisor" && past && !att && (
            <button className="btn btn-amber btn-sm" style={{ marginTop: 10 }} onClick={() => onTakeAttendance && onTakeAttendance(session)}>
              <Icon name="check" size={13} /> Take attendance
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------------- Read-only Supervisor Availability Panel ---------------- */
interface SupervisorAvailabilityPanelProps {
  supId: string;
  viewer: string;
  studentId?: string;
  compact?: boolean;
}

export const SupervisorAvailabilityPanel: React.FC<SupervisorAvailabilityPanelProps> = ({ 
  supId, 
  viewer, 
  studentId, 
  compact 
}) => {
  const { availability, groupSessions, students } = useAppContext();
  
  // Since we already import supById at top of file, let's just use it
  const sup = supById[supId];
  if (!sup) return null;

  const avail = availability[supId] || {};
  const slots = { ...avail };
  delete slots.location;

  const sessions = groupSessions.filter(s => s.supervisorId === supId);
  const supStudents = students.filter(s => s.supervisorId === supId);
  const count = Object.values(slots).filter(Boolean).length;

  return (
    <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "minmax(0,360px) 1fr", gap: 16, alignItems: "start" }}>
      <div className="card">
        <div className="card-hd"><h3>Weekly office hours</h3><Badge tone="navy" dot>{count} slots</Badge></div>
        <div className="card-pad">
          <WeeklyAvailabilityGrid slots={slots} readOnly />
          {avail.location && (
            <div style={{ marginTop: 13, display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--ink-2)" }}>
              <Icon name="building" size={14} style={{ color: "var(--ink-3)" }} /> {avail.location}
            </div>
          )}
          <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--ink-2)" }}>
            <Icon name="phone" size={14} style={{ color: "var(--ink-3)" }} /> <span className="mono">{sup.phone}</span>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-hd"><h3>Group sessions</h3><Badge tone="grey">{sessions.length}</Badge></div>
        <div className="card-pad" style={{ display: "grid", gap: 11 }}>
          {sessions.length ? (
            sessions.map(s => (
              <GroupSessionCard key={s.id} session={s} viewer={viewer} students={supStudents} studentId={studentId} />
            ))
          ) : (
            <EmptyState icon="calendar" title="No sessions scheduled" sub="This supervisor hasn't scheduled any group sessions yet." />
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------------- All-Supervisors Availability Directory ---------------- */
interface StaffAvailabilityDirectoryProps {
  title?: string;
  sub?: string;
}

export const StaffAvailabilityDirectory: React.FC<StaffAvailabilityDirectoryProps> = ({ title, sub }) => {
  const { students, availability, groupSessions } = useAppContext();
  
  const [supId, setSupId] = React.useState<string>(SUPERVISORS[0].id);
  const selectedSup = supById[supId];

  return (
    <div>
      <SectionTitle style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        {title || "Supervisor Availability"}
      </SectionTitle>
      
      <p className="muted" style={{ fontSize: 13, margin: '0 0 16px', maxWidth: 600 }}>
        {sub || "See every supervisor's office hours, location and group sessions across the department."}
      </p>

      <div className="resp-stack" style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 18, alignItems: "start" }}>
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "11px 14px", borderBottom: "1px solid var(--line-soft)" }} className="eyebrow">
            All supervisors ({SUPERVISORS.length})
          </div>
          {SUPERVISORS.map((s: Supervisor) => {
            const avail = availability[s.id] || {};
            const slots = { ...avail };
            delete slots.location;
            
            const nSlots = Object.values(slots).filter(Boolean).length;
            const nSessions = groupSessions.filter(gs => gs.supervisorId === s.id).length;
            const nStud = students.filter(st => st.supervisorId === s.id).length;

            return (
              <button 
                key={s.id} 
                onClick={() => setSupId(s.id)} 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 10, 
                  width: "100%", 
                  padding: "11px 13px", 
                  border: 0, 
                  borderTop: "1px solid var(--line-soft)", 
                  background: s.id === supId ? "var(--blue-bg)" : "transparent", 
                  cursor: "pointer", 
                  textAlign: "left" 
                }}
              >
                <Avatar name={s.name} role="Supervisor" size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {s.name}
                  </div>
                  <div className="muted" style={{ fontSize: 10.5 }}>
                    {nStud} students · {nSlots} slots · {nSessions} sessions
                  </div>
                </div>
                {s.id === supId && <Icon name="chevronRight" size={15} style={{ color: "var(--ink-4)" }} />}
              </button>
            );
          })}
        </div>
        
        {selectedSup && (
          <div>
            <div className="card card-pad" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 13 }}>
              <Avatar name={selectedSup.name} role="Supervisor" size={42} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>{selectedSup.full}</div>
                <div className="muted" style={{ fontSize: 12.5 }}>
                  {selectedSup.title} · {students.filter(st => st.supervisorId === supId).length} supervised
                </div>
              </div>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--ink-2)" }}>
                <Icon name="phone" size={14} style={{ color: "var(--ink-3)" }} />
                <span className="mono">{selectedSup.phone}</span>
              </span>
            </div>
            <SupervisorAvailabilityPanel key={supId} supId={supId} viewer="staff" />
          </div>
        )}
      </div>
    </div>
  );
};
