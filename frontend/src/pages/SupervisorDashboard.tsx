import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Student, GroupSession, Meeting } from '../types';
import {
  Icon,
  Badge,
  Avatar,
  StateBadge,
  EmptyState,
  SectionTitle,
  WhatsAppButton,
  Modal
} from '../components/SharedUI';
import { useNow } from '../components/LetterUI';
import { Timeline } from '../components/Timeline';
import {
  WeeklyAvailabilityGrid,
  GroupSessionCard,
  defaultAttendance
} from '../components/AvailabilityUI';
import {
  fmt,
  fmtT,
  fmtFull,
  supById
} from '../utils/fypData';
import { notify } from '../components/LetterUI';
import { supervisionApi } from '../api/supervision';
import { mapMeeting } from '../utils/mappers';
import { getToken } from '../api/client';
import { usersApi } from '../api/users';

interface SupervisorDashboardProps {
  onOpen: (page: string, id: string) => void;
  onNav: (view: string) => void;
}

const toneColor: { [key: string]: string } = { 
  amber: "var(--amber-deep)", 
  red: "var(--red)", 
  blue: "var(--blue)", 
  violet: "var(--violet)" 
};

/* ---------------- As Role Metrics Card Component ---------------- */
interface RoleCardProps {
  tag: string;
  color: string;
  items: { label: string; n: number; sub: string }[];
}

const RoleCard: React.FC<RoleCardProps> = ({ tag, color, items }) => (
  <div className="card" style={{ overflow: "hidden" }}>
    <div className="card-hd">
      <h3>
        <span style={{ display: "inline-flex", width: 8, height: 8, borderRadius: "50%", background: color, marginRight: 8, verticalAlign: "middle" }} />
        {tag}
      </h3>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
      {items.map((it, i) => (
        <div key={i} style={{ padding: "14px 16px", borderLeft: i ? "1px solid var(--line-soft)" : 0 }}>
          <div className="eyebrow" style={{ marginBottom: 7 }}>{it.label}</div>
          <div className="num" style={{ fontSize: 24, fontWeight: 600, color: it.n ? "var(--ink)" : "var(--ink-4)" }}>{it.n}</div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{it.sub}</div>
        </div>
      ))}
    </div>
  </div>
);

