# @corems/auth

Shared sign-in for the CoreMS PWA suite: `CoreMSAuthProvider`, `LoginScreen`, `SetPasswordScreen`, `RequireAuth`, `RoleBasedRoute`.

## Install (from GitHub)
```bash
bun add github:<org>/<repo>#v0.1.0
```
`prepare` runs `build:lib`, producing `dist/` (ESM + `.d.ts`). Styles are bundled — no CSS import needed.

## Use
```tsx
import { CoreMSAuthProvider, RequireAuth, SetPasswordScreen } from "@corems/auth";

<CoreMSAuthProvider supabaseClient={supabase} appKey="fuel" branding={{ subtitle: "Sign in to CoreFUEL." }}>
  <RequireAuth>{/* app */}</RequireAuth>
</CoreMSAuthProvider>

// on /set-password and /reset-password:
<SetPasswordScreen onBackToSignIn={() => navigate("/")} />
```

Gates on every login and session restore: `is_user_active(_user_id)` → `is_super_admin(_user_id)` (bypass) → `can_user_access_app(_app)`. Failures sign the user out and show a clear message on the login card.

## Develop
- `bun dev` — interactive harness (app switcher, scenario simulator, set/reset password demo).
- `bun run build:lib` — build the package.
