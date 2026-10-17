import { useCallback, useMemo, useState } from "react";
import {
  APP_KEYS,
  AppMark,
  COREMS_APPS,
  CoreMSAuthProvider,
  RequireAuth,
  RoleBasedRoute,
  SetPasswordScreen,
  resolveBranding,
  useCoreMSAuth,
  type AppKey,
} from "@/lib";
import { createMockSupabase, type MockLogEntry, type Scenario } from "./mockSupabase";

const SCENARIOS: { key: Scenario; label: string; hint: string }[] = [
  { key: "success", label: "Successful login", hint: "Active user with app entitlement." },
  { key: "inactive", label: "Inactive account", hint: "is_user_active returns false → auto sign-out." },
  { key: "company_inactive", label: "Company suspended", hint: "Active account, inactive company → auto sign-out." },
  { key: "company_error", label: "Company check unavailable", hint: "Company status cannot be verified → access blocked." },
  { key: "entitlement", label: "Entitlement denied", hint: "can_user_access_app returns false → auto sign-out." },
  { key: "superadmin", label: "Super Admin bypass", hint: "No entitlement, but is_super_admin skips the check." },
  { key: "invalid", label: "Wrong password", hint: "Supabase rejects credentials." },
];

type View = "login" | "set" | "reset";

function SignedInPanel() {
  const { user, logout, branding } = useCoreMSAuth();
  if (!user) return null;
  return (
    <div className="cms-root cms-contained" style={{ ["--cms-accent" as string]: branding.accent }}>
      <div className="cms-card" style={{ maxWidth: 460 }}>
        <div className="cms-card-head">
          <div className="cms-brand-row">
            <AppMark branding={branding} />
            <div>
              <p className="cms-app-name">{branding.appName}</p>
              <h2 className="cms-title">Welcome, {user.username}</h2>
            </div>
          </div>
        </div>
        <div className="cms-card-body cms-form">
          <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 16px", margin: 0, fontSize: 14 }}>
            <dt style={{ color: "var(--cms-muted)" }}>Email</dt><dd>{user.email}</dd>
            <dt style={{ color: "var(--cms-muted)" }}>Roles</dt><dd>{user.roles.join(", ")}</dd>
            <dt style={{ color: "var(--cms-muted)" }}>Super Admin</dt><dd>{user.isSuperAdmin ? "Yes (entitlement bypassed)" : "No"}</dd>
          </dl>
          <RoleBasedRoute roles={["Admin"]} allowSuperAdmin fallback={<p className="cms-hint">RoleBasedRoute [Admin]: hidden for this user.</p>}>
            <p className="cms-hint" style={{ color: "var(--cms-ok)" }}>RoleBasedRoute [Admin]: visible.</p>
          </RoleBasedRoute>
          <button className="cms-btn cms-btn-ghost" onClick={() => void logout()}>Sign out</button>
        </div>
      </div>
    </div>
  );
}

export default function Showcase() {
  const [appKey, setAppKey] = useState<AppKey>("ctrl");
  const [scenario, setScenario] = useState<Scenario>("success");
  const [view, setView] = useState<View>("login");
  const [runId, setRunId] = useState(0);
  const [log, setLog] = useState<MockLogEntry[]>([]);

  const onLog = useCallback((e: MockLogEntry) => setLog((l) => [...l.slice(-60), e]), []);
  const client = useMemo(
    () => createMockSupabase({ scenario, appKey, onLog, recoverySession: view !== "login" }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scenario, appKey, view, runId, onLog],
  );
  const reset = () => { setLog([]); setRunId((n) => n + 1); };
  const active = SCENARIOS.find((s) => s.key === scenario);

  return (
    <div className="min-h-dvh bg-background text-foreground lg:grid lg:grid-cols-[340px_1fr]">
      <aside className="flex flex-col gap-6 border-b border-border bg-card p-5 lg:h-dvh lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">CoreMS Auth</p>
          <h1 className="mt-1 text-xl font-semibold">Test harness</h1>
          <p className="mt-1 text-sm text-muted-foreground">Preview the shared sign-in screens across the suite. All calls are simulated.</p>
        </header>

        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">App</h2>
          <div className="grid grid-cols-2 gap-2">
            {APP_KEYS.map((k) => {
              const b = resolveBranding(k);
              const on = k === appKey;
              return (
                <button
                  key={k}
                  onClick={() => { setAppKey(k); setLog([]); }}
                  aria-pressed={on}
                  className={`flex min-h-11 items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs font-semibold transition-colors ${on ? "border-primary bg-secondary" : "border-border hover:bg-secondary/60"}`}
                >
                  <span className="cms-root" style={{ all: "unset", ["--cms-accent" as string]: b.accent }}>
                    <AppMark branding={b} size={26} />
                  </span>
                  {COREMS_APPS[k].name}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Screen</h2>
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-secondary p-1">
            {(["login", "set", "reset"] as View[]).map((v) => (
              <button key={v} onClick={() => { setView(v); setLog([]); }} aria-pressed={view === v}
                className={`min-h-10 rounded-md text-xs font-semibold ${view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
                {v === "login" ? "Login" : v === "set" ? "Invite" : "Reset"}
              </button>
            ))}
          </div>
        </section>

        {view === "login" && (
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scenario</h2>
            <div className="flex flex-col gap-1.5" role="radiogroup">
              {SCENARIOS.map((s) => (
                <label key={s.key} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm ${scenario === s.key ? "border-primary bg-secondary" : "border-border"}`}>
                  <input type="radio" name="scenario" className="accent-primary" checked={scenario === s.key} onChange={() => { setScenario(s.key); setLog([]); }} />
                  {s.label}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{active?.hint} Use any email and password.</p>
          </section>
        )}

        <button onClick={reset} className="min-h-10 rounded-lg border border-border text-sm font-semibold hover:bg-secondary">Reset simulation</button>

        <section className="flex min-h-0 flex-1 flex-col">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Call log</h2>
          <ol className="flex-1 space-y-1 overflow-y-auto rounded-lg bg-background p-2 font-mono text-[11px] leading-snug" aria-live="polite">
            {log.length === 0 && <li className="text-muted-foreground">No calls yet.</li>}
            {log.map((e, i) => (
              <li key={i}>
                <span className="text-muted-foreground">{e.call}</span>{" → "}
                <span className={e.tone === "ok" ? "text-success" : e.tone === "error" ? "text-destructive" : e.tone === "warn" ? "text-warning" : "text-foreground"}>{e.result}</span>
              </li>
            ))}
          </ol>
        </section>
      </aside>

      <main className="h-[820px] lg:h-dvh">
        <CoreMSAuthProvider key={`${appKey}-${scenario}-${view}-${runId}`} supabaseClient={client} appKey={appKey}>
          {view === "login" ? (
            <RequireAuth loginProps={{ contained: true }}>
              <SignedInPanel />
            </RequireAuth>
          ) : (
            <SetPasswordScreen contained mode={view} onBackToSignIn={() => setView("login")} />
          )}
        </CoreMSAuthProvider>
      </main>
    </div>
  );
}
