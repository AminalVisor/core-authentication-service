# @corems/auth — Integration Manual

How to add the shared CoreMS sign-in to a new app, migrate an existing app, and release updates.

## 1. Backend requirements

Every app on the shared backend needs these Postgres RPCs. They run on every login and session restore:

| RPC | Returns | Purpose |
| --- | --- | --- |
| `is_company_active(_user_id uuid)` | `boolean` | Mandatory company gate; missing/inactive companies block all users, including Super Admins |
| `is_user_active(_user_id uuid)` | `boolean` | Inactive accounts are blocked and signed out |
| `is_super_admin(_user_id uuid)` | `boolean` | Super Admins bypass app entitlements |
| `can_user_access_app(_app text)` | `boolean` | Is the user assigned this app key |
| `get_user_roles(_user_id uuid)` | `text[]` | Roles (stored in a separate `user_roles` table, never on `profiles`) |

Order: company active → user active → super admin → profile/roles → app entitlement (unless Super Admin). Company verification errors fail closed. Company suspension returns `company_inactive`, independently of individual user activation.

Sessions are rechecked on token refresh, returning to the foreground and every 60 seconds while visible. This is UI revocation, not the security boundary: database policies and privileged endpoints must reject suspended-company data access on every request.

### Company suspension rollout (required before updating consumer apps)

The prepared SQL is in [database/company-suspension.sql](./database/company-suspension.sql). **It has not been applied**: this library has no connected shared backend. It was prepared using a read-only CoreCTRL schema snapshot; verify the live definitions before applying through the shared backend project's migration tools.

1. Review the existing `company`, `profiles`, `clients`, `user_clients`, `client_apps`, `is_super_admin` and RLS definitions. The snapshot has `profiles.company_id → company.id` but no company active field.
2. Apply the reviewed SQL to add `company.is_active` (existing companies default active), the dedicated company RPC, protected status updates, and company-aware legacy account/app RPCs. No individual `profiles.is_active` flags are changed. Only suite Super Admins or privileged server maintenance may change company status; existing company UPDATE RLS still applies.
3. Add restrictive company/account-active policies alongside existing ownership/tenant policies on **every** tenant-data table and relevant storage policies. Audit SECURITY DEFINER RPCs and privileged server endpoints separately. The SQL deliberately leaves this inventory-specific step for the connected project rather than guessing unseen policies. Without it, already-issued sessions may still access data directly.
4. Users without a profile/company assignment are denied, including Super Admins. Assign the suite administrators to an active operator company so they can reactivate suspended customers; do not assign them to the suspended company.
5. Before releasing, test suspension and reactivation using real accounts and an already-issued session, including direct data requests. New libraries block sign-in if the new RPC is absent, so deploy the shared-backend changes **first**.
6. Release a new library version/tag and upgrade each consumer. To suspend/reactivate, change the company's `is_active` only. Individually inactive or unentitled users remain blocked after reactivation.

Invite/recovery sessions remain available for password changes but never grant protected-app access on password-setup pages. A successful password change signs the user out.

## 2. New app setup

### 2.1 Install
```bash
bun add github:AminalVisor/core-authentication-service#v0.1.0
bun add @supabase/supabase-js react react-dom   # peers: React >=18, supabase-js ^2
```
No build step and no CSS import needed — `dist/` is prebuilt and styles self-inject.

### 2.2 Wrap the app
```tsx
import { CoreMSAuthProvider, RequireAuth } from "@corems/auth";
import { supabase } from "@/integrations/supabase/client";

<CoreMSAuthProvider supabaseClient={supabase} appKey="fuel" branding={{ subtitle: "Sign in to CoreFUEL" }}>
  <RequireAuth>{/* protected app */}</RequireAuth>
</CoreMSAuthProvider>
```

### 2.3 Set / reset password route
Create `/set-password` and `/reset-password` (whatever your invite and reset emails redirect to):
```tsx
import { SetPasswordScreen } from "@corems/auth";

<SetPasswordScreen onBackToSignIn={() => navigate("/")} />
```
It detects invite vs reset links, exchanges codes / verifies OTPs, checks strength, saves, then signs out.

### 2.4 Supabase Auth settings
Add the app's URLs (preview + production) to the Supabase Auth redirect allow-list, and point invite/recovery emails at the route above.

## 3. Migrating an existing app

1. Install the package (2.1).
2. Remove local copies: `src/contexts/AuthContext.tsx`, `src/components/LoginScreen.tsx`, `src/pages/SetPassword.tsx` (replace with the 2.3 wrapper).
3. Replace the provider in the app root with `CoreMSAuthProvider` (2.2).
4. Replace hook imports:

