/**
 * Self-contained styles for every CoreMS auth screen. Rendered through React 19's
 * <style href precedence> so it is hoisted into <head> once and deduplicated —
 * consumer apps need no Tailwind or CSS setup.
 */
export const COREMS_AUTH_CSS = `
.cms-root{--cms-bg:#08131E;--cms-card:#0D1B2A;--cms-field:#08131E;--cms-border:rgba(255,255,255,.12);--cms-border-strong:rgba(255,255,255,.24);--cms-text:#E6ECF2;--cms-muted:#A9B7C6;--cms-danger-bg:rgba(220,38,38,.14);--cms-danger:#FCA5A5;--cms-ok-bg:rgba(22,163,74,.14);--cms-ok:#86EFAC;--cms-accent:#0F8A5F;--cms-accent-text:color-mix(in srgb,var(--cms-accent) 55%,#fff);
  box-sizing:border-box;font-family:Manrope,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--cms-text);background-color:var(--cms-bg);
  background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px),radial-gradient(1200px 600px at 85% -10%,color-mix(in srgb,var(--cms-accent) 22%,transparent),transparent 60%);
  background-size:40px 40px,40px 40px,100% 100%;min-height:100dvh;padding:16px;display:flex;align-items:center;justify-content:center;-webkit-font-smoothing:antialiased;line-height:1.5}
.cms-root *,.cms-root *::before,.cms-root *::after{box-sizing:border-box}
.cms-root.cms-contained{min-height:100%;height:100%}
.cms-shell{width:100%;max-width:1120px;display:flex;align-items:center;justify-content:center;gap:64px}
.cms-hero{display:none;max-width:520px}
@media (min-width:1024px){.cms-shell{justify-content:space-between}.cms-hero{display:block}.cms-card .cms-suite-mobile{display:none}}
.cms-root.cms-contained .cms-hero{display:none}.cms-root.cms-contained .cms-shell{justify-content:center}.cms-root.cms-contained .cms-card .cms-suite-mobile{display:block}
@container (min-width:1000px){.cms-root.cms-contained .cms-hero{display:block}.cms-root.cms-contained .cms-shell{justify-content:space-between}.cms-root.cms-contained .cms-card .cms-suite-mobile{display:none}}
.cms-suite-logo{height:72px;width:auto;display:block;margin-bottom:40px}
.cms-eyebrow{margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:var(--cms-accent-text)}
.cms-hero h1{margin:0;font-size:46px;line-height:1.12;font-weight:650;color:var(--cms-text);letter-spacing:-.01em}
.cms-hero p.cms-lede{margin:24px 0 0;font-size:16px;line-height:1.75;color:var(--cms-muted)}
.cms-card{width:100%;max-width:440px;background:var(--cms-card);border:1px solid var(--cms-border);border-radius:16px;box-shadow:0 24px 60px rgba(0,0,0,.45);overflow:hidden;position:relative}
.cms-card::before{content:"";position:absolute;inset:0 0 auto 0;height:3px;background:var(--cms-accent)}
.cms-card-head{padding:28px 28px 22px;border-bottom:1px solid var(--cms-border)}
.cms-card-body{padding:24px 28px 28px}
.cms-suite-mobile img{height:40px;width:auto;display:block;margin-bottom:20px}
.cms-brand-row{display:flex;align-items:center;gap:14px}
.cms-mark{flex:none;width:48px;height:48px;border-radius:12px;display:grid;place-items:center;background:var(--cms-accent);color:#fff;font-weight:800;font-size:15px;letter-spacing:.02em;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)}
.cms-mark img{width:100%;height:100%;object-fit:contain;border-radius:inherit}
.cms-app-name{margin:0;font-size:18px;font-weight:800;letter-spacing:.18em;color:var(--cms-accent-text)}
.cms-title{margin:2px 0 0;font-size:22px;font-weight:650;color:var(--cms-text);line-height:1.25}
.cms-sub{margin:14px 0 0;font-size:14px;color:var(--cms-muted)}
.cms-form{display:flex;flex-direction:column;gap:18px}
.cms-field{display:flex;flex-direction:column;gap:8px}
.cms-label{font-size:14px;font-weight:600;color:var(--cms-text)}
.cms-input-wrap{position:relative}
.cms-input{width:100%;height:48px;padding:0 14px;font:inherit;font-size:16px;color:var(--cms-text);background:var(--cms-field);border:1px solid var(--cms-border-strong);border-radius:10px;outline:none;transition:border-color .15s,box-shadow .15s}
.cms-input::placeholder{color:#7F8FA3}
.cms-input:focus-visible{border-color:var(--cms-accent-text);box-shadow:0 0 0 3px color-mix(in srgb,var(--cms-accent) 45%,transparent)}
.cms-input:disabled{opacity:.6}
.cms-input.cms-has-toggle{padding-right:52px}
.cms-reveal{position:absolute;top:0;right:0;width:48px;height:48px;display:grid;place-items:center;background:none;border:0;border-radius:10px;color:var(--cms-muted);cursor:pointer}
.cms-reveal:hover{color:var(--cms-text)}
.cms-reveal:focus-visible,.cms-btn:focus-visible,.cms-link:focus-visible{outline:2px solid var(--cms-accent-text);outline-offset:2px}
.cms-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:48px;padding:0 18px;font:inherit;font-size:16px;font-weight:700;color:#fff;background:var(--cms-accent);border:0;border-radius:10px;cursor:pointer;transition:filter .15s,transform .05s}
.cms-btn:hover:not(:disabled){filter:brightness(1.1)}
.cms-btn:active:not(:disabled){transform:translateY(1px)}
.cms-btn:disabled{opacity:.6;cursor:not-allowed}
.cms-btn-ghost{background:transparent;color:var(--cms-text);border:1px solid var(--cms-border-strong)}
.cms-row{display:flex;align-items:center;justify-content:space-between;gap:12px}
.cms-link{background:none;border:0;padding:10px 0;min-height:44px;font:inherit;font-size:14px;font-weight:600;color:var(--cms-accent-text);cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.cms-link:hover{color:#fff}
.cms-alert{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:10px;font-size:14px;line-height:1.45;margin-bottom:18px}
.cms-alert svg{flex:none;margin-top:1px}
.cms-alert-error{background:var(--cms-danger-bg);color:var(--cms-danger);border:1px solid rgba(252,165,165,.3)}
.cms-alert-ok{background:var(--cms-ok-bg);color:var(--cms-ok);border:1px solid rgba(134,239,172,.3)}
.cms-alert strong{display:block;color:#fff;font-weight:700;margin-bottom:2px}
.cms-hint{margin:0;font-size:13px;color:var(--cms-muted)}
.cms-meter{display:flex;gap:4px;margin-top:2px}.cms-meter span{flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,.12)}.cms-meter span.on{background:var(--cms-accent-text)}
.cms-footer{margin-top:22px;padding-top:18px;border-top:1px solid var(--cms-border);font-size:12px;color:var(--cms-muted);text-align:center}
.cms-spin{animation:cms-spin .8s linear infinite}@keyframes cms-spin{to{transform:rotate(360deg)}}
.cms-center{display:flex;flex-direction:column;align-items:center;gap:12px;color:var(--cms-muted);font-size:14px}
.cms-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0}
@media (prefers-reduced-motion:reduce){.cms-spin{animation-duration:2s}.cms-btn,.cms-input{transition:none}}
`;

export function CoreMSStyles() {
  return (
    <style href="corems-auth-styles" precedence="default">
      {COREMS_AUTH_CSS}
    </style>
  );
}
