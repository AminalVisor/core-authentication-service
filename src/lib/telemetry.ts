import type { AnySupabaseClient, AppKey } from "./types";

/** Current version of @corems/auth. Keep in sync with package.json. */
export const COREMS_AUTH_VERSION = "0.2.2";

const DEVICE_KEY = "corems_device_id";

export function getDeviceId(): string | undefined {
  try {
    if (typeof localStorage === "undefined") return undefined;
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id && typeof crypto !== "undefined" && "randomUUID" in crypto) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id ?? undefined;
  } catch {
    return undefined;
  }
}

export function detectSupabaseJsVersion(client: AnySupabaseClient): string {
  const c = client as unknown as { headers?: Record<string, string>; rest?: { headers?: Record<string, string> } };
  const info = c.headers?.["X-Client-Info"] ?? c.rest?.headers?.["X-Client-Info"];
  const match = typeof info === "string" ? /(\d+\.\d+\.\d+[\w.-]*)/.exec(info) : null;
  return match?.[1] ?? "2.x";
}

export interface TelemetryOptions {
  appKey: AppKey;
  appVersion?: string | undefined;
  swVersion?: string | undefined;
  offlineSchemaVersion?: number | undefined;
}

export function buildTelemetryPayload(client: AnySupabaseClient, o: TelemetryOptions) {
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  return {
    p_app_key: o.appKey,
    p_auth_version: COREMS_AUTH_VERSION,
    p_app_version: o.appVersion ?? null,
    p_sw_version: o.swVersion ?? null,
    p_sw_active: !!nav && "serviceWorker" in nav && Boolean(nav.serviceWorker.controller),
    p_offline_schema: o.offlineSchemaVersion ?? null,
    p_supabase_js: detectSupabaseJsVersion(client),
    p_platform: nav?.userAgent ?? null,
    p_device_id: getDeviceId() ?? null,
  };
}

/** Fire-and-forget: telemetry failures never affect authentication. */
export async function reportTelemetry(client: AnySupabaseClient, o: TelemetryOptions): Promise<void> {
  try {
    await client.rpc("record_app_telemetry", buildTelemetryPayload(client, o));
  } catch {
    /* ignore */
  }
}
