import React, { useState, useEffect, useRef } from 'react';
import { Avatar, Icon } from './SharedUI';
import { NotifBell } from './Notifications';

export interface RoleInfo {
  id: 'student' | 'supervisor' | 'facilitator' | 'hod' | 'superadmin';
  label: string;
  person: string;
  sub: string;
  icon: string;
  color: string;
}

export const ROLES: RoleInfo[] = [
  { id: "student",     label: "Student",     person: "Mutoni Aline",   sub: "STU-2026-041",          icon: "user",      color: "#2A6FB5" },
  { id: "supervisor",  label: "Supervisor",  person: "Dr. Habimana",  sub: "Supervisor & Examiner",   icon: "users",     color: "#1F3A5F" },
  { id: "facilitator", label: "Facilitator", person: "Ms. Ingabire",  sub: "FYP Coordinator",       icon: "pipeline",  color: "#C98A12" },
  { id: "hod",         label: "HOD",         person: "Dr. Bizimungu", sub: "Head of Department",     icon: "shield",    color: "#1E8E5A" },
  { id: "superadmin",  label: "Superadmin",  person: "E. Manzi",      sub: "System Owner / IT",     icon: "key",       color: "#C0392B" },
];

export const roleById = Object.fromEntries(ROLES.map(r => [r.id, r])) as { [key: string]: RoleInfo };

export const NAV: { [role: string]: { id: string; label: string; icon: string; badge?: number }[] } = {
  student: [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "case", label: "Case-Study Letter", icon: "file" },
    { id: "supervisor", label: "My Supervisor", icon: "users" },
    { id: "timeline", label: "My Timeline", icon: "history" },
  ],
  supervisor: [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "supervision", label: "Supervision", icon: "activity" },
    { id: "find", label: "Find Students", icon: "search" },
    { id: "availability", label: "Availability & Sessions", icon: "calendar" },
    { id: "examining", label: "Examining", icon: "scale" },
    { id: "settings", label: "WhatsApp & Contact", icon: "whatsapp" },
  ],
  facilitator: [
    { id: "pipeline", label: "Pipeline Overview", icon: "pipeline" },
    { id: "risk", label: "Risk Dashboard", icon: "shield" },
    { id: "escalation", label: "Escalation Ladder", icon: "activity" },
    { id: "students", label: "All Students", icon: "list" },
    { id: "pending", label: "Pending Coordination", icon: "alert", badge: 5 },
    { id: "supervisors", label: "Assign Supervisors", icon: "users" },
    { id: "examiners", label: "Assign Pre-Defense", icon: "scale" },
    { id: "availability", label: "Supervisor Availability", icon: "calendar" },
    { id: "proto", label: "Prototype Data", icon: "external" },
  ],
  hod: [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "risk", label: "Risk Dashboard", icon: "shield" },
    { id: "escalation", label: "Escalation Ladder", icon: "activity" },
    { id: "find", label: "Find Students", icon: "search" },
    { id: "upload", label: "Upload Students", icon: "upload" },
    { id: "request", label: "Request Letters", icon: "send" },
    { id: "review", label: "Review Letters", icon: "checkCircle", badge: 2 },
    { id: "mysupervision", label: "My Supervision", icon: "activity" },
    { id: "availability", label: "Supervisor Availability", icon: "calendar" },
    { id: "records", label: "Records & Reports", icon: "list" },
  ],
  superadmin: [
    { id: "dashboard", label: "System Overview", icon: "dashboard" },
    { id: "accounts", label: "Accounts & Roles", icon: "users" },
    { id: "audit", label: "Audit Log", icon: "shield" },
    { id: "notifications", label: "Notification Log", icon: "mail" },
    { id: "config", label: "Configuration", icon: "settings" },
  ],
};