| Before | After |
| --- | --- |
| `import { useAuth } from "@/contexts/AuthContext"` | `import { useCoreMSAuth } from "@corems/auth"` |
| `const { user, signOut } = useAuth()` | `const { user, logout } = useCoreMSAuth()` |
| `user.role` | `user?.role` / `user?.roles` / `user?.isSuperAdmin` |

5. Replace custom route guards:
```tsx
import { RequireRole } from "@corems/auth";
<RequireRole roles={["Admin", "Manager"]}><AdminSettings /></RequireRole>
```
Super Admins pass by default; set `allowSuperAdmin={false}` to exclude them.

6. Test: valid login, inactive user, no app entitlement, Super Admin entitlement bypass, inactive company (including a Super Admin), company-check failure, suspension during an existing session, reactivation, invite link, reset link and direct data access while suspended.

### Migration checklist
- [ ] Package installed at the latest tag
- [ ] Old auth context / login / set-password files removed
- [ ] All `useAuth` imports replaced
- [ ] Guards replaced with `RequireAuth` / `RequireRole`
- [ ] Set/reset password route added, redirect URLs allow-listed
- [ ] RPCs present and the app key assigned to test users
- [ ] Company suspension migration and restrictive data policies applied in the shared backend
- [ ] All authorization scenarios above pass with real accounts, including direct data access

## 4. Reference

### App keys
| `appKey` | Name | Title |
| --- | --- | --- |
| `ctrl` | CoreCTRL | CoreMS Control Centre |
| `fuel` | CoreFUEL | Fuel Manager |
| `loading` | CoreLOAD | Load Manager |
| `production` | CoreMINE | Mine Production |
| `process` | CorePRCS | Processing & Production |
| `mech` | CoreMECH | Maintenance and Fleetcare |
| `safety` | CoreRISK | Safety & Compliance |
| `qc` | CoreLABS | Quality Control |
| `stock` | CoreSTOR | Stores & Inventory |
| `port` | CorePORT | Destination Receiving |
| `dashboard` | CoreVIEW | Executive Dashboard |

Adding a new app: add the key to `AppKey` in `src/lib/types.ts` and an entry in `src/lib/apps.ts`, then release (section 5).

### Branding overrides
```tsx
branding={{ appName, title, subtitle, tagline, accent: "#B45309", logo: "/logo.svg", hideSuiteLogo: false }}
```

### Custom profile loader
```tsx
loadProfile={async (client, userId) => {
  const { data } = await client.from("profiles").select("display_name, site_id").eq("id", userId).single();
  const { data: roles } = await client.rpc("get_user_roles", { _user_id: userId });
  return { username: data?.display_name, roles: roles ?? [], role: roles?.[0], profile: data };
}}
```
Access extra fields via `useCoreMSAuth().user?.profile`.

### Exports
`CoreMSAuthProvider`, `useCoreMSAuth`, `LoginScreen`, `SetPasswordScreen`, `RequireAuth`, `RequireRole` (= `RoleBasedRoute`), `AuthLoading`, `APP_REGISTRY` (= `COREMS_APPS`), `APP_KEYS`, `getAppMeta`, `AppMark`, `CoreMSStyles`, and types `AppKey`, `AppMeta`, `CoreMSUser`, `CoreMSProfile`, `AuthErrorCode`, `AuthResult`, `CoreMSBranding`.

## 5. Releasing an update

1. Change code in this repo (Lovable or locally) and test in the harness (`bun dev`).
2. Push to `main` — the `build-lib` workflow runs tests, rebuilds `dist/` and commits it. (Locally: `bun run build:lib`.)
3. Bump `version` in `package.json`, then tag the latest `main`:
   ```bash
   git pull && git tag v0.1.1 && git push origin v0.1.1
   ```
   The `release` workflow fails the tag if `dist/` is stale — pull the latest `main` before tagging.
4. In each consumer app:
   ```bash
   bun add github:AminalVisor/core-authentication-service#v0.1.1
   ```
   then redeploy.

Versioning: patch (`0.1.x`) for fixes, minor (`0.x.0`) for new features, major for breaking changes. Upgrade apps one at a time.

## Version telemetry (v0.2.0+)
After each successful sign-in or session restore (once per user per page load), the provider calls `record_app_telemetry` with the app key, `COREMS_AUTH_VERSION`, service-worker state, browser info and an anonymous device id (`localStorage.corems_device_id`). Failures are ignored and never affect sign-in. Pass optional details:
```tsx
<CoreMSAuthProvider supabaseClient={supabase} appKey="fuel"
  appVersion={import.meta.env.VITE_APP_VERSION} swVersion="sw-2026-10" offlineSchemaVersion={3}>
```
