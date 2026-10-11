import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { useCoreMSAuth } from "./CoreMSAuthProvider";
import { Alert, AuthShell, CardHeader, EyeIcon, EyeOffIcon, Spinner } from "./ui";
import type { AuthErrorCode } from "./types";

export interface LoginScreenProps {
  /** Called after a successful, fully gated sign-in. */
  onSuccess?: () => void;
  /** Where password-reset emails should send users. Default: `${origin}/reset-password`. */
  resetRedirectTo?: string;
  /** Render inside a parent box instead of filling the viewport. */
  contained?: boolean;
  /** Hide the large-screen marketing column. */
  hideHero?: boolean;
  heroHeadline?: ReactNode;
  footer?: ReactNode;
}

const ERROR_TITLES: Partial<Record<AuthErrorCode, string>> = {
  invalid_credentials: "Sign-in failed",
  inactive: "Account deactivated",
  entitlement_denied: "Access not enabled",
  rate_limited: "Too many attempts",
  profile_error: "Profile unavailable",
};

const MAX_ATTEMPTS = 5;
const LOCK_MS = 30_000;

export function LoginScreen({ onSuccess, resetRedirectTo, contained, hideHero, heroHeadline, footer }: LoginScreenProps) {
  const { branding, login, error, errorCode, clearError, requestPasswordReset } = useCoreMSAuth();
  const ids = useId();
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (lockedUntil <= now) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [lockedUntil, now]);

  const locked = lockedUntil > now;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (locked || busy) return;
    setBusy(true);
    setNotice(null);
    const res = await login(email, password);
    setBusy(false);
    if (res.success) {
      setAttempts(0);
      setPassword("");
      onSuccess?.();
      return;
    }
    if (res.code === "invalid_credentials") {
      const n = attempts + 1;
      setAttempts(n);
      if (n >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCK_MS);
        setNow(Date.now());
        setAttempts(0);
      }
    }
  };

  const sendReset = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    const res = await requestPasswordReset(email, resetRedirectTo);
    setBusy(false);
    if (res.success) {
      setNotice(`If an account exists for ${email.trim()}, a reset link is on its way.`);
      setMode("login");
    } else setNotice(null);
  };

  const shownError = locked
    ? { code: "rate_limited" as const, msg: `Please wait ${Math.ceil((lockedUntil - now) / 1000)}s before trying again.` }
    : error
      ? { code: errorCode ?? "unknown", msg: error }
      : null;

  return (
    <AuthShell branding={branding} {...(contained !== undefined && { contained })} hero={!hideHero} heroHeadline={heroHeadline}>
      <main className="cms-card" aria-labelledby={`${ids}-title`}>
        <CardHeader
          branding={branding}
          title={mode === "login" ? branding.title : "Reset your password"}
          subtitle={mode === "login" ? branding.subtitle : "Enter your email and we'll send you a secure reset link."}
        />
        <span id={`${ids}-title`} className="cms-sr">{branding.appName} sign in</span>
        <div className="cms-card-body">
          {notice && <Alert tone="ok" title="Check your inbox">{notice}</Alert>}
          {mode === "login" && shownError && (
            <Alert tone="error" title={ERROR_TITLES[shownError.code as AuthErrorCode] ?? "Something went wrong"}>{shownError.msg}</Alert>
          )}

          {mode === "login" ? (
            <form className="cms-form" onSubmit={submit} noValidate={false}>
              <div className="cms-field">
                <label className="cms-label" htmlFor={`${ids}-email`}>Email address</label>
                <input
                  id={`${ids}-email`} className="cms-input" type="email" inputMode="email" autoComplete="email" required maxLength={320}
                  placeholder="name@company.com" value={email} disabled={busy}
                  onChange={(e) => { setEmail(e.target.value.trim()); if (error) clearError(); }}
                />
              </div>
              <div className="cms-field">
                <label className="cms-label" htmlFor={`${ids}-pw`}>Password</label>
                <div className="cms-input-wrap">
                  <input
                    id={`${ids}-pw`} className="cms-input cms-has-toggle" type={reveal ? "text" : "password"} autoComplete="current-password"
                    required maxLength={128} placeholder="Enter your password" value={password} disabled={busy}
                    onChange={(e) => { setPassword(e.target.value); if (error) clearError(); }}
                  />
                  <button
                    type="button" className="cms-reveal" onClick={() => setReveal((v) => !v)}
                    aria-label={reveal ? "Hide password" : "Show password"} aria-pressed={reveal} aria-controls={`${ids}-pw`}
                  >
                    {reveal ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
              <button type="submit" className="cms-btn" disabled={busy || locked || !email || !password}>
                {busy ? <><Spinner /> Signing in…</> : "Sign in"}
              </button>
              <div className="cms-row">
                <button type="button" className="cms-link" onClick={() => { clearError(); setNotice(null); setMode("forgot"); }}>
                  Forgot password?
                </button>
              </div>
            </form>
          ) : (
            <form className="cms-form" onSubmit={sendReset}>
              <div className="cms-field">
                <label className="cms-label" htmlFor={`${ids}-remail`}>Email address</label>
                <input
                  id={`${ids}-remail`} className="cms-input" type="email" autoComplete="email" required
                  placeholder="name@company.com" value={email} disabled={busy} onChange={(e) => setEmail(e.target.value.trim())}
                />
              </div>
              <button type="submit" className="cms-btn" disabled={busy || !email}>
                {busy ? <><Spinner /> Sending…</> : "Send reset link"}
              </button>
              <button type="button" className="cms-btn cms-btn-ghost" onClick={() => setMode("login")}>Back to sign in</button>
            </form>
          )}
          <div className="cms-footer">{footer ?? <>Access is managed by your CoreMS administrator.</>}</div>
        </div>
      </main>
    </AuthShell>
  );
}
