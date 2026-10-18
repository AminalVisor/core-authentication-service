import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CoreMSAuthProvider, useCoreMSAuth, type CoreMSAuthContextValue } from "@/lib";
import { createMockSupabase, type Scenario } from "@/pages/mockSupabase";

vi.mock("@/lib/styles", () => ({ CoreMSStyles: () => null }));
afterEach(() => { cleanup(); window.history.replaceState({}, "", "/"); });

async function setup(scenario: Scenario = "success") {
  const client = createMockSupabase({ scenario, appKey: "fuel", latency: 0, onLog: () => {} });
  const originalRpc = client.rpc.bind(client);
  const rpc = vi.spyOn(client, "rpc");
  const signOut = vi.spyOn(client.auth, "signOut");
  const subscribe = client.auth.onAuthStateChange.bind(client.auth);
  let notify: Parameters<typeof client.auth.onAuthStateChange>[0] | undefined;
  vi.spyOn(client.auth, "onAuthStateChange").mockImplementation((callback) => {
    notify = callback;
    return subscribe(callback);
  });
  let context: CoreMSAuthContextValue | undefined;
  function Probe() { context = useCoreMSAuth(); return null; }
  render(<CoreMSAuthProvider supabaseClient={client} appKey="fuel"><Probe /></CoreMSAuthProvider>);
  await waitFor(() => expect(context?.loading).toBe(false));
  const current = () => { if (!context) throw new Error("Missing provider"); return context; };
  const login = async () => {
    let result;
    await act(async () => { result = await current().login("member@example.com", "password"); });
    return result;
  };
  return { client, rpc, originalRpc, signOut, current, login, notify: (...args: Parameters<NonNullable<typeof notify>>) => notify?.(...args) };
}

