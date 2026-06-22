import React, { useState } from 'react';
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
  DocChip, 
  Countdown, 
  useNow 
} from '../components/LetterUI';
import { EmailPreview } from '../components/Emails';
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
  SUPERVISORS, 
  supById, 
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
  const { students, letters } = useAppContext();
  const [found, setFound] = useState<Student | null>(null);

  const counts: { [key: number]: number } = {};
  students.forEach(s => {
    counts[s.stateIndex] = (counts[s.stateIndex] || 0) + 1;
  });

  const total = students.length;
  
  // Count by status
  const ls = { requested: 0, submitted: 0, approved: 0, rejected: 0 };
  Object.values(letters).forEach(L => {
    if (L.status && L.status !== "none") {
      ls[L.status as 'requested' | 'submitted' | 'approved' | 'rejected']++;
    }
  });

  const approaching = students.filter(s => s.stateIndex <= 1)
    .map(s => ({ s, deadline: bookDeadline(s) }))
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 6);

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
            <h3>Approaching Final-Year-Book deadline</h3>
            <button className="btn btn-quiet btn-sm" onClick={() => onNav("request")}>
              Request letters <Icon name="arrowRight" size={13} />
            </button>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Student</th>
                <th>Case study</th>
                <th>Deadline</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {approaching.map(({ s, deadline }) => (
                <tr key={s.id} style={{ cursor: "default" }}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Avatar name={s.name} role="Student" size={24} />
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: 12.5 }}>{s.name}</div>
                        <div className="mono muted" style={{ fontSize: 10 }}>{s.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="muted" style={{ fontSize: 12 }}>{s.org}</td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <span className="mono" style={{ fontSize: 11.5 }}>{fmt(deadline)}</span>
                      <DeadlinePill deadline={deadline} />
                    </div>
                  </td>
                  <td>
                    <LetterStatusBadge 
                      status={letters[s.id]?.status || "none"} 
                      expired={letters[s.id]?.deadlineTs ? Date.now() > letters[s.id]!.deadlineTs! : false} 
                    />
                  </td>
                </tr>
              ))}
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
  const [stage, setStage] = useState(1);
  const rows = [
    { id: "STU-2026-041", name: "Mutoni Aline", org: "Inkomoko", reg: "12 Aug 2025", ok: true, err: "" },
    { id: "STU-2026-042", name: "Gatete Yves", org: "AC Group (Tap&Go)", reg: "03 Jul 2025", ok: true, err: "" },
    { id: "STU-2026-043", name: "Cyiza Belinda", org: "Equity Bank", reg: "20 Sep 2025", ok: true, err: "" },
    { id: "STU-2026-044", name: "Iradukunda Kevin", org: "RSSB", reg: "05 Oct 2025", ok: true, err: "" },
    { id: "STU-2026-045", name: "Umutoni Clarisse", org: "Zipline Rwanda", reg: "28 Aug 2025", ok: true, err: "" },
    { id: "STU-2026-046", name: "Ishimwe Grace", org: "—", reg: "11 Sep 2025", ok: false, err: "Missing case-study org" },
    { id: "STU-2026-042", name: "Gatete Y.", org: "AC Group", reg: "—", ok: false, err: "Duplicate ID / missing date" },
  ];
  const valid = rows.filter(r => r.ok).length;
  
  return (
    <div>
      <SectionTitle sub="Upload the registered-student list. Columns: Student ID, Name, Case-Study Organisation, Book-Registration Date. The date starts each student's 1-year clock.">
        Upload Students
      </SectionTitle>
      
      {stage === 0 && (
        <div className="card card-pad" style={{ maxWidth: 640, textAlign: "center", padding: "44px 30px", margin: "0 auto" }}>
          <div style={{ width: 60, height: 60, borderRadius: 14, background: "var(--green-bg)", color: "var(--green-deep)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Icon name="upload" size={28} />
          </div>
          <h3 style={{ fontSize: 16 }}>Drop your Excel / CSV file here</h3>
          <p className="muted" style={{ fontSize: 13, marginTop: 6, marginBottom: 18 }}>
            Columns: Student ID, Name, Case-Study Organisation, Book-Registration Date.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => setStage(1)}>
            <Icon name="file" size={16} /> Select class-of-2026.xlsx
          </button>
        </div>
      )}
      
      {stage === 1 && (
        <div className="card" style={{ overflow: "hidden", maxWidth: 880, margin: "0 auto" }}>
          <div className="card-hd">
            <h3>Preview &amp; validation — class-of-2026.xlsx</h3>
            <div style={{ display: "flex", gap: 8 }}>
              <Badge tone="green">{valid} valid</Badge>
              <Badge tone="red">{rows.length - valid} errors</Badge>
            </div>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Case-Study Organisation</th>
                <th>Book Registered</th>
                <th>Validation</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ cursor: "default", background: r.ok ? "" : "var(--red-bg)" }}>
                  <td className="mono">{r.id}</td>
                  <td style={{ fontWeight: 600, color: "var(--ink)" }}>{r.name}</td>
                  <td className="muted" style={{ fontSize: 12.5 }}>{r.org}</td>
                  <td className="mono" style={{ fontSize: 11.5 }}>{r.reg}</td>
                  <td>
                    {r.ok ? (
                      <span style={{ color: "var(--green-deep)", display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
                        <Icon name="check" size={14} /> OK
                      </span>
                    ) : (
                      <span style={{ color: "var(--red)", display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
                        <Icon name="alert" size={14} /> {r.err}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: "var(--surface)", borderTop: "1px solid var(--line)" }}>
            <span className="muted" style={{ fontSize: 12.5 }}>
              Only the {valid} valid rows will be imported, each at <strong>Registered</strong> with the 1-year clock started.
            </span>
            <div style={{ display: "flex", gap: 9 }}>
              <button className="btn btn-ghost" onClick={() => setStage(0)}>Choose another file</button>
              <button className="btn btn-primary" onClick={() => setStage(2)}>Import {valid} students</button>
            </div>
          </div>
        </div>
      )}
      
      {stage === 2 && (
        <div className="card card-pad" style={{ maxWidth: 560, margin: "0 auto" }}>
          <SuccessScreen 
            badge="Import complete" 
            title={valid + " students imported"}
            sub="They now appear at Registered with their book-registration date recorded. Next, go to Request Letters to open their submission windows."
            actions={<button className="btn btn-ghost" onClick={() => setStage(stage - 1)}>Back to preview</button>} 
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
  q: { id: string; student: Student; file: string };
  onClose: () => void;
  onResult: (r: { type: 'approved' | 'rejected'; student: Student }) => void;
}

export const ReviewLetterModal: React.FC<ReviewLetterModalProps> = ({ q, onClose, onResult }) => {
  const { approveCaseLetter, returnCaseLetter } = useAppContext();
  const [mode, setMode] = useState<"view" | "reject" | "approve">("view");
  const [reason, setReason] = useState("");
  const doc = { name: "fyp-requirements-class-2026.docx", size: "46 KB", pages: 3 };
  const [reAmt, setReAmt] = useState(5);
  const [reUnit, setReUnit] = useState("days");

  function handleApprove() {
    approveCaseLetter(q.student.id);
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
              <div className="muted" style={{ fontSize: 12 }}>{q.student.org} · {q.file}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><Icon name="x" size={14} /> Close</button>
        </div>
        
        {/* scrollable letter */}
        <div className="scroll-y" style={{ flex: 1, padding: 18, background: "var(--surface)" }}>
          <LetterPaper student={q.student} long />
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
                Attach requirements (Word) — advances {q.student.name} to Prototyping
              </div>
              <DocChip doc={doc} action="Preview" tone="navy" />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, marginTop: 10 }}>
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
  const { students, letters } = useAppContext();
  const [review, setReview] = useState<{ id: string; student: Student; file: string } | null>(null);
  const [result, setResult] = useState<{ type: 'approved' | 'rejected'; student: Student } | null>(null);
  const [found, setFound] = useState<Student | null>(null);

  // submitted list
  const queue = students
    .filter(s => letters[s.id]?.status === "submitted")
    .map(s => ({
      id: s.id,
      student: s,
      file: letters[s.id]?.file || "case-letter.pdf"
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
            <span><strong>{result.student.name}</strong> approved — requirements document sent and the student now sees the Prototyping phase on their dashboard.</span>
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
                  {q.student.org} · <span className="mono">{q.file}</span> · 4-page letter
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
  const sample = students.filter(s => s.stateIndex >= 6).slice(0, 4);
  const [assigned, setAssigned] = useState<{ [stuId: string]: string }>({});
  const [emailFor, setEmailFor] = useState<{ s: Student; sup: any } | null>(null);
  
  return (
    <div>
      <SectionTitle sub="Assign a supervisor once a proposal is accepted. The student gets an email with a WhatsApp button; the supervisor is notified too.">
        Assign Supervisors
      </SectionTitle>
      
      <div className="card" style={{ overflow: "hidden", maxWidth: 880 }}>
        <div className="card-hd"><h3>Awaiting supervisor</h3><Badge tone="amber">{sample.length}</Badge></div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Student</th>
              <th>Topic</th>
              <th>Assign supervisor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sample.map(s => {
              const done = assigned[s.id] || s.supervisorId;
              return (
                <tr key={s.id} style={{ cursor: "default" }}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <Avatar name={s.name} role="Student" size={26} />
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--ink)" }}>{s.name}</div>
                        <div className="mono muted" style={{ fontSize: 10.5 }}>{s.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="muted" style={{ fontSize: 12.5 }}>{s.topic}</td>
                  <td>
                    {done ? (
                      <Badge tone="green" dot>{supById[done]?.name || done}</Badge>
                    ) : (
                      <select 
                        className="select" 
                        style={{ width: 200, height: 34 }} 
                        defaultValue="" 
                        onChange={e => {
                          if (e.target.value) {
                            assignSupervisor(s.id, e.target.value);
                            setAssigned(a => ({ ...a, [s.id]: e.target.value }));
                            setEmailFor({ s, sup: supById[e.target.value] });
                          }
                        }}
                      >
                        <option value="" disabled>Choose supervisor…</option>
                        {SUPERVISORS.map(x => (
                          <option key={x.id} value={x.id}>{x.name} — {x.title}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>
                    {done && (
                      <span style={{ color: "var(--green-deep)", fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
                        <Icon name="mail" size={14} /> Emailed
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <Modal open={!!emailFor} onClose={() => setEmailFor(null)} width={540}>
        {emailFor && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <Badge tone="amber" dot>KEY EVENT · SUPERVISOR ASSIGNED</Badge>
              <button className="btn btn-ghost btn-sm" onClick={() => setEmailFor(null)}>
                <Icon name="x" size={14} /> Close
              </button>
            </div>
            <EmailPreview 
              templateKey="sup-assigned" 
              student={emailFor.s} 
              supervisor={emailFor.sup} 
              status="sent" 
              toName={emailFor.s.name} 
              ts={new Date().toISOString()} 
            />
          </div>
        )}
      </Modal>
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
