import { useState, useEffect } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { useAuth } from './hooks/useAuth';
import {
  AppShell,
  LoginLauncher,
  NAV,
  roleById
} from './components/Layout';
import { 
  StudentDashboard, 
  StudentCase, 
  StudentSupervisor, 
  StudentTimeline 
} from './pages/StudentDashboard';
import { 
  SupDashboard, 
  SupSupervision, 
  SupAvailability, 
  SupSettings,
  ChangePasswordCard
} from './pages/SupervisorDashboard';
import { 
  FacPipeline, 
  FacStudents, 
  FacExaminers, 
  FacPending, 
  FacProtoData 
} from './pages/FacilitatorDashboard';
import {
  HODDashboard,
  HODUpload,
  HODRequest,
  HODReview,
  HODSupervisors,
  HODRecords,
  HODSupervisorWindow,
  ProtoReview,
  ProposalReview,
} from './pages/HODDashboard';
import { 
  AdminDashboard, 
  AdminAccounts, 
  AdminAudit, 
  AdminNotifications, 
  AdminConfig 
} from './pages/SuperadminDashboard';
import { SupFindStudents, HODFindStudents } from './components/Filters';
import { SupExamining } from './pages/ExaminerDashboard';
import { RiskDashboard } from './components/Risk';
import { EscalationLadder } from './components/Escalation';
import { StaffAvailabilityDirectory } from './components/AvailabilityUI';
import { EmptyState } from './components/SharedUI';
import { ToastHost, notify } from './components/LetterUI';
import { ConnectionBanner, ErrorBoundary, PageSkeletonFor } from './components/StateSystem';
import { NotificationsPage } from './components/Notifications';

const PAGE_SKELETON: { [key: string]: 'form' | 'list' | 'detail' | 'dashboard' } = {
  case: "form", 
  upload: "form", 
  request: "list", 
  review: "list", 
  find: "list", 
  students: "list",
  pending: "list", 
  audit: "list", 
  notifications: "list", 
  accounts: "list", 
  records: "detail",
  proto: "form", 
  settings: "form", 
  availability: "detail", 
  supervisor: "detail", 
  timeline: "detail",
  supervision: "detail", 
  config: "form",
};

function skeletonKind(page: string) {
  if (page === "__notifs") return "list";
  return PAGE_SKELETON[page] || "dashboard";
}