/* ---------------- Role switcher (top bar) ---------------- */
interface RoleSwitcherProps {
  role: 'student' | 'supervisor' | 'facilitator' | 'hod' | 'superadmin';
  onSwitch: (role: 'student' | 'supervisor' | 'facilitator' | 'hod' | 'superadmin') => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ role, onSwitch }) => {
  const [open, setOpen] = useState(false);
  const cur = roleById[role];
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="btn btn-ghost" onClick={() => setOpen(o => !o)} style={{ height: 38, gap: 9, paddingLeft: 8 }}>
        <span className="badge badge-amber" style={{ height: 18, fontSize: 10, letterSpacing: ".04em" }}>DEMO</span>
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Avatar name={cur.person} role={cur.label} size={22} />
          <span style={{ textAlign: "left", lineHeight: 1.1 }}>
            <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>{cur.label}</span>
          </span>
        </span>
        <Icon name="chevronDown" size={15} style={{ color: "var(--ink-3)" }} />
      </button>
      {open && (
        <div className="card fade-in" style={{ position: "absolute", right: 0, top: 46, width: 268, padding: 6, boxShadow: "var(--sh-pop)", zIndex: 50 }}>
          <div className="eyebrow" style={{ padding: "8px 10px 6px" }}>Switch logged-in view</div>
          {ROLES.map(r => (
            <button 
              key={r.id} 
              onClick={() => { onSwitch(r.id); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 10px", border: 0, borderRadius: 8, background: r.id === role ? "var(--surface-2)" : "transparent", cursor: "pointer", textAlign: "left" }}
            >
              <span style={{ width: 30, height: 30, borderRadius: 8, background: r.color + "1a", color: r.color, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                <Icon name={r.icon} size={16} />
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{r.label}</span>
                <span style={{ display: "block", fontSize: 11.5, color: "var(--ink-3)" }}>{r.person} · {r.sub}</span>
              </span>
              {r.id === role && <Icon name="check" size={16} style={{ color: "var(--green)" }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------------- App shell ---------------- */
interface AppShellProps {
  role: 'student' | 'supervisor' | 'facilitator' | 'hod' | 'superadmin';
  page: string;
  onNav: (page: string) => void;
  onSwitch: (role: 'student' | 'supervisor' | 'facilitator' | 'hod' | 'superadmin') => void;
  breadcrumb?: string;
  children: React.ReactNode;
  onResolveDemo?: () => void;
  onGoto: (page: string) => void;
  onLogout?: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({ 
  role, 
  page, 
  onNav, 
  onSwitch, 
  breadcrumb, 
  children, 
  onResolveDemo, 
  onGoto,
  onLogout
}) => {
  const cur = roleById[role];
  const nav = NAV[role] || [];
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    setDrawer(false);
  }, [role, page]);

  return (
    <div className="app-shell">
      {/* mobile overlay */}
      <div className={"app-overlay" + (drawer ? " show" : "")} onClick={() => setDrawer(false)} />
      
      {/* Sidebar */}
      <aside className={"app-sidebar" + (drawer ? " open" : "")}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "16px 16px 14px" }}>
          <div style={{ width: 38, height: 38, borderRadius: 9, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", overflow: "hidden" }}>
            <img src="assets/aauca-logo.jpg" alt="AAUCA" style={{ width: 34, height: 34, objectFit: "contain" }} 
                 onError={(e) => {
                   // Fallback if logo doesn't exist
                   e.currentTarget.style.display = 'none';
                 }} />
            <Icon name="building" size={24} style={{ color: 'var(--navy)' }} />
          </div>
          <div style={{ lineHeight: 1.15 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", letterSpacing: "-.01em" }}>FYP Tracker</div>
            <div style={{ fontSize: 10.5, color: "var(--on-navy-dim)" }}>AUCA · Software Eng.</div>
          </div>
        </div>
        <div style={{ height: 1, background: "rgba(255,255,255,.08)", margin: "0 12px 10px" }} />
        <div style={{ padding: "0 12px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", background: "rgba(255,255,255,.06)", borderRadius: 9 }}>
            <span style={{ width: 28, height: 28, borderRadius: 7, background: cur.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <Icon name={cur.icon} size={15} />
            </span>
            <div style={{ lineHeight: 1.2, overflow: "hidden" }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "#fff", whiteSpace: "nowrap" }}>{cur.person}</div>
              <div style={{ fontSize: 10.5, color: "var(--on-navy-dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {cur.label} · {cur.sub}
              </div>
            </div>
          </div>
        </div>
        <nav className="scroll-y" style={{ flex: 1, padding: "4px 12px" }}>
          {nav.map(n => {
            const active = n.id === page;
            return (
              <button 
                key={n.id} 
                onClick={() => onNav(n.id)}
                style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "9px 11px", margin: "2px 0", border: 0, borderRadius: 8, cursor: "pointer", textAlign: "left", background: active ? "rgba(246,198,103,.16)" : "transparent", color: active ? "#fff" : "var(--on-navy-dim)", fontSize: 13, fontWeight: active ? 600 : 500, position: "relative", transition: "background .12s" }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,.05)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                {active && <span style={{ position: "absolute", left: 0, top: 8, bottom: 8, width: 3, borderRadius: 3, background: "var(--amber)" }} />}
                <Icon name={n.icon} size={17} style={{ color: active ? "var(--amber)" : "var(--on-navy-dim)", flex: "none" }} />
                <span style={{ flex: 1 }}>{n.label}</span>
                {n.badge && <span className="badge" style={{ height: 18, minWidth: 18, justifyContent: "center", padding: "0 5px", background: "var(--red)", color: "#fff", fontSize: 10.5 }}>{n.badge}</span>}
              </button>
            );
          })}
        </nav>
        
        <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,.08)", display: "flex", flexDirection: "column", gap: 8 }}>
          {onResolveDemo && (
            <button onClick={onResolveDemo} className="btn" style={{ width: "100%", background: "rgba(246,198,103,.14)", color: "var(--amber)", border: "1px solid rgba(246,198,103,.3)", fontSize: 12.5, height: 38 }}>
              <Icon name="sparkle" size={15} /> Guided: Resolve a complaint
            </button>
          )}
          {onLogout && (
            <button onClick={onLogout} className="btn btn-ghost" style={{ width: "100%", color: "var(--on-navy-dim)", fontSize: 12.5, height: 38 }}>
              <Icon name="logout" size={15} /> Sign out
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Pane */}
      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--surface)", width: "100%" }}>
        <header className="app-header" style={{ height: "var(--topbar-h)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", background: "var(--white)", borderBottom: "1px solid var(--line)", flex: "none", zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, minWidth: 0 }}>
            <button className="hamburger btn btn-quiet" onClick={() => setDrawer(d => !d)} style={{ width: 36, padding: 0, marginLeft: -6, flex: "none" }} aria-label="Menu">
              <Icon name="list" size={20} />
            </button>
            <span style={{ fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap" }}>{cur.label}</span>
            {breadcrumb && (
              <>
                <Icon name="chevronRight" size={14} style={{ color: "var(--ink-4)", flex: "none" }} />
                <span className="muted" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{breadcrumb}</span>
              </>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <NotifBell role={role} onGoto={onGoto} />
            <div style={{ width: 1, height: 24, background: "var(--line)" }} />
            <RoleSwitcher role={role} onSwitch={onSwitch} />
          </div>
        </header>
        
        <main className="scroll-y fade-in app-main" key={role + page} style={{ flex: 1, padding: "24px 28px 60px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>{children}</div>
        </main>
      </div>
    </div>
  );
};

/* ---------------- Login launcher ---------------- */
interface LoginLauncherProps {
  onPick: (role: 'student' | 'supervisor' | 'facilitator' | 'hod' | 'superadmin') => void;
}

export const LoginLauncher: React.FC<LoginLauncherProps> = ({ onPick }) => {
  const [forgot, setForgot] = useState(false);
  const [totpFor, setTotpFor] = useState<RoleInfo | null>(null); // role pending 2FA
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  function pick(r: RoleInfo) {
    if (r.id === "student") { 
      onPick(r.id); 
      return; 
    } // students: password only, no TOTP
    setTotpFor(r); 
    setCode(""); 
    setErr(false);
  }

  function setDigit(i: number, v: string) {
    v = v.replace(/\D/g, "").slice(-1);
    const arr = code.padEnd(6, " ").split("");
    arr[i] = v || " ";
    setCode(arr.join("").trimEnd());
    setErr(false);
    if (v && i < 5 && inputsRef.current[i + 1]) {
      inputsRef.current[i + 1]?.focus();
    }
  }

  function onKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[i] && i > 0 && inputsRef.current[i - 1]) {
      inputsRef.current[i - 1]?.focus();
    }
  }

  function verify() {
    const clean = code.replace(/\s/g, "");
    if (clean.length < 6) { 
      setErr(true); 
      return; 
    }
    setVerifying(true);
    setTimeout(() => {
      // demo: any 6 digits accepted except "000000"
      if (clean === "000000") { 
        setErr(true); 
        setVerifying(false); 
        return; 
      }
      setVerifying(false); 
      if (totpFor) {
        onPick(totpFor.id);
      }
    }, 650);
  }

  return (
    <div className="login-split" style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1.05fr 1fr", background: "var(--surface)" }}>
      {/* left brand panel */}
      <div className="login-brand" style={{ background: "linear-gradient(155deg, var(--navy) 0%, var(--navy-900) 100%)", color: "#fff", padding: "56px 60px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", border: "1px solid rgba(255,255,255,.07)" }} />
        <div style={{ position: "absolute", bottom: -120, right: -40, width: 260, height: 260, borderRadius: "50%", border: "1px solid rgba(255,255,255,.06)" }} />
        
        <div style={{ display: "flex", alignItems: "center", gap: 13, position: "relative" }}>
          <div style={{ width: 48, height: 48, borderRadius: 11, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flex: "none" }}>
            <Icon name="building" size={28} style={{ color: 'var(--navy)' }} />
          </div>
          <div style={{ maxWidth: 360 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.3, whiteSpace: "nowrap" }}>Adventist University of Central Africa</div>
            <div style={{ fontSize: 11.5, color: "var(--on-navy-dim)", marginTop: 4 }}>Department of Software Engineering</div>
          </div>
        </div>
        
        <div style={{ position: "relative", maxWidth: 440 }}>
          <div className="badge badge-solid-amber" style={{ marginBottom: 18 }}>FINAL YEAR PROJECT · CLASS OF 2026</div>
          <h1 style={{ color: "#fff", fontSize: 34, lineHeight: 1.15, letterSpacing: "-.02em", fontWeight: 600 }}>FYP Tracking &amp;<br />Accountability System</h1>
          <p style={{ color: "var(--on-navy-dim)", fontSize: 15, marginTop: 16, lineHeight: 1.6 }}>
            One continuous, auditable timeline of every step a student passes through — who did what, and when — from registration to defense. No more guessing. No more blame by assumption.
          </p>
          <div className="role-stat-row" style={{ display: "flex", gap: 22, marginTop: 30 }}>
            {[["11", "tracked states"], ["5", "role views"], ["100%", "email receipts"]].map(([n, l]) => (
              <div key={l}>
                <div className="num" style={{ fontSize: 26, fontWeight: 600, color: "var(--amber)" }}>{n}</div>
                <div style={{ fontSize: 12, color: "var(--on-navy-dim)" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div style={{ position: "relative", fontSize: 11.5, color: "rgba(255,255,255,.4)" }}>
          Prototype · email, WhatsApp &amp; prototype-review API are mocked for demo
        </div>
      </div>

      {/* right sign-in */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          {forgot ? (
            <>
              <h2 style={{ fontSize: 22 }}>Forgot password</h2>
              <p className="muted" style={{ fontSize: 13.5, marginTop: 6, marginBottom: 20 }}>
                Password resets are handled by the Superadmin. Submit a request and you'll be notified by email once it's reset.
              </p>
              <label className="field-label">University email</label>
              <input className="input" placeholder="you@stu.aauca.ac.rw" defaultValue="kwizera.luc@stu.aauca.ac.rw" style={{ marginBottom: 14 }} />
              <button className="btn btn-primary btn-lg" style={{ width: "100%" }} onClick={() => setForgot(false)}>Request password reset</button>
              <div style={{ marginTop: 14, padding: "10px 12px", background: "var(--blue-bg)", borderRadius: 8, fontSize: 12, color: "var(--ink-2)", display: "flex", gap: 8 }}>
                <Icon name="shield" size={15} style={{ color: "var(--blue)", flex: "none", marginTop: 1 }} />
                A Superadmin will reset your password and the action will be recorded in the audit log.
              </div>
              <button onClick={() => setForgot(false)} className="btn btn-quiet" style={{ marginTop: 14, width: "100%", fontSize: 12.5 }}>← Back to sign in</button>
            </>
          ) : totpFor ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 4 }}>
                <span style={{ width: 40, height: 40, borderRadius: 10, background: totpFor.color + "1a", color: totpFor.color, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                  <Icon name="shield" size={20} />
                </span>
                <div>
                  <h2 style={{ fontSize: 20 }}>Two-factor authentication</h2>
                  <div className="muted" style={{ fontSize: 12.5 }}>{totpFor.label} · {totpFor.person}</div>
                </div>
              </div>
              <p className="muted" style={{ fontSize: 13, marginTop: 12, marginBottom: 18, lineHeight: 1.6 }}>
                Staff accounts are protected by an authenticator app. Enter the 6-digit code from <strong>Google Authenticator</strong> (or similar) for your AAUCA account.
              </p>
              <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <input 
                    key={i} 
                    ref={el => { inputsRef.current[i] = el; }} 
                    inputMode="numeric" 
                    maxLength={1}
                    value={code[i] || ""} 
                    onChange={e => setDigit(i, e.target.value)} 
                    onKeyDown={e => onKey(i, e)}
                    autoFocus={i === 0}
                    className="input mono" 
                    style={{ width: 48, height: 56, textAlign: "center", fontSize: 22, fontWeight: 600, padding: 0, borderColor: err ? "var(--red)" : undefined }} 
                  />
                ))}
              </div>
              {err && (
                <div style={{ fontSize: 12, color: "var(--red)", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                  <Icon name="alert" size={13} /> Invalid or incomplete code. Try again.
                </div>
              )}
              <button className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: 10 }} onClick={verify} disabled={verifying}>
                {verifying ? <><Icon name="refresh" size={15} /> Verifying…</> : <><Icon name="shield" size={15} /> Verify &amp; sign in</>}
              </button>
              <div style={{ marginTop: 14, padding: "10px 12px", background: "var(--surface)", borderRadius: 8, fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.6 }}>
                <Icon name="key" size={13} style={{ verticalAlign: -2, marginRight: 5 }} />
                Demo: enter any 6 digits to continue. Lost your device? The Superadmin can reset your authenticator.
              </div>
              <button onClick={() => setTotpFor(null)} className="btn btn-quiet" style={{ marginTop: 12, width: "100%", fontSize: 12.5 }}>← Back to sign in</button>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: 22 }}>Sign in</h2>
              <p className="muted" style={{ fontSize: 13.5, marginTop: 6, marginBottom: 22 }}>
                Choose a role to enter that logged-in experience. You can switch roles anytime from the top bar.
              </p>
              <div style={{ display: "grid", gap: 9 }}>
                {ROLES.map(r => (
                  <button 
                    key={r.id} 
                    onClick={() => pick(r)} 
                    className="role-pick"
                    style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 10, background: "#fff", cursor: "pointer", textAlign: "left", transition: "all .14s", boxShadow: "var(--sh-sm)" }}
                  >
                    <span style={{ width: 38, height: 38, borderRadius: 9, background: r.color + "1a", color: r.color, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                      <Icon name={r.icon} size={19} />
                    </span>
                    <span style={{ flex: 1 }}>
                      <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{r.label}</span>
                      <span style={{ display: "block", fontSize: 12, color: "var(--ink-3)" }}>{r.person} · {r.sub}</span>
                    </span>
                    {r.id === "student" ? (
                      <Icon name="arrowRight" size={17} style={{ color: "var(--ink-4)" }} />
                    ) : (
                      <span title="Requires 2FA" style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--ink-4)", fontSize: 10.5, fontWeight: 600 }}>
                        <Icon name="shield" size={14} /> 2FA
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 12, fontSize: 11.5, color: "var(--ink-3)" }}>
                <Icon name="shield" size={13} style={{ color: "var(--ink-4)" }} /> 
                Staff sign-ins require an authenticator code. Students sign in with their password only.
              </div>
              <button onClick={() => setForgot(true)} className="btn btn-quiet" style={{ marginTop: 10, width: "100%", color: "var(--ink-3)", fontSize: 12.5 }}>Forgot password?</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
