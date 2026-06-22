import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import type { CaseLetterState } from '../context/AppContext';
import type { Student } from '../types';
import { Icon, Avatar, StateBadge, EmptyState, SectionTitle, Modal } from './SharedUI';
import { 
  STATES, 
  bookDeadline, 
  daysLeft, 
  fmt, 
  semesterOf, 
  semesters, 
  currentSemester 
} from '../utils/fypData';

const DAYMS = 86400000;

export interface RiskReason {
  t: string;
  w: 'critical' | 'high' | 'med' | 'low' | 'done';
}

export interface RiskInfo {
  level: 'critical' | 'watch' | 'ontrack' | 'done';
  score: number;
  reasons: RiskReason[];
  daysLeft: number;
  gap: number;
  daysInStage: number;
  owner: string;
  action: string;
  page: string | null;
  role: string;
  deadline: string;
}

export function computeRisk(stu: Student, letters: { [stuId: string]: CaseLetterState }): RiskInfo {
  const L = letters[stu.id] || { status: 'none' };
  const deadline = bookDeadline(stu);
  const dlDays = daysLeft(deadline);
  const reg = new Date(stu.bookRegisteredTs).getTime();
  const dl = new Date(deadline).getTime();
  const elapsedFrac = Math.max(0, Math.min(1, (Date.now() - reg) / (dl - reg)));
  const expectedStage = elapsedFrac * 10;
  const gap = expectedStage - stu.stateIndex;           // +ve = behind schedule
  const daysInStage = Math.max(0, (Date.now() - new Date(stu.enteredStageTs).getTime()) / DAYMS);
  
  const letterOwed = (L.status === "none" || L.status === "requested" || L.status === "rejected") && stu.stateIndex <= 1;
  const windowClosed = L.status === "requested" && !!(L.deadlineTs && Date.now() > L.deadlineTs);
  const reworked = (stu.attempts || []).some(a => a.status === "rejected");

  let score = 0;
  const reasons: RiskReason[] = [];
  const done = stu.stateIndex >= 10;
  const stagesRemaining = 10 - stu.stateIndex;
  // healthy pace needs ~33 days per remaining stage; buffer = slack against the deadline
  const buffer = dlDays - stagesRemaining * 33;

  if (!done && dlDays < 0) { 
    score += 100; 
    reasons.push({ t: "1-year book deadline has LAPSED", w: "critical" }); 
  } else if (!done) {
    if (buffer < -60) { 
      score += 60; 
      reasons.push({ t: `Severely behind — ~${Math.abs(Math.round(buffer / 33))} stages short of pace`, w: "high" }); 
    } else if (buffer < -30) { 
      score += 40; 
      reasons.push({ t: "Behind schedule for the remaining stages", w: "high" }); 
    } else if (buffer < 0) { 
      score += 22; 
      reasons.push({ t: "Slightly behind the pace needed to finish in time", w: "med" }); 
    } else if (buffer < 25) { 
      score += 10; 
      reasons.push({ t: "Little slack left against the deadline", w: "low" }); 
    }
    
    if (dlDays < 45 && stu.stateIndex < 8) { 
      score += 20; 
      reasons.push({ t: `Only ${dlDays}d left and still at ${STATES[stu.stateIndex]?.short || ''}`, w: "high" }); 
    }
  }

  if (!done && daysInStage > 160) { 
    score += 16; 
    reasons.push({ t: `Stalled ${Math.round(daysInStage)}d in ${STATES[stu.stateIndex]?.short || ''}`, w: "med" }); 
  } else if (!done && daysInStage > 110) { 
    score += 8; 
    reasons.push({ t: `${Math.round(daysInStage)}d in ${STATES[stu.stateIndex]?.short || ''}`, w: "low" }); 
  }

  if (windowClosed) { 
    score += 22; 
    reasons.push({ t: "Letter window closed — not submitted", w: "high" }); 
  } else if (letterOwed && L.status !== "rejected") { 
    score += 8; 
    reasons.push({ t: "Case letter still owed", w: "low" }); 
  }
  
  if (L.status === "rejected") { 
    score += 10; 
    reasons.push({ t: "Letter returned — awaiting resend", w: "med" }); 
  }
  
  if (stu.flagged) { 
    score += 14; 
    reasons.push({ t: "Complaint on file", w: "med" }); 
  }
  
  if (reworked) { 
    score += 6; 
    reasons.push({ t: "Proposal rework history", w: "low" }); 
  }

  if (done) { 
    score = 0; 
    reasons.length = 0; 
    reasons.push({ t: "Journey complete — defended", w: "done" }); 
  }

  let level: 'critical' | 'watch' | 'ontrack' | 'done' = "ontrack";
  if (done) level = "done";
  else if (dlDays < 0) level = "critical";
  else if (score >= 55) level = "critical";
  else if (score >= 30) level = "watch";
  else level = "ontrack";

  // who should act next
  let owner = "—", action = "Monitor", page: string | null = null, role = "facilitator";
  if (level === "done") { 
    owner = "—"; 
    action = "Completed"; 
  } else if (letterOwed || windowClosed || L.status === "rejected") { 
    owner = "HOD / Student"; 
    action = windowClosed ? "Re-request letter" : "Chase case letter"; 
    role = "hod"; 
    page = "find"; 
  } else if (stu.stateIndex === 5) { 
    owner = "Supervisor"; 
    action = "Push proposal review"; 
    role = "facilitator"; 
    page = "students"; 
  } else if (stu.stateIndex === 7) { 
    owner = "Supervisor"; 
    action = stu.nextMeeting && !stu.nextMeeting.confirmed ? "Confirm meeting / progress" : "Drive to book sign-off"; 
    role = "facilitator"; 
    page = "students"; 
  } else if (stu.stateIndex === 8) { 
    owner = "Facilitator"; 
    action = "Assign pre-defense"; 
    role = "facilitator"; 
    page = "examiners"; 
  } else if (!stu.supervisorId && stu.stateIndex >= 6) { 
    owner = "Facilitator"; 
    action = "Assign supervisor"; 
    role = "facilitator"; 
    page = "supervisors"; 
  } else { 
    owner = "Facilitator"; 
    action = "Monitor progress"; 
    role = "facilitator"; 
    page = "students"; 
  }

  return { level, score: Math.min(100, Math.round(score)), reasons, daysLeft: dlDays, gap, daysInStage, owner, action, page, role, deadline };
}

