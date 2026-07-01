import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  SectionTitle, 
  MetricCard, 
  Icon, 
  Avatar, 
  Badge, 
  Modal 
} from '../components/SharedUI';
import { EmailPreview } from '../components/Emails';
import {
  fmt,
  fmtFull,
  TEMPLATES
} from '../utils/fypData';
import { usersApi } from '../api/users';
import { studentsApi } from '../api/students';
import { notify } from '../components/LetterUI';
import type { UserResponse } from '../api/types';

/* ---------------- AdminDashboard ---------------- */
interface AdminDashboardProps {
  onNav: (view: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNav }) => {
  const { students, notificationLogs, auditLogs } = useAppContext();
  const failed = notificationLogs.filter(n => n.status === "failed").length;

  return (
    <div>
      <SectionTitle sub="System health, recent activity and monitoring at a glance.">
        System Overview
      </SectionTitle>
      
      <div className="resp-cols-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
        <MetricCard label="Active accounts" value={students.length} sub="students registered" icon="users" tone="navy" />
        <MetricCard label="Emails sent (log)" value={notificationLogs.length} sub={failed + " failed → retried"} icon="mail" tone={failed ? "amber" : "green"} onClick={() => onNav("notifications")} />
        <MetricCard label="Audit events" value={auditLogs.length} sub="this term" icon="shield" tone="blue" onClick={() => onNav("audit")} />
        <MetricCard label="Prototype API" value="Stub" sub="not yet connected" icon="external" tone="red" onClick={() => onNav("config")} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18, alignItems: "start" }}>
        <div className="card">
          <div className="card-hd">
            <h3>Recent activity</h3>
            <button className="btn btn-quiet btn-sm" onClick={() => onNav("audit")}>
              Audit log <Icon name="arrowRight" size={13} />
            </button>
          </div>
          <div>
            {auditLogs.slice().reverse().slice(0, 6).map((a) => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", borderTop: "1px solid var(--line-soft)" }}>
                <Avatar name={a.actor} role={a.role} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: "var(--ink)" }}>{a.action}</div>
                  <div className="muted" style={{ fontSize: 11 }}>{a.actor} · {a.role}</div>
                </div>
                <span className="mono muted" style={{ fontSize: 11, flex: "none" }}>{fmt(a.ts)}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="card card-pad">
          <div className="eyebrow" style={{ marginBottom: 12 }}>System health</div>
          {[
            ["Email service (SMTP)", "Operational", "green"],
            ["Database", "Operational", "green"],
            ["Prototype-review API", "Stub / mocked", "amber"],
            ["Data retention job", "Scheduled", "green"]
          ].map(([k, v, t]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderTop: k !== "Email service (SMTP)" ? "1px solid var(--line-soft)" : 0 }}>
              <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{k}</span>
              <Badge tone={t} dot>{v}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ---------------- AdminAccounts ---------------- */
const ROLES = ['STUDENT', 'SUPERVISOR', 'FACILITATOR', 'HOD', 'EXAMINER', 'SUPERADMIN'];

function roleTone(role: string) {
  switch (role) {
    case 'SUPERADMIN': return 'red';
    case 'HOD': return 'green';
    case 'FACILITATOR': return 'amber';
    case 'EXAMINER': return 'violet';
    case 'SUPERVISOR': return 'navy';
    default: return 'blue';
  }
}

const BLANK_FORM = { fullName: '', email: '', password: '', phone: '', role: 'SUPERVISOR', eligibleExaminer: false, regNumber: '', org: '', groupLabel: '' };

export const AdminAccounts: React.FC = () => {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetFor, setResetFor] = useState<UserResponse | null>(null);
  const [resetPwd, setResetPwd] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    usersApi.list().then(setUsers).catch(() => notify('Failed to load users', 'error')).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (form.role === 'STUDENT') {
        await studentsApi.createStudent({
          fullName: form.fullName,
          email: form.email,
          regNumber: form.regNumber,
          phone: form.phone || undefined,
          org: form.org || undefined,
          groupLabel: form.groupLabel || undefined,
        });
        notify(`Student account created — login password is the registration number`, 'success');
      } else {
        await usersApi.create({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
          role: form.role,
          // The EXAMINER role always implies eligibility — the checkbox only matters
          // for other roles (e.g. a SUPERVISOR who may also examine).
          eligibleExaminer: form.role === 'EXAMINER' ? true : form.eligibleExaminer,
        });
        notify('Account created', 'success');
      }
      setShowCreate(false);
      setForm(BLANK_FORM);
      load();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Failed to create account', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(u: UserResponse) {
    try {
      await usersApi.setEnabled(u.id, !u.enabled);
      setUsers(us => us.map(x => x.id === u.id ? { ...x, enabled: !u.enabled } : x));
    } catch {
      notify('Failed to update account', 'error');
    }
  }

  async function handleReset() {
    if (!resetFor || !resetPwd) return;
    setSaving(true);
    try {
      await usersApi.resetPassword(resetFor.id, resetPwd);
      notify(`Password reset for ${resetFor.fullName}`, 'success');
      setResetFor(null);
      setResetPwd('');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Failed to reset password', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <SectionTitle
        sub="Create, enable/disable accounts, assign roles, and reset passwords."
        right={<button className="btn btn-primary" onClick={() => setShowCreate(true)}><Icon name="plus" size={15} /> Create account</button>}
      >
        Accounts &amp; Roles
      </SectionTitle>

      {loading ? (
        <div className="muted" style={{ padding: 24 }}>Loading users…</div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <Avatar name={u.fullName} role={u.role} size={26} />
                      <span style={{ fontWeight: 600, color: "var(--ink)" }}>{u.fullName}</span>
                    </div>
                  </td>
                  <td className="mono muted" style={{ fontSize: 11.5 }}>{u.email}</td>
                  <td><Badge tone={roleTone(u.role)}>{u.role}</Badge></td>
                  <td>{u.enabled ? <Badge tone="green" dot>Active</Badge> : <Badge tone="grey" dot>Disabled</Badge>}</td>
                  <td>
                    <div style={{ display: "flex", gap: 7 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setResetFor(u); setResetPwd(''); }}>
                        <Icon name="key" size={13} /> Reset
                      </button>
                      <button className="btn btn-quiet btn-sm" onClick={() => handleToggle(u)}>
                        {u.enabled ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create account modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} width={460}>
        <div className="card" style={{ boxShadow: "var(--sh-pop)" }}>
          <div className="card-pad">
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Create account</div>
            <form onSubmit={handleCreate} style={{ display: 'grid', gap: 12 }}>
              <div>
                <label className="field-label">Role</label>
                <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {form.role === 'STUDENT' && (
                <div style={{ padding: '10px 12px', background: 'var(--blue-bg)', border: '1px solid #C7DCF1', borderRadius: 8, fontSize: 12.5, color: 'var(--ink-2)' }}>
                  &#8505;&nbsp; Student login password will be set to their registration number automatically.
                </div>
              )}

              <div>
                <label className="field-label">Full name</label>
                <input className="input" required value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
              </div>
              <div>
                <label className="field-label">Email</label>
                <input className="input" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>

              {form.role === 'STUDENT' ? (
                <>
                  <div>
                    <label className="field-label">Registration number</label>
                    <input className="input mono" required value={form.regNumber} placeholder="e.g. 26972"
                      onChange={e => setForm(f => ({ ...f, regNumber: e.target.value }))} />
                  </div>
                  <div>
                    <label className="field-label">Phone (optional)</label>
                    <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div>
                    <label className="field-label">Organisation / Case study (optional)</label>
                    <input className="input" value={form.org} placeholder="e.g. Bank of Kigali"
                      onChange={e => setForm(f => ({ ...f, org: e.target.value }))} />
                  </div>
                  <div>
                    <label className="field-label">Group label (optional)</label>
                    <input className="input" value={form.groupLabel} placeholder="e.g. A"
                      onChange={e => setForm(f => ({ ...f, groupLabel: e.target.value }))} />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="field-label">Password</label>
                    <input className="input" type="password" required minLength={8} value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                  </div>
                  <div>
                    <label className="field-label">Phone (optional)</label>
                    <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  {(form.role === 'SUPERVISOR' || form.role === 'HOD') && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <input type="checkbox" checked={form.eligibleExaminer} onChange={e => setForm(f => ({ ...f, eligibleExaminer: e.target.checked }))} />
                      Eligible examiner
                    </label>
                  )}
                  {form.role === 'EXAMINER' && (
                    <div className="muted" style={{ fontSize: 12 }}>
                      The EXAMINER role is automatically eligible to be assigned to panels — no separate checkbox needed.
                    </div>
                  )}
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9, marginTop: 4 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create account'}</button>
              </div>
            </form>
          </div>
        </div>
      </Modal>

      {/* Reset password modal */}
      <Modal open={!!resetFor} onClose={() => setResetFor(null)} width={420}>
        {resetFor && (
          <div className="card" style={{ overflow: "hidden", boxShadow: "var(--sh-pop)" }}>
            <div className="card-pad">
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                <span style={{ width: 40, height: 40, borderRadius: 10, background: "var(--red-bg)", color: "var(--red)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="key" size={19} />
                </span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>Reset password</div>
                  <div className="muted" style={{ fontSize: 12.5 }}>{resetFor.fullName}</div>
                </div>
              </div>
              <label className="field-label">New password</label>
              <input className="input" type="password" minLength={10} value={resetPwd}
                onChange={e => setResetPwd(e.target.value)} placeholder="Min. 10 characters" />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, padding: "14px 18px", background: "var(--surface)", borderTop: "1px solid var(--line)" }}>
              <button className="btn btn-ghost" onClick={() => setResetFor(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={saving || resetPwd.length < 10} onClick={handleReset}>
                <Icon name="key" size={14} /> {saving ? 'Saving…' : 'Reset password'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

/* ---------------- AdminAudit ---------------- */
export const AdminAudit: React.FC = () => {
  const { auditLogs } = useAppContext();
  const [role, setRole] = useState("all");
  const list = auditLogs.slice().reverse().filter(a => role === "all" || a.role === role);
  const roles = Array.from(new Set(auditLogs.map(a => a.role)));

  return (
    <div>
      <SectionTitle 
        sub="Immutable record of who changed what, and when." 
        right={
          <select className="select" value={role} onChange={e => setRole(e.target.value)} style={{ width: "auto", height: 36 }}>
            <option value="all">All roles</option>
            {roles.map(r => <option key={r}>{r}</option>)}
          </select>
        }
      >
        Audit Log
      </SectionTitle>
      
      <div className="card" style={{ overflow: "hidden" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Event</th>
              <th>Actor</th>
              <th>Action</th>
              <th>IP</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {list.map(a => (
              <tr key={a.id} style={{ cursor: "default" }}>
                <td className="mono" style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{a.id}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Avatar name={a.actor} role={a.role} size={24} />
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>{a.actor}</div>
                      <div className="muted" style={{ fontSize: 10.5 }}>{a.role}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: 12.5 }}>{a.action}</td>
                <td className="mono muted" style={{ fontSize: 11.5 }}>{a.ip}</td>
                <td className="mono muted" style={{ fontSize: 11.5 }}>{fmtFull(a.ts)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ---------------- AdminNotifications ---------------- */
export const AdminNotifications: React.FC = () => {
  const { notificationLogs, students } = useAppContext();
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<any | null>(null);
  
  const list = notificationLogs.slice().reverse().filter(n => filter === "all" || n.status === filter);
  const tone: { [key: string]: string } = { sent: "green", failed: "red", retried: "amber" };

  return (
    <div>
      <SectionTitle 
        sub="Every email the system sent — recipient, time, contents, and delivery status." 
        right={
          <div style={{ display: "flex", gap: 7 }}>
            {["all", "sent", "failed", "retried"].map(f => (
              <button key={f} className={"chip" + (filter === f ? " active" : "")} onClick={() => setFilter(f)}>
                {f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        }
      >
        Notification Log
      </SectionTitle>

      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 16px", background: "var(--amber-bg)", border: "1px solid #EAD08A", borderRadius: 10, marginBottom: 16, fontSize: 12.5 }}>
        <Icon name="refresh" size={16} style={{ color: "var(--amber-deep)", flex: "none" }} />
        <span style={{ color: "var(--ink-2)" }}>
          Delivery is monitored. One message to <strong>Mugisha Eric</strong> <strong style={{ color: "var(--red)" }}>failed</strong> (SMTP greylisting) and was automatically <strong style={{ color: "var(--amber-deep)" }}>retried</strong> successfully — both events are logged below.
        </span>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>ID</th>
              <th>Event</th>
              <th>Recipient</th>
              <th>Sent</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map(n => (
              <tr key={n.id} onClick={() => setOpen(n)} style={{ background: n.status === "failed" ? "var(--red-bg)" : "" }}>
                <td className="mono" style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{n.id}</td>
                <td style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>
                  {TEMPLATES[n.template]?.event || n.template}
                </td>
                <td>
                  <div style={{ fontSize: 12.5 }}>
                    {n.toName} <span className="muted">· {n.toRole}</span>
                    <div className="mono muted" style={{ fontSize: 10.5 }}>{n.to}</div>
                  </div>
                </td>
                <td className="mono muted" style={{ fontSize: 11 }}>{fmtFull(n.ts)}</td>
                <td>
                  <Badge tone={tone[n.status]} dot>{n.status}{n.note && " ✓"}</Badge>
                  {n.error && <div className="muted" style={{ fontSize: 10.5, marginTop: 3 }}>{n.error}</div>}
                  {n.note && <div className="muted" style={{ fontSize: 10.5, marginTop: 3 }}>{n.note}</div>}
                </td>
                <td><Icon name="chevronRight" size={15} style={{ color: "var(--ink-4)" }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!open} onClose={() => setOpen(null)} width={540}>
        {open && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <Badge tone={tone[open.status]} dot>{open.status.toUpperCase()}</Badge>
              <button className="btn btn-ghost btn-sm" onClick={() => setOpen(null)}>
                <Icon name="x" size={14} /> Close
              </button>
            </div>
            <EmailPreview 
              templateKey={open.template} 
              student={students.find(s => s.id === open.studentId)} 
              supervisor={undefined}
              status={open.status} 
              to={open.to} 
              toName={open.toName} 
              ts={open.ts} 
              attempt={2} 
              reason="Literature review thin; no comparison of existing systems." 
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

/* ---------------- AdminConfig ---------------- */
export const AdminConfig: React.FC = () => {
  const [retention, setRetention] = useState(true);
  const { examiners: eligibleExaminers } = useAppContext();

  return (
    <div>
      <SectionTitle sub="Email, data retention, the external prototype API, and eligible examiners/facilitators.">
        Configuration
      </SectionTitle>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "start", maxWidth: 980 }}>
        <div style={{ display: "grid", gap: 18 }}>
          <div className="card card-pad">
            <div className="eyebrow" style={{ marginBottom: 12 }}>Email settings</div>
            <div style={{ display: "grid", gap: 10 }}>
              <div>
                <label className="field-label">SMTP host</label>
                <input className="input mono" defaultValue="smtp.aauca.ac.rw" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: 10 }}>
                <div>
                  <label className="field-label">From address</label>
                  <input className="input mono" defaultValue="noreply@aauca.ac.rw" />
                </div>
                <div>
                  <label className="field-label">Port</label>
                  <input className="input mono" defaultValue="587" />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <Badge tone="green" dot>Connection OK</Badge>
                <span className="muted" style={{ fontSize: 12 }}>Last test 2 min ago</span>
              </div>
            </div>
          </div>
          
          <div className="card card-pad">
            <div className="eyebrow" style={{ marginBottom: 12 }}>Data retention</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>1-year retention</div>
                <div className="muted" style={{ fontSize: 12 }}>Auto-archive records 12 months after defense.</div>
              </div>
              <button 
                onClick={() => setRetention(r => !r)} 
                style={{ width: 46, height: 26, borderRadius: 13, border: 0, background: retention ? "var(--green)" : "var(--surface-3)", position: "relative", cursor: "pointer", flex: "none" }}
              >
                <span style={{ position: "absolute", top: 3, left: retention ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .15s", boxShadow: "var(--sh-sm)" }} />
              </button>
            </div>
          </div>
          
          <div className="card card-pad">
            <div className="eyebrow" style={{ marginBottom: 12 }}>Prototype-review API</div>
            <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 14px", background: "#fff", border: "1px dashed var(--violet)", borderRadius: 10 }}>
              <span style={{ width: 36, height: 36, borderRadius: 9, background: "var(--violet-bg)", color: "var(--violet)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                <Icon name="external" size={18} />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>External connection</div>
                <div className="muted" style={{ fontSize: 12 }}>Reads prototype-review data by student ID.</div>
              </div>
              <Badge tone="amber" dot>Not connected — stub</Badge>
            </div>
            <input className="input mono" placeholder="https://proto-review.api.endpoint/v1" style={{ marginTop: 10 }} />
          </div>
        </div>

        <div style={{ display: "grid", gap: 18 }}>
          <div className="card">
            <div className="card-hd">
              <h3>Eligible examiners</h3>
              <Badge tone="violet">{eligibleExaminers.length}</Badge>
            </div>
            <div className="card-pad" style={{ display: "grid", gap: 8 }}>
              {eligibleExaminers.length === 0 && (
                <div className="muted" style={{ fontSize: 13, padding: "8px 0" }}>No eligible examiners yet. Create a user with the EXAMINER role, or check "Eligible examiner" when creating a SUPERVISOR/HOD.</div>
              )}
              {eligibleExaminers.map(s => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 11px", border: "1px solid var(--line)", borderRadius: 9 }}>
                  <Avatar name={s.name} role="Examiner" size={28} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>{s.full}</div>
                    <div className="muted" style={{ fontSize: 11 }}>{s.title}</div>
                  </div>
                  <Badge tone="green" dot>Eligible</Badge>
                </div>
              ))}
            </div>
          </div>
          
          <div className="card">
            <div className="card-hd">
              <h3>Facilitators</h3>
              <Badge tone="amber">1</Badge>
            </div>
            <div className="card-pad">
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 11px", border: "1px solid var(--line)", borderRadius: 9 }}>
                <Avatar name="FYP Facilitator" role="Facilitator" size={28} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>FYP Facilitator</div>
                  <div className="muted" style={{ fontSize: 11 }}>Coordinator, FYP</div>
                </div>
                <Badge tone="green" dot>Active</Badge>
              </div>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }}>
                <Icon name="plus" size={13} /> Add facilitator
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