/* ---------------- SupDashboard Component ---------------- */
export const SupDashboard: React.FC<SupervisorDashboardProps> = ({ onOpen, onNav }) => {
  const { students, activeUserId } = useAppContext();
  const SUP_ID = activeUserId || "sup-hab";

  const mine = students.filter(s => s.supervisorId === SUP_ID);
  
  // Examinees are students where supervisor is predefense/defense examiner
  const examinees = students.filter(s => s.examinerPreId === SUP_ID || s.examinerDefId === SUP_ID);

  const toConfirm = mine.filter(s => s.nextMeeting && !s.nextMeeting.confirmed);
  const toSignOff = mine.filter(s => s.stateIndex === 7);
  const flagged = mine.filter(s => s.flagged);
  
  const preToMark = examinees.filter(s => s.stateIndex === 9 && s.predefenseStatus !== "Cleared to defend");
  const defToRecord = examinees.filter(s => s.predefenseStatus === "Cleared to defend" && s.stateIndex === 9);

  // unified action queue
  const actions: any[] = [];
  
  toConfirm.forEach(s => actions.push({ 
    role: "Supervisor", 
    icon: "calendar", 
    tone: "amber", 
    label: "Confirm a meeting time", 
    who: s.name, 
    sub: s.id + " · " + s.topic, 
    cta: "Confirm", 
    page: "supervision", 
    id: s.id 
  }));
  
  flagged.forEach(s => actions.push({ 
    role: "Supervisor", 
    icon: "flag", 
    tone: "red", 
    label: "Complaint on file — review the record", 
    who: s.name, 
    sub: s.id, 
    cta: "Open", 
    page: "supervision", 
    id: s.id 
  }));
  
  toSignOff.forEach(s => actions.push({ 
    role: "Supervisor", 
    icon: "checkCircle", 
    tone: "blue", 
    label: "Book ready to sign off", 
    who: s.name, 
    sub: s.id + " · advances to pre-defense", 
    cta: "Review", 
    page: "supervision", 
    id: s.id 
  }));
  
  preToMark.forEach(s => actions.push({ 
    role: "Examiner", 
    icon: "scale", 
    tone: "violet", 
    label: "Pre-defense to conduct & mark", 
    who: s.name, 
    sub: s.id + " · clear to defend", 
    cta: "Open", 
    page: "examining", 
    id: s.id 
  }));

  const sup = supById[SUP_ID] || { full: SUP_ID, name: SUP_ID };

  return (
    <div>
      <SectionTitle 
        sub={(sup.full || sup.name) + " · Supervisor & Examiner — your supervision and examining duties in one place."} 
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <Badge tone="navy" dot>{mine.length} supervised</Badge>
            <Badge tone="violet" dot>{examinees.length} to examine</Badge>
          </div>
        }
      >
        Dashboard
      </SectionTitle>

      {/* ACTION REQUIRED */}
      <div className="card" style={{ overflow: "hidden", marginBottom: 18, borderColor: actions.length ? "var(--amber)" : "var(--line)" }}>
        <div className="card-hd" style={{ background: actions.length ? "var(--amber-bg)" : "var(--white)" }}>
          <h3><Icon name="alert" size={16} style={{ verticalAlign: -3, marginRight: 7, color: "var(--amber-deep)" }} />Action required</h3>
          <Badge tone={actions.length ? "amber" : "green"} dot>{actions.length || "All clear"}</Badge>
        </div>
        {actions.length ? actions.map((a, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 18px", borderTop: i ? "1px solid var(--line-soft)" : 0 }}>
            <span style={{ width: 34, height: 34, borderRadius: 9, background: toneColor[a.tone] + "1a", color: toneColor[a.tone], display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <Icon name={a.icon} size={16} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{a.label}</span>
                <Badge tone={a.role === "Examiner" ? "violet" : "navy"} style={{ height: 17, fontSize: 9.5 }}>{a.role}</Badge>
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 1 }}><strong style={{ color: "var(--ink-2)" }}>{a.who}</strong> · {a.sub}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => onOpen(a.page, a.id)}>{a.cta} <Icon name="arrowRight" size={13} /></button>
          </div>
        )) : <div className="card-pad muted" style={{ fontSize: 13 }}>Nothing needs your attention right now.</div>}
      </div>

      {/* role summaries */}
      <div className="resp-stack" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        <RoleCard tag="As Supervisor" color="var(--navy)" items={[
          { label: "Supervised", n: mine.length, sub: "Class of 2026" },
          { label: "Awaiting confirm", n: toConfirm.length, sub: "meeting times" },
          { label: "Ready to sign off", n: toSignOff.length, sub: "book → pre-defense" },
        ]} />
        <RoleCard tag="As Examiner" color="var(--violet)" items={[
          { label: "Assigned to examine", n: examinees.length, sub: "separate from supervised" },
          { label: "Pre-defense", n: preToMark.length, sub: "to conduct" },
          { label: "Cleared to defend", n: defToRecord.length, sub: "advanced" },
        ]} />
      </div>

      {/* supervised table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div className="card-hd">
          <h3>My supervised students</h3>
          <button className="btn btn-quiet btn-sm" onClick={() => onNav("supervision")}>
            Open supervision <Icon name="arrowRight" size={13} />
          </button>
        </div>
        <table className="tbl">
          <thead><tr><th>Student</th><th>Stage</th><th>Next meeting</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {mine.map(s => (
              <tr key={s.id} onClick={() => onOpen("supervision", s.id)} style={{ cursor: 'pointer' }}>
                <td><div style={{ display: "flex", alignItems: "center", gap: 9 }}><Avatar name={s.name} role="Student" size={26} /><div><div style={{ fontWeight: 600, color: "var(--ink)" }}>{s.name}</div><div className="mono muted" style={{ fontSize: 10.5 }}>{s.id} · {s.topic}</div></div>{s.flagged && <Icon name="flag" size={13} style={{ color: "var(--red)" }} />}</div></td>
                <td><StateBadge stateIndex={s.stateIndex} short /></td>
                <td>{s.nextMeeting ? <span className="mono" style={{ fontSize: 12 }}>{fmt(s.nextMeeting.ts)} · {fmtT(s.nextMeeting.ts)}</span> : <span className="faint">—</span>}</td>
                <td>{s.nextMeeting ? (s.nextMeeting.confirmed ? <Badge tone="green" dot>Confirmed</Badge> : <Badge tone="amber" dot>Not confirmed</Badge>) : <span className="faint">—</span>}</td>
                <td><Icon name="chevronRight" size={16} style={{ color: "var(--ink-4)" }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ---------------- Attendance Modal Component ---------------- */
interface AttendanceModalProps {
  session: GroupSession;
  students: Student[];
  initial?: { [stuId: string]: 'present' | 'absent' | 'late' };
  onSave: (list: { [stuId: string]: 'present' | 'absent' | 'late' }) => void;
  onClose: () => void;
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({ session, students, initial, onSave, onClose }) => {
  const [att, setAtt] = useState<{ [stuId: string]: 'present' | 'absent' | 'late' }>(() => {
    if (initial) return initial;
    const base = defaultAttendance(session, students);
    return base;
  });

  const cycle: { [key: string]: 'present' | 'absent' | 'late' } = { 
    present: "absent", 
    absent: "late", 
    late: "present" 
  };
  const tone = { 
    present: "green", 
    absent: "red", 
    late: "amber" 
  };
  
  const present = Object.values(att).filter(s => s === "present").length;

  return (
    <Modal open onClose={onClose} width={560}>
      <div className="card" style={{ overflow: "hidden", boxShadow: "var(--sh-pop)", display: "flex", flexDirection: "column", maxHeight: "84vh" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--line)", flex: "none" }}>
          <div><div className="eyebrow">Take attendance</div><div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink)" }}>{session.title}</div><div className="muted" style={{ fontSize: 12 }}>{fmtFull(session.ts)}</div></div>
          <button className="btn btn-quiet btn-sm" onClick={onClose} style={{ width: 30, padding: 0 }}><Icon name="x" size={15} /></button>
        </div>
        <div style={{ padding: "10px 18px", background: "var(--surface)", borderBottom: "1px solid var(--line-soft)", display: "flex", gap: 8, flex: "none" }}>
          <Badge tone="green" dot>{present} present</Badge>
          <Badge tone="red" dot>{students.length - present} not present</Badge>
          <span className="muted" style={{ fontSize: 11.5, marginLeft: "auto", alignSelf: "center" }}>Tap a row to cycle present → absent → late</span>
        </div>
        <div className="scroll-y" style={{ flex: 1 }}>
          {students.map((s, i) => (
            <button key={s.id} onClick={() => setAtt(a => ({ ...a, [s.id]: cycle[a[s.id]] }))} style={{ display: "flex", width: "100%", alignItems: "center", gap: 11, padding: "10px 18px", border: 0, borderTop: i ? "1px solid var(--line-soft)" : 0, background: "transparent", cursor: "pointer", textAlign: "left" }}>
              <Avatar name={s.name} role="Student" size={28} />
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{s.name}</div><div className="mono muted" style={{ fontSize: 10.5 }}>{s.id}</div></div>
              <Badge tone={tone[att[s.id]]} dot>{att[s.id]}</Badge>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, padding: "13px 18px", borderTop: "1px solid var(--line)", background: "var(--surface)", flex: "none" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { onSave(att); }}><Icon name="check" size={15} /> Save attendance</button>
        </div>
      </div>
    </Modal>
  );
};

/* ---------------- Weekly availability + group sessions ---------------- */
// Map "Mon" → "MONDAY" for the API
const DAY_MAP: Record<string, string> = {
  Mon: 'MONDAY', Tue: 'TUESDAY', Wed: 'WEDNESDAY', Thu: 'THURSDAY', Fri: 'FRIDAY',
};
// Next hour string (09:00 → 10:00)
function nextHour(t: string) {
  const [h, m] = t.split(':').map(Number);
  return String(h + 1).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

export const SupAvailability: React.FC = () => {
  const { availability, groupSessions, students, activeUserId, updateAvailability, addGroupSession, takeGroupAttendance } = useAppContext();
  const SUP_ID = activeUserId || "sup-hab";
  const mine = students.filter(s => s.supervisorId === SUP_ID);

  const [sel, setSel] = useState<{ [slot: string]: number }>(() => {
    const a = { ...(availability[SUP_ID] || {}) };
    delete a.location;
    return a as { [slot: string]: number };
  });
  const [saved, setSaved] = useState(true);
  const [location, setLocation] = useState((availability[SUP_ID] || {}).location || "");
  const [slotIds, setSlotIds] = useState<Record<string, string>>({}); // slotKey → API id
  const [publishing, setPublishing] = useState(false);

  // Load real slots from API on mount
  useEffect(() => {
    if (!getToken()) return;
    supervisionApi.mySlots().then(slots => {
      const map: { [k: string]: number } = {};
      const ids: Record<string, string> = {};
      for (const s of slots) {
        // Find the matching AVAIL_DAYS abbreviation
        const dayAbbr = Object.entries(DAY_MAP).find(([, v]) => v === s.dayOfWeek)?.[0];
        if (dayAbbr && s.startTime) {
          const k = dayAbbr + '-' + s.startTime;
          map[k] = 1;
          ids[k] = s.id;
        }
      }
      setSel(map);
      setSlotIds(ids);
      setSaved(true);
    }).catch(() => {/* keep mock state */});
  }, []);

  const toggle = (k: string) => {
    setSel(s => ({ ...s, [k]: s[k] ? 0 : 1 }));
    setSaved(false);
  };
  const count = Object.values(sel).filter(Boolean).length;

  async function handlePublish() {
    if (getToken()) {
      setPublishing(true);
      try {
        // DELETE slots that were turned off
        for (const [k, id] of Object.entries(slotIds)) {
          if (!sel[k]) {
            await supervisionApi.deleteSlot(id);
          }
        }
        // POST newly enabled slots
        const newIds = { ...slotIds };
        for (const [k, on] of Object.entries(sel)) {
          if (on && !slotIds[k]) {
            const [day, time] = k.split('-');
            const created = await supervisionApi.addSlot({
              dayOfWeek: DAY_MAP[day] || day,
              startTime: time,
              endTime: nextHour(time),
              location: location || undefined,
            });
            newIds[k] = created.id;
          }
        }
        setSlotIds(newIds);
      } catch (e) {
        notify(e instanceof Error ? e.message : 'Failed to save slots', 'error');
        setPublishing(false);
        return;
      } finally {
        setPublishing(false);
      }
    }
    updateAvailability(SUP_ID, sel, location);
    setSaved(true);
    notify("Weekly availability published", "success");
  }

  const sessions = groupSessions.filter(g => g.supervisorId === SUP_ID);
  const [attFor, setAttFor] = useState<GroupSession | null>(null);
  const [adding, setAdding] = useState(false);
  const blank = { title: "", date: "", time: "10:00", durationMin: 60, type: "inperson" as 'meet' | 'inperson', location: "Room B-204", link: "meet.google.com/hab-grp-new", agenda: "" };
  const [form, setForm] = useState(blank);

  function handleAddSession() {
    if (!form.title || !form.date) return;
    const ts = new Date(form.date + "T" + (form.time || "10:00") + ":00").toISOString();
    addGroupSession(form.title, ts, +form.durationMin || 60, form.type, form.type === 'inperson' ? form.location : form.link, form.agenda);
    setForm(blank); 
    setAdding(false); 
    notify("Group session scheduled — all students notified", "success");
  }

  function handleSaveAtt(list: { [stuId: string]: 'present' | 'absent' | 'late' }) { 
    if (attFor) {
      takeGroupAttendance(attFor.id, list);
      setAttFor(null); 
      notify("Attendance saved to the record", "success"); 
    }
  }

  return (
    <div>
      <SectionTitle sub="Publish your weekly office hours and schedule group sessions for all your students — with attendance.">Availability &amp; Sessions</SectionTitle>

      <div className="resp-stack" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "start" }}>
        {/* weekly grid */}
        <div className="card">
          <div className="card-hd">
            <h3>Weekly office hours</h3>
            <button className="btn btn-primary btn-sm" disabled={saved || publishing} onClick={handlePublish}>
              {publishing ? "Saving…" : saved ? <><Icon name="check" size={14} /> Published</> : "Publish"}
            </button>
          </div>
          <div className="card-pad">
            <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
              <Badge tone="navy" dot>{count} slots/week</Badge>
              <span className="muted" style={{ fontSize: 12 }}>Click a cell to toggle.</span>
            </div>
            <WeeklyAvailabilityGrid slots={sel} onToggle={toggle} />
            <div style={{ marginTop: 14 }}>
              <label className="field-label">Where students find you</label>
              <input className="input" value={location} onChange={e => { setLocation(e.target.value); setSaved(false); }} placeholder="e.g. Office B-204, ICT Building" />
            </div>
          </div>
        </div>

        {/* group sessions */}
        <div className="card">
          <div className="card-hd">
            <h3>Group sessions <span className="muted" style={{ fontWeight: 400 }}>· all {mine.length} students</span></h3>
            <button className="btn btn-amber btn-sm" onClick={() => setAdding(a => !a)}><Icon name="plus" size={14} /> Schedule</button>
          </div>
          <div className="card-pad" style={{ display: "grid", gap: 11 }}>
            {adding && (
              <div style={{ padding: "13px 14px", border: "1px dashed var(--line)", borderRadius: 10, display: "grid", gap: 9, background: "var(--surface)" }}>
                <input className="input" placeholder="Session title (e.g. Kick-off — FYP process)" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 84px", gap: 8 }}>
                  <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                  <input type="time" className="input" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                  <input type="number" className="input mono" value={form.durationMin} onChange={e => setForm(f => ({ ...f, durationMin: +e.target.value || 60 }))} title="minutes" />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {(['inperson', 'meet'] as const).map(v => (
                    <button 
                      key={v} 
                      className={"chip" + (form.type === v ? " active" : "")} 
                      style={{ flex: 1, justifyContent: "center" }} 
                      onClick={() => setForm(f => ({ ...f, type: v }))}
                    >
                      <Icon name={v === 'inperson' ? "building" : "link"} size={13} /> {v === 'inperson' ? "In-person" : "Google Meet"}
                    </button>
                  ))}
                </div>
                {form.type === "inperson" ? (
                  <input className="input" placeholder="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                ) : (
                  <div style={{ fontSize: 12, color: "var(--ink-3)", padding: "2px 2px" }}>
                    <Icon name="link" size={13} style={{ verticalAlign: -2 }} /> Meet link auto-created: <span className="mono">{form.link}</span>
                  </div>
                )}
                <textarea className="input" rows={2} placeholder="Agenda / what students should prepare" value={form.agenda} onChange={e => setForm(f => ({ ...f, agenda: e.target.value }))} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={handleAddSession} disabled={!form.title || !form.date}>Schedule &amp; notify all</button>
                  <button className="btn btn-quiet btn-sm" onClick={() => setAdding(false)}>Cancel</button>
                </div>
              </div>
            )}
            {sessions.length ? (
              sessions.map(s => <GroupSessionCard key={s.id} session={s} viewer="supervisor" students={mine} onTakeAttendance={setAttFor} />)
            ) : (
              !adding && <EmptyState icon="calendar" title="No group sessions yet" sub="Schedule a kick-off session to brief all your students on the FYP process." />
            )}
          </div>
        </div>
      </div>

      {attFor && (
        <AttendanceModal 
          session={attFor} 
          students={mine} 
          initial={attFor.attendance} 
          onSave={handleSaveAtt} 
          onClose={() => setAttFor(null)} 
        />
      )}
    </div>
  );
};

/* ---------------- Meeting Scheduler Component ---------------- */
interface MeetingSchedulerProps {
  stu: Student;
  confirmed: boolean;
  onConfirmedChange: (c: boolean) => void;
}

const MeetingScheduler: React.FC<MeetingSchedulerProps> = ({ stu, confirmed, onConfirmedChange }) => {
  const now = useNow(15000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const seedDate = stu.nextMeeting ? new Date(stu.nextMeeting.ts) : new Date(Date.now() + 3 * 86400000);

  const [date, setDate] = useState(seedDate.getFullYear() + "-" + pad(seedDate.getMonth() + 1) + "-" + pad(seedDate.getDate()));
  const [time, setTime] = useState(pad(seedDate.getHours()) + ":" + pad(seedDate.getMinutes()));
  const [type, setType] = useState<'meet' | 'inperson'>("inperson");
  const [location, setLocation] = useState("Office B-204");
  const [purpose, setPurpose] = useState("Pre-submission review");
  const link = "meet.google.com/qra-vkdb-7yz";
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState(!confirmed);
  const [resched, setResched] = useState(false);
  const [rDate, setRDate] = useState(date);
  const [rTime, setRTime] = useState(time);
  const [reason, setReason] = useState("");
  const [history, setHistory] = useState<{ from: string; to: string; reason: string; ts: number }[]>([]);

  const meetingTs = new Date(date + "T" + (time || "00:00") + ":00");
  const minsUntil = (meetingTs.getTime() - now) / 60000;
  const canReschedule = minsUntil > 30;
  const iso = meetingTs.toISOString();
  const label = fmt(iso) + " · " + fmtT(iso);

  async function confirm() {
    setSaving(true);
    try {
      if (getToken()) {
        await supervisionApi.scheduleMeeting({
          studentId: stu.id,
          scheduledAt: iso,
          topic: purpose,
          meetingType: type === 'meet' ? 'ONLINE' : 'IN_PERSON',
          location: type === 'inperson' ? location : undefined,
          meetLink: type === 'meet' ? link : undefined,
        });
      }
      onConfirmedChange(true);
      setEditing(false);
      notify("Meeting confirmed — " + label, "success");
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Failed to schedule meeting', 'error');
    } finally {
      setSaving(false);
    }
  }

  function openResched() {
    setRDate(date);
    setRTime(time);
    setReason("");
    setResched(true);
  }

  async function saveResched() {
    if (!reason.trim()) return;
    const prev = { date, time };
    const newTs = new Date(rDate + "T" + (rTime || "00:00") + ":00").toISOString();
    setSaving(true);
    try {
      if (getToken()) {
        await supervisionApi.scheduleMeeting({
          studentId: stu.id,
          scheduledAt: newTs,
          topic: purpose,
          meetingType: type === 'meet' ? 'ONLINE' : 'IN_PERSON',
          location: type === 'inperson' ? location : undefined,
          meetLink: type === 'meet' ? link : undefined,
        });
      }
      const histEntry = { from: label, to: fmt(newTs) + " · " + fmtT(newTs), reason, ts: Date.now() };
      setHistory(h => [histEntry, ...h]);
      setDate(rDate);
      setTime(rTime);
      setResched(false);
      onConfirmedChange(true);
      notify("Meeting rescheduled — student notified with your reason", {
        tone: "success",
        undo: () => {
          setDate(prev.date);
          setTime(prev.time);
          setHistory(h => h.filter(x => x !== histEntry));
        }
      });
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Failed to reschedule', 'error');
    } finally {
      setSaving(false);
    }
  }

  const TypeChip = ({ v, icon, label: text }: { v: 'meet' | 'inperson'; icon: string; label: string }) => (
    <button onClick={() => setType(v)} className={"chip" + (type === v ? " active" : "")} style={{ flex: 1, justifyContent: "center" }}>
      <Icon name={icon} size={14} /> {text}
    </button>
  );

  return (
    <div className="card">
      <div className="card-hd"><h3><Icon name="calendar" size={15} style={{ verticalAlign: -3, marginRight: 6, color: "var(--navy)" }} />Next meeting</h3>{confirmed && !editing ? <Badge tone="green" dot>Confirmed — student follows this</Badge> : <Badge tone="amber" dot>{confirmed ? "Editing" : "Not yet confirmed"}</Badge>}</div>

      {confirmed && !editing && !resched && (
        <div className="card-pad" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 10, background: "var(--green-bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: "var(--green-deep)", lineHeight: 1 }}>{meetingTs.getDate()}</span>
              <span style={{ fontSize: 9.5, color: "var(--ink-3)", textTransform: "uppercase" }}>{meetingTs.toLocaleString("en", { month: "short" })}</span>
            </div>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink)" }}>{label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 4 }}>
                {type === "meet" ? (
                  <><Badge tone="blue" dot><Icon name="link" size={11} /> Google Meet</Badge><span className="mono muted" style={{ fontSize: 11.5 }}>{link}</span></>
                ) : (
                  <><Badge tone="navy" dot><Icon name="building" size={11} /> In-person</Badge><span className="muted" style={{ fontSize: 12 }}>{location}</span></>
                )}
              </div>
              <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>{purpose}{!canReschedule && <span style={{ color: "var(--red)" }}> · locked (under 30 min to start)</span>}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {type === "meet" && <a className="btn" style={{ background: "#2A6FB5", color: "#fff" }} href={"https://" + link} target="_blank" rel="noreferrer"><Icon name="link" size={14} /> Join</a>}
            <button className="btn btn-ghost" onClick={() => setEditing(true)}>Change</button>
            <button className="btn btn-primary" onClick={openResched} disabled={!canReschedule} title={canReschedule ? "" : "Cannot reschedule within 30 minutes of the meeting"}><Icon name="refresh" size={14} /> Reschedule</button>
          </div>
        </div>
      )}

      {resched && (
        <div className="card-pad" style={{ background: "var(--surface)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 12.5, color: "var(--ink-2)" }}><Icon name="refresh" size={14} style={{ color: "var(--amber-deep)" }} /> Rescheduling from <strong>{label}</strong></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div><label className="field-label">New date</label><input type="date" className="input" value={rDate} onChange={e => setRDate(e.target.value)} /></div>
            <div><label className="field-label">New time</label><input type="time" className="input" value={rTime} onChange={e => setRTime(e.target.value)} /></div>
          </div>
          <label className="field-label">Reason for rescheduling (required — shared with the student)</label>
          <textarea className="input" rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Clashing faculty meeting — moving to the afternoon." style={{ marginBottom: 10 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={saveResched} disabled={!reason.trim() || saving}><Icon name="check" size={14} /> {saving ? "Saving…" : "Save & notify student"}</button>
            <button className="btn btn-quiet btn-sm" onClick={() => setResched(false)}>Cancel</button>
          </div>
        </div>
      )}

      {editing && !resched && (
        <div className="card-pad">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div><label className="field-label">Date</label><input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} /></div>
            <div><label className="field-label">Time</label><input type="time" className="input" value={time} onChange={e => setTime(e.target.value)} /></div>
          </div>
          <label className="field-label">How will you meet?</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <TypeChip v="inperson" icon="building" label="In-person" />
            <TypeChip v="meet" icon="link" label="Google Meet" />
          </div>
          {type === "inperson" ? (
            <div style={{ marginBottom: 12 }}><label className="field-label">Location</label><input className="input" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Office B-204" /></div>
          ) : (
            <div style={{ marginBottom: 12, padding: "10px 13px", background: "var(--blue-bg)", borderRadius: 8, display: "flex", alignItems: "center", gap: 9, fontSize: 12.5 }}>
              <Icon name="link" size={15} style={{ color: "var(--blue)" }} />
              <span>A Google Meet link is created automatically: <strong className="mono">{link}</strong></span>
            </div>
          )}
          <div style={{ marginBottom: 14 }}><label className="field-label">Purpose</label><input className="input" value={purpose} onChange={e => setPurpose(e.target.value)} /></div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" onClick={confirm} disabled={saving}><Icon name="check" size={15} /> {saving ? "Saving…" : "Confirm date & time"}</button>
            {confirmed && <button className="btn btn-quiet" onClick={() => setEditing(false)}>Cancel</button>}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div style={{ borderTop: "1px solid var(--line-soft)", padding: "12px 18px" }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Reschedule history</div>
          {history.map((h, i) => (
            <div key={i} style={{ display: "flex", gap: 10, fontSize: 12, padding: "6px 0" }}>
              <Icon name="refresh" size={13} style={{ color: "var(--amber-deep)", flex: "none", marginTop: 2 }} />
              <div><span className="muted">{h.from}</span> → <strong style={{ color: "var(--ink)" }}>{h.to}</strong><div className="muted" style={{ marginTop: 2 }}>Reason: {h.reason}</div></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------------- Supervision (per-student) Component ---------------- */
interface SupSupervisionProps {
  focusStudent: string | null;
}

export const SupSupervision: React.FC<SupSupervisionProps> = ({ focusStudent }) => {
  const { students, activeUserId, getStudentMeetings, signoffBook } = useAppContext();
  const SUP_ID = activeUserId || "sup-hab";
  const sup = supById[SUP_ID] || { name: "Supervisor" };
  const mine = students.filter(s => s.supervisorId === SUP_ID);

  const [sel, setSel] = useState(focusStudent && mine.find(s => s.id === focusStudent) ? focusStudent : (mine[0] && mine[0].id));

  useEffect(() => {
    if (focusStudent && mine.find(s => s.id === focusStudent)) {
      setSel(focusStudent);
    }
  }, [focusStudent, mine]);

  const stu = students.find(s => s.id === sel);

  const [confirmed, setConfirmed] = useState(stu && stu.nextMeeting ? stu.nextMeeting.confirmed : false);
  const [logging, setLogging] = useState(false);
  const [form, setForm] = useState({ topic: "", attendance: "Present", notes: "" });

  // Real meetings loaded from API (keyed by studentId)
  const [apiMeetings, setApiMeetings] = useState<Meeting[] | null>(null);
  const [meetingSaving, setMeetingSaving] = useState(false);

  const loadMeetings = useCallback((studentId: string) => {
    if (!getToken()) return;
    supervisionApi.meetingsByStudent(studentId)
      .then(list => setApiMeetings(list.map(mapMeeting)))
      .catch(() => setApiMeetings(null));
  }, []);

  useEffect(() => {
    if (stu) {
      setConfirmed(stu.nextMeeting ? stu.nextMeeting.confirmed : false);
      setLogging(false);
      setApiMeetings(null);
      loadMeetings(stu.id);
    }
  }, [sel, stu, loadMeetings]);

  if (!stu) return <EmptyState title="No students" sub="You are not supervising any students in this cohort." />;

  const meetings = apiMeetings ?? getStudentMeetings(stu.id);
  const signedOff = stu.stateIndex >= 8;

  async function handleLogMeeting() {
    setMeetingSaving(true);
    try {
      if (getToken()) {
        // Create the meeting as already-happened (now), then record outcome
        const created = await supervisionApi.scheduleMeeting({
          studentId: stu!.id,
          scheduledAt: new Date().toISOString(),
          topic: form.topic,
          meetingType: 'IN_PERSON',
        });
        await supervisionApi.recordOutcome(
          created.id,
          form.attendance === 'Present',
          form.notes || undefined
        );
        await loadMeetings(stu!.id);
      }
      setForm({ topic: "", attendance: "Present", notes: "" });
      setLogging(false);
      notify("Meeting logged to the record", "success");
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Failed to log meeting', 'error');
    } finally {
      setMeetingSaving(false);
    }
  }

  function handleSignoff() {
    signoffBook(stu!.id);
    notify("Book signed off — advanced to Pre-Defense", "success");
  }

  return (
    <div>
      <SectionTitle sub="Confirm meeting times, log meetings & attendance, and sign off the book.">Supervision</SectionTitle>
      
      <div className="resp-stack" style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 18, alignItems: "start" }}>
        {/* student list */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "11px 14px", borderBottom: "1px solid var(--line-soft)" }} className="eyebrow">My students ({mine.length})</div>
          {mine.map(s => (
            <button 
              key={s.id} 
              onClick={() => setSel(s.id)} 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 9, 
                width: "100%", 
                padding: "10px 13px", 
                border: 0, 
                borderTop: "1px solid var(--line-soft)", 
                background: s.id === sel ? "var(--blue-bg)" : "transparent", 
                cursor: "pointer", 
                textAlign: "left" 
              }}
            >
              <Avatar name={s.name} role="Student" size={26} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {s.name}
                </div>
                <div className="mono muted" style={{ fontSize: 10 }}>{s.id}</div>
              </div>
              {s.flagged && <Icon name="flag" size={12} style={{ color: "var(--red)" }} />}
            </button>
          ))}
        </div>

        {/* detail */}
        <div style={{ display: "grid", gap: 16 }}>
          {/* student header */}
          <div className="card card-pad" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Avatar name={stu.name} role="Student" size={42} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>
                  {stu.name} {stu.flagged && <Badge tone="red" dot style={{ marginLeft: 6 }}>COMPLAINT</Badge>}
                </div>
                <div className="muted" style={{ fontSize: 12.5 }}>{stu.topic} · {stu.org}</div>
              </div>
            </div>
            <StateBadge stateIndex={stu.stateIndex} />
          </div>

          {/* meeting scheduler */}
          <MeetingScheduler key={stu.id} stu={stu} confirmed={confirmed} onConfirmedChange={setConfirmed} />

          {/* meeting history + log */}
          <div className="card">
            <div className="card-hd">
              <h3><Icon name="activity" size={15} style={{ verticalAlign: -3, marginRight: 6, color: "var(--navy)" }} />Meeting log &amp; attendance</h3>
              <button className="btn btn-amber btn-sm" onClick={() => setLogging(l => !l)}>
                <Icon name="plus" size={14} /> Log meeting
              </button>
            </div>
            {logging && (
              <div style={{ padding: "14px 18px", background: "var(--surface)", borderBottom: "1px solid var(--line)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 10, marginBottom: 10 }}>
                  <div><label className="field-label">Topic discussed</label><input className="input" value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} placeholder="e.g. Auth module review" /></div>
                  <div>
                    <label className="field-label">Attendance</label>
                    <select className="select" value={form.attendance} onChange={e => setForm(f => ({ ...f, attendance: e.target.value }))}>
                      <option>Present</option>
                      <option>Absent</option>
                      <option>Late</option>
                    </select>
                  </div>
                </div>
                <label className="field-label">Notes</label>
                <textarea className="input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Action items, decisions…" style={{ marginBottom: 10 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={handleLogMeeting} disabled={meetingSaving}>
                    {meetingSaving ? "Saving…" : "Save to record"}
                  </button>
                  <button className="btn btn-quiet btn-sm" onClick={() => setLogging(false)} disabled={meetingSaving}>Cancel</button>
                </div>
              </div>
            )}
            <div className="card-pad">
              {meetings.filter(m => m.logged).length ? (
                <Timeline events={meetings.filter(m => m.logged).map(m => ({ 
                  label: m.topic, 
                  actor: { name: sup.name, role: "Supervisor" }, 
                  ts: m.ts, 
                  meeting: m, 
                  focus: true 
                }))} />
              ) : (
                <div className="muted" style={{ fontSize: 12.5 }}>No meetings logged yet.</div>
              )}
            </div>
          </div>

          {/* sign off */}
          <div className="card card-pad" style={{ background: signedOff ? "var(--green-bg)" : "var(--white)", borderColor: signedOff ? "#BCE2CC" : "var(--line)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ width: 40, height: 40, borderRadius: 10, background: signedOff ? "var(--green)" : "var(--navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name={signedOff ? "checkCircle" : "book"} size={20} /></span>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink)" }}>{signedOff ? "Book signed off" : "Sign off the book"}</div>
                  <div className="muted" style={{ fontSize: 12.5 }}>{signedOff ? "Student advanced to Pre-Defense. Forward-only — does not return to supervision." : "Advances the student to Pre-Defense. This is recorded with your name and timestamp."}</div>
                </div>
              </div>
              {signedOff ? (
                <Badge tone="green" dot>Signed {fmt(stu.stateIndex >= 8 ? stu.enteredStageTs : new Date().toISOString())}</Badge>
              ) : (
                <button className="btn btn-primary" onClick={handleSignoff} disabled={!confirmed}>
                  <Icon name="check" size={15} /> Sign off &amp; advance
                </button>
              )}
            </div>
            {!signedOff && !confirmed && <div className="muted" style={{ fontSize: 11.5, marginTop: 10 }}>Confirm at least one meeting before signing off.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Supervisor Settings: WhatsApp & Phone ---------------- */
/* Reusable change-password card — used across all role settings */
export const ChangePasswordCard: React.FC = () => {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) { notify('Passwords do not match', 'error'); return; }
    if (next.length < 8) { notify('Password must be at least 8 characters', 'error'); return; }
    if (!getToken()) { notify('You must be logged in', 'error'); return; }
    setSaving(true);
    try {
      await usersApi.changePassword(cur, next);
      notify('Password changed successfully', 'success');
      setCur(''); setNext(''); setConfirm('');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Failed to change password', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card card-pad" style={{ maxWidth: 420 }}>
      <div className="eyebrow" style={{ marginBottom: 14 }}>Change password</div>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 11 }}>
        <div>
          <label className="field-label">Current password</label>
          <input className="input" type="password" value={cur} onChange={e => setCur(e.target.value)} required />
        </div>
        <div>
          <label className="field-label">New password</label>
          <input className="input" type="password" value={next} onChange={e => setNext(e.target.value)} required minLength={8} />
        </div>
        <div>
          <label className="field-label">Confirm new password</label>
          <input className="input" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
        </div>
        <button className="btn btn-primary btn-sm" type="submit" disabled={saving} style={{ marginTop: 4 }}>
          {saving ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </div>
  );
};

export const SupSettings: React.FC = () => {
  const { waGroups, predefenseWa, activeUserId } = useAppContext();
  const SUP_ID = activeUserId || "sup-hab";

  const [groups, setGroups] = useState(waGroups[SUP_ID] || []);
  const [predef, setPredef] = useState(predefenseWa[SUP_ID] || []);
  
  const sup = supById[SUP_ID] || { phone: '' };
  const [phone, setPhone] = useState(sup.phone || "");

  function WAGroupCard({ 
    title, 
    sub, 
    accent, 
    list, 
    setList, 
    placeholder 
  }: { 
    title: string; 
    sub: string; 
    accent: string; 
    list: any[]; 
    setList: React.Dispatch<React.SetStateAction<any[]>>; 
    placeholder: string 
  }) {
    const [adding, setAdding] = useState(false);
    const [nt, setNt] = useState({ team: "", link: "" });
    return (
      <div className="card">
        <div className="card-hd"><h3><Icon name="whatsapp" size={15} style={{ verticalAlign: -3, marginRight: 6, color: "#1FA855" }} />{title}</h3><Badge tone={accent}>{list.length}</Badge></div>
        <div className="card-pad" style={{ display: "grid", gap: 11 }}>
          <div className="muted" style={{ fontSize: 12, marginTop: -2 }}>{sub}</div>
          {list.map(g => (
            <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", border: "1px solid var(--line)", borderRadius: 10 }}>
              <span style={{ width: 34, height: 34, borderRadius: 8, background: "#E7F6EC", color: "#1FA855", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="whatsapp" size={17} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{g.team}</div>
                <div className="mono muted" style={{ fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.link}</div>
              </div>
              <WhatsAppButton team="Join" link={g.link} sm />
              <button className="btn btn-quiet btn-sm" onClick={() => setList(gs => gs.filter(x => x.id !== g.id))} style={{ width: 30, padding: 0, color: "var(--red)" }}>
                <Icon name="x" size={14} />
              </button>
            </div>
          ))}
          {adding ? (
            <div style={{ padding: "12px 13px", border: "1px dashed var(--line)", borderRadius: 10, display: "grid", gap: 8 }}>
              <input className="input" placeholder={placeholder} value={nt.team} onChange={e => setNt(n => ({ ...n, team: e.target.value }))} />
              <input className="input mono" placeholder="https://chat.whatsapp.com/…" value={nt.link} onChange={e => setNt(n => ({ ...n, link: e.target.value }))} />
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={() => { 
                  if (nt.team) { 
                    setList(g => [...g, { id: "new" + g.length + Date.now(), team: nt.team, link: nt.link || "https://chat.whatsapp.com/…" }]); 
                    setNt({ team: "", link: "" }); 
                    setAdding(false); 
                    notify("WhatsApp group saved", "success"); 
                  } 
                }}>
                  Add link
                </button>
                <button className="btn btn-quiet btn-sm" onClick={() => setAdding(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={() => setAdding(true)} style={{ justifySelf: "start" }}><Icon name="plus" size={14} /> Add another group link</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionTitle sub="Provide the WhatsApp group link(s) students join — separate groups for supervision and for pre-defense panels.">WhatsApp &amp; Contact</SectionTitle>

      <div className="resp-stack" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18, alignItems: "start", maxWidth: 920 }}>
        <div style={{ display: "grid", gap: 18 }}>
          <WAGroupCard title="Supervision groups" sub="Students you supervise join these." accent="navy" list={groups} setList={setGroups} placeholder="Team / group name (e.g. FYP 2026 · Group E)" />
          <WAGroupCard title="Pre-defense groups" sub="Students you examine at pre-defense join these — kept separate from supervision." accent="violet" list={predef} setList={setPredef} placeholder="Panel name (e.g. FYP 2026 · Pre-Defense Panel B)" />
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <div className="card card-pad">
            <div className="eyebrow" style={{ marginBottom: 10 }}>Contact number</div>
            <label className="field-label">Phone (visible to your students)</label>
            <input className="input mono" value={phone} onChange={e => setPhone(e.target.value)} style={{ marginBottom: 14 }} />
            <div style={{ padding: "11px 13px", background: "var(--surface)", borderRadius: 9, fontSize: 12, color: "var(--ink-3)", lineHeight: 1.6 }}>
              <Icon name="link" size={14} style={{ verticalAlign: -2, marginRight: 5 }} />
              WhatsApp is a free click-through — the system stores the link only. There&apos;s no messaging API; students tap to open the group.
            </div>
          </div>
          <ChangePasswordCard />
        </div>
      </div>
    </div>
  );
};
