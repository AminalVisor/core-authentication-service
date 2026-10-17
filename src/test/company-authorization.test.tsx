import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CoreMSAuthProvider, useCoreMSAuth, type CoreMSAuthContextValue } from "@/lib";
import { createMockSupabase, type Scenario } from "@/pages/mockSupabase";

afterEach(() => { cleanup(); window.history.replaceState({}, "", "/"); });

async function setup(scenario: Scenario = "success") {
  const client = createMockSupabase({ scenario, appKey: "fuel", latency: 0, onLog: () => {} });
  const rpc = vi.spyOn(client, "rpc");
  const signOut = vi.spyOn(client.auth, "signOut");
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
  return { client, rpc, signOut, current, login };
}

describe("Company authorization", () => {
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
    const original = s.client.rpc.bind(s.client);
    s.rpc.mockImplementation((fn, args) => fn === "is_company_active"
      ? Promise.resolve({ data: null, error: null }) as ReturnType<typeof original>
      : original(fn, args));
    expect(await s.login()).toMatchObject({ success: false, code: "network" });
  });
  it("does not let Super Admin roles bypass company suspension", async () => {
    const s = await setup("superadmin");
    const original = s.client.rpc.bind(s.client);
    s.rpc.mockImplementation((fn, args) => fn === "is_company_active"
      ? Promise.resolve({ data: false, error: null }) as ReturnType<typeof original>
      : original(fn, args));
    expect(await s.login()).toMatchObject({ success: false, code: "company_inactive" });
  });
  it("reactivation restores eligibility without overriding individual inactivity", async () => {
    const s = await setup("inactive");
    expect(await s.login()).toMatchObject({ success: false, code: "inactive" });
    expect(s.rpc).not.toHaveBeenCalledWith("is_company_active", expect.anything());
  });
  it("revokes an existing session on foreground revalidation after company suspension", async () => {
    const s = await setup();
    expect(await s.login()).toEqual({ success: true });
    const original = s.client.rpc.bind(s.client);
    s.rpc.mockImplementation((fn, args) => fn === "is_company_active"
      ? Promise.resolve({ data: false, error: null }) as ReturnType<typeof original>
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