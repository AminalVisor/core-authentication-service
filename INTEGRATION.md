# @corems/auth — Integration Manual

How to add the shared CoreMS sign-in to a new app, migrate an existing app, and release updates.

## 1. Backend requirements

Every app on the shared backend needs these Postgres RPCs. They run on every login and session restore:

| RPC | Returns | Purpose |
| --- | --- | --- |
| `is_user_active(_user_id uuid)` | `boolean` | Inactive accounts are blocked and signed out |
| `is_super_admin(_user_id uuid)` | `boolean` | Super Admins bypass app entitlements |
| `can_user_access_app(_app text)` | `boolean` | Is the user assigned this app key |
| `get_user_roles(_user_id uuid)` | `text[]` | Roles (stored in a separate `user_roles` table, never on `profiles`) |

Order: active → super admin (bypass) → entitlement → profile load. Any failure signs the user out with a clear message.

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
| `const { user, signOut } = useAuth()` | `const { user, signOut } = useCoreMSAuth()` |
| `user.role` | `user?.role` / `user?.roles` / `user?.isSuperAdmin` |

5. Replace custom route guards:
```tsx
import { RequireRole } from "@corems/auth";
<RequireRole roles={["Admin", "Manager"]}><AdminSettings /></RequireRole>
```
Super Admins pass by default; set `allowSuperAdmin={false}` to exclude them.

6. Test: valid login, inactive user, user without the app entitlement, Super Admin, invite link, reset link.

### Migration checklist
- [ ] Package installed at the latest tag
- [ ] Old auth context / login / set-password files removed
- [ ] All `useAuth` imports replaced
- [ ] Guards replaced with `RequireAuth` / `RequireRole`
- [ ] Set/reset password route added, redirect URLs allow-listed
- [ ] RPCs present and the app key assigned to test users
- [ ] Six test scenarios above pass

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
