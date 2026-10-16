import { useEffect, useId, useState, type FormEvent } from "react";
import { resolveBranding, useOptionalCoreMSAuth } from "./CoreMSAuthProvider";
import type { AnySupabaseClient, AppKey, CoreMSBranding } from "./types";
import { Alert, AuthShell, CardHeader, EyeIcon, EyeOffIcon, Spinner } from "./ui";

export interface SetPasswordScreenProps {
  /** "set" for invite links, "reset" for password recovery. Auto-detected from the URL when omitted. */
  mode?: "set" | "reset";
  /** Called after the password is saved (the user is signed out first). */
  onComplete?: () => void;
  onBackToSignIn?: () => void;
  minLength?: number;
  contained?: boolean;
  /** Use when rendering outside <CoreMSAuthProvider>. */
  supabaseClient?: AnySupabaseClient;
  /** Branding overrides; falls back to the provider's branding. */
  branding?: CoreMSBranding;
  /** App key for standalone branding (defaults to the provider's, else "ctrl"). */
  appKey?: AppKey;
}

type LinkState = "verifying" | "ready" | "invalid" | "done";

function detectMode(): "set" | "reset" {
  if (typeof window === "undefined") return "set";
  const all = window.location.hash + window.location.search;
  return /type=recovery/.test(all) ? "reset" : "set";
}

export function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

export function SetPasswordScreen({ mode: modeProp, onComplete, onBackToSignIn, minLength = 8, contained, supabaseClient, branding: brandingProp, appKey }: SetPasswordScreenProps) {
  const ctx = useOptionalCoreMSAuth();
  const supabase = supabaseClient ?? ctx?.supabase;
  if (!supabase) throw new Error("SetPasswordScreen needs a supabaseClient prop or a <CoreMSAuthProvider>");
  const branding =
    brandingProp || !ctx ? resolveBranding(appKey ?? ctx?.appKey ?? "ctrl", { ...(ctx ? {} : {}), ...brandingProp }) : ctx.branding;
  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return error ? { success: false, error: error.message } : { success: true as const, error: undefined };
  };
  const ids = useId();
  const [mode, setMode] = useState<"set" | "reset">(modeProp ?? "set");
  const [state, setState] = useState<LinkState>("verifying");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!modeProp) setMode(detectMode());
    let cancelled = false;
    const ready = () => !cancelled && setState((s) => (s === "done" ? s : "ready"));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION")) ready();
    });

    (async () => {
      const url = typeof window !== "undefined" ? new URL(window.location.href) : null;
      const hash = new URLSearchParams(url?.hash.replace(/^#/, "") ?? "");
      const errDesc = hash.get("error_description") ?? url?.searchParams.get("error_description");
      if (errDesc) {
        setLinkError(errDesc.replace(/\+/g, " "));
        setState("invalid");
        return;
      }
      const code = url?.searchParams.get("code");
      const tokenHash = url?.searchParams.get("token_hash");
      const type = url?.searchParams.get("type");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) { setLinkError(error.message); setState("invalid"); return; }
      } else if (tokenHash && (type === "invite" || type === "recovery" || type === "email")) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
        if (error) { setLinkError(error.message); setState("invalid"); return; }
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) ready();
      else setTimeout(() => !cancelled && setState((s) => (s === "verifying" ? "invalid" : s)), 4000);
    })();

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [supabase, modeProp]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (pw.length < minLength) return setFormError(`Use at least ${minLength} characters.`);
    if (pw !== pw2) return setFormError("The two passwords don't match.");
    setBusy(true);
    const res = await updatePassword(pw);
    if (!res.success) {
      setBusy(false);
      return setFormError(res.error ?? "Could not save your password.");
    }
    await supabase.auth.signOut();
    setBusy(false);
    setState("done");
    onComplete?.();
  };

  const title = mode === "reset" ? "Reset your password" : "Set your password";
  const score = strength(pw);

  return (
    <AuthShell branding={branding} {...(contained !== undefined && { contained })} hero={false}>
      <main className="cms-card">
        <CardHeader
          branding={branding}
          title={title}
          subtitle={mode === "reset" ? "Choose a new password for your account." : `Welcome to ${branding.appName}. Create a password to activate your account.`}
        />
        <div className="cms-card-body">
          {state === "verifying" && (
            <div className="cms-center" role="status"><Spinner size={24} />Verifying your link…</div>
          )}
          {state === "invalid" && (
            <Alert tone="error" title="Link expired or invalid">
              {linkError ?? "This link is no longer valid."} Request a new one from the sign-in page.
            </Alert>
          )}
          {state === "done" && (
            <Alert tone="ok" title="Password saved">Please sign in with your new password.</Alert>
          )}
          {state === "ready" && (
            <form className="cms-form" onSubmit={submit}>
              {formError && <Alert tone="error">{formError}</Alert>}
              <div className="cms-field">
                <label className="cms-label" htmlFor={`${ids}-pw`}>New password</label>
                <div className="cms-input-wrap">
                  <input
                    id={`${ids}-pw`} className="cms-input cms-has-toggle" type={reveal ? "text" : "password"} autoComplete="new-password"
                    required minLength={minLength} maxLength={128} value={pw} disabled={busy} onChange={(e) => setPw(e.target.value)}
                    aria-describedby={`${ids}-hint`}
                  />
                  <button type="button" className="cms-reveal" onClick={() => setReveal((v) => !v)} aria-label={reveal ? "Hide passwords" : "Show passwords"} aria-pressed={reveal}>
                    {reveal ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                <div className="cms-meter" aria-hidden="true">
                  {[0, 1, 2, 3].map((i) => <span key={i} className={i < score ? "on" : ""} />)}
                </div>
                <p id={`${ids}-hint`} className="cms-hint">At least {minLength} characters. Mix cases, numbers and symbols for a stronger password.</p>
              </div>
              <div className="cms-field">
                <label className="cms-label" htmlFor={`${ids}-pw2`}>Confirm password</label>
                <input
                  id={`${ids}-pw2`} className="cms-input" type={reveal ? "text" : "password"} autoComplete="new-password"
                  required maxLength={128} value={pw2} disabled={busy} onChange={(e) => setPw2(e.target.value)}
                />
              </div>
              <button type="submit" className="cms-btn" disabled={busy || !pw || !pw2}>
                {busy ? <><Spinner /> Saving…</> : "Save password"}
              </button>
            </form>
          )}
          {onBackToSignIn && (
            <div className="cms-row" style={{ marginTop: 8 }}>
              <button type="button" className="cms-link" onClick={onBackToSignIn}>Back to sign in</button>
            </div>
          )}
        </div>
      </main>
    </AuthShell>
  );
}