export const RISK_META = {
  critical: { label: "Critical", tone: "red", color: "var(--red)", bg: "var(--red-bg)", icon: "alert", desc: "Will lose fees without action" },
  watch: { label: "At risk", tone: "amber", color: "var(--amber-deep)", bg: "var(--amber-bg)", icon: "clock", desc: "Behind — needs a push" },
  ontrack: { label: "On track", tone: "green", color: "var(--green-deep)", bg: "var(--green-bg)", icon: "check", desc: "Pace is healthy" },
  done: { label: "Completed", tone: "grey", color: "var(--ink-3)", bg: "var(--surface-2)", icon: "checkCircle", desc: "Defended" },
};

/* ---------------- Risk Dashboard ---------------- */
interface RiskDashboardProps {
  onOpen?: (page: string, id: string) => void;
  scope?: 'supervisor' | 'facilitator' | 'hod' | 'superadmin' | string;
}

export const RiskDashboard: React.FC<RiskDashboardProps> = ({ onOpen, scope }) => {
  const { students, letters, activeUserId } = useAppContext();
  const [level, setLevel] = useState<string>("all");
  const [sem, setSem] = useState<string>("all");
  const [q, setQ] = useState<string>("");
  const [detail, setDetail] = useState<{ s: Student; r: RiskInfo } | null>(null);

  const sems = semesters(students);
  const cur = currentSemester();

  const pool = scope === "supervisor" ? students.filter(s => s.supervisorId === activeUserId) : students;
  const scored = useMemo(() => {
    return pool.map(s => ({ s, r: computeRisk(s, letters) })).sort((a, b) => b.r.score - a.r.score);
  }, [pool, letters]);

  const counts = { critical: 0, watch: 0, ontrack: 0, done: 0 };
  scored.forEach(x => counts[x.r.level]++);
  const atRiskTotal = counts.critical + counts.watch;

  let rows = scored;
  if (level !== "all") rows = rows.filter(x => x.r.level === level);
  if (sem !== "all") rows = rows.filter(x => semesterOf(x.s.bookRegisteredTs).key === sem);
  if (q) rows = rows.filter(x => x.s.name.toLowerCase().includes(q.toLowerCase()) || x.s.id.toLowerCase().includes(q.toLowerCase()));

  const total = pool.length;
  const pct = (n: number) => total ? Math.round(n / total * 100) : 0;

  return (
    <div>
      <SectionTitle style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        Risk Dashboard
      </SectionTitle>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <p className="muted" style={{ fontSize: 13, margin: '0 0 10px', maxWidth: 600 }}>
          {scope === "supervisor" ? "Which of your students are at risk of lapsing their 1-year book deadline." : "Every student scored on the risk of lapsing their 1-year book deadline and losing fees."}
        </p>
        <div style={{ position: "relative" }}>
          <Icon name="search" size={16} style={{ position: "absolute", left: 11, top: 11, color: "var(--ink-4)" }} />
          <input className="input" placeholder="Search name or ID…" value={q} onChange={e => setQ(e.target.value)} style={{ width: 220, paddingLeft: 34, height: 38 }} />
        </div>
      </div>

      {/* headline risk banner */}
      <div className="card" style={{ overflow: "hidden", marginBottom: 18, borderColor: counts.critical ? "var(--red)" : "var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", background: counts.critical ? "var(--red-bg)" : "var(--green-bg)", flexWrap: "wrap" }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: counts.critical ? "var(--red)" : "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            <Icon name={counts.critical ? "alert" : "shield"} size={26} />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 16.5, fontWeight: 600, color: "var(--ink)" }}>
              {atRiskTotal === 0 ? "No students currently at risk" : `${atRiskTotal} student${atRiskTotal === 1 ? "" : "s"} at risk of losing fees`}
            </div>
            <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
              {counts.critical} critical · {counts.watch} need a push · {counts.ontrack} on track{counts.done ? ` · ${counts.done} completed` : ""}
            </div>
          </div>
          {counts.critical > 0 && (
            <button className="btn btn-danger" onClick={() => setLevel("critical")}>
              <Icon name="alert" size={15} /> Show {counts.critical} critical
            </button>
          )}
        </div>
        {/* distribution bar */}
        <div style={{ display: "flex", height: 8 }}>
          {(['critical', 'watch', 'ontrack', 'done'] as const).map(k => counts[k] > 0 && (
            <div 
              key={k} 
              title={RISK_META[k].label + ": " + counts[k]} 
              style={{ 
                width: pct(counts[k]) + "%", 
                background: k === "critical" ? "var(--red)" : k === "watch" ? "var(--amber)" : k === "ontrack" ? "var(--green)" : "var(--surface-3)" 
              }} 
            />
          ))}
        </div>
      </div>

      {/* level filter cards */}
      <div className="resp-cols-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 }}>
        {(['critical', 'watch', 'ontrack', 'done'] as const).map(k => {
          const m = RISK_META[k];
          return (
            <div key={k} className="card metric-card" onClick={() => setLevel(level === k ? "all" : k)}
              style={{ padding: "14px 16px", cursor: "pointer", borderColor: level === k ? m.color : "var(--line)", boxShadow: level === k ? "0 0 0 2px " + m.color + "22" : "var(--sh-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span className="badge" style={{ background: m.bg, color: m.color, height: 22 }}>
                  <span className="dot" style={{ background: m.color }} /> {m.label}
                </span>
                <Icon name={m.icon} size={16} style={{ color: m.color, opacity: .85 }} />
              </div>
              <div className="num" style={{ fontSize: 26, fontWeight: 600, color: "var(--ink)", lineHeight: 1 }}>{counts[k]}</div>
              <div className="muted" style={{ fontSize: 11.5, marginTop: 5 }}>{m.desc}</div>
            </div>
          );
        })}
      </div>

      {/* filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <span className="eyebrow">Showing</span>
        <button className={"chip" + (level === "all" ? " active" : "")} onClick={() => setLevel("all")}>All levels</button>
        {(['critical', 'watch', 'ontrack'] as const).map(k => (
          <button key={k} className={"chip" + (level === k ? " active" : "")} onClick={() => setLevel(k)}>
            <span className="dot" style={{ width: 7, height: 7, borderRadius: "50%", background: RISK_META[k].color }} /> {RISK_META[k].label}
          </button>
        ))}
        {scope !== "supervisor" && (
          <select className="select" value={sem} onChange={e => setSem(e.target.value)} style={{ width: "auto", height: 32, marginLeft: 4 }}>
            <option value="all">All semesters</option>
            {sems.map(s => <option key={s.key} value={s.key}>{s.label}{s.order === cur.order ? " (current)" : ""}</option>)}
          </select>
        )}
        <span className="muted" style={{ fontSize: 12.5, marginLeft: "auto" }}>{rows.length} shown</span>
      </div>

      {/* table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead><tr><th>Risk</th><th>Student</th><th>Stage</th><th>Days left</th><th>Top reason</th><th>Needs action by</th><th></th></tr></thead>
            <tbody>
              {rows.map(({ s, r }) => {
                const m = RISK_META[r.level];
                return (
                  <tr key={s.id} onClick={() => setDetail({ s, r })} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 38, textAlign: "center", fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color: m.color }}>{r.level === "done" ? "—" : r.score}</span>
                        <span className="badge" style={{ background: m.bg, color: m.color, height: 20 }}><span className="dot" style={{ background: m.color }} /> {m.label}</span>
                      </div>
                    </td>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 9 }}><Avatar name={s.name} role="Student" size={26} /><div><div style={{ fontWeight: 600, color: "var(--ink)" }}>{s.name}</div><div className="mono muted" style={{ fontSize: 10.5 }}>{s.id}</div></div>{s.flagged && <Icon name="flag" size={12} style={{ color: "var(--red)" }} />}</div></td>
                    <td><StateBadge stateIndex={s.stateIndex} short /></td>
                    <td><span className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: r.daysLeft < 0 ? "var(--red)" : r.daysLeft < 60 ? "var(--amber-deep)" : "var(--ink-2)" }}>{r.level === "done" ? "—" : r.daysLeft < 0 ? "overdue" : r.daysLeft + "d"}</span></td>
                    <td style={{ fontSize: 12.5, color: "var(--ink-2)", maxWidth: 220 }}>{r.reasons[0] ? r.reasons[0].t : "—"}</td>
                    <td>{r.level === "done" ? <span className="faint">—</span> : <div><div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>{r.owner}</div><div className="muted" style={{ fontSize: 11 }}>{r.action}</div></div>}</td>
                    <td><Icon name="chevronRight" size={16} style={{ color: "var(--ink-4)" }} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!rows.length && <EmptyState icon="shield" title="Nothing here" sub="No students match this risk level or filter." />}
      </div>

      {/* detail drawer */}
      <Modal open={!!detail} onClose={() => setDetail(null)} width={520}>
        {detail && (() => {
          const { s, r } = detail, m = RISK_META[r.level];
          return (
            <div className="card" style={{ overflow: "hidden", boxShadow: "var(--sh-pop)" }}>
              <div style={{ padding: "16px 20px", background: m.bg, display: "flex", alignItems: "center", gap: 13 }}>
                <Avatar name={s.name} role="Student" size={44} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>{s.name}</div>
                  <div className="mono muted" style={{ fontSize: 11.5 }}>{s.id} · {semesterOf(s.bookRegisteredTs).short}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="badge" style={{ background: "#fff", color: m.color, height: 22 }}><span className="dot" style={{ background: m.color }} /> {m.label}</span>
                  <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: m.color, marginTop: 4 }}>{r.level === "done" ? "✓" : r.score}</div>
                </div>
              </div>
              <div className="card-pad" style={{ display: "grid", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                  <div style={{ padding: "10px 12px", background: "var(--surface)", borderRadius: 9 }}><div className="eyebrow">Stage</div><div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginTop: 4 }}>{STATES[s.stateIndex]?.short || ''}</div></div>
                  <div style={{ padding: "10px 12px", background: "var(--surface)", borderRadius: 9 }}><div className="eyebrow">Days left</div><div className="mono" style={{ fontSize: 13, fontWeight: 600, color: r.daysLeft < 0 ? "var(--red)" : "var(--ink)", marginTop: 4 }}>{r.level === "done" ? "—" : r.daysLeft < 0 ? "overdue" : r.daysLeft + "d"}</div></div>
                  <div style={{ padding: "10px 12px", background: "var(--surface)", borderRadius: 9 }}><div className="eyebrow">Deadline</div><div className="mono" style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginTop: 4 }}>{fmt(r.deadline)}</div></div>
                </div>
                <div>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>Why this score</div>
                  <div style={{ display: "grid", gap: 6 }}>
                    {r.reasons.map((rs, i) => {
                      const t = rs.w === "critical" || rs.w === "high" ? "red" : rs.w === "med" ? "amber" : rs.w === "done" ? "green" : "grey";
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "var(--ink-2)" }}>
                          <span className="dot" style={{ width: 7, height: 7, borderRadius: "50%", background: t === "red" ? "var(--red)" : t === "amber" ? "var(--amber-deep)" : t === "green" ? "var(--green)" : "var(--ink-4)", flex: "none" }} />
                          {rs.t}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {r.level !== "done" && (
                  <div style={{ padding: "12px 14px", background: m.bg, borderRadius: 10 }}>
                    <div className="eyebrow" style={{ marginBottom: 4 }}>Recommended next action</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{r.action}</div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 1 }}>Owner: {r.owner}</div>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, padding: "13px 18px", background: "var(--surface)", borderTop: "1px solid var(--line)" }}>
                <button className="btn btn-ghost" onClick={() => setDetail(null)}>Close</button>
                {r.page && onOpen && <button className="btn btn-primary" onClick={() => { if (r.page) { onOpen(r.page, s.id); setDetail(null); } }}>Open record <Icon name="arrowRight" size={14} /></button>}
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};
