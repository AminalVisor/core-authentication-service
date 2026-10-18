import { useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { getAppMeta } from "./apps";
import type {
  AnySupabaseClient,
  AppKey,
  AuthErrorCode,
  AuthResult,
  CoreMSAuthContextValue,
  CoreMSBranding,
  CoreMSUser,
  ProfileLoader,
  ResolvedBranding,
} from "./types";
import { CoreMSStyles } from "./styles";
import { CoreMSAuthContext } from "./auth-context";

export const DEFAULT_SUPER_ADMIN_ROLES = ["Super Admin"];

export interface CoreMSAuthProviderProps {
  supabaseClient: AnySupabaseClient;
  appKey: AppKey;
  branding?: CoreMSBranding;
  /** Override how the profile/roles are loaded. Defaults to `profiles` table + `get_user_roles` RPC. */
  loadProfile?: ProfileLoader;
  /** Role names treated as Super Admin (in addition to the `is_super_admin` RPC). */
  superAdminRoles?: string[];
  children: ReactNode;
}

export const defaultProfileLoader: ProfileLoader = async (client, userId) => {
  const [profileRes, rolesRes] = await Promise.all([
    client.from("profiles").select("id, username, full_name, role").eq("id", userId).maybeSingle(),
    client.rpc("get_user_roles", { _user_id: userId }),
  ]);
  if (profileRes.error) throw profileRes.error;
  if (isConnectionError(rolesRes.error)) throw rolesRes.error;
  const profile = (profileRes.data ?? null) as Record<string, unknown> | null;
  const roles = Array.isArray(rolesRes.data) ? (rolesRes.data as string[]) : [];
  return {
    profile,
    username: typeof profile?.["username"] === "string" ? (profile["username"] as string) : undefined,
    fullName: typeof profile?.["full_name"] === "string" ? (profile["full_name"] as string) : undefined,
    role: typeof profile?.["role"] === "string" ? (profile["role"] as string) : undefined,
    roles,
  };
};

/** True while the user is on an invite / password-recovery link, where the session must survive the gates. */
export function isPasswordSetupFlow(): boolean {
  if (typeof window === "undefined") return false;
  const { pathname, hash, search } = window.location;
  return (
    pathname.includes("set-password") ||
    pathname.includes("reset-password") ||
    /type=(recovery|invite)/.test(hash) ||
    /type=(recovery|invite)/.test(search)
  );
}

class GateError extends Error {
  constructor(public code: AuthErrorCode, message: string, public retryable = false) {
    super(message);
  }
}

/** Only transport outages are retryable; missing status and authorization errors fail closed. */
function isConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const value = error as { status?: number; message?: string };
  return value.status === 0 || [502, 503, 504].includes(value.status ?? -1) ||
    /failed to fetch|fetch failed|network\s*(error|request failed)|load failed|timed?\s*out|timeout|connection (reset|refused)/i.test(value.message ?? "");
}

export function resolveBranding(appKey: AppKey, overrides?: CoreMSBranding): ResolvedBranding {
  const meta = getAppMeta(appKey);
  return {
    appKey,
    appName: overrides?.appName ?? meta.name,
    title: overrides?.title ?? meta.title,
    subtitle: overrides?.subtitle ?? "Sign in to your workspace.",
    tagline: overrides?.tagline ?? meta.tagline,
    accent: overrides?.accent ?? meta.accent,
    logo: overrides?.logo,
    hideSuiteLogo: overrides?.hideSuiteLogo ?? false,
  };
}

