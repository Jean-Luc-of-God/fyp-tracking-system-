import React from 'react';
import { Icon, Badge, EmptyState, Skeleton } from './SharedUI';

/* ---------------- SkRow Component ---------------- */
interface SkRowProps {
  cols: (string | number)[];
}

export const SkRow: React.FC<SkRowProps> = ({ cols }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 14px", borderTop: "1px solid var(--line-soft)" }}>
      {cols.map((w, i) => (
        <React.Fragment key={i}>
          {i === 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 9, width: w }}>
              <Skeleton width={26} height={26} style={{ flex: "none", borderRadius: 13 }} />
              <div style={{ flex: 1 }}>
                <Skeleton width="70%" height={11} />
                <Skeleton width="45%" height={9} style={{ marginTop: 6 }} />
              </div>
            </div>
          ) : (
            <Skeleton width={w} height={11} />
          )}
        </React.Fragment>
      ))}
      <div style={{ flex: 1 }} />
      <Skeleton width={16} height={16} style={{ flex: "none", borderRadius: 4 }} />
    </div>
  );
};

/* ---------------- TableSkeleton Component ---------------- */
interface TableSkeletonProps {
  rows?: number;
  cols?: (string | number)[];
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 6, cols = [180, 90, 80, 110] }) => {
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div className="card-hd">
        <Skeleton width={150} height={14} />
        <Skeleton width={56} height={18} style={{ borderRadius: 9 }} />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkRow key={i} cols={cols} />
      ))}
    </div>
  );
};

/* ---------------- MetricsSkeleton Component ---------------- */
interface MetricsSkeletonProps {
  n?: number;
}

