import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Student } from '../types';
import { 
  Icon, 
  Avatar, 
  Badge, 
  StateBadge, 
  MetricCard, 
  SectionTitle, 
  Modal 
} from '../components/SharedUI';
import {
  StudentIdSearch,
  LetterStatusBadge,
  RichText,
  Countdown,
  useNow,
  notify
} from '../components/LetterUI';
import { EmailPreview } from '../components/Emails';
import { studentsApi } from '../api/students';
import { usersApi } from '../api/users';
import { proposalsApi } from '../api/proposals';
import type { UserResponse } from '../api/types';
import { 
  SupDashboard, 
  SupSupervision, 
  SupAvailability, 
  SupSettings 
} from './SupervisorDashboard';
import { SupExamining } from './ExaminerDashboard';
import { FacProtoData } from './FacilitatorDashboard';
import { 
  fmt, 
  fmtFull, 
  bookDeadline,
  daysLeft,
  STATES
} from '../utils/fypData';

/* ---------------- DeadlinePill Component ---------------- */
interface DeadlinePillProps {
  deadline: string;
}

export const DeadlinePill: React.FC<DeadlinePillProps> = ({ deadline }) => {
  const days = daysLeft(deadline);
  const tone = days < 30 ? "red" : days < 60 ? "amber" : "grey";
  return <Badge tone={tone} dot>{days} days left</Badge>;
};

/* ---------------- SuccessScreen Component ---------------- */
interface SuccessScreenProps {
  badge: string;
  title: string;
  sub: string;
  actions?: React.ReactNode;
}

const SuccessScreen: React.FC<SuccessScreenProps> = ({ badge, title, sub, actions }) => {
  return (
    <div style={{ textAlign: "center", padding: "40px 30px" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
        <Icon name="check" size={28} stroke={2.4} />
      </div>
      <Badge tone="green">{badge}</Badge>
      <h3 style={{ fontSize: 17, marginTop: 10 }}>{title}</h3>
      <p className="muted" style={{ fontSize: 13, marginTop: 6, marginBottom: 16 }}>{sub}</p>
      {actions}
    </div>
  );
};

/* ---------------- LetterPaper Component ---------------- */
interface LetterPaperProps {
  student: Student;
  long?: boolean;
}

export const LetterPaper: React.FC<LetterPaperProps> = ({ student, long }) => {
  const { letters } = useAppContext();
  const L = letters[student.id] || { file: "case-letter.pdf", status: "none", submittedTs: Date.now() };
  
  const PageBreak = ({ n }: { n: number }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "22px -30px", padding: "0 30px" }}>
      <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
      <span className="mono" style={{ fontSize: 10, color: "var(--ink-4)" }}>page {n}</span>
      <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
    </div>
  );
  
  const h = { fontWeight: 600, color: "var(--ink)", margin: "0 0 8px", fontSize: 13 };
  const p = { marginBottom: 10 };
  
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ padding: "10px 16px", background: "var(--surface)", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="file" size={15} style={{ color: "var(--red)" }} />
          <span className="mono" style={{ fontSize: 12 }}>{L.file || "case-letter.pdf"}</span>
        </div>
        {long && <span className="badge badge-grey" style={{ height: 18 }}>4 pages</span>}
      </div>
      <div style={{ padding: "26px 30px", fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.7 }}>
        <div style={{ textAlign: "right", color: "var(--ink-3)", marginBottom: 14 }}>
          {fmt(L.submittedTs ? new Date(L.submittedTs).toISOString() : new Date().toISOString())}
        </div>
        <p style={p}>The Head of Department,<br />Software Engineering, AUCA</p>
        <p style={{ ...p, fontWeight: 600, color: "var(--ink)" }}>RE: Case-Study Acceptance — {student.org}</p>
        <p style={p}>Dear Sir/Madam,</p>
        <p style={p}>
          I, <strong>{student.name}</strong> ({student.id}), write to confirm that <strong>{student.org}</strong> has accepted to host my Final Year Project, titled “{student.topic}”. The organisation has agreed to provide the access and data necessary to complete the project.
        </p>
        {long && (
          <>
            <PageBreak n={2} />
            <h4 style={h}>1. Background of the organisation</h4>
            <p style={p}>
              {student.org} operates across several departments whose day-to-day processes are still largely manual. Staff currently rely on paper records and spreadsheets, which creates delays, duplicated effort, and limited visibility for management when making decisions.
            </p>
            <h4 style={h}>2. Problem statement</h4>
            <p style={p}>
              The absence of a centralised digital system means information is fragmented and difficult to audit. This project, “{student.topic}”, aims to address those gaps by providing a single, reliable platform that streamlines the workflow end to end.
            </p>
            <h4 style={h}>3. Objectives</h4>
            <p style={p}>
              The main objective is to design and implement a working system. Specific objectives include capturing requirements from staff, modelling the data, building the core modules, and validating the solution against measurable success criteria agreed with the organisation.
            </p>
            <PageBreak n={3} />
            <h4 style={h}>4. Scope</h4>
            <p style={p}>
              The project covers the core operational workflow and reporting. It excludes payroll and third-party integrations, which are noted as future work. A prototype will be presented to the review board before full development proceeds.
            </p>
            <h4 style={h}>5. Methodology</h4>
            <p style={p}>
              An iterative approach will be followed: requirements gathering, prototyping, supervised development with weekly check-ins, testing, and a final defense. Regular feedback from the organisation will guide each iteration.
            </p>
            <PageBreak n={4} />
            <h4 style={h}>6. Expected outcomes</h4>
            <p style={p}>
              On completion, the organisation will have a functional system that reduces manual effort, improves data accuracy, and provides management with timely reports. The work will also satisfy the academic requirements of the Final Year Project.
            </p>
          </>
        )}
        <p style={p}>I kindly request approval to proceed to the prototyping phase. A signed acceptance from the organisation is attached.</p>
        <p style={{ marginTop: 18 }}>Yours faithfully,<br /><strong>{student.name}</strong></p>
      </div>
    </div>
  );
};

/* ---------------- HODDashboard ---------------- */
interface HODDashboardProps {
  onNav: (view: string) => void;
}

