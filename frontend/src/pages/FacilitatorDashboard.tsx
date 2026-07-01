import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Student, ProposalAttempt } from '../types';
import {
  Icon,
  Badge,
  Avatar,
  StateBadge,
  EmptyState,
  SectionTitle,
  MetricCard,
  Modal,
  StateTracker,
  RowSearch,
  matchesSearch,
} from '../components/SharedUI';
import { EmailPreview } from '../components/Emails';
import { Timeline } from '../components/Timeline';
import {
  fmt,
  supById,
  STATES,
  TEMPLATES
} from '../utils/fypData';
import { notify } from '../components/LetterUI';
import { proposalsApi } from '../api/proposals';
import { panelsApi } from '../api/panels';
import type { PanelAssignmentResponse } from '../api/types';
import { mapProposalAttempt } from '../utils/mappers';
import { getToken } from '../api/client';

/* ---------------- StudentRecord Component (shared accountability record) ---------------- */
interface StudentRecordProps {
  studentId: string;
  onBack: () => void;
  readOnly?: boolean;
}

export const StudentRecord: React.FC<StudentRecordProps> = ({ studentId, onBack, readOnly: _readOnly }) => {
  const { students, notificationLogs, letters, refreshStudents, activeUserRole } = useAppContext();
  const stu = students.find(s => s.id === studentId);
  const [emailOpen, setEmailOpen] = useState<any>(null);

  // Real proposal history (loaded from API when authenticated)
  const [apiAttempts, setApiAttempts] = useState<ProposalAttempt[] | null>(null);
  const [proposalDecision, setProposalDecision] = useState<'ACCEPTED' | 'REJECTED' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [proposalSubmitting, setProposalSubmitting] = useState(false);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  async function handleUnlockProposal() {
    if (!stu) return;
    setUnlocking(true);
    try {
      await proposalsApi.unlock(stu.id);
      notify(`Proposal unlocked for ${stu.name}`, 'success');
      await refreshStudents();
      const updated = await proposalsApi.history(studentId);
      setApiAttempts(updated.map(mapProposalAttempt));
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Unlock failed', 'error');
    } finally {
      setUnlocking(false);
    }
  }

  useEffect(() => {
    if (!getToken() || !studentId) return;
    proposalsApi.history(studentId)
      .then(list => setApiAttempts(list.map(mapProposalAttempt)))
      .catch(() => setApiAttempts(null));
  }, [studentId]);

  async function handleProposalReview() {
    if (!stu || !proposalDecision) return;
    if (proposalDecision === 'REJECTED' && !rejectReason.trim()) return;
    setProposalSubmitting(true);
    setProposalError(null);
    try {
      await proposalsApi.review(
        stu.id,
        proposalDecision,
        proposalDecision === 'REJECTED' ? rejectReason : undefined
      );
      notify(
        proposalDecision === 'ACCEPTED'
          ? `Proposal accepted — ${stu.name} advances to Supervision`
          : `Proposal returned to ${stu.name} for revision`,
        proposalDecision === 'ACCEPTED' ? 'success' : 'info'
      );
      setProposalDecision(null);
      setRejectReason('');
      await refreshStudents();
      // Reload proposal history
      const updated = await proposalsApi.history(studentId);
      setApiAttempts(updated.map(mapProposalAttempt));
    } catch (e) {
      setProposalError(e instanceof Error ? e.message : 'Failed to record decision');
    } finally {
      setProposalSubmitting(false);
    }
  }

  if (!stu) return <EmptyState title="Student not found" sub="Record could not be retrieved." />;

  const sup = stu.supervisorId ? supById[stu.supervisorId] : null;
  
  // Let's build her timeline events list
  const L = letters[stu.id] || { status: 'none' };
  
  const events = useMemo(() => {
    const list: any[] = [];
    // Base registration
    list.push({
      label: "Registered in cohort · Class of 2026",
      actor: { name: "Dr. Bizimungu", role: "HOD" },
      ts: stu.bookRegisteredTs,
      email: "reg-confirmed",
      note: "Final Year Book registered — the 1-year deadline begins here"
    });
    
    // Case study submission/approval
    if (L.requestedTs) {
      list.push({
        label: "Case-study letter requested by HOD",
        actor: { name: "Dr. Bizimungu", role: "HOD" },
        ts: new Date(L.requestedTs).toISOString(),
        note: "Submission window opened — you can now send your letter"
      });
    }
    if (L.submittedTs) {
      list.push({
        label: "Case-study letter submitted",
        actor: { name: stu.name, role: "Student" },
        ts: new Date(L.submittedTs).toISOString(),
        file: L.file || "case-letter.pdf"
      });
    }
    if (L.status === "rejected" && L.rejectedTs) {
      list.push({
        label: "Letter returned for revision",
        actor: { name: "Dr. Bizimungu", role: "HOD" },
        ts: new Date(L.rejectedTs).toISOString(),
        kind: "rework",
        reasonHtml: L.rejectionReason
      });
    }
    if (L.status === "approved" && L.approvedTs) {
      list.push({
        label: "Case letter approved — advance to Prototyping",
        actor: { name: "Dr. Bizimungu", role: "HOD" },
        ts: new Date(L.approvedTs).toISOString(),
        email: "case-approved",
        note: "Requirements document attached"
      });
    }

    return list.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
  }, [stu, L]);

  const emails = notificationLogs.filter(n => n.studentId === stu.id);
  const exPre = stu.examinerPreId ? supById[stu.examinerPreId] : null;

  return (
    <div className="fade-in">
      <button className="btn btn-quiet btn-sm" onClick={onBack} style={{ marginBottom: 14, paddingLeft: 6 }}>
        <Icon name="chevronLeft" size={15} /> Back to all students
      </button>

      {/* header card */}
      <div className="card" style={{ overflow: "hidden", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, padding: "18px 22px" }}>
          <div style={{ display: "flex", gap: 15 }}>
            <Avatar name={stu.name} role="Student" size={54} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h2 style={{ fontSize: 21 }}>{stu.name}</h2>
                <span className="mono" style={{ fontSize: 12.5, color: "var(--ink-3)", background: "var(--surface-2)", padding: "2px 8px", borderRadius: 5 }}>{stu.id}</span>
                {stu.flagged && <Badge tone="red" dot>COMPLAINT ON FILE</Badge>}
              </div>
              <div className="muted" style={{ fontSize: 13.5, marginTop: 5 }}>{stu.topic} · case study: <strong style={{ color: "var(--ink-2)" }}>{stu.org}</strong></div>
              <div style={{ display: "flex", gap: 18, marginTop: 9, flexWrap: "wrap", fontSize: 12.5, color: "var(--ink-3)" }}>
                <span><Icon name="user" size={13} style={{ verticalAlign: -2 }} /> {stu.group}</span>
                <span><Icon name="mail" size={13} style={{ verticalAlign: -2 }} /> {stu.email}</span>
                {sup && <span><Icon name="users" size={13} style={{ verticalAlign: -2 }} /> Supervisor: {sup.name}</span>}
                {exPre && <span style={{ color: "var(--violet)" }}><Icon name="scale" size={13} style={{ verticalAlign: -2 }} /> Examiner: {exPre.name}</span>}
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Current state</div>
            <StateBadge stateIndex={stu.stateIndex} />
            <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>In stage since {fmt(stu.enteredStageTs)}</div>
          </div>
        </div>
        <div style={{ padding: "14px 22px 16px", borderTop: "1px solid var(--line-soft)", background: "var(--surface)" }}>
          <StateTracker stateIndex={stu.stateIndex} attempts={stu.attempts} protoPres={stu.protoPres} compact />
        </div>
      </div>

      <div className="resp-stack" style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 18, alignItems: "start" }}>
        {/* timeline */}
        <div className="card">
          <div className="card-hd"><h3><Icon name="history" size={16} style={{ verticalAlign: -3, marginRight: 7, color: "var(--navy)" }} />Accountability timeline</h3><span className="muted" style={{ fontSize: 12 }}>{events.length} recorded events</span></div>
          <div className="card-pad"><Timeline events={events} highlightEmails={stu.flagged} /></div>
        </div>

        {/* right column */}
        <div style={{ display: "grid", gap: 18 }}>
          {/* attempts / rework summary */}
          <div className="card">
            <div className="card-hd"><h3>Rework &amp; accountability</h3></div>
            <div className="card-pad" style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13 }}>Prototype presentations</span>
                <Badge tone={stu.protoPres > 1 ? "amber" : "grey"}>{stu.protoPres || 0}× {stu.protoPres > 1 && "(refined)"}</Badge>
              </div>
              <div className="hr" />
              <div>
                {(() => {
                  const attempts = apiAttempts ?? stu.attempts ?? [];
                  const rejected = attempts.filter(a => a.status === "rejected").length;
                  return (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: 13 }}>Proposal attempts</span>
                        <Badge tone={rejected > 0 ? "red" : "grey"}>{attempts.length} submitted · {rejected} rejected</Badge>
                      </div>
                      {attempts.map(a => (
                        <div key={a.n} style={{ display: "flex", gap: 9, fontSize: 12, padding: "6px 0", borderTop: "1px solid var(--line-soft)" }}>
                          <span className="mono" style={{ color: "var(--ink-4)", flex: "none" }}>#{a.n}</span>
                          <span style={{ flex: 1 }}>
                            <Badge tone={a.status === "accepted" ? "green" : a.status === "rejected" ? "red" : "blue"} style={{ height: 16, fontSize: 9.5 }}>{a.status.toUpperCase()}</Badge>
                            {a.reason && <div className="muted" style={{ marginTop: 4 }}>{a.reason}</div>}
                          </span>
                          <span className="mono muted" style={{ fontSize: 10.5, flex: "none" }}>{fmt(a.ts)}</span>
                        </div>
                      ))}

                      {/* Proposal locked — HOD/SUPERADMIN can unlock */}
                      {stu.proposalLocked && getToken() && (activeUserRole === 'hod' || activeUserRole === 'superadmin') && (
                        <div style={{ marginTop: 12, padding: '12px 14px', background: 'var(--red-bg)', border: '1px solid #F5C6C6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--red-deep)' }}>Proposal locked — 3 rejections reached</div>
                            <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>Student cannot resubmit without an HOD unlock.</div>
                          </div>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={handleUnlockProposal}
                            disabled={unlocking}
                          >
                            <Icon name="refresh" size={13} /> {unlocking ? 'Unlocking…' : 'Unlock Proposal'}
                          </button>
                        </div>
                      )}

                      {/* Proposal review panel — shown only when student is PROPOSAL_UNDER_REVIEW */}
                      {stu.stateIndex === 5 && getToken() && (
                        <div style={{ marginTop: 12, padding: "12px 14px", background: "var(--surface)", borderRadius: 8, border: "1px solid var(--line)" }}>
                          <div className="eyebrow" style={{ marginBottom: 10, color: "var(--navy)" }}>Record decision</div>
                          {!proposalDecision ? (
                            <div style={{ display: "flex", gap: 9 }}>
                              <button className="btn btn-danger btn-sm" onClick={() => setProposalDecision('REJECTED')}>
                                <Icon name="x" size={13} /> Reject
                              </button>
                              <button className="btn btn-primary btn-sm" onClick={() => setProposalDecision('ACCEPTED')}>
                                <Icon name="check" size={13} /> Accept
                              </button>
                            </div>
                          ) : proposalDecision === 'REJECTED' ? (
                            <div>
                              <textarea
                                className="input"
                                placeholder="Rejection reason (visible to student)…"
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                rows={3}
                                style={{ width: "100%", resize: "vertical", fontSize: 13 }}
                              />
                              {proposalError && <div style={{ color: "var(--red)", fontSize: 12, marginTop: 6 }}>{proposalError}</div>}
                              <div style={{ display: "flex", gap: 9, marginTop: 9 }}>
                                <button className="btn btn-ghost btn-sm" onClick={() => setProposalDecision(null)}>Cancel</button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={handleProposalReview}
                                  disabled={proposalSubmitting || !rejectReason.trim()}
                                >
                                  {proposalSubmitting ? "Saving…" : "Send rejection"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="muted" style={{ fontSize: 12.5, marginBottom: 10 }}>
                                Accept this proposal? {stu.name} will advance to Supervision.
                              </p>
                              {proposalError && <div style={{ color: "var(--red)", fontSize: 12, marginBottom: 8 }}>{proposalError}</div>}
                              <div style={{ display: "flex", gap: 9 }}>
                                <button className="btn btn-ghost btn-sm" onClick={() => setProposalDecision(null)}>Cancel</button>
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={handleProposalReview}
                                  disabled={proposalSubmitting}
                                >
                                  {proposalSubmitting ? "Saving…" : "Confirm accept"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* emails sent */}
          <div className="card">
            <div className="card-hd"><h3><Icon name="mail" size={15} style={{ verticalAlign: -3, marginRight: 6, color: "var(--blue)" }} />Emails sent</h3><span className="muted" style={{ fontSize: 12 }}>{emails.length}</span></div>
            <div>
              {emails.map((n, i) => (
                <button key={n.id} onClick={() => setEmailOpen(n)} style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 18px", border: 0, borderTop: i ? "1px solid var(--line-soft)" : 0, background: "transparent", cursor: "pointer", textAlign: "left" }} className="email-list-row">
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{TEMPLATES[n.template]?.event || n.template}</div>
                    <div className="mono muted" style={{ fontSize: 10.5 }}>→ {n.toName} · {fmt(n.ts)}</div>
                  </div>
                  <Badge tone={n.status === "failed" ? "red" : n.status === "retried" ? "amber" : "green"} style={{ flex: "none" }}>{n.status}</Badge>
                </button>
              ))}
              {!emails.length && <div className="card-pad muted" style={{ fontSize: 12.5 }}>No emails sent yet at this stage.</div>}
            </div>
          </div>
        </div>
      </div>

      <Modal open={!!emailOpen} onClose={() => setEmailOpen(null)} width={540}>
        {emailOpen && (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setEmailOpen(null)}>
                <Icon name="x" size={14} /> Close
              </button>
            </div>
            <EmailPreview 
              templateKey={emailOpen.template} 
              student={stu} 
              supervisor={sup || undefined} 
              examiner={exPre || undefined} 
              status={emailOpen.status} 
              to={emailOpen.to} 
              toName={emailOpen.toName} 
              ts={emailOpen.ts} 
              attempt={2} 
              reason={(stu.attempts || []).find(a => a.reason)?.reason} 
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

/* ---------------- FacPipeline Component (Kanban view) ---------------- */
interface FacPipelineProps {
  onOpen: (page: string, id: string) => void;
}

export const FacPipeline: React.FC<FacPipelineProps> = ({ onOpen }) => {
  const { students, pendingItems, supervisorById: apiSupById } = useAppContext();
  const supMap = Object.keys(apiSupById).length > 0 ? apiSupById : supById;
  
  const counts = useMemo(() => {
    const list = Array(11).fill(0);
    students.forEach(s => {
      if (s.stateIndex >= 0 && s.stateIndex < 11) {
        list[s.stateIndex]++;
      }
    });
    return list;
  }, [students]);

  const total = students.length;
  const supervisionN = counts[7];
  const proposalN = counts[5];
  const colColor: { [key: string]: string } = { 
    navy: "var(--navy)", 
    blue: "var(--blue)", 
    green: "var(--green)", 
    amber: "var(--amber-deep)", 
    violet: "var(--violet)" 
  };

  return (
    <div>
      <SectionTitle sub={`Whole cohort at a glance · Class of 2026 · ${total} students`}>Pipeline Overview</SectionTitle>

      {/* metrics */}
      <div className="resp-cols-4" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 18 }}>
        <MetricCard label="Total students" value={total} sub="Class of 2026" icon="users" tone="navy" />
        <MetricCard label="In supervision" value={supervisionN} sub="primary-focus stage" icon="activity" tone="amber" active />
        <MetricCard label="In proposal review" value={proposalN} sub="watch for rejections" icon="book" tone="blue" />
        <MetricCard label="Reached defense" value={counts[10]} sub="journey complete" icon="scale" tone="green" />
        <MetricCard label="Pending coordination" value={pendingItems.length} sub="needs your action" icon="alert" tone="red" onClick={() => onOpen("pending", "")} />
      </div>

      {/* bottleneck banner */}
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 16px", background: "var(--amber-bg)", border: "1px solid #EAD08A", borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
        <Icon name="alert" size={17} style={{ color: "var(--amber-deep)", flex: "none" }} />
        <span style={{ color: "var(--ink-2)" }}><strong>Bottleneck:</strong> {supervisionN} students are sitting in <strong>Supervision</strong> and {proposalN} in <strong>Proposal Review</strong> — the two stages where students typically stall. Surface blocked students below.</span>
      </div>

      {/* kanban */}
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 12 }}>
        {STATES.map(st => {
          const list = students.filter(s => s.stateIndex === st.i);
          const bottleneck = (st.i === 7 || st.i === 5) && list.length >= 5;
          return (
            <div key={st.key} style={{ minWidth: 232, width: 232, flex: "none", background: "var(--surface-2)", borderRadius: 12, display: "flex", flexDirection: "column", maxHeight: 560 }}>
              <div style={{ padding: "11px 13px", borderTop: "3px solid " + colColor[st.color], borderRadius: "12px 12px 0 0", background: "var(--white)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>{String(st.i + 1).padStart(2, "0")}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>{st.short}</span>
                  </div>
                  <span className="num" style={{ fontSize: 14, fontWeight: 700, color: colColor[st.color] }}>{list.length}</span>
                </div>
                {st.external && <div style={{ fontSize: 9.5, color: "var(--violet)", fontWeight: 600, marginTop: 3, letterSpacing: ".04em" }}>EXTERNAL · READ-ONLY</div>}
                {bottleneck && <div className="badge badge-red" style={{ height: 16, fontSize: 9, marginTop: 5 }}>BOTTLENECK</div>}
              </div>
              <div className="scroll-y" style={{ padding: 8, display: "grid", gap: 7 }}>
                {list.map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => onOpen("students", s.id)} 
                    className="kanban-card"
                    style={{ textAlign: "left", border: "1px solid var(--line)", background: "#fff", borderRadius: 9, padding: "9px 11px", cursor: "pointer", boxShadow: "var(--sh-sm)", transition: "all .12s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "var(--navy-tint)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "var(--line)"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <Avatar name={s.name} role="Student" size={22} />
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</span>
                      {s.flagged && <Icon name="flag" size={13} style={{ color: "var(--red)", flex: "none" }} />}
                    </div>
                    <div className="mono" style={{ fontSize: 10, color: "var(--ink-4)" }}>{s.id} · {s.group}</div>
                    {s.supervisorId && <div className="muted" style={{ fontSize: 10.5, marginTop: 3 }}>{(supMap[s.supervisorId] || { name: s.supervisorId }).name}</div>}
                    {(s.attempts || []).filter(a => a.status === "rejected").length > 0 && (
                      <div className="badge badge-red" style={{ height: 15, fontSize: 9, marginTop: 5 }}>
                        ×{(s.attempts || []).filter(a => a.status === "rejected").length} rejected
                      </div>
                    )}
                  </button>
                ))}
                {!list.length && <div className="muted" style={{ fontSize: 11.5, textAlign: "center", padding: "14px 0" }}>—</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ---------------- FacStudents Component (search & filters list) ---------------- */
interface FacStudentsProps {
  focusStudent: string | null;
  onClearFocus: () => void;
}

export const FacStudents: React.FC<FacStudentsProps> = ({ focusStudent, onClearFocus }) => {
  const { students, supervisors: apiSups, supervisorById: apiSupById } = useAppContext();
  const supList = apiSups;
  const supMap = apiSupById;
  const [open, setOpen] = useState<string | null>(focusStudent);
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("all");
  const [group, setGroup] = useState("all");
  const [sup, setSup] = useState("all");

  useEffect(() => { 
    setOpen(focusStudent); 
  }, [focusStudent]);

  if (open) {
    return (
      <StudentRecord 
        studentId={open} 
        onBack={() => { setOpen(null); onClearFocus(); }} 
      />
    );
  }

  const list = students.filter(s => {
    if (q && !(s.name.toLowerCase().includes(q.toLowerCase()) || s.id.toLowerCase().includes(q.toLowerCase()))) return false;
    if (stage !== "all" && s.stateIndex !== +stage) return false;
    if (group !== "all" && s.group !== group) return false;
    if (sup !== "all" && s.supervisorId !== sup) return false;
    return true;
  });

  const groups = Array.from(new Set(students.map(s => s.group))).sort();

  return (
    <div>
      <SectionTitle 
        sub={`${list.length} of ${students.length} students`} 
        right={
          <div style={{ position: "relative" }}>
            <Icon name="search" size={16} style={{ position: "absolute", left: 11, top: 11, color: "var(--ink-4)" }} />
            <input className="input" placeholder="Search name or ID…" value={q} onChange={e => setQ(e.target.value)} style={{ width: 240, paddingLeft: 34, height: 38 }} />
          </div>
        }
      >
        All Students
      </SectionTitle>

      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <span className="eyebrow">Filter</span>
        <select className="select" value={stage} onChange={e => setStage(e.target.value)} style={{ width: "auto", height: 34 }}>
          <option value="all">All stages</option>
          {STATES.map(s => <option key={s.key} value={s.i}>{s.i + 1}. {s.short}</option>)}
        </select>
        <select className="select" value={group} onChange={e => setGroup(e.target.value)} style={{ width: "auto", height: 34 }}>
          <option value="all">All groups</option>
          {groups.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select className="select" value={sup} onChange={e => setSup(e.target.value)} style={{ width: "auto", height: 34 }}>
          <option value="all">All supervisors</option>
          {supList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {(stage !== "all" || group !== "all" || sup !== "all" || q) && (
          <button className="btn btn-quiet btn-sm" onClick={() => { setStage("all"); setGroup("all"); setSup("all"); setQ(""); }}>Clear</button>
        )}
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead><tr><th>Student</th><th>ID</th><th>Group</th><th>Stage</th><th>Supervisor</th><th>Rework</th><th></th></tr></thead>
            <tbody>
              {list.map(s => (
                <tr key={s.id} onClick={() => setOpen(s.id)} style={{ cursor: 'pointer' }}>
                  <td><div style={{ display: "flex", alignItems: "center", gap: 9 }}><Avatar name={s.name} role="Student" size={26} /><span style={{ fontWeight: 600, color: "var(--ink)" }}>{s.name}</span>{s.flagged && <Icon name="flag" size={13} style={{ color: "var(--red)" }} />}</div></td>
                  <td><span className="mono" style={{ fontSize: 12 }}>{s.id}</span></td>
                  <td>{s.group}</td>
                  <td><StateBadge stateIndex={s.stateIndex} short /></td>
                  <td>{s.supervisorId ? (supMap[s.supervisorId] || { name: s.supervisorId }).name : <span className="faint">—</span>}</td>
                  <td>
                    {(s.attempts || []).filter(a => a.status === "rejected").length > 0 ? (
                      <Badge tone="red">×{(s.attempts || []).filter(a => a.status === "rejected").length}</Badge>
                    ) : s.protoPres > 1 ? (
                      <Badge tone="amber">proto ×{s.protoPres}</Badge>
                    ) : (
                      <span className="faint">—</span>
                    )}
                  </td>
                  <td><Icon name="chevronRight" size={16} style={{ color: "var(--ink-4)" }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!list.length && (
            <EmptyState icon="search" title="No students match your filters" sub="Try clearing the search or filters to see the full cohort." action={<button className="btn btn-ghost" onClick={() => { setStage("all"); setGroup("all"); setSup("all"); setQ(""); }}>Clear all filters</button>} />
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------------- FacExaminers Component ---------------- */
export const FacExaminers: React.FC = () => {
  const {
    students, assignExaminer, refreshStudents,
    supervisorById: apiSupById,
    examiners: apiExaminers,
  } = useAppContext();
  const supMap = apiSupById;
  const [scheduling, setScheduling] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState<{ [stuId: string]: string }>({});
  const [selectedExaminer, setSelectedExaminer] = useState<{ [stuId: string]: string }>({});
  const [assigning, setAssigning] = useState<string | null>(null);
  const [panelsByStudent, setPanelsByStudent] = useState<Record<string, PanelAssignmentResponse[]>>({});
  const [q, setQ] = useState('');

  // Step 1: book submitted, waiting to be scheduled for pre-defense
  const bookSubmitted = students.filter(s => s.stateIndex === 8 && matchesSearch(s.name, s.reg, q));
  // Students who could need a panel assignment right now (pre-defense or defense phase)
  const preDefenseCandidates = students.filter(s => s.stateIndex === 9);
  const defenseCandidates = students.filter(s => s.stateIndex === 10);

  const loadPanels = React.useCallback(async () => {
    const ids = [...preDefenseCandidates, ...defenseCandidates].map(s => s.id);
    if (!getToken() || ids.length === 0) { setPanelsByStudent({}); return; }
    const results = await Promise.all(ids.map(id => panelsApi.byStudent(id).catch(() => [] as PanelAssignmentResponse[])));
    const map: Record<string, PanelAssignmentResponse[]> = {};
    ids.forEach((id, i) => { map[id] = results[i]; });
    setPanelsByStudent(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students.length]);

  useEffect(() => { loadPanels(); }, [loadPanels]);

  // "Pending" means no outcome recorded yet — after a REFERRED/FAILED re-defense outcome, the
  // old (resolved) row still exists, so checking "any panel of this type" would wrongly keep
  // hiding the student from needing a new examiner.
  const hasPendingPanel = (studentId: string, type: 'PRE_DEFENSE' | 'DEFENSE') =>
    (panelsByStudent[studentId] || []).some(p => p.panelType === type && !p.outcome);

  // Step 2: in pre-defense, waiting for examiner assignment
  const needExaminer = preDefenseCandidates
    .filter(s => !hasPendingPanel(s.id, 'PRE_DEFENSE'))
    .filter(s => matchesSearch(s.name, s.reg, q));
  // Step 3: in defense, waiting for examiner assignment
  const needDefenseExaminer = defenseCandidates
    .filter(s => !hasPendingPanel(s.id, 'DEFENSE'))
    .filter(s => matchesSearch(s.name, s.reg, q));

  async function handleSchedule(stuId: string) {
    setScheduling(stuId);
    try {
      const { studentsApi } = await import('../api/students');
      await studentsApi.transition(stuId, 'PRE_DEFENSE');
      await refreshStudents();
      notify('Student scheduled for pre-defense', 'success');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not schedule pre-defense', 'error');
    } finally {
      setScheduling(null);
    }
  }

  async function handleAssign(stu: Student, panelType: 'predefense' | 'defense') {
    const exId = selectedExaminer[stu.id];
    const localDateTime = scheduledAt[stu.id];
    if (!exId || !localDateTime) return;
    setAssigning(stu.id);
    try {
      const isoDateTime = new Date(localDateTime).toISOString();
      await assignExaminer(stu.id, exId, panelType, isoDateTime);
      notify(`Examiner assigned to ${stu.name}`, 'success');
      await loadPanels();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Failed to assign examiner', 'error');
    } finally {
      setAssigning(null);
    }
  }

  return (
    <div>
      <SectionTitle
        sub="Schedule pre-defense, assign a pre-defense examiner, then assign a defense examiner once cleared. A student's own supervisor can never be their examiner."
        right={<RowSearch value={q} onChange={setQ} />}
      >
        Assign Examiners
      </SectionTitle>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 11, padding: "12px 16px", background: "var(--violet-bg)", border: "1px solid #D9CDEC", borderRadius: 10, marginBottom: 22, fontSize: 13 }}>
        <Icon name="scale" size={17} style={{ color: "var(--violet)", flex: "none", marginTop: 1 }} />
        <span style={{ color: "var(--ink-2)" }}>An examiner's assigned-students list is <strong>completely separate</strong> from the students they supervise. The system will never offer a student's own supervisor as their examiner.</span>
      </div>

      {/* Step 1 */}
      <div className="card" style={{ overflow: "hidden", marginBottom: 20 }}>
        <div className="card-hd">
          <div>
            <h3>Step 1 — Schedule Pre-Defense</h3>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>These students have submitted their book. Advance them to Pre-Defense when ready.</div>
          </div>
          <Badge tone="amber">{bookSubmitted.length} waiting</Badge>
        </div>
        {bookSubmitted.length === 0 ? (
          <div className="card-pad">
            <div className="muted" style={{ fontSize: 13, textAlign: "center", padding: "12px 0" }}>No students at Book Submitted stage.</div>
          </div>
        ) : (
          <table className="tbl">
            <thead><tr><th>Student</th><th>Supervisor</th><th>Book submitted</th><th></th></tr></thead>
            <tbody>
              {bookSubmitted.map(s => {
                const sup = s.supervisorId ? supMap[s.supervisorId] : null;
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <Avatar name={s.name} role="Student" size={26} />
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--ink)" }}>{s.name}</div>
                          <div className="mono muted" style={{ fontSize: 10.5 }}>{s.reg || s.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="muted">{sup ? sup.name : '—'}</td>
                    <td className="muted">{s.enteredStageTs ? new Date(s.enteredStageTs).toLocaleDateString() : '—'}</td>
                    <td>
                      <button
                        className="btn btn-navy btn-sm"
                        disabled={scheduling === s.id}
                        onClick={() => handleSchedule(s.id)}
                      >
                        {scheduling === s.id ? 'Scheduling…' : 'Schedule Pre-Defense'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Step 2 */}
      {renderAssignTable({
        title: 'Step 2 — Assign Pre-Defense Examiner',
        sub: 'These students are in Pre-Defense. Assign an examiner to complete the panel.',
        emptyText: 'No students awaiting pre-defense examiner assignment.',
        candidates: needExaminer,
        panelType: 'predefense',
      })}

      {/* Step 3 */}
      {renderAssignTable({
        title: 'Step 3 — Assign Defense Examiner',
        sub: 'These students cleared pre-defense and are in Defense. Assign an examiner to complete the panel.',
        emptyText: 'No students awaiting defense examiner assignment.',
        candidates: needDefenseExaminer,
        panelType: 'defense',
      })}
    </div>
  );

  function renderAssignTable(opts: {
    title: string; sub: string; emptyText: string;
    candidates: Student[]; panelType: 'predefense' | 'defense';
  }) {
    const { title, sub, emptyText, candidates, panelType } = opts;
    const backendType = panelType === 'predefense' ? 'PRE_DEFENSE' : 'DEFENSE';
    return (
      <div className="card" style={{ overflow: "hidden", marginBottom: 20 }}>
        <div className="card-hd">
          <div>
            <h3>{title}</h3>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{sub}</div>
          </div>
          <Badge tone="violet">{candidates.length} need examiner</Badge>
        </div>
        {candidates.length === 0 ? (
          <div className="card-pad">
            <div className="muted" style={{ fontSize: 13, textAlign: "center", padding: "12px 0" }}>{emptyText}</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead><tr><th>Student</th><th>Supervisor (excluded)</th><th>Date &amp; time</th><th>Assign examiner</th><th></th></tr></thead>
              <tbody>
                {candidates.map(s => {
                  const sup = s.supervisorId ? supMap[s.supervisorId] : null;
                  // Exclude the student's supervisor, and anyone who already examined this
                  // student at the *other* panel stage — but a re-defense may legitimately
                  // reuse the same examiner who did an earlier defense attempt.
                  const alreadyExamined = new Set(
                    (panelsByStudent[s.id] || [])
                      .filter(p => p.panelType !== backendType)
                      .map(p => p.examinerId)
                  );
                  const eligible = apiExaminers.filter(x => x.id !== s.supervisorId && !alreadyExamined.has(x.id));
                  const priorAttempts = (panelsByStudent[s.id] || []).filter(p => p.panelType === backendType);
                  const nextAttempt = priorAttempts.length > 0
                    ? Math.max(...priorAttempts.map(p => p.attemptNumber)) + 1
                    : 1;
                  return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <Avatar name={s.name} role="Student" size={26} />
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--ink)", display: "flex", alignItems: "center", gap: 6 }}>
                              {s.name}
                              {nextAttempt > 1 && <Badge tone="amber">Attempt {nextAttempt}</Badge>}
                            </div>
                            <div className="mono muted" style={{ fontSize: 10.5 }}>{s.reg || s.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>{sup ? <span style={{ color: "var(--ink-3)" }}>{sup.name}</span> : <span className="faint">—</span>}</td>
                      <td>
                        <input
                          type="datetime-local"
                          className="input"
                          style={{ height: 34, fontSize: 12.5 }}
                          value={scheduledAt[s.id] || ''}
                          onChange={e => setScheduledAt(a => ({ ...a, [s.id]: e.target.value }))}
                        />
                      </td>
                      <td>
                        <select className="select" style={{ width: 210, height: 34 }}
                          value={selectedExaminer[s.id] || ''}
                          onChange={e => setSelectedExaminer(a => ({ ...a, [s.id]: e.target.value }))}>
                          <option value="" disabled>Choose examiner…</option>
                          {eligible.map(x => <option key={x.id} value={x.id}>{x.name}{x.title ? ` — ${x.title}` : ''}</option>)}
                        </select>
                      </td>
                      <td>
                        <button className="btn btn-primary btn-sm"
                          disabled={!selectedExaminer[s.id] || !scheduledAt[s.id] || assigning === s.id}
                          onClick={() => handleAssign(s, panelType)}>
                          {assigning === s.id ? 'Assigning…' : 'Assign'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }
};

/* ---------------- FacPending Component ---------------- */
interface FacPendingProps {
  onOpen: (page: string, id: string) => void;
}

export const FacPending: React.FC<FacPendingProps> = ({ onOpen }) => {
  const { pendingItems } = useAppContext();
  const [done, setDone] = useState<{ [id: string]: boolean }>({});
  
  const sevTone: { [key: string]: string } = { high: "red", med: "amber", low: "grey" };
  const kindIcon: { [key: string]: string } = { "assign-examiner": "scale", "assign-supervisor": "users", "email": "mail", "stalled": "clock" };
  
  const open = pendingItems.filter(p => !done[p.id]);

  return (
    <div>
      <SectionTitle sub="Assignments not yet made and emails not yet sent — keep the cohort moving.">Pending Coordination</SectionTitle>
      
      <div className="resp-cols-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 18 }}>
        <MetricCard label="Open items" value={open.length} tone="red" icon="alert" />
        <MetricCard label="Assignments pending" value={pendingItems.filter(p => p.kind.startsWith("assign")).length} tone="amber" icon="scale" />
        <MetricCard label="Emails not sent" value={pendingItems.filter(p => p.kind === "email").length} tone="blue" icon="mail" />
      </div>
      
      <div className="card" style={{ overflow: "hidden" }}>
        <div className="card-hd"><h3>Needs your action</h3></div>
        {pendingItems.map((p, i) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 18px", borderTop: i ? "1px solid var(--line-soft)" : 0, opacity: done[p.id] ? .5 : 1 }}>
            <span style={{ width: 34, height: 34, borderRadius: 9, background: "var(--surface-2)", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name={kindIcon[p.kind]} size={16} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{p.label}</span>
                <Badge tone={sevTone[p.sev]}>{p.sev.toUpperCase()}</Badge>
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}><span className="mono">{p.student}</span> · {p.detail}</div>
            </div>
            <span className="mono muted" style={{ fontSize: 11.5, flex: "none" }}>{p.age}</span>
            {done[p.id] ? (
              <Badge tone="green" dot>Followed up</Badge>
            ) : (
              <div style={{ display: "flex", gap: 7 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => onOpen("students", p.student)}>Open</button>
                <button className="btn btn-amber btn-sm" onClick={() => { 
                  setDone(d => ({ ...d, [p.id]: true })); 
                  notify("Nudge sent · " + p.student, "success"); 
                }}>
                  <Icon name="send" size={13} /> Nudge
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------------- FacProtoData Component ---------------- */
export const FacProtoData: React.FC = () => {
  const { students } = useAppContext();
  const [query, setQuery] = useState("STU-2026-008");
  const [id, setId] = useState<string | null>("STU-2026-008");
  const [fetching, setFetching] = useState(false);
  const [notFound, setNotFound] = useState<string | null>(null);

  const stu = id ? students.find(s => s.id === id) : null;
  const protoData: any = {
    "STU-2026-008": { 
      status: "Granted", 
      presentations: 3, 
      score: 78, 
      board: "Prototype Review Board · Group A", 
      history: [
        { d: "08 Nov 2025", r: "Needs refinement", note: "Sensor data flow unclear; add error handling." }, 
        { d: "14 Nov 2025", r: "Needs refinement", note: "UI incomplete; demonstrate alerts." }, 
        { d: "18 Nov 2025", r: "Granted", note: "All gaps addressed." }
      ] 
    },
  };

  const d = stu && (protoData[stu.id] || { 
    status: "Granted", 
    presentations: stu.protoPres || 1, 
    score: 72, 
    board: "Prototype Review Board", 
    history: [
      { d: fmt(stu.enteredStageTs), r: "Granted", note: "Single presentation — granted." }
    ] 
  });

  function fetchId(raw?: string) {
    const q = (raw != null ? raw : query).trim().toUpperCase();
    if (!q) return;
    setFetching(true); 
    setNotFound(null);
    setTimeout(() => {
      const found = students.find(s => s.id === q);
      if (found && found.stateIndex >= 3) { 
        setId(q); 
        setNotFound(null); 
      } else { 
        setId(null); 
        setNotFound(q); 
      }
      setFetching(false);
    }, 550);
  }

  return (
    <div>
      <SectionTitle sub="Read-only prototype-review records, fetched by student ID from the external review system.">Prototype Data</SectionTitle>
      
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 16px", background: "#fff", border: "1px dashed var(--violet)", borderRadius: 10, marginBottom: 18, fontSize: 12.5 }}>
        <Icon name="external" size={16} style={{ color: "var(--violet)", flex: "none" }} />
        <span style={{ color: "var(--ink-2)" }}><strong>External system</strong> · prototype-review API <Badge tone="amber" style={{ marginLeft: 4 }}>NOT YET CONNECTED — STUB</Badge> Data below is illustrative sample data labelled <em>via API</em>.</span>
      </div>

      {/* fetch by ID */}
      <div className="card card-pad" style={{ marginBottom: 18, maxWidth: 720 }}>
        <label className="field-label">Look up a student record by ID</label>
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 220px", minWidth: 0 }}>
            <Icon name="search" size={16} style={{ position: "absolute", left: 12, top: 11, color: "var(--ink-4)" }} />
            <input className="input mono" value={query} placeholder="e.g. STU-2026-008"
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") fetchId(); }}
              style={{ paddingLeft: 36, textTransform: "uppercase" }} />
          </div>
          <button className="btn btn-primary" onClick={() => fetchId()} disabled={fetching || !query.trim()} style={{ flex: "none" }}>
            {fetching ? <><Icon name="refresh" size={15} /> Fetching…</> : <><Icon name="external" size={15} /> Fetch record</>}
          </button>
        </div>
        <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>Type the full student ID and press Enter or Fetch. The system queries the external review API by ID.</div>
      </div>

      {fetching && (
        <div className="card card-pad" style={{ maxWidth: 720 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--ink-3)", fontSize: 13 }}>
            <Icon name="refresh" size={16} /> Querying prototype-review API for <span className="mono">{query.trim().toUpperCase()}</span>…
          </div>
        </div>
      )}

      {!fetching && notFound && (
        <div style={{ maxWidth: 720 }}>
          <EmptyState icon="search" title={"No prototype record for " + notFound} sub="Check the ID is correct and that the student has reached the Prototype Review stage. Only students at or beyond prototyping have records in the external system." />
        </div>
      )}

      {!fetching && stu && d && (
        <div className="card fade-in" style={{ overflow: "hidden", maxWidth: 720 }}>
          <div style={{ padding: "16px 20px", background: "var(--violet-bg)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div><div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>{stu.name}</div><div className="mono muted" style={{ fontSize: 11.5 }}>{stu.id} · {d.board}</div></div>
            <span className="badge badge-violet" style={{ height: 24 }}>via API</span>
          </div>
          <div className="card-pad" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, borderBottom: "1px solid var(--line-soft)" }}>
            <div><div className="eyebrow">Status</div><div style={{ marginTop: 6 }}><Badge tone={d.status === "Granted" ? "green" : "amber"} dot>{d.status}</Badge></div></div>
            <div><div className="eyebrow">Presentations</div><div className="num" style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", marginTop: 4 }}>{d.presentations}×</div></div>
            <div><div className="eyebrow">Board score</div><div className="num" style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", marginTop: 4 }}>{d.score}<span style={{ fontSize: 13, color: "var(--ink-4)" }}>/100</span></div></div>
          </div>
          <div className="card-pad">
            <div className="eyebrow" style={{ marginBottom: 10 }}>Presentation history</div>
            {d.history.map((h: any, i: number) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "9px 0", borderTop: i ? "1px solid var(--line-soft)" : 0 }}>
                <span className="mono muted" style={{ fontSize: 11.5, width: 92, flex: "none" }}>{h.d}</span>
                <Badge tone={h.r === "Granted" ? "green" : "red"} style={{ flex: "none", height: 18 }}>{h.r}</Badge>
                <span className="muted" style={{ fontSize: 12.5 }}>{h.note}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