export const MetricsSkeleton: React.FC<MetricsSkeletonProps> = ({ n = 4 }) => {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${n},1fr)`, gap: 14, marginBottom: 18 }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="card card-pad">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Skeleton width={80} height={11} />
            <Skeleton width={17} height={17} style={{ borderRadius: 5 }} />
          </div>
          <Skeleton width={54} height={26} style={{ marginTop: 12 }} />
          <Skeleton width={100} height={10} style={{ marginTop: 10 }} />
        </div>
      ))}
    </div>
  );
};

/* ---------------- TitleSkeleton Component ---------------- */
interface TitleSkeletonProps {
  action?: boolean;
}

export const TitleSkeleton: React.FC<TitleSkeletonProps> = ({ action = true }) => {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18 }}>
      <div>
        <Skeleton width={190} height={22} />
        <Skeleton width={300} height={12} style={{ marginTop: 10 }} />
      </div>
      {action && <Skeleton width={210} height={38} style={{ borderRadius: 8 }} />}
    </div>
  );
};

/* ---------------- DashboardSkeleton Component ---------------- */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="fade-in">
      <TitleSkeleton />
      <MetricsSkeleton n={4} />
      <TableSkeleton rows={5} />
    </div>
  );
};

/* ---------------- ListSkeleton Component ---------------- */
interface ListSkeletonProps {
  rows?: number;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({ rows = 7 }) => {
  return (
    <div className="fade-in">
      <TitleSkeleton />
      <TableSkeleton rows={rows} />
    </div>
  );
};

/* ---------------- DetailSkeleton Component ---------------- */
export const DetailSkeleton: React.FC = () => {
  return (
    <div className="fade-in">
      <Skeleton width={140} height={28} style={{ borderRadius: 8, marginBottom: 14 }} />
      <div className="card card-pad" style={{ marginBottom: 18, display: "flex", gap: 15 }}>
        <Skeleton width={54} height={54} style={{ flex: "none", borderRadius: 27 }} />
        <div style={{ flex: 1 }}>
          <Skeleton width={200} height={18} />
          <Skeleton width={320} height={12} style={{ marginTop: 10 }} />
          <Skeleton width={260} height={10} style={{ marginTop: 8 }} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18 }}>
        <div className="card card-pad" style={{ display: "grid", gap: 16 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ display: "flex", gap: 12 }}>
              <Skeleton width={30} height={30} style={{ flex: "none", borderRadius: 15 }} />
              <div style={{ flex: 1 }}>
                <Skeleton width="60%" height={12} />
                <Skeleton width="40%" height={10} style={{ marginTop: 7 }} />
              </div>
            </div>
          ))}
        </div>
        <div className="card card-pad" style={{ display: "grid", gap: 12 }}>
          {[0, 1, 2].map(i => (
            <Skeleton key={i} width="100%" height={44} style={{ borderRadius: 9 }} />
          ))}
        </div>
      </div>
    </div>
  );
};

/* ---------------- FormSkeleton Component ---------------- */
export const FormSkeleton: React.FC = () => {
  return (
    <div className="fade-in">
      <TitleSkeleton action={false} />
      <div className="card card-pad" style={{ maxWidth: 640, display: "grid", gap: 16 }}>
        {[0, 1, 2].map(i => (
          <div key={i}>
            <Skeleton width={120} height={11} style={{ marginBottom: 8 }} />
            <Skeleton width="100%" height={38} style={{ borderRadius: 8 }} />
          </div>
        ))}
        <Skeleton width={150} height={40} style={{ borderRadius: 8 }} />
      </div>
    </div>
  );
};

/* ---------------- PageSkeletonFor Component ---------------- */
const SKELETON_KIND: { [key: string]: React.FC } = {
  dashboard: DashboardSkeleton,
  list: ListSkeleton,
  detail: DetailSkeleton,
  form: FormSkeleton,
};

interface PageSkeletonForProps {
  kind: 'dashboard' | 'list' | 'detail' | 'form' | string;
}

export const PageSkeletonFor: React.FC<PageSkeletonForProps> = ({ kind }) => {
  const C = SKELETON_KIND[kind] || DashboardSkeleton;
  return <C />;
};

/* ---------------- ErrorState Component ---------------- */
export interface ErrorStateProps {
  title?: string;
  sub?: string;
  onRetry?: () => void;
  icon?: string;
  compact?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  sub = "We couldn't load this just now. Your data is safe — please try again.",
  onRetry,
  icon = "alert",
  compact
}) => {
  return (
    <div className="pop-in" style={{ textAlign: "center", padding: compact ? "28px 20px" : "48px 28px" }}>
      <div style={{
        width: 56,
        height: 56,
        borderRadius: 14,
        background: "var(--red-bg)",
        color: "var(--red)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 14px"
      }}>
        <Icon name={icon} size={26} />
      </div>
      <h3 style={{ fontSize: 15.5 }}>{title}</h3>
      <p className="muted" style={{ fontSize: 13, marginTop: 6, maxWidth: 360, marginLeft: "auto", marginRight: "auto", lineHeight: 1.55 }}>{sub}</p>
      {onRetry && (
        <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={onRetry}>
          <Icon name="refresh" size={15} /> Try again
        </button>
      )}
    </div>
  );
};

/* ---------------- StateView Component ---------------- */
interface StateViewProps {
  state: 'loading' | 'empty' | 'error' | 'ready';
  skeleton?: 'dashboard' | 'list' | 'detail' | 'form' | string | React.ReactNode;
  empty?: React.ReactNode;
  error?: ErrorStateProps | null;
  onRetry?: () => void;
  children: React.ReactNode;
}

export const StateView: React.FC<StateViewProps> = ({
  state,
  skeleton = "dashboard",
  empty,
  error,
  onRetry,
  children
}) => {
  if (state === "loading") {
    if (typeof skeleton === "string") {
      return <PageSkeletonFor kind={skeleton} />;
    }
    return <>{skeleton}</>;
  }
  if (state === "error") {
    return <ErrorState onRetry={onRetry} {...(error || {})} />;
  }
  if (state === "empty") {
    return <>{empty || <EmptyState title="Nothing here yet" sub="Check back later." />}</>;
  }
  return <>{children}</>;
};

/* ---------------- ErrorBoundary Component ---------------- */
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  err: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { err: null };
  }

  static getDerivedStateFromError(err: Error) {
    return { err };
  }

  componentDidCatch(err: Error, info: React.ErrorInfo) {
    console.error("View error:", err, info);
  }

  render() {
    if (this.state.err) {
      return (
        <div style={{ padding: "10px 0" }}>
          <ErrorState
            title="This screen hit a problem"
            sub="The rest of the app is fine. Reload this view to continue."
            onRetry={() => this.setState({ err: null })}
          />
        </div>
      );
    }
    return this.props.children;
  }
}

/* ---------------- SuccessPanel Component ---------------- */
interface SuccessPanelProps {
  title: string;
  children?: React.ReactNode;
  next?: string;
  onDismiss?: () => void;
  tone?: 'green' | 'navy';
}

export const SuccessPanel: React.FC<SuccessPanelProps> = ({
  title,
  children,
  next,
  onDismiss,
  tone = "green"
}) => {
  const c = tone === "green" ? "var(--green)" : "var(--navy)";
  return (
    <div className="pop-in card" style={{ overflow: "hidden", borderColor: tone === "green" ? "#BCE2CC" : "var(--line)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 13, padding: "16px 18px", background: tone === "green" ? "var(--green-bg)" : "var(--surface)" }}>
        <span className="success-ring" style={{ width: 38, height: 38, borderRadius: "50%", background: c, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
          <svg className="success-check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>{title}</div>
          {children && <div className="muted" style={{ fontSize: 13, marginTop: 3, lineHeight: 1.55 }}>{children}</div>}
        </div>
        {onDismiss && (
          <button className="btn btn-quiet btn-sm" onClick={onDismiss} style={{ width: 28, padding: 0 }}>
            <Icon name="x" size={15} />
          </button>
        )}
      </div>
      {next && (
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 18px", borderTop: "1px solid var(--line-soft)", background: "var(--white)" }}>
          <span className="eyebrow" style={{ color: c }}>Next</span>
          <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{next}</span>
        </div>
      )}
    </div>
  );
};

/* ---------------- SuccessScreen Component ---------------- */
interface SuccessScreenProps {
  title: string;
  sub?: string;
  badge?: string;
  actions?: React.ReactNode;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({ title, sub, badge, actions }) => {
  return (
    <div className="pop-in" style={{ textAlign: "center", padding: "52px 28px" }}>
      <span className="success-ring" style={{ width: 76, height: 76, borderRadius: "50%", background: "var(--green)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
        <svg className="success-check" width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
      {badge && <div style={{ marginBottom: 12 }}><Badge tone="green" dot>{badge}</Badge></div>}
      <h2 style={{ fontSize: 22 }}>{title}</h2>
      {sub && <p className="muted" style={{ fontSize: 14, marginTop: 8, maxWidth: 420, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>{sub}</p>}
      {actions && <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 22 }}>{actions}</div>}
    </div>
  );
};

/* ---------------- ConnectionBanner Component ---------------- */
export const ConnectionBanner: React.FC = () => {
  const [offline, setOffline] = React.useState(!navigator.onLine);
  const [restored, setRestored] = React.useState(false);

  React.useEffect(() => {
    const off = () => { setOffline(true); setRestored(false); };
    const on = () => { setOffline(false); setRestored(true); setTimeout(() => setRestored(false), 2600); };
    window.addEventListener("offline", off);
    window.addEventListener("online", on);
    return () => {
      window.removeEventListener("offline", off);
      window.removeEventListener("online", on);
    };
  }, []);

  if (!offline && !restored) return null;
  return (
    <div className="conn-banner" style={{ background: offline ? "var(--red)" : "var(--green)", color: "#fff", display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', justifyContent: 'center', fontSize: '12px' }}>
      <Icon name={offline ? "alert" : "check"} size={14} />
      {offline ? "You're offline — changes will sync when the connection returns." : "Back online — you're all synced."}
    </div>
  );
};
