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
- Library styles are a CSS string injected via React 19 `<style href precedence>` (`src/lib/styles.tsx`), classes prefixed `cms-` — consumers must not need Tailwind or a CSS import.
- The library is built with `vite.lib.config.ts` + `tsconfig.lib.json` (`build:lib`, also run by `prepare` so GitHub installs build `dist/`); never mix it into the app's `vite.config.ts`.
- `src/pages/` holds the harness; it talks to the library only through `@/lib` and uses an in-memory mock client, never a real backend.
