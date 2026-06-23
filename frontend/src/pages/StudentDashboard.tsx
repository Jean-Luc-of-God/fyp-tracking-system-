import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { studentsApi } from '../api/students';
import { supervisionApi } from '../api/supervision';
import { mapStudent, mapMeeting } from '../utils/mappers';
import { getToken } from '../api/client';
import { 
  Icon, 
  Badge, 
  Avatar, 
  StateTracker, 
  EmptyState, 
  SectionTitle, 
  WhatsAppButton 
} from '../components/SharedUI';
import { LetterStatusBadge, Countdown, DocChip, notify } from '../components/LetterUI';
import { Timeline } from '../components/Timeline';
import { SupervisorAvailabilityPanel } from '../components/AvailabilityUI';
import { 
  bookDeadline,
  daysLeft,
  fmt, 
  fmtFull, 
  supById,
  WA_GROUPS
} from '../utils/fypData';
import type { Student } from '../types';

/* build the student's timeline from book registration + letter store */
export function studentLetterEvents(stu: Student, letters: any): any[] {
  const L = letters[stu.id] || { status: 'none' };
  const ev: any[] = [
    { 
      st: 0, 
      label: "Registered in cohort · Class of 2026", 
      actor: { name: "Dr. Bizimungu", role: "HOD" }, 
      ts: stu.bookRegisteredTs, 
      email: "reg-confirmed", 
      note: "Final Year Book registered — the 1-year deadline begins here" 
    }
  ];

  if (L.requestedTs) {
    ev.push({ 
      st: 1, 
      label: "Case-study letter requested by HOD", 
      actor: { name: "Dr. Bizimungu", role: "HOD" }, 
      ts: new Date(L.requestedTs).toISOString(), 
      note: "Submission window opened — you can now send your letter" 
    });
  }
  if (L.submittedTs) {
    ev.push({ 
      st: 1, 
      label: "Case-study letter submitted", 
      actor: { name: stu.name, role: "Student" }, 
      ts: new Date(L.submittedTs).toISOString(), 
      file: L.file || "case-letter.pdf" 
    });
  }
  if (L.status === "rejected" && L.rejectedTs) {
    ev.push({ 
      st: 1, 
      kind: "rework", 
      label: "Letter returned for revision", 
      actor: { name: "Dr. Bizimungu", role: "HOD" }, 
      ts: new Date(L.rejectedTs).toISOString(), 
      reasonHtml: L.rejectionReason 
    });
  }
  if (L.status === "approved" && L.approvedTs) {
    ev.push({ 
      st: 2, 
      label: "Case letter approved — advance to Prototyping", 
      actor: { name: "Dr. Bizimungu", role: "HOD" }, 
      ts: new Date(L.approvedTs).toISOString(), 
      email: "case-approved", 
      note: "Requirements document attached" 
    });
  }

  return ev.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
}

interface NavProps {
  onNav: (view: string) => void;
}

/* Hook: load the logged-in student's own record from the API */
function useMyStudent() {
  const { students, activeUserId } = useAppContext();
  const [apiStu, setApiStu] = useState<import('../types').Student | null>(null);

  useEffect(() => {
    if (!getToken()) return;
    studentsApi.me().then(r => setApiStu(mapStudent(r))).catch(() => {});
  }, [activeUserId]);

  // Prefer API result; fall back to matching by userId in the preloaded list
  return apiStu
    ?? students.find(s => s.userId === activeUserId)
    ?? students.find(s => s.id === activeUserId)
    ?? null;
}