export const HODDashboard: React.FC<HODDashboardProps> = ({ onNav }) => {
  const { students } = useAppContext();
  const [found, setFound] = useState<Student | null>(null);

  const counts: { [key: number]: number } = {};
  students.forEach(s => {
    counts[s.stateIndex] = (counts[s.stateIndex] || 0) + 1;
  });

  const total = students.length;

  // Use real state-machine counts instead of local letter map
  const ls = {
    requested: students.filter(s => s.stateIndex >= 1).length,
    submitted: students.filter(s => s.stateIndex === 1).length,
    approved: students.filter(s => s.stateIndex >= 2).length,
    rejected: 0,
  };

  // Show all early-stage students (not deadline-filtered) so the table is never empty
  const approaching = students.filter(s => s.stateIndex <= 2)
    .map(s => ({ s, deadline: bookDeadline(s) }))
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 8);

  return (
    <div>
      <SectionTitle sub="Department-wide view of the Class of 2026 cohort." right={<StudentIdSearch onOpen={setFound} />}>
        Dashboard
      </SectionTitle>

      {found && (
        <div className="card card-pad fade-in" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 14, borderColor: "var(--navy-tint)" }}>
          <Avatar name={found.name} role="Student" size={42} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>{found.name}</span>
              <span className="mono muted" style={{ fontSize: 12 }}>{found.id}</span>
            </div>
            <div className="muted" style={{ fontSize: 12.5 }}>{found.topic} · {found.org} · {found.group}</div>
          </div>
          <StateBadge stateIndex={found.stateIndex} />
          <button className="btn btn-quiet btn-sm" onClick={() => setFound(null)}><Icon name="x" size={14} /></button>
        </div>
      )}

      <div className="resp-cols-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
        <MetricCard label="Registered students" value={total} sub="Class of 2026" icon="users" tone="navy" />
        <MetricCard label="Letters requested" value={ls.requested + ls.submitted + ls.approved + ls.rejected} sub="across batches" icon="send" tone="amber" onClick={() => onNav("request")} />
        <MetricCard label="Letters in review" value={ls.submitted} sub="awaiting your decision" icon="checkCircle" tone="blue" onClick={() => onNav("review")} active={ls.submitted > 0} />
        <MetricCard label="Approaching deadline" value={approaching.filter(a => daysLeft(a.deadline) < 60).length} sub="< 60 days on the book" icon="alert" tone="red" onClick={() => onNav("request")} />
      </div>

      <div className="resp-stack" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "start" }}>
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="card-hd">
            <h3>Early-stage students</h3>
            <button className="btn btn-quiet btn-sm" onClick={() => onNav("request")}>
              Request letters <Icon name="arrowRight" size={13} />
            </button>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Student</th>
                <th>Case study</th>
                <th>Stage</th>
                <th>Letter status</th>
              </tr>
            </thead>
            <tbody>
              {approaching.map(({ s }) => (
                <tr key={s.id} style={{ cursor: "default" }}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Avatar name={s.name} role="Student" size={24} />
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: 12.5 }}>{s.name}</div>
                        <div className="mono muted" style={{ fontSize: 10 }}>{s.reg}</div>
                      </div>
                    </div>
                  </td>
                  <td className="muted" style={{ fontSize: 12 }}>{s.org || '—'}</td>
                  <td>
                    {s.stateIndex === 0 && <Badge tone="grey" dot>Registered</Badge>}
                    {s.stateIndex === 1 && <Badge tone="amber" dot>Letter Submitted</Badge>}
                    {s.stateIndex === 2 && <Badge tone="green" dot>Letter Approved</Badge>}
                  </td>
                  <td>
                    {s.stateIndex === 0 && <Badge tone="grey">Not submitted</Badge>}
                    {s.stateIndex === 1 && <Badge tone="blue" dot>Awaiting review</Badge>}
                    {s.stateIndex >= 2 && <Badge tone="green" dot>Approved</Badge>}
                  </td>
                </tr>
              ))}
              {!approaching.length && (
                <tr><td colSpan={4} className="muted" style={{ textAlign: "center", padding: 22 }}>All students have progressed past the early stages.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-hd"><h3>Cohort by stage</h3></div>
          <div className="card-pad" style={{ display: "grid", gap: 9 }}>
            {STATES.map(st => {
              const n = counts[st.i] || 0;
              const pct = total ? Math.round(n / total * 100) : 0;
              const colMap: { [key: string]: string } = { navy: "var(--navy)", blue: "var(--blue)", green: "var(--green)", amber: "var(--amber-deep)", violet: "var(--violet)" };
              return (
                <div key={st.key} style={{ display: "grid", gridTemplateColumns: "138px 1fr 30px", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 12, color: "var(--ink-2)" }}>
                    <span className="mono muted" style={{ fontSize: 10.5 }}>{String(st.i + 1).padStart(2, "0")}</span> {st.short}
                  </span>
                  <div style={{ height: 8, background: "var(--surface-2)", borderRadius: 5, overflow: "hidden" }}>
                    <div style={{ width: Math.max(pct, n ? 4 : 0) + "%", height: "100%", background: colMap[st.color] || "var(--navy)", borderRadius: 5 }} />
                  </div>
                  <span className="num" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", textAlign: "right" }}>{n}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- HODUpload ---------------- */
export const HODUpload: React.FC = () => {
  const { refreshStudents } = useAppContext();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ count: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function pickFile(f: File) {
    setSelectedFile(f);
    setResult(null);
    setError(null);
  }

  async function doImport() {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    try {
      const imported = await studentsApi.importExcel(selectedFile);
      setResult({ count: imported.length });
      await refreshStudents();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <SectionTitle sub="Upload an Excel file with columns: reg_number, full_name, email, phone, org, group. Each row creates a student at REGISTERED state.">
        Upload Students
      </SectionTitle>

      {!result && (
        <div
          className="card card-pad"
          style={{
            maxWidth: 640, textAlign: "center", padding: "44px 30px", margin: "0 auto",
            border: dragOver ? "2px dashed var(--navy)" : "2px dashed var(--line)",
            background: dragOver ? "var(--surface)" : "",
            transition: "all .15s",
          }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f) pickFile(f);
          }}
        >
          <div style={{ width: 60, height: 60, borderRadius: 14, background: "var(--green-bg)", color: "var(--green-deep)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Icon name="upload" size={28} />
          </div>
          <h3 style={{ fontSize: 16 }}>
            {selectedFile ? selectedFile.name : "Drop your Excel file here"}
          </h3>
          <p className="muted" style={{ fontSize: 13, marginTop: 6, marginBottom: 18 }}>
            Required columns: <span className="mono">reg_number · full_name · email · phone · org · group</span>
          </p>

          {!selectedFile && (
            <label className="btn btn-primary btn-lg" style={{ cursor: "pointer" }}>
              <Icon name="file" size={16} /> Choose file
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); }}
              />
            </label>
          )}

          {selectedFile && (
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="btn btn-ghost" onClick={() => setSelectedFile(null)}>Change file</button>
              <button
                className="btn btn-primary"
                onClick={doImport}
                disabled={uploading}
              >
                {uploading ? "Importing…" : `Import ${selectedFile.name}`}
              </button>
            </div>
          )}

          {error && (
            <div style={{ marginTop: 16, color: "var(--red)", fontSize: 13, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
              <Icon name="alert" size={15} /> {error}
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="card card-pad" style={{ maxWidth: 560, margin: "0 auto" }}>
          <SuccessScreen
            badge="Import complete"
            title={`${result.count} student${result.count !== 1 ? "s" : ""} imported`}
            sub="They now appear at Registered. Next, assign supervisors and open submission windows."
            actions={
              <button className="btn btn-ghost" onClick={() => { setResult(null); setSelectedFile(null); }}>
                Import another file
              </button>
            }
          />
        </div>
      )}
    </div>
  );
};

/* ---------------- HODRequest ---------------- */
export const HODRequest: React.FC = () => {
  const { students, letters, requestCaseLetters } = useAppContext();
  useNow(1000);
  const [tab, setTab] = useState("todo");
  const [batch, setBatch] = useState(5);
  const [amount, setAmount] = useState(7);
  const [unit, setUnit] = useState("days"); // hours | days
  const [sel, setSel] = useState<{ [stuId: string]: boolean }>({});
  const [sent, setSent] = useState<{ ids: string[]; sample: Student | null; label: string } | null>(null);
  const [found, setFound] = useState<Student | null>(null);

  const durationMs = unit === "hours" ? amount * 3600e3 : amount * 86400e3;
  const previewDeadline = Date.now() + durationMs;
  const durLabel = amount + " " + (amount === 1 ? unit.slice(0, -1) : unit);

  const registered = students.filter(s => s.stateIndex <= 1).map(s => ({
    s,
    L: letters[s.id] || { status: "none" as const },
    deadline: bookDeadline(s)
  }));

  let todo = registered.filter(x => x.L.status === "none").sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  let already = registered.filter(x => x.L.status !== "none").sort((a, b) => (b.L.requestedTs || 0) - (a.L.requestedTs || 0));
  
  if (found) {
    todo = todo.filter(x => x.s.id === found.id);
    already = already.filter(x => x.s.id === found.id);
  }

  const selectedIds = Object.keys(sel).filter(id => sel[id]);
  
  function autoSelect() {
    const m: { [id: string]: boolean } = {};
    todo.slice(0, batch).forEach(x => m[x.s.id] = true);
    setSel(m);
  }
  
  function toggle(id: string) {
    setSel(s => ({ ...s, [id]: !s[id] }));
  }
  
  function handleRequest(ids: string[]) {
    const batchId = "B-2026-" + String(Math.floor(Date.now() / 1000) % 90 + 10);
    const durationDays = unit === "days" ? amount : amount / 24;
    requestCaseLetters(ids, durationDays, batchId);
    setSent({ ids: ids.slice(), sample: students.find(s => s.id === ids[0]) || null, label: durLabel });
    setSel({});
  }

  const stuCell = (s: Student) => (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <Avatar name={s.name} role="Student" size={26} />
      <div>
        <div style={{ fontWeight: 600, color: "var(--ink)" }}>{s.name}</div>
        <div className="mono muted" style={{ fontSize: 10.5 }}>{s.id}</div>
      </div>
    </div>
  );

  return (
    <div>
      <SectionTitle sub="Request case-study letters from students who haven't been selected yet. Set how long they have to submit — hours or days." right={<StudentIdSearch onOpen={setFound} />}>
        Request Letters
      </SectionTitle>

      {/* deadline + batch config */}
      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Submission deadline for this request</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 20, flexWrap: "wrap" }}>
          <div>
            <label className="field-label">Students must submit within</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="input mono" type="number" min={1} value={amount} onChange={e => setAmount(Math.max(1, +e.target.value || 1))} style={{ width: 88 }} />
              <div style={{ display: "flex", border: "1px solid var(--line)", borderRadius: 7, overflow: "hidden", height: 38 }}>
                {["hours", "days"].map(u => (
                  <button 
                    key={u} 
                    onClick={() => setUnit(u)} 
                    style={{ border: 0, padding: "0 14px", cursor: "pointer", fontSize: 13, fontWeight: 600, background: unit === u ? "var(--navy)" : "#fff", color: unit === u ? "#fff" : "var(--ink-2)" }}
                  >
                    {u[0].toUpperCase() + u.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ padding: "9px 14px", background: "var(--surface)", borderRadius: 9, border: "1px solid var(--line)" }}>
            <div className="eyebrow">Window closes</div>
            <div className="mono" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", marginTop: 3 }}>
              {fmtFull(new Date(previewDeadline).toISOString())}
            </div>
          </div>
          <div>
            <label className="field-label">Auto-select batch size</label>
            <input className="input mono" type="number" min={1} value={batch} onChange={e => setBatch(Math.max(1, +e.target.value || 1))} style={{ width: 88 }} />
          </div>
          <button className="btn btn-ghost" onClick={autoSelect} disabled={tab !== "todo" || !todo.length}>
            <Icon name="filter" size={15} /> Auto-select {Math.min(batch, todo.length)} most urgent
          </button>
        </div>
      </div>

      {/* tabs + request action */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <button className={"chip" + (tab === "todo" ? " active" : "")} onClick={() => setTab("todo")}>Awaiting request · {todo.length}</button>
        <button className={"chip" + (tab === "sent" ? " active" : "")} onClick={() => setTab("sent")}>Requested &amp; sent · {already.length}</button>
        {tab === "todo" && selectedIds.length > 0 && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <span className="muted" style={{ fontSize: 12.5 }}>{selectedIds.length} selected · deadline in <strong style={{ color: "var(--ink)" }}>{durLabel}</strong></span>
            <button className="btn btn-amber" onClick={() => handleRequest(selectedIds)}>
              <Icon name="send" size={15} /> Request Letters ({selectedIds.length})
            </button>
          </div>
        )}
      </div>

      {tab === "todo" ? (
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="card-hd">
            <h3>Not yet selected {found && <span className="muted">· {found.id}</span>}</h3>
            <span className="muted" style={{ fontSize: 12 }}>{todo.length} students · sorted by nearest book deadline</span>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 38 }}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === todo.length && todo.length > 0} 
                    onChange={e => {
                      if (e.target.checked) {
                        const m: { [id: string]: boolean } = {};
                        todo.forEach(x => m[x.s.id] = true);
                        setSel(m);
                      } else setSel({});
                    }} 
                  />
                </th>
                <th>Student</th>
                <th>Case study</th>
                <th>Book registered</th>
                <th>Book deadline</th>
              </tr>
            </thead>
            <tbody>
              {todo.map(({ s, deadline }) => (
                <tr key={s.id} onClick={() => toggle(s.id)} className={sel[s.id] ? "is-active" : ""}>
                  <td onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={!!sel[s.id]} onChange={() => toggle(s.id)} />
                  </td>
                  <td>{stuCell(s)}</td>
                  <td className="muted" style={{ fontSize: 12.5 }}>{s.org}</td>
                  <td className="mono" style={{ fontSize: 11.5 }}>{fmt(s.bookRegisteredTs)}</td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <span className="mono" style={{ fontSize: 11.5 }}>{fmt(deadline)}</span>
                      <DeadlinePill deadline={deadline} />
                    </div>
                  </td>
                </tr>
              ))}
              {!todo.length && (
                <tr>
                  <td colSpan={5} className="muted" style={{ textAlign: "center", padding: 22 }}>
                    Every registered student has already been requested. See the “Requested &amp; sent” tab.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="card-hd">
            <h3>Requested &amp; sent {found && <span className="muted">· {found.id}</span>}</h3>
            <span className="muted" style={{ fontSize: 12 }}>{already.length} students</span>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Student</th>
                <th>Case study</th>
                <th>Batch</th>
                <th>Letter status</th>
                <th>Submission deadline</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {already.map(({ s, L }) => {
                const expired = L.deadlineTs ? Date.now() > L.deadlineTs : false;
                const closed = L.status === "requested" && expired;
                return (
                  <tr key={s.id} style={{ cursor: "default" }}>
                    <td>{stuCell(s)}</td>
                    <td className="muted" style={{ fontSize: 12.5 }}>{s.org}</td>
                    <td className="mono muted" style={{ fontSize: 11 }}>{L.batch || "—"}</td>
                    <td>{closed ? <Badge tone="grey" dot>Window closed</Badge> : <LetterStatusBadge status={L.status || "none"} expired={expired} />}</td>
                    <td>
                      {L.deadlineTs ? (
                        L.status === "requested" && !expired ? (
                          <Countdown to={L.deadlineTs} />
                        ) : (
                          <span className="mono muted" style={{ fontSize: 11 }}>{fmtFull(new Date(L.deadlineTs).toISOString())}</span>
                        )
                      ) : (
                        <span className="faint">—</span>
                      )}
                    </td>
                    <td>
                      {closed || L.status === "rejected" ? (
                        <button className="btn btn-ghost btn-sm" onClick={() => handleRequest([s.id])}>
                          <Icon name="refresh" size={13} /> Re-request ({durLabel})
                        </button>
                      ) : L.status === "approved" ? (
                        <Icon name="checkCircle" size={16} style={{ color: "var(--green)" }} />
                      ) : null}
                    </td>
                  </tr>
                );
              })}
              {!already.length && (
                <tr>
                  <td colSpan={6} className="muted" style={{ textAlign: "center", padding: 22 }}>
                    No letters requested yet — select students in the “Awaiting request” tab.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* sent confirmation */}
      <Modal open={!!sent} onClose={() => setSent(null)} width={560}>
        {sent && (
          <div>
            <div className="card card-pad" style={{ marginBottom: 12, boxShadow: "var(--sh-pop)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 44, height: 44, borderRadius: 11, background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                  <Icon name="check" size={22} stroke={2.3} />
                </span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>{sent.ids.length} letter{sent.ids.length > 1 ? "s" : ""} requested</div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    Each student got a tailored email and a <strong>{sent.label}</strong> countdown to submit. They now appear under “Requested &amp; sent”.
                  </div>
                </div>
              </div>
            </div>
            {sent.sample && (
              <EmailPreview 
                templateKey="case-requested" 
                student={sent.sample} 
                status="sent" 
                toName={sent.sample.name} 
                ts={new Date().toISOString()} 
              />
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <button className="btn btn-primary" onClick={() => { setSent(null); setTab("sent"); }}>View requested</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

/* ---------------- ReviewLetterModal ---------------- */
interface ReviewLetterModalProps {
  q: { id: string; student: Student; file: string | null };
  onClose: () => void;
  onResult: (r: { type: 'approved' | 'rejected'; student: Student }) => void;
}

export const ReviewLetterModal: React.FC<ReviewLetterModalProps> = ({ q, onClose, onResult }) => {
  const { approveCaseLetter, returnCaseLetter } = useAppContext();
  const [mode, setMode] = useState<"view" | "reject" | "approve">("view");
  const [reason, setReason] = useState("");
  const [reAmt, setReAmt] = useState(5);
  const [reUnit, setReUnit] = useState("days");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [reqFile, setReqFile] = useState<File | null>(null);

  useEffect(() => {
    if (!q.file) return;
    let objectUrl = '';
    const token = localStorage.getItem('fyp_jwt');
    fetch(`/api/students/${q.student.id}/letter-file`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.blob() : Promise.reject(r.status))
      .then(blob => { objectUrl = URL.createObjectURL(blob); setBlobUrl(objectUrl); })
      .catch(() => { /* file not accessible — no-op */ });
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [q.student.id, q.file]);

  function handleApprove() {
    approveCaseLetter(q.student.id, reqFile ?? undefined);
    onResult({ type: "approved", student: q.student });
  }

  function handleReject() {
    if (!reason.replace(/<[^>]*>/g, "").trim()) return;
    const days = reUnit === "hours" ? reAmt / 24 : reAmt;
    returnCaseLetter(q.student.id, reason, days);
    onResult({ type: "rejected", student: q.student });
  }

  return (
    <Modal open onClose={onClose} width={680}>
      <div className="card" style={{ overflow: "hidden", boxShadow: "var(--sh-pop)", display: "flex", flexDirection: "column", maxHeight: "86vh" }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 18px", borderBottom: "1px solid var(--line)", flex: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <Avatar name={q.student.name} role="Student" size={34} />
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink)" }}>
                {q.student.name} <span className="mono muted" style={{ fontSize: 11, fontWeight: 400 }}>{q.id}</span>
              </div>
              <div className="muted" style={{ fontSize: 12 }}>{q.student.org}{q.file ? ` · ${q.file}` : ''}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><Icon name="x" size={14} /> Close</button>
        </div>
        
        {/* uploaded letter file */}
        <div className="scroll-y" style={{ flex: 1, background: "var(--surface)", display: "flex", flexDirection: "column" }}>
          {q.file ? (
            blobUrl ? (
              q.file.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={blobUrl}
                  style={{ flex: 1, border: "none", minHeight: 480 }}
                  title="Case letter"
                />
              ) : (
                <div style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                  <Icon name="file" size={40} style={{ color: "var(--ink-3)" }} />
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>{q.file}</div>
                  <p className="muted" style={{ fontSize: 13, textAlign: "center" }}>
                    This file cannot be previewed inline. Download it to view.
                  </p>
                  <a
                    href={blobUrl}
                    download={q.file}
                    className="btn btn-primary"
                    style={{ textDecoration: "none" }}
                  >
                    <Icon name="file" size={15} /> Download letter
                  </a>
                </div>
              )
            ) : (
              <div style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div className="muted" style={{ fontSize: 13 }}>Loading letter…</div>
              </div>
            )
          ) : (
            <div style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <Icon name="alert" size={32} style={{ color: "var(--amber)" }} />
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>No file uploaded</div>
              <p className="muted" style={{ fontSize: 13, textAlign: "center" }}>
                The student submitted their case letter without attaching a file.
              </p>
            </div>
          )}
        </div>
        
        {/* sticky answer bar */}
        <div style={{ flex: "none", borderTop: "1px solid var(--line)", background: "#fff" }}>
          {mode === "view" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "13px 18px" }}>
              <span className="muted" style={{ fontSize: 12.5 }}>
                <Icon name="layers" size={14} style={{ verticalAlign: -2, marginRight: 5 }} />
                Decide here — no need to close the letter
              </span>
              <div style={{ display: "flex", gap: 9 }}>
                <button className="btn btn-danger" onClick={() => setMode("reject")}><Icon name="x" size={15} /> Return for revision</button>
                <button className="btn btn-primary" onClick={() => setMode("approve")}><Icon name="check" size={15} /> Approve</button>
              </div>
            </div>
          )}
          
          {mode === "reject" && (
            <div style={{ padding: "14px 18px" }}>
              <div className="eyebrow" style={{ marginBottom: 8, color: "var(--red-deep)" }}>
                Reason for returning — {q.student.name} will see this
              </div>
              <RichText value={reason} onChange={setReason} placeholder="e.g. The acceptance letter is unsigned; attach the signed version and tighten the objectives…" minHeight={88} />
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, padding: "10px 12px", background: "var(--amber-bg)", borderRadius: 8, flexWrap: "wrap" }}>
                <Icon name="refresh" size={15} style={{ color: "var(--amber-deep)", flex: "none" }} />
                <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>Reopen submission window for</span>
                <input className="input mono" type="number" min={1} value={reAmt} onChange={e => setReAmt(Math.max(1, +e.target.value || 1))} style={{ width: 70, height: 32 }} />
                <div style={{ display: "flex", border: "1px solid var(--line)", borderRadius: 7, overflow: "hidden", height: 32 }}>
                  {["hours", "days"].map(u => (
                    <button 
                      key={u} 
                      onClick={() => setReUnit(u)} 
                      style={{ border: 0, padding: "0 12px", cursor: "pointer", fontSize: 12.5, fontWeight: 600, background: reUnit === u ? "var(--navy)" : "#fff", color: reUnit === u ? "#fff" : "var(--ink-2)" }}
                    >
                      {u[0].toUpperCase() + u.slice(1)}
                    </button>
                  ))}
                </div>
                <span className="muted" style={{ fontSize: 11.5 }}>so they can revise &amp; resend</span>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, marginTop: 12 }}>
                <button className="btn btn-ghost" onClick={() => setMode("view")}>Back to letter</button>
                <button className="btn btn-danger" onClick={handleReject} disabled={!reason.replace(/<[^>]*>/g, "").trim()}>
                  <Icon name="send" size={14} /> Send reason &amp; return
                </button>
              </div>
            </div>
          )}
          
          {mode === "approve" && (
            <div style={{ padding: "14px 18px" }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>
                Attach prototype requirements (optional)
              </div>
              <div style={{ marginBottom: 12 }}>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  style={{ fontSize: 13 }}
                  onChange={e => setReqFile(e.target.files?.[0] ?? null)}
                />
                {reqFile && (
                  <div style={{ marginTop: 5, fontSize: 12, color: "var(--green)" }}>
                    ✓ {reqFile.name} — will be sent to the student
                  </div>
                )}
                {!reqFile && (
                  <div style={{ marginTop: 5, fontSize: 12, color: "var(--ink-3)" }}>
                    No file — student will be approved without a requirements document.
                  </div>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 9 }}>
                <button className="btn btn-ghost" onClick={() => setMode("view")}>Back to letter</button>
                <button className="btn btn-primary" onClick={handleApprove}>
                  <Icon name="check" size={15} /> Approve &amp; notify student
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

/* ---------------- HODReview ---------------- */
export const HODReview: React.FC = () => {
  const { students } = useAppContext();
  const [review, setReview] = useState<{ id: string; student: Student; file: string | null } | null>(null);
  const [result, setResult] = useState<{ type: 'approved' | 'rejected'; student: Student } | null>(null);
  const [found, setFound] = useState<Student | null>(null);

  // Students at CASE_LETTER_SUBMITTED state (stateIndex === 1) — driven by real API state
  const queue = students
    .filter(s => s.stateIndex === 1)
    .map(s => ({
      id: s.id,
      student: s,
      file: s.letterFileName || null
    }));

  const list = found ? queue.filter(q => q.id === found.id) : queue;

  function handleResult(r: { type: 'approved' | 'rejected'; student: Student }) {
    setResult(r);
    setReview(null);
  }

  return (
    <div>
      <SectionTitle sub="Open a submitted letter and approve or return it from within the letter view — even for long, multi-page letters." right={<StudentIdSearch onOpen={setFound} />}>
        Review Letters
      </SectionTitle>

      {result && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: result.type === "approved" ? "var(--green-bg)" : "var(--red-bg)", borderRadius: 10, marginBottom: 16, fontSize: 13, color: result.type === "approved" ? "var(--green-deep)" : "var(--red-deep)" }}>
          <Icon name={result.type === "approved" ? "checkCircle" : "refresh"} size={16} />
          {result.type === "approved" ? (
            <span><strong>{result.student.name}</strong> approved — letter accepted and the student has been moved to the Prototype Review phase.</span>
          ) : (
            <span><strong>{result.student.name}</strong>'s letter returned — your reason was sent and is visible on their letter page so they can revise &amp; resend.</span>
          )}
          <button className="btn btn-quiet btn-sm" onClick={() => setResult(null)} style={{ marginLeft: "auto" }}>Dismiss</button>
        </div>
      )}

      {list.length ? (
        <div className="card" style={{ overflow: "hidden", maxWidth: 920 }}>
          <div className="card-hd">
            <h3>In review</h3>
            <Badge tone="blue">{queue.length} pending</Badge>
          </div>
          {list.map((q, i) => (
            <div key={q.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 18px", borderTop: i ? "1px solid var(--line-soft)" : 0 }}>
              <Avatar name={q.student.name} role="Student" size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: 13.5 }}>
                  {q.student.name} <span className="mono muted" style={{ fontSize: 11, fontWeight: 400 }}>{q.id}</span>
                </div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {q.student.org} · <span className="mono">{q.file || "no file attached"}</span>
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setReview(q)}>
                <Icon name="eye" size={14} /> Open &amp; review
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="card card-pad" style={{ maxWidth: 560, textAlign: "center", padding: 40 }}>
          <Icon name="checkCircle" size={30} style={{ color: "var(--green)" }} />
          <h3 style={{ marginTop: 10 }}>{found ? "No submitted letter for " + found.id : "Queue cleared"}</h3>
          <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            {found ? "That student hasn't submitted a letter yet." : "All submitted letters have been reviewed."}
          </p>
        </div>
      )}

      {review && (
        <ReviewLetterModal 
          q={review} 
          onClose={() => setReview(null)} 
          onResult={handleResult} 
        />
      )}
    </div>
  );
};

/* ---------------- HODSupervisors ---------------- */
export const HODSupervisors: React.FC = () => {
  const { students, assignSupervisor } = useAppContext();
  const [supList, setSupList] = useState<UserResponse[]>([]);
  const [supMap, setSupMap]   = useState<Record<string, UserResponse>>({});
  const [loadingSups, setLoadingSups] = useState(true);
  const [assigned, setAssigned] = useState<{ [stuId: string]: string }>({});

  useEffect(() => {
    usersApi.byRole('SUPERVISOR')
      .then(sups => {
        setSupList(sups);
        setSupMap(Object.fromEntries(sups.map(s => [s.id, s])));
      })
      .finally(() => setLoadingSups(false));
  }, []);

  // All students who don't yet have a supervisor assigned
  const sample = students.filter(s => !s.supervisorId && s.stateIndex < 12);
  
  return (
    <div>
      <SectionTitle sub="Assign a supervisor once a proposal is accepted. The student gets an email with a WhatsApp button; the supervisor is notified too.">
        Assign Supervisors
      </SectionTitle>
      
      <div className="card" style={{ overflow: "hidden", maxWidth: 880 }}>
        <div className="card-hd"><h3>Students without a supervisor</h3><Badge tone="amber">{sample.length}</Badge></div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Student</th>
              <th>Topic</th>
              <th>Assign supervisor</th>
            </tr>
          </thead>
          <tbody>
            {loadingSups && (
              <tr><td colSpan={3} className="muted" style={{ textAlign: 'center', padding: 20 }}>Loading supervisors…</td></tr>
            )}
            {!loadingSups && sample.map(s => {
              const done = assigned[s.id] || s.supervisorId;
              return (
                <tr key={s.id} style={{ cursor: "default" }}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <Avatar name={s.name} role="Student" size={26} />
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--ink)" }}>{s.name}</div>
                        <div className="mono muted" style={{ fontSize: 10.5 }}>{s.reg}</div>
                      </div>
                    </div>
                  </td>
                  <td className="muted" style={{ fontSize: 12.5 }}>{s.topic || '—'}</td>
                  <td>
                    {done ? (
                      <Badge tone="green" dot>{supMap[done]?.fullName || done}</Badge>
                    ) : (
                      <select
                        className="select"
                        style={{ width: 220, height: 34 }}
                        defaultValue=""
                        onChange={e => {
                          if (e.target.value) {
                            assignSupervisor(s.id, e.target.value);
                            setAssigned(a => ({ ...a, [s.id]: e.target.value }));
                          }
                        }}
                      >
                        <option value="" disabled>Choose supervisor…</option>
                        {supList.map((x: any) => (
                          <option key={x.id} value={x.id}>{x.fullName}</option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              );
            })}
            {!loadingSups && !sample.length && (
              <tr><td colSpan={3} className="muted" style={{ textAlign: 'center', padding: 22 }}>All students have been assigned a supervisor.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      
    </div>
  );
};

/* ---------------- ProtoReview ---------------- */
export const ProtoReview: React.FC = () => {
  const { students, refreshStudents } = useAppContext();
  const [loading, setLoading] = useState<string | null>(null);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const awaiting    = students.filter(s => s.stateIndex === 2); // CASE_LETTER_APPROVED
  const underReview = students.filter(s => s.stateIndex === 3); // PROTOTYPE_REVIEW
  const granted     = students.filter(s => s.stateIndex === 4); // PROTOTYPE_GRANTED

  async function callForReview(studentId: string) {
    setLoading(studentId);
    try {
      await studentsApi.transition(studentId, 'PROTOTYPE_REVIEW');
      notify('Student called for prototype review', 'success');
      await refreshStudents();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Failed', 'error');
    } finally { setLoading(null); }
  }

  async function recordOutcome(studentId: string, outcome: 'PROTOTYPE_REVIEW' | 'PROTOTYPE_GRANTED') {
    setLoading(studentId);
    try {
      await studentsApi.transition(studentId, outcome, note.trim() || undefined);
      notify(outcome === 'PROTOTYPE_GRANTED' ? 'Prototype granted ✓' : 'Marked as needs refinement', 'success');
      setNoteFor(null); setNote('');
      await refreshStudents();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Failed', 'error');
    } finally { setLoading(null); }
  }

  return (
    <div>
      <SectionTitle sub="Manage prototype review sessions. Call students in, record outcomes, and grant access to proposal submission.">
        Prototype Review
      </SectionTitle>

      {/* ── Awaiting call ── */}
      <div className="card" style={{ overflow: 'hidden', marginBottom: 18 }}>
        <div className="card-hd">
          <h3>Awaiting prototype review call</h3>
          <Badge tone="blue">{awaiting.length}</Badge>
        </div>
        <table className="tbl">
          <thead><tr><th>Student</th><th>Organisation</th><th>Topic</th><th>Action</th></tr></thead>
          <tbody>
            {awaiting.map(s => (
              <tr key={s.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <Avatar name={s.name} role="Student" size={26} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                      <div className="mono muted" style={{ fontSize: 10.5 }}>{s.reg}</div>
                    </div>
                  </div>
                </td>
                <td className="muted" style={{ fontSize: 12.5 }}>{s.org || '—'}</td>
                <td className="muted" style={{ fontSize: 12.5 }}>{s.topic || '—'}</td>
                <td>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={loading === s.id}
                    onClick={() => callForReview(s.id)}
                  >
                    {loading === s.id ? 'Calling…' : 'Call for Review'}
                  </button>
                </td>
              </tr>
            ))}
            {!awaiting.length && (
              <tr><td colSpan={4} className="muted" style={{ textAlign: 'center', padding: 20 }}>No students waiting for a prototype review call.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Under review ── */}
      <div className="card" style={{ overflow: 'hidden', marginBottom: 18 }}>
        <div className="card-hd">
          <h3>Currently under prototype review</h3>
          <Badge tone="amber">{underReview.length}</Badge>
        </div>
        <table className="tbl">
          <thead><tr><th>Student</th><th>Organisation</th><th>Attempts</th><th>Outcome</th></tr></thead>
          <tbody>
            {underReview.map(s => (
              <React.Fragment key={s.id}>
                <tr>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <Avatar name={s.name} role="Student" size={26} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                        <div className="mono muted" style={{ fontSize: 10.5 }}>{s.reg}</div>
                      </div>
                    </div>
                  </td>
                  <td className="muted" style={{ fontSize: 12.5 }}>{s.org || '—'}</td>
                  <td>
                    <Badge tone={s.protoPres >= 2 ? 'red' : 'amber'}>{s.protoPres} attempt{s.protoPres !== 1 ? 's' : ''}</Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-sm"
                        style={{ background: 'var(--green)', color: '#fff' }}
                        disabled={loading === s.id}
                        onClick={() => { setNoteFor(s.id); setNote(''); }}
                      >
                        Grant ✓
                      </button>
                      <button
                        className="btn btn-quiet btn-sm"
                        disabled={loading === s.id}
                        onClick={() => recordOutcome(s.id, 'PROTOTYPE_REVIEW')}
                      >
                        Needs refinement ↺
                      </button>
                    </div>
                  </td>
                </tr>
                {noteFor === s.id && (
                  <tr>
                    <td colSpan={4} style={{ background: 'var(--green-bg)', padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                          <label className="field-label">Note for student (optional)</label>
                          <input className="input" placeholder="e.g. Strong prototype, approved to proceed" value={note} onChange={e => setNote(e.target.value)} />
                        </div>
                        <button className="btn btn-primary btn-sm" disabled={loading === s.id} onClick={() => recordOutcome(s.id, 'PROTOTYPE_GRANTED')}>
                          {loading === s.id ? 'Saving…' : 'Confirm Grant'}
                        </button>
                        <button className="btn btn-quiet btn-sm" onClick={() => setNoteFor(null)}>Cancel</button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {!underReview.length && (
              <tr><td colSpan={4} className="muted" style={{ textAlign: 'center', padding: 20 }}>No students currently in prototype review.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Granted ── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="card-hd">
          <h3>Prototype granted — awaiting proposal</h3>
          <Badge tone="green">{granted.length}</Badge>
        </div>
        <table className="tbl">
          <thead><tr><th>Student</th><th>Organisation</th><th>Topic</th><th>Status</th></tr></thead>
          <tbody>
            {granted.map(s => (
              <tr key={s.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <Avatar name={s.name} role="Student" size={26} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                      <div className="mono muted" style={{ fontSize: 10.5 }}>{s.reg}</div>
                    </div>
                  </div>
                </td>
                <td className="muted" style={{ fontSize: 12.5 }}>{s.org || '—'}</td>
                <td className="muted" style={{ fontSize: 12.5 }}>{s.topic || '—'}</td>
                <td><Badge tone="green" dot>Can submit proposal</Badge></td>
              </tr>
            ))}
            {!granted.length && (
              <tr><td colSpan={4} className="muted" style={{ textAlign: 'center', padding: 20 }}>No students have been granted prototype approval yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ---------------- ProposalReview ---------------- */
export const ProposalReview: React.FC = () => {
  const { students } = useAppContext();
  const [active, setActive] = useState<Student | null>(null);
  const [result, setResult] = useState<{ type: 'accepted' | 'rejected'; name: string } | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const queue = students.filter(s => s.stateIndex === 5); // PROPOSAL_UNDER_REVIEW

  useEffect(() => {
    setBlobUrl(null);
    if (!active) return;
    let url = '';
    const token = localStorage.getItem('fyp_jwt');
    fetch(`/api/proposals/${active.id}/latest-file`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.blob() : Promise.reject())
      .then(blob => { url = URL.createObjectURL(blob); setBlobUrl(url); })
      .catch(() => {});
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [active?.id]);

  async function decide(decision: 'ACCEPTED' | 'REJECTED') {
    if (!active) return;
    if (decision === 'REJECTED' && !reason.trim()) return;
    setSubmitting(true);
    try {
      await proposalsApi.review(active.id, decision, reason.trim() || undefined);
      setResult({ type: decision === 'ACCEPTED' ? 'accepted' : 'rejected', name: active.name });
      setActive(null);
      setReason('');
      setBlobUrl(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <SectionTitle sub="Review submitted proposal documents and record an accept or reject decision.">
        Proposal Review
      </SectionTitle>

      {result && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13,
          background: result.type === 'accepted' ? 'var(--green-bg)' : 'var(--red-bg)',
          color: result.type === 'accepted' ? 'var(--green-deep)' : 'var(--red-deep)' }}>
          <Icon name={result.type === 'accepted' ? 'checkCircle' : 'refresh'} size={16} />
          <span><strong>{result.name}</strong> — proposal {result.type === 'accepted' ? 'accepted and moved to supervision phase' : 'rejected, student notified'}.</span>
          <button className="btn btn-quiet btn-sm" onClick={() => setResult(null)} style={{ marginLeft: 'auto' }}>Dismiss</button>
        </div>
      )}

      {/* Queue */}
      <div className="card" style={{ overflow: 'hidden', marginBottom: 18 }}>
        <div className="card-hd">
          <h3>Awaiting review</h3>
          <Badge tone="amber">{queue.length} pending</Badge>
        </div>
        <table className="tbl">
          <thead><tr><th>Student</th><th>Organisation</th><th>Topic</th><th>Action</th></tr></thead>
          <tbody>
            {queue.map(s => (
              <tr key={s.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <Avatar name={s.name} role="Student" size={26} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                      <div className="mono muted" style={{ fontSize: 10.5 }}>{s.reg}</div>
                    </div>
                  </div>
                </td>
                <td className="muted" style={{ fontSize: 12.5 }}>{s.org || '—'}</td>
                <td className="muted" style={{ fontSize: 12.5 }}>{s.topic || '—'}</td>
                <td>
                  <button className="btn btn-quiet btn-sm" onClick={() => { setActive(s); setReason(''); }}>
                    <Icon name="file" size={14} /> Open proposal
                  </button>
                </td>
              </tr>
            ))}
            {!queue.length && (
              <tr><td colSpan={4} className="muted" style={{ textAlign: 'center', padding: 20 }}>No proposals are currently under review.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Review modal */}
      {active && (
        <Modal open onClose={() => { setActive(null); setBlobUrl(null); setReason(''); }} width={700}>
          <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '88vh' }}>
            {/* header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', borderBottom: '1px solid var(--line)', flex: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <Avatar name={active.name} role="Student" size={34} />
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{active.name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{active.topic || 'No topic'} · {active.org || ''}</div>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => { setActive(null); setBlobUrl(null); setReason(''); }}>
                <Icon name="x" size={14} /> Close
              </button>
            </div>

            {/* proposal document */}
            <div style={{ flex: 1, background: 'var(--surface)', display: 'flex', flexDirection: 'column', minHeight: 360 }}>
              {blobUrl ? (
                <iframe src={blobUrl} style={{ flex: 1, border: 'none', minHeight: 360 }} title="Proposal" />
              ) : (
                <div style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <Icon name="file" size={36} style={{ color: 'var(--ink-3)' }} />
                  <div className="muted" style={{ fontSize: 13 }}>Loading proposal…</div>
                  <div className="muted" style={{ fontSize: 12 }}>If nothing appears, the student may not have attached a file.</div>
                </div>
              )}
            </div>

            {/* decision bar */}
            <div style={{ flex: 'none', borderTop: '1px solid var(--line)', padding: '14px 18px', background: '#fff' }}>
              <div style={{ marginBottom: 10 }}>
                <label className="field-label">Rejection reason <span className="muted">(required only when rejecting)</span></label>
                <textarea
                  className="input"
                  rows={2}
                  style={{ width: '100%', marginTop: 5, resize: 'vertical' }}
                  placeholder="Explain what needs to be improved so the student can revise…"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9 }}>
                <button className="btn btn-danger" disabled={submitting || !reason.trim()} onClick={() => decide('REJECTED')}>
                  <Icon name="x" size={14} /> Reject
                </button>
                <button className="btn btn-primary" disabled={submitting} onClick={() => decide('ACCEPTED')}>
                  <Icon name="check" size={14} /> Accept proposal
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

/* ---------------- HODRecords ---------------- */
export const HODRecords: React.FC = () => {
  return <FacProtoData />;
};

/* ---------------- HODSupervisorWindow ---------------- */
export const HODSupervisorWindow: React.FC = () => {
  const { students } = useAppContext();
  const [tab, setTab] = useState("overview");
  const [focus, setFocus] = useState<Student | null>(null);
  
  const mine = students.filter(s => s.supervisorId === "hod-biz");
  
  const tabs = [
    { id: "overview", label: "Overview", icon: "dashboard" },
    { id: "supervision", label: "Supervision", icon: "activity" },
    { id: "availability", label: "Availability & Sessions", icon: "calendar" },
    { id: "examining", label: "Examining", icon: "scale" },
    { id: "settings", label: "WhatsApp & Contact", icon: "whatsapp" },
  ];

  function goTab(t: string, id?: string) {
    setTab(t);
    setFocus(students.find(s => s.id === id) || null);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 11, padding: "12px 16px", background: "var(--green-bg)", border: "1px solid #BCE2CC", borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
        <Icon name="users" size={17} style={{ color: "var(--green-deep)", flex: "none", marginTop: 1 }} />
        <span style={{ color: "var(--ink-2)" }}>
          As HOD you also supervise <strong>{mine.length}</strong> student{mine.length === 1 ? "" : "s"} directly. This window gives you the full supervisor toolset — meetings, availability, group sessions, attendance and examining — scoped to your own students.
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button 
            key={t.id} 
            className={"chip" + (tab === t.id ? " active" : "")} 
            onClick={() => { setTab(t.id); setFocus(null); }}
          >
            <Icon name={t.icon} size={13} /> {t.label}
          </button>
        ))}
      </div>
      {tab === "overview" && <SupDashboard onOpen={goTab} onNav={setTab} />}
      {tab === "supervision" && <SupSupervision focusStudent={focus?.id || null} />}
      {tab === "availability" && <SupAvailability />}
      {tab === "examining" && <SupExamining focusStudent={focus} />}
      {tab === "settings" && <SupSettings />}
    </div>
  );
};