export function CoreMSAuthProvider({
  supabaseClient: supabase,
  appKey,
  branding: brandingOverrides,
  loadProfile = defaultProfileLoader,
  superAdminRoles = DEFAULT_SUPER_ADMIN_ROLES,
  children,
}: CoreMSAuthProviderProps) {
  const [user, setUser] = useState<CoreMSUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<AuthErrorCode | null>(null);
  const inflight = useRef<{ token: string; promise: Promise<CoreMSUser> } | null>(null);
  const mounted = useRef(true);
  const verifiedUser = useRef<CoreMSUser | null>(null);

  const branding = useMemo(() => resolveBranding(appKey, brandingOverrides), [appKey, brandingOverrides]);

  const fail = useCallback((code: AuthErrorCode, message: string) => {
    if (!mounted.current) return;
    setError(message);
    setErrorCode(code);
  }, []);

  /** Company suspension is independent of user activation and cannot be bypassed by roles. */
  const runGates = useCallback(
    async (s: Session): Promise<CoreMSUser> => {
      const uid = s.user.id;
      const company = await supabase.rpc("is_company_active", { _user_id: uid });
      if (company.error || (company.data !== true && company.data !== false))
        throw new GateError("network", "We couldn't verify your company's status. Please try again.", isConnectionError(company.error));
      if (company.data !== true)
        throw new GateError("company_inactive", "Your company's access has been temporarily suspended. Please contact your company administrator.");

      const active = await supabase.rpc("is_user_active", { _user_id: uid });
      if (active.error) throw new GateError("network", "We couldn't verify your account. Please try again.", isConnectionError(active.error));
      if (active.data !== true)
        throw new GateError("inactive", "Your account has been deactivated. Please contact your administrator.");

      const sa = await supabase.rpc("is_super_admin", { _user_id: uid });
      if (isConnectionError(sa.error))
        throw new GateError("network", "We couldn't verify your account. Please try again.", true);
      let isSuperAdmin = sa.data === true;

      let prof: Awaited<ReturnType<ProfileLoader>>;
      try {
        prof = await loadProfile(supabase, uid);
      } catch (e) {
        if (isConnectionError(e)) throw new GateError("network", "We couldn't load your profile. Please try again.", true);
        throw new GateError("profile_error", "We couldn't load your profile. Please contact support.");
      }
      const role = prof.role ?? "User";
      const roles = Array.from(new Set([role, ...(prof.roles ?? [])])).filter(Boolean);
      if (roles.some((r) => superAdminRoles.includes(r))) isSuperAdmin = true;

      if (!isSuperAdmin && !isPasswordSetupFlow()) {
        const access = await supabase.rpc("can_user_access_app", { _app: appKey });
        if (isConnectionError(access.error))
          throw new GateError("network", "We couldn't verify your app access. Please try again.", true);
        if (access.error || access.data !== true)
          throw new GateError(
            "entitlement_denied",
            `Your organisation doesn't have access to ${branding.appName}. Please contact your administrator.`,
          );
      }

      return {
        id: uid,
        email: s.user.email ?? null,
        fullName: prof.fullName,
        username: prof.username ?? s.user.email?.split("@")[0] ?? "User",
        role,
        roles,
        isSuperAdmin,
        profile: prof.profile ?? null,
      };
    },
    [supabase, appKey, branding.appName, loadProfile, superAdminRoles],
  );

  const hydrate = useCallback(
    (s: Session): Promise<CoreMSUser> => {
      if (inflight.current?.token === s.access_token) return inflight.current.promise;
      const promise = runGates(s).catch((e: unknown) => {
        if (isConnectionError(e)) throw new GateError("network", "Connection interrupted. Please try again.", true);
        throw e;
      });
      inflight.current = { token: s.access_token, promise };
      promise.then(
        (u) => {
          if (!mounted.current || inflight.current?.promise !== promise) return;
          setSession(s);
          // Password links authorize password changes, not entry to the protected app.
          verifiedUser.current = isPasswordSetupFlow() ? null : u;
          setUser(verifiedUser.current);
          setError(null);
          setErrorCode(null);
        },
        async (e: unknown) => {
          if (!mounted.current || inflight.current?.promise !== promise) return;
          inflight.current = null;
          const ge = e instanceof GateError ? e : new GateError("unknown", "Sign-in failed. Please try again.");
          fail(ge.code, ge.message);
          // Keep invite/recovery sessions alive so the user can still set their password.
          if (isPasswordSetupFlow()) {
            if (mounted.current) {
              setUser(null);
              verifiedUser.current = null;
              setSession(s);
            }
            return;
          }
          // Retain only previously verified access for the same identity during transport outages.
          // Explicit denials, malformed responses and initial hydration still fail closed.
          if (ge.retryable && verifiedUser.current?.id === s.user.id) {
            setSession(s);
            return;
          }
          verifiedUser.current = null;
          await supabase.auth.signOut();
          if (mounted.current) {
            setUser(null);
            setSession(null);
          }
        },
      );
      return promise;
    },
    [runGates, fail, supabase],
  );

  useEffect(() => {
    mounted.current = true;
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_OUT" || !s) {
        inflight.current = null;
        verifiedUser.current = null;
        setUser(null);
        setSession(null);
        return;
      }
      // Recheck company status on refreshed sessions instead of retaining stale authorization.
      // Defer so we never call Supabase inside the auth callback (avoids deadlocks).
      setTimeout(() => void hydrate(s).catch(() => undefined), 0);
    });
    const revalidate = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      inflight.current = null;
      void supabase.auth.getSession().then(({ data }) => {
        if (data.session) void hydrate(data.session).catch(() => undefined);
      }).catch(() => undefined);
    };
    const timer = setInterval(revalidate, 60_000);
    window.addEventListener("focus", revalidate);
    window.addEventListener("online", revalidate);
    document.addEventListener("visibilitychange", revalidate);
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (data.session) await hydrate(data.session).catch(() => undefined);
      })
      .finally(() => mounted.current && setLoading(false));
    return () => {
      mounted.current = false;
      clearInterval(timer);
      window.removeEventListener("focus", revalidate);
      window.removeEventListener("online", revalidate);
      document.removeEventListener("visibilitychange", revalidate);
      sub.subscription.unsubscribe();
    };
  }, [supabase, hydrate]);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      setError(null);
      setErrorCode(null);
      const { data, error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err || !data.session) {
        const msg = /invalid/i.test(err?.message ?? "") ? "Incorrect email or password." : err?.message ?? "Sign-in failed.";
        fail("invalid_credentials", msg);
        return { success: false, error: msg, code: "invalid_credentials" };
      }
      try {
        await hydrate(data.session);
        return { success: true };
      } catch (e) {
        const ge = e instanceof GateError ? e : new GateError("unknown", "Sign-in failed.");
        return { success: false, error: ge.message, code: ge.code };
      }
    },
    [supabase, hydrate, fail],
  );

  const logout = useCallback(async () => {
    inflight.current = null;
    verifiedUser.current = null;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, [supabase]);

  const refreshUser = useCallback(async () => {
    if (!session) return;
    inflight.current = null;
    await hydrate(session).catch(() => undefined);
  }, [session, hydrate]);

  const requestPasswordReset = useCallback(
    async (email: string, redirectTo?: string): Promise<AuthResult> => {
      const target = redirectTo ?? (typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined);
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), target ? { redirectTo: target } : undefined);
      return err ? { success: false, error: err.message, code: "unknown" } : { success: true };
    },
    [supabase],
  );

  const updatePassword = useCallback(
    async (password: string): Promise<AuthResult> => {
      const { error: err } = await supabase.auth.updateUser({ password });
      return err ? { success: false, error: err.message, code: "unknown" } : { success: true };
    },
    [supabase],
  );

  const value = useMemo<CoreMSAuthContextValue>(
    () => ({
      appKey,
      branding,
      supabase,
      user,
      session,
      loading,
      error,
      errorCode,
      isAuthenticated: !!user,
      isSuperAdmin: !!user?.isSuperAdmin,
      login,
      logout,
      refreshUser,
      clearError: () => {
        setError(null);
        setErrorCode(null);
      },
      hasRole: (r) => !!user?.roles.includes(r),
      hasAnyRole: (rs) => !!user && rs.some((r) => user.roles.includes(r)),
      requestPasswordReset,
      updatePassword,
    }),
    [appKey, branding, supabase, user, session, loading, error, errorCode, login, logout, refreshUser, requestPasswordReset, updatePassword],
  );

  return (
    <CoreMSAuthContext.Provider value={value}>
      <CoreMSStyles />
      {children}
    </CoreMSAuthContext.Provider>
  );
}

/** Like useCoreMSAuth but returns undefined outside a provider. */
export function useOptionalCoreMSAuth(): CoreMSAuthContextValue | undefined {
  return useContext(CoreMSAuthContext);
}

export function useCoreMSAuth(): CoreMSAuthContextValue {
  const ctx = useContext(CoreMSAuthContext);
  if (!ctx) throw new Error("useCoreMSAuth must be used inside <CoreMSAuthProvider>");
  return ctx;
}
