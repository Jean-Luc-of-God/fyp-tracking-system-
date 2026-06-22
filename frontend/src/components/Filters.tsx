import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Icon, Avatar, Badge, StateBadge, EmptyState, SectionTitle } from './SharedUI';
import { LetterStatusBadge } from './LetterUI';
import { 
  currentSemester, 
  semesters, 
  semesterOf, 
  bookDeadline, 
  daysLeft, 
  fmt, 
  supById, 
  STATES, 
  SUPERVISORS 
} from '../utils/fypData';

/* shared select control */
interface FSelectProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { v: string; l: string }[];
}

const FSelect: React.FC<FSelectProps> = ({ label, value, onChange, options }) => {
  return (
    <div>
      <label className="field-label">{label}</label>
      <select className="select" value={value} onChange={e => onChange(e.target.value)} style={{ height: 36, minWidth: 150 }}>
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
};

/* ---------------- HOD · Find Students ---------------- */
export const HODFindStudents: React.FC = () => {
  const { students, letters } = useAppContext();
  const cur = currentSemester();
  const sems = semesters(students);
  const lastSemOrder = cur.order - 1;
  const lastSem = sems.find(s => s.order === lastSemOrder) || sems[0];

  const [sem, setSem] = useState("all");
  const [letter, setLetter] = useState("all");
  const [stage, setStage] = useState("all");
  const [deadline, setDeadline] = useState("all");
  const [sup, setSup] = useState("all");
  const [q, setQ] = useState("");

  function preset(name: string) {
    setQ("");
    if (name === "not-submitted-last") {
      setSem(lastSem ? lastSem.key : "all");
      setLetter("not-submitted");
      setStage("all");
      setDeadline("all");
      setSup("all");
    } else if (name === "deadline") {
      setSem("all");
      setLetter("all");
      setStage("all");
      setDeadline("lt60");
      setSup("all");
    } else if (name === "review") {
      setSem("all");
      setLetter("submitted");
      setStage("all");
      setDeadline("all");
      setSup("all");
    } else if (name === "nosup") {
      setSem("all");
      setLetter("all");
      setStage("all");
      setDeadline("all");
      setSup("none");
    } else if (name === "overdue") {
      setSem("all");
      setLetter("all");
      setStage("all");
      setDeadline("overdue");
      setSup("all");
    }
  }

  function clearAll() {
    setSem("all");
    setLetter("all");
    setStage("all");
    setDeadline("all");
    setSup("all");
    setQ("");
  }

  const rows = students.filter(s => {
    const L = letters[s.id] || { status: 'none' };
    const si = semesterOf(s.bookRegisteredTs);
    const dl = bookDeadline(s);
    const days = daysLeft(dl);
    const exp = !!(L.deadlineTs && Date.now() > L.deadlineTs);

    if (q && !(s.name.toLowerCase().includes(q.toLowerCase()) || s.id.toLowerCase().includes(q.toLowerCase()))) return false;
    if (sem !== "all" && si.key !== sem) return false;
    if (stage !== "all" && s.stateIndex !== +stage) return false;
    if (sup === "none" && s.supervisorId) return false;
    if (sup === "any" && !s.supervisorId) return false;
    if (sup !== "all" && sup !== "none" && sup !== "any" && s.supervisorId !== sup) return false;
    if (deadline === "overdue" && days >= 0) return false;
    if (deadline === "lt30" && !(days >= 0 && days < 30)) return false;
    if (deadline === "lt60" && !(days >= 0 && days < 60)) return false;
    if (letter !== "all") {
      const st = L.status;
      if (letter === "not-submitted" && (st === "submitted" || st === "approved")) return false;
      if (letter === "submitted" && st !== "submitted") return false;
      if (letter === "approved" && st !== "approved") return false;
      if (letter === "rejected" && st !== "rejected") return false;
      if (letter === "requested" && !(st === "requested" && !exp)) return false;
      if (letter === "closed" && !(st === "requested" && exp)) return false;
      if (letter === "none" && st !== "none") return false;
    }
    return true;
  });

  const activeFilters = [sem, letter, stage, deadline, sup].filter(v => v !== "all").length + (q ? 1 : 0);
  const presets = [
    { id: "not-submitted-last", label: "Not submitted · last sem", icon: "alert", hint: lastSem ? lastSem.label : "" },
    { id: "review", label: "Awaiting review", icon: "checkCircle" },
    { id: "deadline", label: "Approaching deadline (<60d)", icon: "clock" },
    { id: "overdue", label: "Overdue (1-yr lapsed)", icon: "alert" },
    { id: "nosup", label: "No supervisor yet", icon: "users" },
  ];

  return (
    <div>
      <SectionTitle style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        Find Students
      </SectionTitle>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <p className="muted" style={{ fontSize: 13, margin: '0 0 10px', maxWidth: 600 }}>
          Slice the cohort by semester, letter status, stage, deadline and supervisor — registrations are counted per semester.
        </p>
        <div style={{ position: "relative" }}>
          <Icon name="search" size={16} style={{ position: "absolute", left: 11, top: 11, color: "var(--ink-4)" }} />
          <input className="input" placeholder="Search name or ID…" value={q} onChange={e => setQ(e.target.value)} style={{ width: 230, paddingLeft: 34, height: 38 }} />
        </div>
      </div>

      {/* quick presets */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <span className="eyebrow" style={{ marginRight: 2 }}>Quick views</span>
        {presets.map(p => (
          <button key={p.id} className="chip" onClick={() => preset(p.id)} title={p.hint}>
            <Icon name={p.icon} size={13} /> {p.label}
          </button>
        ))}
      </div>

      {/* filter bar */}
      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
          <FSelect label="Semester registered" value={sem} onChange={setSem} options={[{ v: "all", l: "All semesters" }, ...sems.map(s => ({ v: s.key, l: s.label + (s.order === cur.order ? " (current)" : s.order === lastSemOrder ? " (last)" : "") }))]} />
          <FSelect label="Letter status" value={letter} onChange={setLetter} options={[
            { v: "all", l: "Any status" }, { v: "not-submitted", l: "Not submitted (owes letter)" }, { v: "none", l: "Not yet requested" },
            { v: "requested", l: "Requested · window open" }, { v: "closed", l: "Window closed" }, { v: "submitted", l: "Submitted · awaiting review" },
            { v: "rejected", l: "Returned for revision" }, { v: "approved", l: "Approved" },
          ]} />
          <FSelect label="Deadline" value={deadline} onChange={setDeadline} options={[{ v: "all", l: "Any" }, { v: "overdue", l: "Overdue" }, { v: "lt30", l: "< 30 days" }, { v: "lt60", l: "< 60 days" }]} />
          <FSelect label="Stage" value={stage} onChange={setStage} options={[{ v: "all", l: "All stages" }, ...STATES.map(s => ({ v: String(s.i), l: (s.i + 1) + ". " + s.short }))]} />
          <FSelect label="Supervisor" value={sup} onChange={setSup} options={[{ v: "all", l: "Any" }, { v: "none", l: "Not assigned" }, { v: "any", l: "Assigned (any)" }, ...SUPERVISORS.map(s => ({ v: s.id, l: s.name }))]} />
          {activeFilters > 0 && <button className="btn btn-quiet btn-sm" onClick={clearAll} style={{ marginBottom: 1 }}>Clear ({activeFilters})</button>}
        </div>
      </div>

      {/* result summary */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <span className="num" style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)" }}>{rows.length}</span>
        <span className="muted" style={{ fontSize: 13 }}>student{rows.length === 1 ? "" : "s"} match</span>
        {sem !== "all" && <Badge tone="navy" dot>{(sems.find(s => s.key === sem) || { label: '' }).label}</Badge>}
        {letter === "not-submitted" && <Badge tone="red" dot>Owe a letter</Badge>}
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead><tr><th>Student</th><th>Semester</th><th>Registered</th><th>Deadline</th><th>Letter</th><th>Stage</th><th>Supervisor</th></tr></thead>
            <tbody>
              {rows.map(s => {
                const L = letters[s.id] || { status: 'none' };
                const si = semesterOf(s.bookRegisteredTs);
                const dl = bookDeadline(s);
                const days = daysLeft(dl);
                const exp = !!(L.deadlineTs && Date.now() > L.deadlineTs);
                return (
                  <tr key={s.id} style={{ cursor: "default" }}>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 9 }}><Avatar name={s.name} role="Student" size={26} /><div><div style={{ fontWeight: 600, color: "var(--ink)" }}>{s.name}</div><div className="mono muted" style={{ fontSize: 10.5 }}>{s.id}</div></div></div></td>
                    <td><Badge tone="grey">{si.short}</Badge></td>
                    <td className="mono muted" style={{ fontSize: 11.5 }}>{fmt(s.bookRegisteredTs)}</td>
                    <td><div style={{ display: "flex", flexDirection: "column", gap: 2 }}><span className="mono" style={{ fontSize: 11 }}>{fmt(dl)}</span><span style={{ fontSize: 10.5, fontWeight: 600, color: days < 0 ? "var(--red)" : days < 60 ? "var(--amber-deep)" : "var(--ink-4)" }}>{days < 0 ? "overdue" : days + "d left"}</span></div></td>
                    <td><LetterStatusBadge status={L.status} expired={exp} /></td>
                    <td><StateBadge stateIndex={s.stateIndex} short /></td>
                    <td className="muted" style={{ fontSize: 12 }}>{s.supervisorId ? (supById[s.supervisorId] || { name: s.supervisorId }).name : <span className="faint">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!rows.length && <EmptyState icon="search" title="No students match" sub="Adjust the filters or clear them to see the full cohort." action={<button className="btn btn-ghost" onClick={clearAll}>Clear filters</button>} />}
      </div>
    </div>
  );
};

/* ---------------- Supervisor · Find (within own students) ---------------- */
interface SupFindStudentsProps {
  onOpen?: (view: string, id: string) => void;
}

export const SupFindStudents: React.FC<SupFindStudentsProps> = ({ onOpen }) => {
  const { students, activeUserId } = useAppContext();
  const mine = students.filter(s => s.supervisorId === activeUserId);

  const [stage, setStage] = useState("all");
  const [meeting, setMeeting] = useState("all");
  const [flag, setFlag] = useState("all");
  const [q, setQ] = useState("");

  function preset(name: string) {
    setQ("");
    if (name === "needs-confirm") { setMeeting("unconfirmed"); setStage("all"); setFlag("all"); }
    else if (name === "signoff") { setStage("7"); setMeeting("all"); setFlag("all"); }
    else if (name === "flagged") { setFlag("flagged"); setStage("all"); setMeeting("all"); }
    else if (name === "rework") { setFlag("rework"); setStage("all"); setMeeting("all"); }
    else if (name === "nomeeting") { setMeeting("none"); setStage("all"); setFlag("all"); }
  }

  function clearAll() {
    setStage("all");
    setMeeting("all");
    setFlag("all");
    setQ("");
  }

  const rows = mine.filter(s => {
    if (q && !(s.name.toLowerCase().includes(q.toLowerCase()) || s.id.toLowerCase().includes(q.toLowerCase()))) return false;
    if (stage !== "all" && s.stateIndex !== +stage) return false;
    if (meeting === "confirmed" && !(s.nextMeeting && s.nextMeeting.confirmed)) return false;
    if (meeting === "unconfirmed" && !(s.nextMeeting && !s.nextMeeting.confirmed)) return false;
    if (meeting === "none" && s.nextMeeting) return false;
    if (flag === "flagged" && !s.flagged) return false;
    if (flag === "rework" && !((s.attempts || []).some(a => a.status === "rejected"))) return false;
    return true;
  });

  const activeFilters = [stage, meeting, flag].filter(v => v !== "all").length + (q ? 1 : 0);
  const presets = [
    { id: "needs-confirm", label: "Needs meeting confirmation", icon: "calendar" },
    { id: "signoff", label: "Ready to sign off", icon: "checkCircle" },
    { id: "flagged", label: "Flagged / complaints", icon: "flag" },
    { id: "rework", label: "Proposal rework", icon: "refresh" },
    { id: "nomeeting", label: "No meeting set", icon: "clock" },
  ];

  return (
    <div>
      <SectionTitle style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        Find My Students
      </SectionTitle>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <p className="muted" style={{ fontSize: 13, margin: '0 0 10px', maxWidth: 600 }}>
          Quickly surface students who need action — across your supervised cohort.
        </p>
        <div style={{ position: "relative" }}>
          <Icon name="search" size={16} style={{ position: "absolute", left: 11, top: 11, color: "var(--ink-4)" }} />
          <input className="input" placeholder="Search name or ID…" value={q} onChange={e => setQ(e.target.value)} style={{ width: 230, paddingLeft: 34, height: 38 }} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <span className="eyebrow" style={{ marginRight: 2 }}>Quick views</span>
        {presets.map(p => (
          <button key={p.id} className="chip" onClick={() => preset(p.id)}>
            <Icon name={p.icon} size={13} /> {p.label}
          </button>
        ))}
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
          <FSelect label="Stage" value={stage} onChange={setStage} options={[{ v: "all", l: "All stages" }, ...STATES.map(s => ({ v: String(s.i), l: (s.i + 1) + ". " + s.short }))]} />
          <FSelect label="Meeting" value={meeting} onChange={setMeeting} options={[{ v: "all", l: "Any" }, { v: "confirmed", l: "Confirmed" }, { v: "unconfirmed", l: "Not confirmed" }, { v: "none", l: "No meeting set" }]} />
          <FSelect label="Flags" value={flag} onChange={setFlag} options={[{ v: "all", l: "Any" }, { v: "flagged", l: "Complaint on file" }, { v: "rework", l: "Proposal rework" }]} />
          {activeFilters > 0 && <button className="btn btn-quiet btn-sm" onClick={clearAll} style={{ marginBottom: 1 }}>Clear ({activeFilters})</button>}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span className="num" style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)" }}>{rows.length}</span>
        <span className="muted" style={{ fontSize: 13 }}>of {mine.length} supervised students</span>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead><tr><th>Student</th><th>Stage</th><th>Next meeting</th><th>Status</th><th>Flags</th><th></th></tr></thead>
            <tbody>
              {rows.map(s => (
                <tr key={s.id} onClick={() => { if (onOpen) onOpen("supervision", s.id); }} style={{ cursor: 'pointer' }}>
                  <td><div style={{ display: "flex", alignItems: "center", gap: 9 }}><Avatar name={s.name} role="Student" size={26} /><div><div style={{ fontWeight: 600, color: "var(--ink)" }}>{s.name}</div><div className="mono muted" style={{ fontSize: 10.5 }}>{s.id}</div></div></div></td>
                  <td><StateBadge stateIndex={s.stateIndex} short /></td>
                  <td>{s.nextMeeting ? <span className="mono" style={{ fontSize: 11.5 }}>{fmt(s.nextMeeting.ts)}</span> : <span className="faint">—</span>}</td>
                  <td>{s.nextMeeting ? (s.nextMeeting.confirmed ? <Badge tone="green" dot>Confirmed</Badge> : <Badge tone="amber" dot>Unconfirmed</Badge>) : <Badge tone="grey">No meeting</Badge>}</td>
                  <td><div style={{ display: "flex", gap: 5 }}>{s.flagged && <Badge tone="red" dot>Complaint</Badge>}{(s.attempts || []).some(a => a.status === "rejected") && <Badge tone="amber">rework</Badge>}{!s.flagged && !(s.attempts || []).some(a => a.status === "rejected") && <span className="faint">—</span>}</div></td>
                  <td><Icon name="chevronRight" size={16} style={{ color: "var(--ink-4)" }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && <EmptyState icon="search" title="No students match" sub="Adjust or clear the filters." action={<button className="btn btn-ghost" onClick={clearAll}>Clear filters</button>} />}
      </div>
    </div>
  );
};
