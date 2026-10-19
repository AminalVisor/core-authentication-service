import { describe, it, expect, vi } from "vitest";
import { buildTelemetryPayload, reportTelemetry, COREMS_AUTH_VERSION } from "@/lib/telemetry";

const client = (rpc = vi.fn()) => ({ rpc, headers: { "X-Client-Info": "supabase-js-web/2.45.1" } }) as never;

describe("telemetry", () => {
  it("builds payload with app key, auth version and supabase-js version", () => {
    const p = buildTelemetryPayload(client(), { appKey: "fuel", appVersion: "1.4.0", offlineSchemaVersion: 3 });
    expect(p.p_app_key).toBe("fuel");
    expect(p.p_auth_version).toBe(COREMS_AUTH_VERSION);
    expect(p.p_app_version).toBe("1.4.0");
    expect(p.p_offline_schema).toBe(3);
    expect(p.p_supabase_js).toBe("2.45.1");
  });
  it("persists the same device id across calls", () => {
    const a = buildTelemetryPayload(client(), { appKey: "ctrl" }).p_device_id;
    expect(a).toBeTruthy();
    expect(localStorage.getItem("corems_device_id")).toBe(a);
    expect(buildTelemetryPayload(client(), { appKey: "ctrl" }).p_device_id).toBe(a);
  });
  it("swallows RPC failures", async () => {
    await expect(reportTelemetry(client(vi.fn().mockRejectedValue(new Error("x"))), { appKey: "mech" })).resolves.toBeUndefined();
  });
});
