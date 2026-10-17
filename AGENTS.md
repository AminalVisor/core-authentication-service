<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- `src/lib/index.ts` is the public entry of the distributable `@corems/auth` package; everything it exports must stay router-agnostic and depend only on React + `@supabase/supabase-js` (peers) — consumer PWAs use different routers.
- Library styles are a CSS string injected once into <head> by id (`src/lib/styles.tsx`, React 18+19 safe), classes prefixed `cms-` — consumers must not need Tailwind or a CSS import.
- The library is built with `vite.lib.config.ts` + `tsconfig.lib.json` (`build:lib`, run manually or by CI); `dist/` is committed and there is deliberately no `prepare` script, so git installs never build; never mix it into the app's `vite.config.ts`.
- `.github/workflows/build-lib.yml` rebuilds and commits `dist/` on every push to `main`; `.github/workflows/release.yml` fails a `v*` tag if committed `dist/` is stale.
- `src/pages/` holds the harness; it talks to the library only through `@/lib` and uses an in-memory mock client, never a real backend.
- Company authorization uses the required fail-closed `is_company_active(_user_id)` RPC before role bypasses; recheck sessions on refresh, foreground return and every minute because company state can change during a session. Data access must independently enforce the same check through backend RLS.
- Keep React auth context identity in `src/lib/auth-context.ts`, separate from refreshable provider components, so live updates cannot disconnect guards from the provider.