/* ---------------- Student Dashboard Component ---------------- */
export const StudentDashboard: React.FC<NavProps> = ({ onNav }) => {
  const { letters } = useAppContext();
  const stu = useMyStudent();

  if (!stu) return <EmptyState title="Student not found" sub="Could not find student details." />;

  const L = letters[stu.id] || { status: 'none' };
  const events = studentLetterEvents(stu, letters);
  const deadline = bookDeadline(stu);
  const bookDays = daysLeft(deadline);

  return (
    <div>
      <SectionTitle 
        style={{ justifyContent: 'space-between', alignItems: 'center' }}
        badge=""
      >
        Welcome back, {stu.name.split(" ")[1] || stu.name}
      </SectionTitle>
      
      <p className="muted" style={{ fontSize: 13, margin: '0 0 16px', maxWidth: 600 }}>
        {stu.id} · case study: {stu.org} · {stu.group}
      </p>

      {/* tracker */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-hd"><h3>Your journey</h3><span className="muted" style={{ fontSize: 12 }}>state {stu.stateIndex + 1} of 11</span></div>
        <div className="card-pad" style={{ paddingTop: 10 }}>
          <StateTracker stateIndex={stu.stateIndex} attempts={stu.attempts} protoPres={stu.protoPres} compact />
        </div>
      </div>

      {/* PHASE HERO */}
      {L.status === "approved" ? (
        <PrototypingWelcome stu={stu} L={L} />
      ) : (
        <LetterPhaseHero stu={stu} L={L} onNav={onNav} />
      )}

      <div className="resp-stack" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18, alignItems: "start", marginTop: 18 }}>
        {/* recent activity */}
        <div className="card">
          <div className="card-hd">
            <h3>Recent activity</h3>
            <button className="btn btn-quiet btn-sm" onClick={() => onNav("timeline")}>
              Full timeline <Icon name="arrowRight" size={13} />
            </button>
          </div>
          <div className="card-pad"><Timeline events={events} /></div>
        </div>

        {/* book deadline + case study */}
        <div style={{ display: "grid", gap: 18 }}>
          <div className="card card-pad">
            <div className="eyebrow" style={{ marginBottom: 10 }}>Final Year Book deadline</div>
            <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
              <div style={{ 
                width: 50, 
                height: 50, 
                borderRadius: 11, 
                background: bookDays < 45 ? "var(--red-bg)" : "var(--surface-2)", 
                color: bookDays < 45 ? "var(--red)" : "var(--navy)", 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                justifyContent: "center", 
                flex: "none" 
              }}>
                <span className="num" style={{ fontSize: 17, fontWeight: 700, lineHeight: 1 }}>{bookDays}</span>
                <span style={{ fontSize: 8, textTransform: "uppercase" }}>days</span>
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>Due {fmt(deadline)}</div>
                <div className="muted" style={{ fontSize: 12 }}>Book registered {fmt(stu.bookRegisteredTs)} · 1-year limit</div>
              </div>
            </div>
          </div>
          <div className="card card-pad">
            <div className="eyebrow" style={{ marginBottom: 10 }}>Case-study organisation</div>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <span style={{ width: 40, height: 40, borderRadius: 9, background: "var(--blue-bg)", color: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="building" size={19} /></span>
              <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{stu.org}</div><div className="muted" style={{ fontSize: 12 }}>{stu.topic}</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Letter Phase Hero Component ---------------- */
interface LetterHeroProps {
  stu: Student;
  L: any;
  onNav: (view: string) => void;
}

const LetterPhaseHero: React.FC<LetterHeroProps> = ({ stu, L, onNav }) => {
  const requested = L.status === "requested" || L.status === "rejected";
  const canSend = requested && !!(L.deadlineTs && Date.now() < L.deadlineTs);


  if (!requested && L.status !== "submitted") {
    return (
      <div className="card card-pad" style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ width: 44, height: 44, borderRadius: 10, background: "var(--surface-2)", color: "var(--ink-3)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="clock" size={22} /></span>
        <div><div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>No letter requested yet</div><div className="muted" style={{ fontSize: 13 }}>The HOD will request your case-study letter when your batch opens. You&apos;ll be notified by email and a Send button will appear here.</div></div>
      </div>
    );
  }

  if (L.status === "submitted") {
    return (
      <div className="card card-pad" style={{ background: "var(--blue-bg)", borderColor: "#C7DCF1", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <span style={{ width: 46, height: 46, borderRadius: 11, background: "var(--blue)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="clock" size={22} /></span>
        <div style={{ flex: 1, minWidth: 220 }}><div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>Letter submitted — awaiting HOD review</div><div className="muted" style={{ fontSize: 13 }}>You sent <span className="mono">{L.file}</span> on {fmtFull(L.submittedTs)}. You&apos;ll be notified when it&apos;s approved or returned.</div></div>
        <button className="btn btn-ghost" onClick={() => onNav("case")}>View submission</button>
      </div>
    );
  }

  return (
    <div className="card" style={{ overflow: "hidden", borderColor: L.status === "rejected" ? "#E6B7AE" : "var(--amber)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 20px", background: L.status === "rejected" ? "var(--red-bg)" : "var(--amber-bg)" }}>
        <Icon name={L.status === "rejected" ? "refresh" : "send"} size={18} style={{ color: L.status === "rejected" ? "var(--red)" : "var(--amber-deep)" }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{L.status === "rejected" ? "Your letter was returned — please revise & resend" : "The HOD has requested your case-study letter"}</span>
        <span className="badge badge-grey mono" style={{ marginLeft: "auto", height: 18 }}>Batch {L.batch}</span>
      </div>
      <div className="card-pad" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "center" }}>
        <div>
          {L.status === "rejected" && L.rejectionReason && (
            <div style={{ marginBottom: 14, padding: "12px 14px", background: "var(--red-bg)", borderLeft: "3px solid var(--red)", borderRadius: 8 }}>
              <div className="eyebrow" style={{ color: "var(--red-deep)", marginBottom: 5 }}>Reason from HOD</div>
              <div className="rt-content" style={{ fontSize: 13, color: "var(--red-deep)" }} dangerouslySetInnerHTML={{ __html: L.rejectionReason }} />
            </div>
          )}
          <div className="eyebrow" style={{ marginBottom: 8 }}>{canSend ? "Time remaining to send your letter" : "Submission window"}</div>
          {canSend ? (
            <Countdown to={L.deadlineTs} size="lg" />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Badge tone="red" dot>Window closed</Badge>
              <span className="muted" style={{ fontSize: 12.5 }}>The button is hidden until the HOD requests your letter again.</span>
            </div>
          )}
          <div className="muted" style={{ fontSize: 11.5, marginTop: 10 }}>Window closes {fmtFull(L.deadlineTs)} · case study: <strong style={{ color: "var(--ink-2)" }}>{stu.org}</strong></div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, minWidth: 190 }}>
          {canSend ? (
            <button className="btn btn-amber btn-lg" onClick={() => onNav("case")}>
              <Icon name="send" size={16} /> {L.status === "rejected" ? "Revise & resend" : "Send case letter"}
            </button>
          ) : (
            <button className="btn btn-ghost btn-lg" disabled><Icon name="x" size={15} /> Window closed</button>
          )}
          <button className="btn btn-quiet btn-sm" onClick={() => onNav("case")}>Open letter page</button>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Prototyping Welcome Component ---------------- */
interface PrototypingWelcomeProps {
  stu: Student;
  L: any;
}

const PrototypingWelcome: React.FC<PrototypingWelcomeProps> = ({ stu, L }) => {
  return (
    <div className="card" style={{ overflow: "hidden", border: 0 }}>
      <div style={{ background: "linear-gradient(115deg, var(--navy) 0%, var(--navy-700) 100%)", color: "#fff", padding: "26px 28px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -40, width: 200, height: 200, borderRadius: "50%", border: "1px solid rgba(255,255,255,.08)" }} />
        <div className="badge badge-solid-amber" style={{ marginBottom: 14 }}><Icon name="sparkle" size={13} /> PROJECT APPROVED</div>
        <h2 style={{ color: "#fff", fontSize: 25, letterSpacing: "-.02em" }}>Welcome to the Prototyping phase, {stu.name.split(" ")[1] || stu.name}!</h2>
        <p style={{ color: "var(--on-navy-dim)", fontSize: 14.5, marginTop: 9, lineHeight: 1.6, maxWidth: 560 }}>Your case-study letter for <strong style={{ color: "#fff" }}>{stu.org}</strong> has been approved by the HOD. The prototyping phase is handled separately — review the requirements below and begin building your prototype for review.</p>
        <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
          <button className="btn btn-amber btn-lg"><Icon name="external" size={16} /> Go to Prototyping workspace</button>
          <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--on-navy-dim)" }}><Icon name="check" size={15} style={{ color: "var(--amber)" }} /> Approved {fmt(L.approvedTs)}</span>
        </div>
      </div>
      <div className="card-pad" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 9 }}>Requirements from the HOD</div>
          <DocChip doc={L.requirements || { name: "FYP_Prototype_Requirements_2026.docx", size: "24 KB", pages: 3 }} action="Download" />
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 9 }}>What happens next</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.7 }}>
            <li>Build your prototype to the requirements</li>
            <li>Present to the Prototype Review Board</li>
            <li>Refine and re-present until granted</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Student Case Study Letter Page Component ---------------- */
export const StudentCase: React.FC = () => {
  const { letters, submitCaseLetter } = useAppContext();
  const stu = useMyStudent();
  const [picked, setPicked] = useState(false);

  if (!stu) return <EmptyState title="Student not found" sub="Could not find student details." />;

  const L = letters[stu.id] || { status: 'none' };
  const canSend = (L.status === "requested" || L.status === "rejected") && !!(L.deadlineTs && Date.now() < L.deadlineTs);
  const events = studentLetterEvents(stu, letters);

  function send() {
    if (stu) {
      submitCaseLetter(stu.id, "case-letter-" + stu.org.toLowerCase().replace(/[^a-z]/g, "").slice(0, 10) + ".pdf");
      setPicked(false);
      notify("Case letter sent to the HOD", "success");
    }
  }


  return (
    <div>
      <SectionTitle 
        style={{ justifyContent: 'space-between', alignItems: 'center' }}
        right={<LetterStatusBadge status={L.status} expired={!!(L.deadlineTs && Date.now() > L.deadlineTs)} />}
      >
        Case-Study Letter
      </SectionTitle>

      <div className="resp-stack" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 18, alignItems: "start", maxWidth: 980 }}>
        <div style={{ display: "grid", gap: 18 }}>
          {/* request / countdown banner */}
          {(L.status === "requested" || L.status === "rejected") && (
            <div className="card card-pad" style={{ background: canSend ? "var(--amber-bg)" : "var(--surface)", borderColor: canSend ? "var(--amber)" : "var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>{canSend ? "Time remaining" : "Window"}</div>
                {canSend ? <Countdown to={L.deadlineTs || 0} size="lg" /> : <Badge tone="red" dot>Window closed — wait for HOD to re-request</Badge>}
              </div>
              <Icon name={canSend ? "send" : "clock"} size={28} style={{ color: canSend ? "var(--amber-deep)" : "var(--ink-4)" }} />
            </div>
          )}

          {/* rejection reason */}
          {L.status === "rejected" && L.rejectionReason && (
            <div className="card" style={{ overflow: "hidden", borderColor: "#E6B7AE" }}>
              <div className="card-hd" style={{ background: "var(--red-bg)" }}><h3 style={{ color: "var(--red-deep)", display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="refresh" size={15} />Why your letter was returned</h3></div>
              <div className="card-pad"><div className="rt-content" style={{ fontSize: 13.5, color: "var(--ink-2)" }} dangerouslySetInnerHTML={{ __html: L.rejectionReason }} /></div>
            </div>
          )}

          {/* upload / submission state */}
          <div className="card card-pad">
            <div className="eyebrow" style={{ marginBottom: 12 }}>{L.status === "submitted" || L.status === "approved" ? "Submitted document" : "Your letter"}</div>

            {L.status === "approved" ? (
              <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "14px 16px", background: "var(--green-bg)", border: "1px solid #BCE2CC", borderRadius: 10 }}>
                <span style={{ width: 42, height: 42, borderRadius: 9, background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="checkCircle" size={21} /></span>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600, color: "var(--ink)", fontSize: 13.5 }}>{L.file}</div><div className="mono muted" style={{ fontSize: 11 }}>Approved {fmtFull(new Date(L.approvedTs || Date.now()).toISOString())}</div></div>
                <Badge tone="green" dot>Approved</Badge>
              </div>
            ) : L.status === "submitted" ? (
              <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "14px 16px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10 }}>
                <span style={{ width: 42, height: 42, borderRadius: 9, background: "var(--blue-bg)", color: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="file" size={20} /></span>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600, color: "var(--ink)", fontSize: 13.5 }}>{L.file}</div><div className="mono muted" style={{ fontSize: 11 }}>Sent {fmtFull(new Date(L.submittedTs || Date.now()).toISOString())} · awaiting review</div></div>
                <Badge tone="blue" dot>In review</Badge>
              </div>
            ) : canSend ? (
              <>
                <div style={{ padding: "20px", border: "2px dashed " + (picked ? "var(--amber)" : "var(--line)"), borderRadius: 10, textAlign: "center", background: picked ? "var(--amber-bg)" : "transparent", cursor: "pointer" }} onClick={() => setPicked(true)}>
                  <Icon name={picked ? "file" : "upload"} size={24} style={{ color: picked ? "var(--amber-deep)" : "var(--ink-4)" }} />
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-2)", marginTop: 7 }}>{picked ? "case-letter-" + stu.org.toLowerCase().replace(/[^a-z]/g, "").slice(0, 10) + ".pdf" : "Choose your signed case-study letter (PDF)"}</div>
                  <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{picked ? "Ready to send" : "Drag a PDF here or click to browse"}</div>
                </div>
                <button className="btn btn-amber btn-lg" disabled={!picked} onClick={send} style={{ width: "100%", marginTop: 12 }}><Icon name="send" size={16} /> Send case letter to HOD</button>
              </>
            ) : (
              <div style={{ padding: "18px", textAlign: "center", border: "1px dashed var(--line)", borderRadius: 10 }}>
                <Icon name="clock" size={22} style={{ color: "var(--ink-4)" }} />
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-2)", marginTop: 7 }}>The send window is closed</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>Your Send button will reappear here once the HOD requests your letter again.</div>
              </div>
            )}
          </div>
        </div>

        {/* status timeline */}
        <div className="card">
          <div className="card-hd"><h3>Status</h3></div>
          <div className="card-pad"><Timeline events={events} /></div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Student Supervisor Page Component ---------------- */
export const StudentSupervisor: React.FC = () => {
  const stu = useMyStudent();

  if (!stu) return <EmptyState title="Student not found" sub="Could not find student details." />;

  const sup = stu.supervisorId ? supById[stu.supervisorId] : null;
  const wa = stu.supervisorId ? WA_GROUPS[stu.supervisorId] : null;

  if (!sup || !stu.supervisorId) {
    return (
      <div>
        <SectionTitle sub="Where to find your supervisor and the sessions they run.">My Supervisor</SectionTitle>
        <EmptyState icon="users" title="No supervisor assigned yet" sub="Once a supervisor is assigned to you, their weekly office hours, location and group sessions will appear here." />
      </div>
    );
  }

  return (
    <div>
      <SectionTitle 
        sub="Your assigned supervisor's availability and group sessions — so you know exactly when and where to find them."
        right={wa && wa.length ? <WhatsAppButton team={wa[0].team.replace("FYP 2026 · ", "")} link={wa[0].link} sm /> : undefined}
      >
        My Supervisor
      </SectionTitle>

      <div className="card card-pad" style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 14 }}>
        <Avatar name={sup.name} role="Supervisor" size={48} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>{sup.full}</div>
          <div className="muted" style={{ fontSize: 12.5 }}>{sup.title}</div>
        </div>
        <div style={{ display: "flex", gap: 18, fontSize: 12.5 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon name="mail" size={14} style={{ color: "var(--ink-3)" }} /><span className="mono">{sup.email}</span></span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 15px", background: "var(--blue-bg)", border: "1px solid #C7DCF1", borderRadius: 10, marginBottom: 16, fontSize: 12.5 }}>
        <Icon name="eye" size={15} style={{ color: "var(--blue)", flex: "none", marginTop: 1 }} />
        <span style={{ color: "var(--ink-2)" }}>You can only see <strong>your assigned supervisor&apos;s</strong> availability. Group sessions are run for all of their students — make sure you attend; attendance is recorded.</span>
      </div>

      <SupervisorAvailabilityPanel supId={stu.supervisorId} viewer="student" studentId={stu.id} />
    </div>
  );
};

/* ---------------- Student Timeline Page Component ---------------- */
export const StudentTimeline: React.FC = () => {
  const { letters } = useAppContext();
  const stu = useMyStudent();

  if (!stu) return <EmptyState title="Student not found" sub="Could not find student details." />;

  const events = studentLetterEvents(stu, letters);

  return (
    <div>
      <SectionTitle sub="Your complete, timestamped FYP history — every step, who acted, and the emails sent.">My Timeline</SectionTitle>
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-pad" style={{ paddingTop: 12 }}><StateTracker stateIndex={stu.stateIndex} attempts={stu.attempts} protoPres={stu.protoPres} /></div>
      </div>
      <div className="card" style={{ maxWidth: 760 }}>
        <div className="card-hd"><h3><Icon name="history" size={16} style={{ verticalAlign: -3, marginRight: 7, color: "var(--navy)" }} />Full history</h3><span className="muted" style={{ fontSize: 12 }}>{events.length} events</span></div>
        <div className="card-pad"><Timeline events={events} /></div>
      </div>
    </div>
  );
};
