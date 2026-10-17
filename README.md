# @corems/auth

Shared sign-in for the CoreMS PWA suite: `CoreMSAuthProvider`, `LoginScreen`, `SetPasswordScreen`, `RequireAuth`, `RoleBasedRoute`.

**Full setup, migration and release manual: [INTEGRATION.md](./INTEGRATION.md).**

## Install (from GitHub)
```bash
bun add github:<org>/<repo>#v0.1.0
```
`bun run build:lib` produces `dist/` (ESM + `.d.ts`), which is committed to the repo — installing from GitHub needs no build step. Styles are bundled — no CSS import needed.

## Use
```tsx
import { CoreMSAuthProvider, RequireAuth, SetPasswordScreen } from "@corems/auth";

<CoreMSAuthProvider supabaseClient={supabase} appKey="fuel" branding={{ subtitle: "Sign in to CoreFUEL." }}>
  <RequireAuth>{/* app */}</RequireAuth>
</CoreMSAuthProvider>

// on /set-password and /reset-password:
<SetPasswordScreen onBackToSignIn={() => navigate("/")} />
```

Gates on every login and session restore: `is_company_active(_user_id)` → `is_user_active(_user_id)` → `is_super_admin(_user_id)` → profile/roles → `can_user_access_app(_app)` (entitlement bypass for Super Admins only). Suspension never modifies individual user activation. Sessions revalidate on refresh, foreground return and every visible minute. Password links retain password-change sessions without granting protected-app access.

**Deploy the shared-backend changes before upgrading consumers.** [database/company-suspension.sql](./database/company-suspension.sql) is prepared, not applied; the [manual](./INTEGRATION.md#company-suspension-rollout-required-before-updating-consumer-apps) includes required per-request data-policy enforcement and real-account verification.

## Develop
- `bun dev` — interactive harness (app switcher, scenario simulator, set/reset password demo).
- `bun run build:lib` — build the package.