function MainApp() {
  const { students, notificationLogs, letters, switchUser, refreshStudents } = useAppContext();
  const { login: apiLogin, logout: apiLogout } = useAuth();
  const [authed, setAuthed] = useState(false);
  const [role, setRole] = useState<'student' | 'supervisor' | 'facilitator' | 'hod' | 'superadmin'>("facilitator");
  const [, setActiveUserId] = useState<string>('');
  const [activeUserFullName, setActiveUserFullName] = useState<string>('');
  const [page, setPage] = useState("pipeline");
  const [focusStudentId, setFocusStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const firstPage = (r: 'student' | 'supervisor' | 'facilitator' | 'hod' | 'superadmin') => NAV[r][0].id;

  const greetUser = (r: 'student' | 'supervisor' | 'facilitator' | 'hod' | 'superadmin', fullName?: string) => {
    const hr = new Date().getHours();
    const part = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
    const person = fullName || roleById[r]?.person || "";
    let msg = `${part}, ${person}`;
    try {
      if (r === "hod") {
        const n = students.filter(s => letters[s.id]?.status === "submitted").length;
        msg += n ? ` — ${n} letter${n > 1 ? "s" : ""} need your review` : " — no letters pending review";
      } else if (r === "facilitator") {
        msg += " — 5 items need coordination";
      } else if (r === "supervisor") {
        msg += " — your students are on track";
      } else if (r === "student") {
        msg += " — here's where your project stands";
      } else if (r === "superadmin") {
        const f = notificationLogs.filter(n => n.status === "failed").length;
        msg += f ? ` — ${f} email issue${f > 1 ? "s" : ""} to review` : " — all systems operational";
      }
    } catch { /* ignore */ }
    notify(msg, "info");
  };

  async function login(email: string, password: string): Promise<'student' | 'supervisor' | 'facilitator' | 'hod' | 'superadmin' | null> {
    const authUser = await apiLogin(email, password);
    if (!authUser) return null;
    const r = authUser.role;
    setActiveUserId(authUser.userId);
    setActiveUserFullName(authUser.fullName);
    switchUser(r, authUser.userId);
    setRole(r);
    setPage(firstPage(r));
    setAuthed(true);
    setTimeout(() => greetUser(r, authUser.fullName), 480);
    // Reload students from API with fresh token
    refreshStudents();
    return r;
  }

  function nav(p: string) {
    setPage(p);
    setFocusStudentId(null);
  }

  function open(p: string, studentId?: string) {
    setPage(p);
    setFocusStudentId(studentId || null);
  }

  function goto(p: string, studentId?: string) {
    if (p === "__notifs") {
      setPage("__notifs");
      setFocusStudentId(null);
      return;
    }
    const navItems = NAV[role] || [];
    const known = navItems.some(n => n.id === p);
    if (known) {
      setPage(p);
      setFocusStudentId(studentId || null);
    } else {
      setPage("__notifs");
    }
  }

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 420);
    return () => clearTimeout(t);
  }, [authed, role, page]);

  if (!authed) {
    return (
      <>
        <LoginLauncher onLogin={login} />
        <ToastHost />
      </>
    );
  }

  const navItem = (NAV[role] || []).find(n => n.id === page);
  const isNotifs = page === "__notifs";

  const renderView = () => {
    if (isNotifs) {
      return <NotificationsPage role={role} onOpen={goto} />;
    }

    if (role === "student") {
      switch (page) {
        case "dashboard": return <StudentDashboard onNav={nav} />;
        case "case": return <StudentCase />;
        case "supervisor": return <StudentSupervisor />;
        case "timeline": return <StudentTimeline />;
        case "settings": return <div style={{ maxWidth: 480 }}><h2 style={{ marginBottom: 20 }}>Account settings</h2><ChangePasswordCard /></div>;
      }
    } else if (role === "supervisor") {
      switch (page) {
        case "dashboard": return <SupDashboard onOpen={open} onNav={nav} />;
        case "supervision": return <SupSupervision focusStudent={focusStudentId} />;
        case "find": return <SupFindStudents onOpen={(id: string) => open("supervision", id)} />;
        case "availability": return <SupAvailability />;
        case "examining": return <SupExamining focusStudent={focusStudentId ? students.find(s => s.id === focusStudentId) || null : null} />;
        case "settings": return <SupSettings />;
      }
    } else if (role === "facilitator") {
      switch (page) {
        case "pipeline": return <FacPipeline onOpen={(id: string) => open("students", id)} />;
        case "risk": return <RiskDashboard onOpen={(id: string) => open("students", id)} scope="all" />;
        case "escalation": return <EscalationLadder onOpen={(id: string) => open("students", id)} />;
        case "students": return <FacStudents focusStudent={focusStudentId} onClearFocus={() => setFocusStudentId(null)} />;
        case "pending": return <FacPending onOpen={(id: string) => open("students", id)} />;
        case "supervisors": return <HODSupervisors />;
        case "examiners": return <FacExaminers />;
        case "proto-review": return <ProtoReview />;
        case "availability": return <StaffAvailabilityDirectory title="Supervisor Availability" sub="Weekly office hours and contact points for staff." />;
        case "proto": return <FacProtoData />;
      }
    } else if (role === "hod") {
      switch (page) {
        case "dashboard": return <HODDashboard onNav={nav} />;
        case "risk": return <RiskDashboard onOpen={(id: string) => open("mysupervision", id)} scope="all" />;
        case "escalation": return <EscalationLadder onOpen={(id: string) => open("mysupervision", id)} />;
        case "find": return <HODFindStudents />;
        case "upload": return <HODUpload />;
        case "request": return <HODRequest />;
        case "review": return <HODReview />;
        case "supervisors": return <HODSupervisors />;
        case "examiners": return <FacExaminers />;
        case "proto-review": return <ProtoReview />;
        case "proposal-review": return <ProposalReview />;
        case "mysupervision": return <HODSupervisorWindow />;
        case "availability": return <StaffAvailabilityDirectory title="Supervisor Availability" sub="Weekly office hours and contact points for staff." />;
        case "records": return <HODRecords />;
        case "settings": return <div style={{ maxWidth: 480 }}><h2 style={{ marginBottom: 20 }}>Account settings</h2><ChangePasswordCard /></div>;
      }
    } else if (role === "superadmin") {
      switch (page) {
        case "dashboard": return <AdminDashboard onNav={nav} />;
        case "accounts": return <AdminAccounts />;
        case "audit": return <AdminAudit />;
        case "notifications": return <AdminNotifications />;
        case "config": return <AdminConfig />;
        case "settings": return <div style={{ maxWidth: 480 }}><h2 style={{ marginBottom: 20 }}>Account settings</h2><ChangePasswordCard /></div>;
      }
    }

    return <EmptyState icon="layers" title="Not available" sub="This view is not available for your role." />;
  };

  return (
    <>
      <ConnectionBanner />
      <AppShell
        role={role}
        page={page}
        onNav={nav}
        onGoto={goto}
        breadcrumb={isNotifs ? "Notifications" : (navItem ? navItem.label : "")}
        onLogout={async () => { await apiLogout(); setAuthed(false); }}
        userFullName={activeUserFullName}
      >
        <ErrorBoundary key={role + page}>
          {loading ? (
            <PageSkeletonFor kind={skeletonKind(page)} />
          ) : (
            renderView()
          )}
        </ErrorBoundary>
      </AppShell>
      <ToastHost />
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

export default App;
