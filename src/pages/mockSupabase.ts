import type { Session } from "@supabase/supabase-js";
import type { AnySupabaseClient, AppKey } from "@/lib";

export type Scenario = "success" | "inactive" | "entitlement" | "superadmin" | "invalid";

export interface MockLogEntry {
  at: number;
  call: string;
  result: string;
  tone: "ok" | "warn" | "error" | "info";
}

type Listener = (event: string, session: Session | null) => void;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** In-memory stand-in for a Supabase client that simulates CoreMS auth scenarios. */
export function createMockSupabase(opts: {
  scenario: Scenario;
  appKey: AppKey;
  onLog: (e: MockLogEntry) => void;
  latency?: number;
  /** Start with a recovery/invite session (for the Set Password demo). */
  recoverySession?: boolean;
}): AnySupabaseClient {
  const { scenario, onLog, latency = 450 } = opts;
  const listeners = new Set<Listener>();
  const log = (call: string, result: string, tone: MockLogEntry["tone"] = "info") => onLog({ at: Date.now(), call, result, tone });
  const makeSession = (email: string): Session =>
    ({
      access_token: `mock-${Math.random().toString(36).slice(2)}`,
      refresh_token: "mock-refresh",
      expires_in: 3600,
      token_type: "bearer",
      user: { id: "00000000-0000-4000-8000-000000000001", email, aud: "authenticated", app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() },
    }) as unknown as Session;

  let session: Session | null = opts.recoverySession ? makeSession("invited.user@coremining.co.za") : null;
  const emit = (event: string) => listeners.forEach((l) => l(event, session));

  const rpc = async (fn: string, args?: Record<string, unknown>) => {
    await wait(latency / 2);
    const argStr = JSON.stringify(args ?? {});
    switch (fn) {
      case "is_user_active": {
        const v = scenario !== "inactive";
        log(`rpc is_user_active(${argStr})`, String(v), v ? "ok" : "error");
        return { data: v, error: null };
      }
      case "is_super_admin": {
        const v = scenario === "superadmin";
        log(`rpc is_super_admin(${argStr})`, String(v), v ? "warn" : "info");
        return { data: v, error: null };
      }
      case "can_user_access_app": {
        const v = scenario === "success";
        log(`rpc can_user_access_app(${argStr})`, String(v), v ? "ok" : "error");
        return { data: v, error: null };
      }
      case "get_user_roles": {
        const roles = scenario === "superadmin" ? ["Super Admin"] : ["Supervisor", "Operator"];
        log(`rpc get_user_roles(${argStr})`, JSON.stringify(roles));
        return { data: roles, error: null };
      }
      default:
        log(`rpc ${fn}`, "unknown function", "error");
        return { data: null, error: { message: `Unknown RPC ${fn}` } };
    }
  };

  const client = {
    rpc,
    from: (table: string) => ({
      select: () => ({
        eq: (_col: string, id: string) => ({
          maybeSingle: async () => {
            await wait(latency / 3);
            const row = {
              id,
              username: scenario === "superadmin" ? "Thandi Admin" : "Pieter Supervisor",
              role: scenario === "superadmin" ? "Super Admin" : "Supervisor",
            };
            log(`from(${table}).select().eq(id)`, row.username);
            return { data: row, error: null };
          },
        }),
      }),
    }),
    auth: {
      getSession: async () => {
        log("auth.getSession()", session ? "session present" : "no session");
        return { data: { session }, error: null };
      },
      onAuthStateChange: (cb: Listener) => {
        listeners.add(cb);
        setTimeout(() => cb("INITIAL_SESSION", session), 0);
        return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
      },
      signInWithPassword: async ({ email }: { email: string; password: string }) => {
        await wait(latency);
        if (scenario === "invalid") {
          log(`auth.signInWithPassword(${email})`, "Invalid login credentials", "error");
          return { data: { session: null, user: null }, error: { message: "Invalid login credentials" } };
        }
        session = makeSession(email);
        log(`auth.signInWithPassword(${email})`, "session issued", "ok");
        emit("SIGNED_IN");
        return { data: { session, user: session.user }, error: null };
      },
      signOut: async () => {
        session = null;
        log("auth.signOut()", "signed out", "warn");
        emit("SIGNED_OUT");
        return { error: null };
      },
      resetPasswordForEmail: async (email: string, o?: { redirectTo?: string }) => {
        await wait(latency);
        log(`auth.resetPasswordForEmail(${email})`, `redirect → ${o?.redirectTo ?? "default"}`, "ok");
        return { data: {}, error: null };
      },
      updateUser: async ({ password }: { password?: string }) => {
        await wait(latency);
        log("auth.updateUser({ password })", `${password?.length ?? 0} chars saved`, "ok");
        emit("USER_UPDATED");
        return { data: { user: session?.user ?? null }, error: null };
      },
      exchangeCodeForSession: async () => ({ data: { session }, error: null }),
      verifyOtp: async () => ({ data: { session }, error: null }),
    },
  };
  return client as unknown as AnySupabaseClient;
}
