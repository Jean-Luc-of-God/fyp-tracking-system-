import React, { useState } from 'react';
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

/* ---------------- Examiner Dashboard ---------------- */
export const ExaminerDashboard: React.FC = () => {
  const { students, activeUserId } = useAppContext();
  const EX_ID = activeUserId || "sup-hab";
  
  // Examinees are students assigned to me to examine
  const examinees = students.filter(s => s.examinerPreId === EX_ID || s.examinerDefId === EX_ID);
  // Supervised are students I supervise
  const supervised = students.filter(s => s.supervisorId === EX_ID);

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
        <MetricCard label="Pre-defense pending" value={examinees.filter(s => s.stateIndex === 9 && s.predefenseStatus !== "Cleared to defend").length} icon="clock" tone="amber" />
        <MetricCard label="Cleared to defend" value={examinees.filter(s => s.predefenseStatus === "Cleared to defend").length} icon="checkCircle" tone="green" />
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
            {examinees.map(s => (
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
                <td className="muted">{s.supervisorId ? supById[s.supervisorId]?.name || s.supervisorId : "—"}</td>
                <td><StateBadge stateIndex={s.stateIndex} short /></td>
                <td>
                  {s.predefenseStatus ? (
                    <Badge tone={s.predefenseStatus === "Cleared to defend" ? "green" : "amber"} dot>
                      {s.predefenseStatus}
                    </Badge>
                  ) : (
                    <span className="faint">—</span>
                  )}
                </td>
              </tr>
            ))}
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
  const { students, activeUserId, predefenseWa, recordPredefenseOutcome } = useAppContext();
  const EX_ID = activeUserId || "sup-hab";
  
  const examinees = students.filter(s => (s.examinerPreId === EX_ID || s.examinerDefId === EX_ID) && s.stateIndex >= 9);
  const [status, setStatus] = useState<{ [studentId: string]: string }>({});
  const predefGroup = (predefenseWa[EX_ID] || [])[0];

  const listToRender = examinees.length ? examinees : students.filter(s => s.stateIndex >= 9).slice(0, 2);

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

      <div style={{ display: "grid", gap: 14 }}>
        {listToRender.map(s => {
          const st = status[s.id] || s.predefenseStatus || "Scheduled";
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
                  <button className="btn btn-primary" onClick={() => {
                    recordPredefenseOutcome(s.id, true);
                    setStatus(x => ({ ...x, [s.id]: "Cleared to defend" }));
                  }}>
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
    </div>
  );
};

/* ---------------- Examiner Defense ---------------- */
export const ExaminerDefense: React.FC = () => {
  const { students, activeUserId, recordDefenseOutcome } = useAppContext();
  const EX_ID = activeUserId || "sup-hab";
  
  const list = students.filter(s => s.examinerDefId === EX_ID || s.stateIndex === 10).slice(0, 4);
  const [outcomes, setOutcomes] = useState<{ [studentId: string]: string }>({});
  const opts = ["Passed", "Passed with minor corrections", "Passed with major corrections", "Failed — re-defense"];

  return (
    <div>
      <SectionTitle sub="Record the final defense outcome for each student. This ends their FYP journey.">
        Defense Outcomes
      </SectionTitle>
      
      <div style={{ display: "grid", gap: 14 }}>
        {list.map(s => {
          const rec = outcomes[s.id] || s.defense?.outcome;
          return (
            <div key={s.id} className="card card-pad">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
                  <Avatar name={s.name} role="Student" size={42} />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>
                      {s.name} <span className="mono muted" style={{ fontSize: 11, fontWeight: 400 }}>{s.id}</span>
                    </div>
                    <div className="muted" style={{ fontSize: 12.5 }}>{s.topic}</div>
                  </div>
                </div>
                {rec ? (
                  <Badge tone={rec.startsWith("Failed") ? "red" : "green"} dot>{rec}</Badge>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <select 
                      className="select" 
                      style={{ width: 240, height: 36 }} 
                      defaultValue="" 
                      onChange={e => {
                        if (e.target.value) {
                          recordDefenseOutcome(s.id, e.target.value, "Panel A");
                          setOutcomes(o => ({ ...o, [s.id]: e.target.value }));
                        }
                      }}
                    >
                      <option value="" disabled>Record outcome…</option>
                      {opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                )}
              </div>
              {rec && (
                <div style={{ marginTop: 12, padding: "10px 13px", background: "var(--green-bg)", borderRadius: 8, fontSize: 12.5, color: "var(--green-deep)", display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="checkCircle" size={15} /> Outcome recorded &amp; student notified by email · journey complete.
                </div>
              )}
            </div>
          );
        })}
      </div>
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
    </div>
  );
};
