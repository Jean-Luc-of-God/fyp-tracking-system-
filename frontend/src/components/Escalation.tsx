import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Student } from '../types';
import { Icon, Avatar, Badge, SectionTitle, MetricCard, Modal, EmptyState } from './SharedUI';
import type { TimelineEvent } from './Timeline';
import { Timeline } from './Timeline';
import { computeRisk } from './Risk';
import { fmt } from '../utils/fypData';
import { notify } from './LetterUI';

export interface Rung {
  n: number;
  within: number;
  to: string[];
  tone: 'low' | 'med' | 'high' | 'critical';
  label: string;
  who: string;
  icon: string;
  body: string;
}

export const RUNGS: Rung[] = [
  { n: 1, within: 60, to: ["Student"], tone: "low", label: "Gentle reminder", who: "Student", icon: "bell", body: "Friendly heads-up that the 1-year book deadline is approaching." },
  { n: 2, within: 30, to: ["Student", "Supervisor"], tone: "low", label: "Reminder + supervisor cc", who: "Student · cc Supervisor", icon: "bell", body: "Reminder to the student, copying their supervisor to start monitoring." },
  { n: 3, within: 14, to: ["Supervisor"], tone: "med", label: "Escalate to supervisor", who: "Supervisor", icon: "users", body: "Supervisor must intervene — the student is close to the deadline." },
  { n: 4, within: 7, to: ["HOD"], tone: "high", label: "Escalate to HOD", who: "HOD", icon: "shield", body: "Escalated to the Head of Department for direct action." },
  { n: 5, within: 1, to: ["HOD", "Student"], tone: "critical", label: "Final warning", who: "HOD + Student", icon: "alert", body: "Final warning — deadline is imminent or lapsed. Decision required." },
];

export const RUNG_TONE: { [key: string]: { c: string; bg: string } } = {
  low: { c: "var(--blue)", bg: "var(--blue-bg)" },
  med: { c: "var(--amber-deep)", bg: "var(--amber-bg)" },
  high: { c: "var(--red)", bg: "var(--red-bg)" },
  critical: { c: "var(--red-deep)", bg: "var(--red-bg)" }
};

export function currentRung(daysLeft: number) {
  if (daysLeft < 0) return 5;
  let n = 0;
  for (const r of RUNGS) {
    if (daysLeft <= r.within) {
      n = Math.max(n, r.n);
    }
  }
  return n;
}

// Global singleton state for escalation logs to survive page switching.
interface EscalationLogEntry {
  id: string;
  studentId: string;
  name: string;
  rung: number;
  to: string[];
  ts: number;
  auto: boolean;
}

class EscalationStoreImpl {
  log: EscalationLogEntry[] = [];
  sent: { [studentId: string]: number } = {};
  listeners = new Set<() => void>();
  seeded = false;

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  emit() {
    this.listeners.forEach(f => f());
  }

  seed(students: Student[], letters: any) {
    if (this.seeded) return;
    const now = Date.now();
    students.forEach(s => {
      if (s.stateIndex >= 10) return;
      const r = computeRisk(s, letters);
      const cur = currentRung(r.daysLeft);
      if (cur === 0) return;
      
      const h = (s.id.charCodeAt(s.id.length - 1) + s.id.charCodeAt(s.id.length - 2)) % 3;
      const seededTo = h === 0 ? cur : cur - 1;
      
      if (seededTo >= 1) {
        this.sent[s.id] = seededTo;
        for (let n = 1; n <= seededTo; n++) {
          const rg = RUNGS[n - 1];
          this.log.push({
            id: `ESC-${s.id}-${n}`,
            studentId: s.id,
            name: s.name,
            rung: n,
            to: rg.to,
            ts: now - (seededTo - n + 1) * 3 * 86400000 - (s.id.length * 1000),
            auto: true
          });
        }
      }
    });
    this.seeded = true;
    this.emit();
  }

  sentRung(id: string) {
    return this.sent[id] || 0;
  }

  dueRung(id: string, daysLeft: number) {
    const cur = currentRung(daysLeft);
    return cur > (this.sent[id] || 0) ? cur : 0;
  }

  send(stu: Student, rung: number, auto: boolean) {
    this.sent[stu.id] = Math.max(this.sent[stu.id] || 0, rung);
    const rg = RUNGS[rung - 1];
    const entry: EscalationLogEntry = {
      id: `ESC-${stu.id}-${rung}-${Date.now()}`,
      studentId: stu.id,
      name: stu.name,
      rung,
      to: rg.to,
      ts: Date.now(),
      auto: !!auto
    };
    this.log.unshift(entry);
    this.emit();
    return { prevSent: rung > 1 ? rung - 1 : 0, entryId: entry.id, studentId: stu.id };
  }

