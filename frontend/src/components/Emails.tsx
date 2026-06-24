import React, { useState, useMemo } from 'react';
import { Icon, Badge, Avatar, WhatsAppButton, Modal } from './SharedUI';
import { Timeline } from './Timeline';
import { fmt, fmtFull, TEMPLATES, supById, WA_GROUPS } from '../utils/fypData';
import { useAppContext } from '../context/AppContext';
import type { Student, Supervisor, Facilitator, HOD, Superadmin } from '../types';

interface EmailBodyCtx {
  student?: Student | any;
  supervisor?: Supervisor | any;
  examiner?: Supervisor | Facilitator | HOD | Superadmin | any;
  attempt?: number;
  reason?: string;
}

export function emailBody(key: string, ctx: EmailBodyCtx): { subject: string; body: React.ReactNode; hero?: boolean } {
  const s = ctx.student || {};
  const sup = ctx.supervisor;
  const ex = ctx.examiner;
  const wa = sup ? WA_GROUPS[sup.id] : null;
  const para: React.CSSProperties = { fontSize: "13.5px", color: "var(--ink-2)", lineHeight: 1.65, margin: "0 0 13px" };
  
  const data: { [key: string]: { subject: string; body: React.ReactNode; hero?: boolean } } = {
    "case-requested": {
      subject: "Action needed: submit your case-study letter",
      body: (
        <>
          <p style={para}>Dear {s.name || "Student"},</p>
          <p style={para}>The Head of Department has requested your <strong>case-study letter</strong> for your Final Year Project. Please log in and submit it before your window closes.</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 15px", background: "var(--amber-bg)", borderRadius: 9, margin: "2px 0 14px" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--amber-deep)" }}>SUBMISSION WINDOW OPEN</div>
              <div className="muted" style={{ fontSize: 12 }}>Case study: {s.org || "your organisation"}</div>
            </div>
            <Icon name="clock" size={22} style={{ color: "var(--amber-deep)" }} />
          </div>
          <div style={{ textAlign: "center", padding: "2px 0 4px" }}>
            <span className="btn btn-amber" style={{ pointerEvents: "none" }}>
              <Icon name="send" size={15} /> Open my dashboard to send the letter
            </span>
          </div>
        </>
      )
    },
    "reg-confirmed": {
      subject: "You've been registered for FYP — Class of 2026",
      body: (
        <>
          <p style={para}>Dear {s.name || "Student"},</p>
          <p style={para}>You have been registered for the Final Year Project programme, <strong>Class of 2026</strong>, in the Department of Software Engineering. Your records are now active in the Final Year Project Tracking system.</p>
          <p style={para}>Your next step is to submit your <strong>case-study letter</strong> identifying your partner organisation.</p>
        </>
      )
    },
    "case-approved": {
      subject: "Your case-study letter has been approved",
      body: (
        <>
          <p style={para}>Dear {s.name || "Student"},</p>
          <p style={para}>Your case-study letter for <strong>{s.org || "your organisation"}</strong> has been <strong style={{ color: "var(--green-deep)" }}>approved</strong> by the Head of Department. You may proceed to the Prototype Review stage.</p>
        </>
      )
    },
    "proto-refine": {
      subject: "Prototype review: refinement required",
      body: (
        <>
          <p style={para}>Dear {s.name || "Student"},</p>
          <p style={para}>Following your prototype presentation, the review board has determined that your prototype <strong style={{ color: "var(--red)" }}>needs refinement</strong> before it can be granted. Please address the feedback and re-present.</p>
          <div style={{ padding: "10px 13px", background: "var(--red-bg)", borderRadius: 8, fontSize: 12.5, color: "var(--red-deep)" }}>
            Presentation count: <strong>{s.protoPres || 2}</strong> · This is recorded on your accountability timeline.
          </div>
        </>
      )
    },
    "proto-granted": {
      subject: "Prototype granted — proceed to proposal",
      body: (
        <>
          <p style={para}>Dear {s.name || "Student"},</p>
          <p style={para}>Congratulations — your prototype has been <strong style={{ color: "var(--green-deep)" }}>granted</strong>. You may now submit your proposal book for review.</p>
        </>
      )
    },
    "prop-rejected": {
      subject: "Proposal returned for revision",
      body: (
        <>
          <p style={para}>Dear {s.name || "Student"},</p>
          <p style={para}>Your proposal (attempt {ctx.attempt || 2}) has been <strong style={{ color: "var(--red)" }}>returned for revision</strong>. Please review the reason below, revise, and resubmit.</p>
          <div style={{ padding: "11px 13px", background: "var(--red-bg)", borderRadius: 8, borderLeft: "3px solid var(--red)", fontSize: 13, color: "var(--red-deep)" }}>
            <strong>Reason:</strong> {ctx.reason || "Literature review thin; no comparison of existing systems."}
          </div>
        </>
      )
    },
    "prop-accepted": {
      subject: "Your proposal has been accepted",
      body: (
        <>
          <p style={para}>Dear {s.name || "Student"},</p>
          <p style={para}>Your proposal has been <strong style={{ color: "var(--green-deep)" }}>accepted</strong>{ctx.attempt ? <> on attempt <strong>#{ctx.attempt}</strong></> : null}. A supervisor will be assigned to guide you through the supervision stage.</p>
        </>
      )
    },
    "sup-assigned": {
      subject: "Your supervisor has been assigned",
      hero: true,
      body: (
        <>
          <p style={para}>Dear {s.name || "Student"},</p>
          <p style={para}>We&apos;re pleased to inform you that your Final Year Project supervisor has been assigned. Please make contact and join the supervision WhatsApp group below.</p>
          <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "14px 16px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, margin: "4px 0 16px" }}>
            <Avatar name={sup ? sup.name : "Supervisor"} role="Supervisor" size={46} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>{sup ? sup.full : "Supervisor"}</div>
              <div className="muted" style={{ fontSize: 12.5 }}>{sup ? sup.title : ""}</div>
              <div className="mono" style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>{sup ? sup.email : ""}</div>
            </div>
          </div>
          <div style={{ textAlign: "center", padding: "4px 0 6px" }}>
            {wa ? <WhatsAppButton team={wa[0].team} link={wa[0].link} /> : <WhatsAppButton link="" />}
            <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>One-click — opens your supervisor&apos;s WhatsApp group</div>
          </div>
        </>
      )
    },
    "sup-notified": {
      subject: "New students assigned to you for supervision",
      body: (
        <>
          <p style={para}>Dear {sup ? sup.name : "Supervisor"},</p>
          <p style={para}>The following student has been assigned to you for Final Year Project supervision. Please post your weekly availability and confirm a first meeting.</p>
          <div style={{ padding: "11px 13px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 13 }}>
            <strong>{s.name}</strong> · <span className="mono">{s.id}</span><br /><span className="muted">{s.topic} — {s.org}</span>
          </div>
        </>
      )
    },
    "examiner-assigned": {
      subject: "You have been assigned as a pre-defense examiner",
      hero: true,
      body: (
        <>
          <p style={para}>Dear {ex ? ex.name : "Examiner"},</p>
          <p style={para}>You have been assigned to conduct a <strong>pre-defense</strong> examination. This is separate from any students you supervise. Details and schedule below.</p>
          <div style={{ border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden", margin: "2px 0 8px" }}>
            <div style={{ padding: "10px 14px", background: "var(--violet-bg)", fontSize: 12, fontWeight: 600, color: "var(--violet)" }}>PRE-DEFENSE ASSIGNMENT</div>
            <div style={{ padding: "12px 14px", fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}><span className="muted">Student</span><strong>{s.name} · {s.id}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}><span className="muted">Project</span><span>{s.topic}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}><span className="muted">Case study</span><span>{s.org}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span className="muted">Schedule</span><strong>14 Jun 2026 · 11:00, Lab B</strong></div>
            </div>
          </div>
        </>
      )
    },
    "reached-predefense": {
      subject: "Book signed off — pre-defense stage",
      body: (
        <>
          <p style={para}>Dear {s.name || "Student"},</p>
          <p style={para}>Your supervisor has <strong>signed off your book</strong>. You have advanced to the <strong>Pre-Defense</strong> stage. Note: pre-defense and defense move forward only and do not return to supervision.</p>
        </>
      )
    },
    "defense-result": {
      subject: "Defense outcome recorded",
      body: (
        <>
          <p style={para}>Dear {s.name || "Student"},</p>
          <p style={para}>Your defense outcome has been recorded: <strong style={{ color: "var(--green-deep)" }}>{s.defense ? s.defense.outcome : "Passed"}</strong>. Congratulations on completing your Final Year Project.</p>
        </>
      )
    },
  };

  return data[key] || { 
    subject: TEMPLATES[key] ? TEMPLATES[key].subject : "Notification", 
    body: <p style={para}>Notification.</p> 
  };
}

/* ---------------- Email Preview Component ---------------- */
interface EmailPreviewProps {
  templateKey: string;
  student?: Student;
  supervisor?: Supervisor;
  examiner?: any;
  attempt?: number;
  reason?: string;
  status?: 'sent' | 'failed' | 'retried' | string;
  to?: string;
  toName?: string;
  ts?: string;
  compact?: boolean;
}

export const EmailPreview: React.FC<EmailPreviewProps> = ({ 
  templateKey, 
  student, 
  supervisor, 
  examiner, 
  attempt, 
  reason, 
  status, 
  to, 
  toName, 
  ts, 
  compact 
}) => {
  const tmpl = TEMPLATES[templateKey];
  const content = emailBody(templateKey, { student, supervisor, examiner, attempt, reason });
  const statusTone = status === "failed" ? "red" : status === "retried" ? "amber" : "green";

  return (
    <div className="card" style={{ overflow: "hidden", boxShadow: compact ? "var(--sh-sm)" : "var(--sh-md)" }}>
      {/* client chrome */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "var(--surface)", borderBottom: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="mail" size={16} style={{ color: "var(--ink-3)" }} />
          <span className="eyebrow">Email preview</span>
          {tmpl && tmpl.hero && <Badge tone="amber">KEY EVENT</Badge>}
        </div>
        <Badge tone={statusTone} dot>{(status || "sent").toUpperCase()}</Badge>
      </div>
      {/* meta */}
      <div style={{ padding: "13px 18px", borderBottom: "1px solid var(--line-soft)", fontSize: 12.5 }}>
        <div style={{ display: "grid", gridTemplateColumns: "52px 1fr", rowGap: 4, color: "var(--ink-3)" }}>
          <span>From</span><span style={{ color: "var(--ink-2)" }}>Final Year Project Tracking System <span className="mono" style={{ color: "var(--ink-4)" }}>&lt;noreply@auca.ac.rw&gt;</span></span>
          <span>To</span><span style={{ color: "var(--ink-2)" }}>{toName || (student && student.name) || (examiner && examiner.name)} <span className="mono" style={{ color: "var(--ink-4)" }}>&lt;{to || (student && student.email) || (examiner && examiner.email)}&gt;</span></span>
          <span>Subject</span><span style={{ color: "var(--ink)", fontWeight: 600 }}>{content.subject}</span>
        </div>
      </div>
      {/* body */}
      <div style={{ padding: 0 }}>
        <div style={{ background: "var(--navy)", padding: "16px 22px", display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 32, height: 32, borderRadius: 7, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <img src="/src/assets/aauca-logo.jpg" style={{ width: 28, height: 28, objectFit: "contain" }} alt="AUCA Logo" />
          </div>
          <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>AUCA · Final Year Project</div>
        </div>
        <div style={{ padding: "20px 22px" }}>
          {content.body}
          <div style={{ marginTop: 8, paddingTop: 14, borderTop: "1px solid var(--line-soft)", fontSize: 11, color: "var(--ink-4)", lineHeight: 1.6 }}>
            This is an automated message from the Final Year Project Tracking &amp; Accountability System. Department of Software Engineering, AUCA Rwanda.<br />
            {ts && <span className="mono">Sent {fmtFull(ts)}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Guided "Resolve a complaint" flow ---------------- */
interface ResolveComplaintFlowProps {
  onClose: () => void;
  onJump?: (role: string, page: string, sid?: string) => void;
}

export const ResolveComplaintFlow: React.FC<ResolveComplaintFlowProps> = ({ onClose, onJump }) => {
  const { students, notificationLogs, letters, getStudentMeetings } = useAppContext();
  const [step, setStep] = useState(0);

  const stu = students.find(s => s.id === "STU-2026-014")!; // Keza Ihirwe
  const sup = stu ? supById[stu.supervisorId || ''] : null;

  // Let's build her timeline events list
  const meetings = getStudentMeetings(stu.id);
  const events = useMemo(() => {
    const list: any[] = [];
    if (!stu) return list;
    // Base registration
    list.push({
      label: "Registered",
      actor: { name: "System", role: "System" },
      ts: stu.bookRegisteredTs,
      note: "Registered into FYP Class of 2026"
    });
    // Case study submission/approval
    const lState = letters[stu.id];
    if (lState) {
      if (lState.requestedTs) {
        list.push({
          label: "Case Letter Requested",
          actor: { name: "HOD", role: "HOD" },
          ts: new Date(lState.requestedTs).toISOString(),
          email: "case-requested"
        });
      }
      if (lState.submittedTs) {
        list.push({
          label: "Case Letter Submitted",
          actor: { name: stu.name, role: "Student" },
          ts: new Date(lState.submittedTs).toISOString(),
          file: lState.file
        });
      }
      if (lState.approvedTs) {
        list.push({
          label: "Case Letter Approved",
          actor: { name: "HOD", role: "HOD" },
          ts: new Date(lState.approvedTs).toISOString(),
          email: "case-approved"
        });
      }
    }
    // Meetings logged
    meetings.forEach(m => {
      if (m.logged) {
        list.push({
          label: "Supervisor meeting logged",
          actor: { name: sup ? sup.name : "Supervisor", role: "Supervisor" },
          ts: m.ts,
          meeting: m
        });
      }
    });

    return list.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
  }, [stu, letters, meetings, sup]);

  const sentEmails = notificationLogs.filter(n => n.studentId === stu?.id);

  const steps = [
    {
      title: "A complaint arrives", 
      icon: "alert", 
      tone: "var(--red)",
      body: (
        <>
          <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, marginBottom: 14 }}>On <strong>06 Jun 2026</strong>, student <strong>Keza Ihirwe</strong> files a complaint with the department:</p>
          <div style={{ padding: "14px 16px", background: "var(--red-bg)", borderLeft: "3px solid var(--red)", borderRadius: 8, fontSize: 13.5, color: "var(--red-deep)", fontStyle: "italic" }}>
            &ldquo;My supervisor has been unresponsive and missed signing off my book. I&apos;m falling behind through no fault of my own.&rdquo;
          </div>
          <p style={{ fontSize: 13.5, color: "var(--ink-3)", lineHeight: 1.6, marginTop: 14 }}>Previously, staff would resolve this from memory — and assign blame by assumption. Now, we open the record.</p>
        </>
      )
    },
    {
      title: "Open the accountability timeline", 
      icon: "history", 
      tone: "var(--navy)",
      body: (
        <>
          <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.6, marginBottom: 12 }}>Every state is timestamped with the actor. The record shows what actually happened during supervision:</p>
          <div style={{ maxHeight: 280, overflowY: "auto", padding: "4px 4px 4px 2px", border: "1px solid var(--line)", borderRadius: 10, background: "var(--white)" }}>
            <div style={{ padding: 14 }}><Timeline events={events.slice(-6)} /></div>
          </div>
          <div style={{ marginTop: 12, padding: "11px 13px", background: "var(--amber-bg)", borderRadius: 8, fontSize: 12.5, color: "var(--ink-2)", display: "flex", gap: 9 }}>
            <Icon name="sparkle" size={16} style={{ color: "var(--amber-deep)", flex: "none", marginTop: 1 }} />
            <span>The record shows a <strong>logged meeting on 27 Mar where the student was marked Absent</strong> with no prior notice — and an upcoming <strong>confirmed</strong> meeting on 12 Jun. The gap is visible and attributable.</span>
          </div>
        </>
      )
    },
    {
      title: "Cross-check the emails sent", 
      icon: "mail", 
      tone: "var(--blue)",
      body: (
        <>
          <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.6, marginBottom: 12 }}>The system logs every notification. Each step the student passed was emailed — with delivery receipts:</p>
          <div style={{ border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden" }}>
            {sentEmails.map((n, i) => (
              <div key={n.id} style={{ display: 'flex', justifyContent: "space-between", padding: "10px 13px", borderBottom: i < sentEmails.length - 1 ? "1px solid var(--line-soft)" : 0, fontSize: 12.5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <Icon name="mail" size={14} style={{ color: "var(--ink-3)" }} />
                  <span style={{ color: "var(--ink)" }}>{TEMPLATES[n.template]?.event || n.template}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="mono muted" style={{ fontSize: 11 }}>{fmt(n.ts)}</span>
                  <Badge tone="green" style={{ height: 17, fontSize: 9.5 }}>DELIVERED</Badge>
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.6, marginTop: 12 }}>Notifications were delivered. The student was informed at each step — confirmed by receipts, not memory.</p>
        </>
      )
    },
    {
      title: "Resolve from the record", 
      icon: "checkCircle", 
      tone: "var(--green)",
      body: (
        <>
          <div style={{ padding: "16px 18px", background: "var(--green-bg)", borderRadius: 10, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
              <Icon name="checkCircle" size={20} style={{ color: "var(--green-deep)" }} />
              <strong style={{ color: "var(--green-deep)", fontSize: 15 }}>Resolved in minutes, from evidence</strong>
            </div>
            <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.6 }}>The facilitator can see exactly where responsibility lies: a missed meeting (student absent, logged), delivered notifications, and a confirmed next meeting. The outcome is documented and fair — no assumptions.</p>
          </div>
          <p style={{ fontSize: 13, color: "var(--ink-3)", lineHeight: 1.6 }}>This is the payoff of the whole system: <strong style={{ color: "var(--ink)" }}>complaints resolved from a timestamped record</strong> instead of from memory.</p>
        </>
      )
    },
  ];

  if (!stu) return null;

  const cur = steps[step];
  return (
    <Modal open onClose={onClose} width={620}>
      <div className="card" style={{ overflow: "hidden", boxShadow: "var(--sh-pop)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <span style={{ width: 34, height: 34, borderRadius: 9, background: cur.tone + "1a", color: cur.tone, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={cur.icon} size={18} />
            </span>
            <div>
              <div className="eyebrow">Guided walkthrough · The accountability payoff</div>
              <div style={{ fontSize: 15.5, fontWeight: 600, color: "var(--ink)" }}>{cur.title}</div>
            </div>
          </div>
          <button className="btn btn-quiet btn-sm" onClick={onClose} style={{ width: 30, padding: 0 }}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ padding: "20px 22px", minHeight: 200 }}>{cur.body}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: "1px solid var(--line)", background: "var(--surface)" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {steps.map((_, i) => <span key={i} style={{ width: i === step ? 22 : 8, height: 8, borderRadius: 4, background: i === step ? cur.tone : "var(--surface-3)", transition: "all .2s" }} />)}
          </div>
          <div style={{ display: "flex", gap: 9 }}>
            {step > 0 && <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>Back</button>}
            {step < steps.length - 1 ? (
              <button className="btn btn-primary" onClick={() => setStep(step + 1)}>
                Next <Icon name="arrowRight" size={15} />
              </button>
            ) : (
              <button className="btn btn-amber" onClick={() => { onClose(); if (onJump) onJump("facilitator", "students", "STU-2026-014"); }}>
                Open full record <Icon name="arrowRight" size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