describe("Company authorization", () => {
  it.each(["is_company_active", "is_user_active", "is_super_admin", "get_user_roles", "can_user_access_app"])("keeps a verified session during a temporary %s connection failure and retries", async (fn) => {
    const s = await setup();
    await s.login();
    const user = s.current().user;
    s.rpc.mockImplementation((name, args) => name === fn
      ? Promise.resolve({ data: null, error: { message: "TypeError: Failed to fetch", status: 0 } }) as unknown as ReturnType<typeof s.originalRpc>
      : s.originalRpc(name, args));
    act(() => window.dispatchEvent(new Event("focus")));
    await waitFor(() => expect(s.current().errorCode).toBe("network"));
    expect(s.current().user).toBe(user);
    expect(s.current().session).not.toBeNull();
    expect(s.signOut).not.toHaveBeenCalled();
    s.rpc.mockImplementation(s.originalRpc);
    act(() => window.dispatchEvent(new Event("online")));
    await waitFor(() => expect(s.current().errorCode).toBeNull());
    expect(s.current().isAuthenticated).toBe(true);
  });
  it("keeps the refreshed token when a verified user's recheck loses connection", async () => {
    const s = await setup();
    await s.login();
    const session = s.current().session;
    if (!session) throw new Error("Missing verified session");
    s.rpc.mockRejectedValue(new TypeError("Failed to fetch"));
    act(() => s.notify("TOKEN_REFRESHED", { ...session, access_token: "refreshed-token" }));
    await waitFor(() => expect(s.current().errorCode).toBe("network"));
    expect(s.current().session?.access_token).toBe("refreshed-token");
    expect(s.current().isAuthenticated).toBe(true);
    expect(s.signOut).not.toHaveBeenCalled();
  });
  it("does not grant initial access during a connection failure", async () => {
    const s = await setup();
    s.rpc.mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await s.login()).toMatchObject({ success: false, code: "network" });
    await waitFor(() => expect(s.signOut).toHaveBeenCalled());
    expect(s.current().isAuthenticated).toBe(false);
  });
  it.each([ ["is_user_active", "inactive"], ["can_user_access_app", "entitlement_denied"] ])("still revokes verified access when %s explicitly denies access", async (fn, code) => {
    const s = await setup();
    await s.login();
    s.rpc.mockImplementation((name, args) => name === fn
      ? Promise.resolve({ data: false, error: null }) as unknown as ReturnType<typeof s.originalRpc>
      : s.originalRpc(name, args));
    act(() => window.dispatchEvent(new Event("focus")));
    await waitFor(() => expect(s.current().isAuthenticated).toBe(false));
    expect(s.current().errorCode).toBe(code);
    expect(s.signOut).toHaveBeenCalled();
  });
  it("never retains verified access for a different identity during a connection failure", async () => {
    const s = await setup();
    await s.login();
    const session = s.current().session;
    if (!session) throw new Error("Missing verified session");
    s.rpc.mockRejectedValue(new TypeError("Failed to fetch"));
    act(() => s.notify("SIGNED_IN", { ...session, access_token: "different-user-token", user: { ...session.user, id: "different-user" } }));
    await waitFor(() => expect(s.current().isAuthenticated).toBe(false));
    expect(s.signOut).toHaveBeenCalled();
  });
  it("still fails closed if a verified user's company status is missing", async () => {
    const s = await setup();
    await s.login();
    s.rpc.mockImplementation((fn, args) => fn === "is_company_active"
      ? Promise.resolve({ data: null, error: null }) as unknown as ReturnType<typeof s.originalRpc>
      : s.originalRpc(fn, args));
    act(() => window.dispatchEvent(new Event("focus")));
    await waitFor(() => expect(s.current().isAuthenticated).toBe(false));
    expect(s.signOut).toHaveBeenCalled();
  });
  it("revokes company suspension on the next successful check after a connection failure", async () => {
    const s = await setup();
    await s.login();
    s.rpc.mockRejectedValue(new TypeError("Failed to fetch"));
    act(() => window.dispatchEvent(new Event("focus")));
    await waitFor(() => expect(s.current().errorCode).toBe("network"));
    s.rpc.mockImplementation((fn, args) => fn === "is_company_active"
      ? Promise.resolve({ data: false, error: null }) as unknown as ReturnType<typeof s.originalRpc>
      : s.originalRpc(fn, args));
    act(() => window.dispatchEvent(new Event("online")));
    await waitFor(() => expect(s.current().isAuthenticated).toBe(false));
    expect(s.current().errorCode).toBe("company_inactive");
    expect(s.signOut).toHaveBeenCalled();
  });
  it("allows an active user at an active company with app entitlement", async () => {
    const s = await setup();
    expect(await s.login()).toEqual({ success: true });
    expect(s.current().isAuthenticated).toBe(true);
    expect(s.rpc).toHaveBeenCalledWith("is_company_active", { _user_id: "00000000-0000-4000-8000-000000000001" });
  });
  it("blocks an active user at an inactive company without modifying the user record", async () => {
    const s = await setup("company_inactive");
    const update = vi.spyOn(s.client.auth, "updateUser");
    expect(await s.login()).toMatchObject({ success: false, code: "company_inactive" });
    await waitFor(() => expect(s.signOut).toHaveBeenCalled());
    expect(s.current().isAuthenticated).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });
  it("fails closed when company verification is unavailable", async () => {
    const s = await setup("company_error");
    expect(await s.login()).toMatchObject({ success: false, code: "network" });
    await waitFor(() => expect(s.signOut).toHaveBeenCalled());
  });
  it("fails closed on missing company status", async () => {
    const s = await setup();
    const original = s.originalRpc;
    s.rpc.mockImplementation((fn, args) => fn === "is_company_active"
      ? Promise.resolve({ data: null, error: null }) as unknown as ReturnType<typeof original>
      : original(fn, args));
    expect(await s.login()).toMatchObject({ success: false, code: "network" });
  });
  it("does not let Super Admin roles bypass company suspension", async () => {
    const s = await setup("superadmin");
    const original = s.originalRpc;
    s.rpc.mockImplementation((fn, args) => fn === "is_company_active"
      ? Promise.resolve({ data: false, error: null }) as unknown as ReturnType<typeof original>
      : original(fn, args));
    expect(await s.login()).toMatchObject({ success: false, code: "company_inactive" });
  });
  it("an active company does not override individual inactivity", async () => {
    const s = await setup("inactive");
    expect(await s.login()).toMatchObject({ success: false, code: "inactive" });
    expect(s.current().isAuthenticated).toBe(false);
  });
  it("restores eligibility after company reactivation without changing user activation", async () => {
    const s = await setup();
    let companyActive = false;
    s.rpc.mockImplementation((fn, args) => fn === "is_company_active"
      ? Promise.resolve({ data: companyActive, error: null }) as unknown as ReturnType<typeof s.originalRpc>
      : s.originalRpc(fn, args));
    expect(await s.login()).toMatchObject({ success: false, code: "company_inactive" });
    companyActive = true;
    expect(await s.login()).toEqual({ success: true });
    expect(s.current().isAuthenticated).toBe(true);
  });
  it("revokes an existing session on foreground revalidation after company suspension", async () => {
    const s = await setup();
    expect(await s.login()).toEqual({ success: true });
    const original = s.originalRpc;
    s.rpc.mockImplementation((fn, args) => fn === "is_company_active"
      ? Promise.resolve({ data: false, error: null }) as unknown as ReturnType<typeof original>
      : original(fn, args));
    act(() => window.dispatchEvent(new Event("focus")));
    await waitFor(() => expect(s.current().isAuthenticated).toBe(false));
    expect(s.signOut).toHaveBeenCalled();
  });
  it("preserves reset sessions without granting protected app access to a suspended company", async () => {
    window.history.replaceState({}, "", "/reset-password");
    const s = await setup("company_inactive");
    expect(await s.login()).toMatchObject({ success: false, code: "company_inactive" });
    expect(s.current().session).not.toBeNull();
    expect(s.current().isAuthenticated).toBe(false);
    expect(s.signOut).not.toHaveBeenCalled();
  });
});