  undoSend(h: { prevSent: number; entryId: string; studentId: string }) {
    const i = this.log.findIndex(x => x.id === h.entryId);
    if (i >= 0) this.log.splice(i, 1);
    this.sent[h.studentId] = h.prevSent;
    this.emit();
  }

  historyFor(id: string) {
    return this.log.filter(x => x.studentId === id).sort((a, b) => a.ts - b.ts);
  }
}

export const EscalationStore = new EscalationStoreImpl();

export function useEscalation() {
  const { students, letters } = useAppContext();
  const [, force] = useState(0);
  
  useEffect(() => {
    EscalationStore.seed(students, letters);
    return EscalationStore.subscribe(() => force(n => n + 1));
  }, [students, letters]);

  return EscalationStore;
}

/* ---------------- Escalation Ladder page ---------------- */
interface EscalationLadderProps {
  onOpen?: (page: string, id: string) => void;
}

export const EscalationLadder: React.FC<EscalationLadderProps> = ({ onOpen }) => {
  const { students, letters } = useAppContext();
  const esc = useEscalation();
  const [detail, setDetail] = useState<any>(null);
  const [justSent, setJustSent] = useState<{ [stuId: string]: boolean }>({});

  const rows = useMemo(() => {
    return students
      .filter(s => s.stateIndex < 10)
      .map(s => {
        const r = computeRisk(s, letters);
        return {
          s,
          r,
          due: esc.dueRung(s.id, r.daysLeft),
          sent: esc.sentRung(s.id),
          cur: currentRung(r.daysLeft)
        };
      })
      .filter(x => x.cur > 0)
      .sort((a, b) => (b.due - a.due) || (a.r.daysLeft - b.r.daysLeft));
  }, [students, letters, esc.log.length, justSent]);

  const due = rows.filter(x => x.due > 0);
  const atRungCounts = [1, 2, 3, 4, 5].map(n => rows.filter(x => x.cur === n).length);
  const sentToday = esc.log.filter(x => !x.auto && Date.now() - x.ts < 86400000).length;

  function sendOne(x: any) {
    const h = esc.send(x.s, x.due, false);
    setJustSent(j => ({ ...j, [x.s.id]: true }));
    notify("Reminder sent to " + RUNGS[x.due - 1].who + " · " + x.s.name, {
      undo: () => {
        esc.undoSend(h);
        setJustSent(j => {
          const n = { ...j };
          delete n[x.s.id];
          return n;
        });
      }
    });
  }

  function sendAll() {
    const d = rows.filter(x => x.due > 0);
    d.forEach(x => esc.send(x.s, x.due, true));
    notify(d.length + " escalation reminder" + (d.length === 1 ? "" : "s") + " sent up the chain");
  }

  return (
    <div>
      <SectionTitle style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        Escalation Ladder
      </SectionTitle>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <p className="muted" style={{ fontSize: 13, margin: '0 0 10px', maxWidth: 600 }}>
          Automated deadline reminders that escalate up the chain — student, then supervisor, then HOD — as the 1-year book deadline nears.
        </p>
        <div>
          {due.length > 0 ? (
            <button className="btn btn-amber" onClick={sendAll}>
              <Icon name="send" size={15} /> Send all due ({due.length})
            </button>
          ) : (
            <Badge tone="green" dot>All reminders up to date</Badge>
          )}
        </div>
      </div>

      {/* metrics */}
      <div className="resp-cols-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 18 }}>
        <MetricCard label="Reminders due now" value={due.length} sub="awaiting send" icon="bell" tone={due.length ? "red" : "green"} />
        <MetricCard label="At final warning" value={atRungCounts[4]} sub="≤1 day / overdue" icon="alert" tone="red" />
        <MetricCard label="Sent this session" value={sentToday} sub="logged to audit" icon="send" tone="blue" />
      </div>

      {/* ladder strip */}
      <div className="card" style={{ overflow: "hidden", marginBottom: 18 }}>
        <div className="card-hd"><h3>The ladder</h3><span className="muted" style={{ fontSize: 12 }}>students at each rung right now</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 0 }}>
          {RUNGS.map((rg, i) => {
            const t = RUNG_TONE[rg.tone];
            return (
              <div key={rg.n} style={{ padding: "16px 16px", borderLeft: i ? "1px solid var(--line-soft)" : 0, position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, background: t.bg, color: t.c, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name={rg.icon} size={15} /></span>
                  {i < RUNGS.length - 1 && <Icon name="chevronRight" size={14} style={{ color: "var(--ink-4)", position: "absolute", right: -7, top: 22, zIndex: 1, background: "var(--white)" }} />}
                </div>
                <div className="num" style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>{atRungCounts[i]}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginTop: 3 }}>{rg.label}</div>
                <div className="muted" style={{ fontSize: 10.5, marginTop: 1 }}>≤{rg.within}d · {rg.who}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* due now */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div className="card-hd"><h3>Reminders due now</h3><Badge tone={due.length ? "amber" : "green"}>{due.length}</Badge></div>
        {due.length ? (
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead><tr><th>Student</th><th>Next reminder</th><th>Goes to</th><th>Days left</th><th>Last sent</th><th></th></tr></thead>
              <tbody>
                {due.map(x => {
                  const rg = RUNGS[x.due - 1];
                  const t = RUNG_TONE[rg.tone];
                  const hist = esc.historyFor(x.s.id);
                  const last = hist.length ? hist[hist.length - 1] : null;
                  return (
                    <tr key={x.s.id} onClick={() => setDetail(x)} style={{ cursor: 'pointer' }}>
                      <td><div style={{ display: "flex", alignItems: "center", gap: 9 }}><Avatar name={x.s.name} role="Student" size={26} /><div><div style={{ fontWeight: 600, color: "var(--ink)" }}>{x.s.name}</div><div className="mono muted" style={{ fontSize: 10.5 }}>{x.s.id}</div></div></div></td>
                      <td><span className="badge" style={{ background: t.bg, color: t.c, height: 20 }}><span className="dot" style={{ background: t.c }} /> Rung {x.due} · {rg.label}</span></td>
                      <td style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{rg.who}</td>
                      <td><span className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: x.r.daysLeft < 0 ? "var(--red)" : x.r.daysLeft < 14 ? "var(--red)" : "var(--amber-deep)" }}>{x.r.daysLeft < 0 ? "overdue" : x.r.daysLeft + "d"}</span></td>
                      <td className="mono muted" style={{ fontSize: 11 }}>{last ? fmt(new Date(last.ts).toISOString()) : "—"}</td>
                      <td onClick={e => e.stopPropagation()}><button className="btn btn-amber btn-sm" onClick={() => sendOne(x)}><Icon name="send" size={13} /> Send</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon="checkCircle" title="No reminders due" sub="Every at-risk student has had their current reminder sent. The ladder advances automatically as deadlines approach." />
        )}
      </div>

      {/* detail */}
      <Modal open={!!detail} onClose={() => setDetail(null)} width={540}>
        {detail && (() => {
          const { s, r, due } = detail;
          const hist = esc.historyFor(s.id);
          const events: TimelineEvent[] = hist.map(h => ({
            label: "Rung " + h.rung + " — " + RUNGS[h.rung - 1].label,
            actor: { name: "System", role: "System" },
            ts: new Date(h.ts).toISOString(),
            note: "Sent to " + h.to.join(" + ") + (h.auto ? " · auto" : " · manual")
          }));
          
          return (
            <div className="card" style={{ overflow: "hidden", boxShadow: "var(--sh-pop)" }}>
              <div style={{ padding: "16px 20px", background: "var(--surface)", display: "flex", alignItems: "center", gap: 13, borderBottom: "1px solid var(--line)" }}>
                <Avatar name={s.name} role="Student" size={44} />
                <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>{s.name}</div><div className="mono muted" style={{ fontSize: 11.5 }}>{s.id} · deadline {fmt(r.deadline)} · {r.daysLeft < 0 ? "overdue" : r.daysLeft + "d left"}</div></div>
                {due > 0 && <span className="badge" style={{ background: RUNG_TONE[RUNGS[due - 1].tone].bg, color: RUNG_TONE[RUNGS[due - 1].tone].c, height: 22 }}>Rung {due} due</span>}
              </div>
              <div className="card-pad">
                <div className="eyebrow" style={{ marginBottom: 10 }}>Escalation history</div>
                {hist.length ? <Timeline events={events} /> : <div className="muted" style={{ fontSize: 12.5 }}>No reminders sent yet.</div>}
                {due > 0 && (
                  <div style={{ marginTop: 14, padding: "12px 14px", background: RUNG_TONE[RUNGS[due - 1].tone].bg, borderRadius: 10 }}>
                    <div className="eyebrow" style={{ marginBottom: 3 }}>Next: rung {due} → {RUNGS[due - 1].who}</div>
                    <div style={{ fontSize: 13, color: "var(--ink-2)" }}>{RUNGS[due - 1].body}</div>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, padding: "13px 18px", background: "var(--surface)", borderTop: "1px solid var(--line)" }}>
                <button className="btn btn-ghost" onClick={() => setDetail(null)}>Close</button>
                {due > 0 && (
                  <button className="btn btn-amber" onClick={() => { esc.send(s, due, false); notify("Reminder sent to " + RUNGS[due - 1].who + " · " + s.name); setDetail(null); }}>
                    <Icon name="send" size={14} /> Send rung {due} reminder
                  </button>
                )}
                {r.page && onOpen && <button className="btn btn-primary" onClick={() => { onOpen(r.page, s.id); setDetail(null); }}>Open record <Icon name="arrowRight" size={14} /></button>}
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};
