import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import {
  SectionTitle,
  MetricCard,
  Icon,
  Avatar,
  StateBadge,
  Badge,
  WhatsAppButton
} from '../components/SharedUI';
import { supById } from '../utils/fypData';
import type { Student } from '../types';
import { panelsApi } from '../api/panels';
import type { PanelAssignmentResponse } from '../api/types';
import { getToken } from '../api/client';
import { notify } from '../components/LetterUI';

/* ---------------- Examiner Dashboard ---------------- */
export const ExaminerDashboard: React.FC = () => {
  const { students, activeUserId, supervisorById } = useAppContext();
  const EX_ID = activeUserId || "sup-hab";

  const [panels, setPanels] = useState<PanelAssignmentResponse[] | null>(null);

  useEffect(() => {
    if (!getToken()) return;
    panelsApi.mine()
      .then(list => setPanels(list))
      .catch(() => setPanels(null));
  }, [EX_ID]);

  const useRealPanels = getToken() && panels !== null;

  // Real path: derive unique student IDs from panel assignments
  const realExamineeIds = useRealPanels
    ? [...new Set(panels!.map(p => p.studentId))]
    : [];
  const realExaminees = realExamineeIds
    .map(id => students.find(s => s.id === id))
    .filter((s): s is NonNullable<typeof s> => s !== undefined);

  // Mock path fallback
  const mockExaminees = students.filter(s => s.examinerPreId === EX_ID || s.examinerDefId === EX_ID);

  const examinees = useRealPanels ? realExaminees : mockExaminees;
  const supervised = students.filter(s => s.supervisorId === EX_ID);

  const preDefensePanels = panels?.filter(p => p.panelType === 'PRE_DEFENSE') ?? [];
  const pendingCount = preDefensePanels.filter(p => !p.outcome).length;
  const clearedCount = preDefensePanels.filter(p => p.outcome === 'CLEARED').length;

  return (
    <div>
      <SectionTitle sub="Students assigned to you to examine. This is separate from anyone you supervise.">
        Assigned to Me
      </SectionTitle>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 11, padding: "12px 16px", background: "var(--violet-bg)", border: "1px solid #D9CDEC", borderRadius: 10, marginBottom: 18, fontSize: 13 }}>
        <Icon name="scale" size={17} style={{ color: "var(--violet)", flex: "none", marginTop: 1 }} />
        <span style={{ color: "var(--ink-2)" }}>
          You supervise <strong>{supervised.length}</strong> students and examine <strong>{examinees.length}</strong> — completely different people. None of your supervised students will ever appear here.
        </span>
      </div>

      <div className="resp-cols-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 18 }}>
        <MetricCard label="Assigned to examine" value={examinees.length} icon="scale" tone="navy" />
        <MetricCard label="Pre-defense pending" value={useRealPanels ? pendingCount : examinees.filter(s => s.stateIndex === 9 && s.predefenseStatus !== "Cleared to defend").length} icon="clock" tone="amber" />
        <MetricCard label="Cleared to defend" value={useRealPanels ? clearedCount : examinees.filter(s => s.predefenseStatus === "Cleared to defend").length} icon="checkCircle" tone="green" />
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div className="card-hd"><h3>My examinees</h3></div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Student</th>
              <th>Their supervisor</th>
              <th>Stage</th>
              <th>Pre-defense status</th>
            </tr>
          </thead>
          <tbody>
            {examinees.map(s => {
              const supName = s.supervisorId
                ? (supervisorById[s.supervisorId]?.name ?? supById[s.supervisorId]?.name ?? s.supervisorId)
                : "—";
              const panelForStu = panels?.find(p => p.studentId === s.id && p.panelType === 'PRE_DEFENSE');
              const preStatus = useRealPanels
                ? (panelForStu?.outcome === 'CLEARED' ? "Cleared to defend" : panelForStu ? "Scheduled" : null)
                : s.predefenseStatus;
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
                  <td className="muted">{supName}</td>
                  <td><StateBadge stateIndex={s.stateIndex} short /></td>
                  <td>
                    {preStatus ? (
                      <Badge tone={preStatus === "Cleared to defend" ? "green" : "amber"} dot>
                        {preStatus}
                      </Badge>
                    ) : (
                      <span className="faint">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {!examinees.length && (
              <tr>
                <td colSpan={4} className="muted" style={{ textAlign: "center", padding: 20 }}>
                  No examinees currently assigned.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ---------------- Examiner Predefense ---------------- */
export const ExaminerPredefense: React.FC = () => {
  const { students, activeUserId, predefenseWa, recordPredefenseOutcome, refreshStudents } = useAppContext();
  const EX_ID = activeUserId || "sup-hab";

  const [panels, setPanels] = useState<PanelAssignmentResponse[] | null>(null);
  const [recording, setRecording] = useState<{ [panelId: string]: boolean }>({});

  useEffect(() => {
    if (!getToken()) return;
    panelsApi.mine()
      .then(list => setPanels(list.filter(p => p.panelType === 'PRE_DEFENSE')))
      .catch(() => setPanels(null));
  }, [EX_ID]);

  async function clearToDefend(panel: PanelAssignmentResponse) {
    setRecording(r => ({ ...r, [panel.id]: true }));
    try {
      await panelsApi.recordOutcome(panel.id, 'CLEARED', 'Pre-defense cleared');
      const stuName = students.find(s => s.id === panel.studentId)?.name ?? 'Student';
      notify(`${stuName} cleared to defend`, 'success');
      await refreshStudents();
      const updated = await panelsApi.mine();
      setPanels(updated.filter(p => p.panelType === 'PRE_DEFENSE'));
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Failed to record outcome', 'error');
    } finally {
      setRecording(r => ({ ...r, [panel.id]: false }));
    }
  }

  const predefGroup = (predefenseWa[EX_ID] || [])[0];

  // Show real panels when authenticated, else fall back to mock examinees
  const useRealPanels = getToken() && panels !== null;
  const mockExaminees = students.filter(
    s => (s.examinerPreId === EX_ID || s.examinerDefId === EX_ID) && s.stateIndex >= 9
  );
  const mockFallback = mockExaminees.length
    ? mockExaminees
    : students.filter(s => s.stateIndex >= 9).slice(0, 2);

  return (
    <div>
      <SectionTitle sub="Record the pre-defense outcome. Cleared students advance to Defense — forward-only, never back to supervision.">
        Pre-Defense
      </SectionTitle>

      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#E7F6EC", border: "1px solid #BCE2CC", borderRadius: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <Icon name="whatsapp" size={18} style={{ color: "#1FA855", flex: "none" }} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Pre-defense WhatsApp group</div>
          <div className="muted" style={{ fontSize: 12 }}>
            {predefGroup ? predefGroup.team + " — students join for this panel" : "Not set — add one in WhatsApp & Contact"}
          </div>
        </div>
        {predefGroup && <WhatsAppButton team={predefGroup.team.replace("FYP 2026 · ", "")} link={predefGroup.link} sm />}
      </div>

      {useRealPanels ? (
        <div style={{ display: "grid", gap: 14 }}>
          {panels!.length === 0 && (
            <div className="card card-pad muted" style={{ fontSize: 13 }}>No pre-defense panels assigned to you yet.</div>
          )}
          {panels!.map(p => {
            const stu = students.find(s => s.id === p.studentId);
            const cleared = p.outcome === 'CLEARED';
            return (
              <div key={p.id} className="card card-pad" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
                  <Avatar name={stu?.name ?? p.studentId} role="Student" size={42} />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>
                      {stu?.name ?? p.studentId}
                    </div>
                    <div className="muted" style={{ fontSize: 12.5 }}>{stu?.topic ?? ''}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Badge tone={cleared ? "green" : "amber"} dot>{cleared ? "Cleared to defend" : "Scheduled"}</Badge>
                  {!cleared ? (
                    <button
                      className="btn btn-primary"
                      onClick={() => clearToDefend(p)}
                      disabled={!!recording[p.id]}
                    >
                      <Icon name="check" size={15} /> {recording[p.id] ? "Saving…" : "Mark cleared to defend"}
                    </button>
                  ) : (
                    <span style={{ color: "var(--green-deep)", fontSize: 12.5, display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="arrowRight" size={14} /> Advanced to Defense
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Mock fallback (unauthenticated or no panel data)
        <div style={{ display: "grid", gap: 14 }}>
          {mockFallback.map(s => {
            const st = s.predefenseStatus || "Scheduled";
            return (
              <div key={s.id} className="card card-pad" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
                  <Avatar name={s.name} role="Student" size={42} />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>
                      {s.name} <span className="mono muted" style={{ fontSize: 11, fontWeight: 400 }}>{s.id}</span>
                    </div>
                    <div className="muted" style={{ fontSize: 12.5 }}>{s.topic} · {s.org}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Badge tone={st === "Cleared to defend" ? "green" : "amber"} dot>{st}</Badge>
                  {st !== "Cleared to defend" ? (
                    <button className="btn btn-primary" onClick={() => { recordPredefenseOutcome(s.id, true); }}>
                      <Icon name="check" size={15} /> Mark completed — clear to defend
                    </button>
                  ) : (
                    <span style={{ color: "var(--green-deep)", fontSize: 12.5, display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="arrowRight" size={14} /> Advanced to Defense
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ---------------- Examiner Defense ---------------- */
const DEFENSE_OUTCOMES: { value: 'PASSED' | 'REFERRED' | 'FAILED'; label: string }[] = [
  { value: 'PASSED',   label: 'Passed' },
  { value: 'REFERRED', label: 'Referred — minor corrections required' },
  { value: 'FAILED',   label: 'Failed — re-defense required' },
];

export const ExaminerDefense: React.FC = () => {
  const { students, activeUserId, refreshStudents } = useAppContext();
  const EX_ID = activeUserId || "sup-hab";

  const [panels, setPanels] = useState<PanelAssignmentResponse[] | null>(null);
  const [recording, setRecording] = useState<{ [panelId: string]: boolean }>({});

  useEffect(() => {
    if (!getToken()) return;
    panelsApi.mine()
      .then(list => setPanels(list.filter(p => p.panelType === 'DEFENSE')))
      .catch(() => setPanels(null));
  }, [EX_ID]);

  async function doRecord(panel: PanelAssignmentResponse, outcome: 'PASSED' | 'REFERRED' | 'FAILED') {
    setRecording(r => ({ ...r, [panel.id]: true }));
    try {
      await panelsApi.recordOutcome(panel.id, outcome, undefined);
      const stuName = students.find(s => s.id === panel.studentId)?.name ?? 'Student';
      const label = DEFENSE_OUTCOMES.find(o => o.value === outcome)?.label ?? outcome;
      notify(`${stuName}: ${label}`, outcome === 'PASSED' ? 'success' : 'info');
      await refreshStudents();
      const updated = await panelsApi.mine();
      setPanels(updated.filter(p => p.panelType === 'DEFENSE'));
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Failed to record outcome', 'error');
    } finally {
      setRecording(r => ({ ...r, [panel.id]: false }));
    }
  }

  const useRealPanels = getToken() && panels !== null;
  const mockList = students.filter(s => s.examinerDefId === EX_ID || s.stateIndex === 10).slice(0, 4);

  return (
    <div>
      <SectionTitle sub="Record the final defense outcome for each student. This ends their final year journey.">
        Defense Outcomes
      </SectionTitle>

      {useRealPanels ? (
        <div style={{ display: "grid", gap: 14 }}>
          {panels!.length === 0 && (
            <div className="card card-pad muted" style={{ fontSize: 13 }}>No defense panels assigned to you yet.</div>
          )}
          {panels!.map(p => {
            const stu = students.find(s => s.id === p.studentId);
            const recorded = p.outcome;
            const outLabel = DEFENSE_OUTCOMES.find(o => o.value === recorded)?.label ?? recorded;
            return (
              <div key={p.id} className="card card-pad">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
                    <Avatar name={stu?.name ?? p.studentId} role="Student" size={42} />
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>{stu?.name ?? p.studentId}</div>
                      <div className="muted" style={{ fontSize: 12.5 }}>{stu?.topic ?? ''}</div>
                    </div>
                  </div>
                  {recorded ? (
                    <Badge tone={recorded === 'FAILED' ? "red" : recorded === 'REFERRED' ? "amber" : "green"} dot>{outLabel}</Badge>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      <select
                        className="select"
                        style={{ width: 260, height: 36 }}
                        defaultValue=""
                        disabled={!!recording[p.id]}
                        onChange={e => {
                          if (e.target.value) doRecord(p, e.target.value as 'PASSED' | 'REFERRED' | 'FAILED');
                        }}
                      >
                        <option value="" disabled>{recording[p.id] ? "Saving…" : "Record outcome…"}</option>
                        {DEFENSE_OUTCOMES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                {recorded && (
                  <div style={{ marginTop: 12, padding: "10px 13px", background: recorded === 'FAILED' ? "var(--red-bg)" : "var(--green-bg)", borderRadius: 8, fontSize: 12.5, color: recorded === 'FAILED' ? "var(--red)" : "var(--green-deep)", display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon name={recorded === 'FAILED' ? "alert" : "checkCircle"} size={15} /> Outcome recorded &amp; student notified.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // Mock fallback
        <div style={{ display: "grid", gap: 14 }}>
          {mockList.map(s => {
            const rec = s.defense?.outcome;
            return (
              <div key={s.id} className="card card-pad">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
                    <Avatar name={s.name} role="Student" size={42} />
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>{s.name} <span className="mono muted" style={{ fontSize: 11, fontWeight: 400 }}>{s.id}</span></div>
                      <div className="muted" style={{ fontSize: 12.5 }}>{s.topic}</div>
                    </div>
                  </div>
                  {rec ? (
                    <Badge tone="green" dot>{rec}</Badge>
                  ) : (
                    <select className="select" style={{ width: 240, height: 36 }} defaultValue="" onChange={() => {}}>
                      <option value="" disabled>Record outcome…</option>
                      {DEFENSE_OUTCOMES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ---------------- SupExamining (Supervisor dashboard tab) ---------------- */
interface SupExaminingProps {
  focusStudent?: Student | null;
}

export const SupExamining: React.FC<SupExaminingProps> = () => {
  const [tab, setTab] = useState("assigned");
  const tabs = [
    { id: "assigned", label: "Assigned to me", icon: "scale" },
    { id: "pre", label: "Pre-Defense", icon: "checkCircle" },
    { id: "defense", label: "Defense", icon: "layers" },
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <span className="eyebrow" style={{ marginRight: 4 }}>Examining</span>
        {tabs.map(t => (
          <button
            key={t.id}
            className={"chip" + (tab === t.id ? " active" : "")}
            onClick={() => setTab(t.id)}
          >
            <Icon name={t.icon} size={13} /> {t.label}
          </button>
        ))}
      </div>
      {tab === "assigned" && <ExaminerDashboard />}
      {tab === "pre" && <ExaminerPredefense />}
      {tab === "defense" && <ExaminerDefense />}
    </div>
  );
};
