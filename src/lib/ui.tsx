import type { CSSProperties, ReactNode } from "react";
import suiteLogo from "./assets/corems-logo-dark.png";
import type { ResolvedBranding } from "./types";
import { CoreMSStyles } from "./styles";

export const SUITE_LOGO_SRC: string = suiteLogo;

const svg = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const EyeIcon = () => (
  <svg {...svg} aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
);
export const EyeOffIcon = () => (
  <svg {...svg} aria-hidden="true"><path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 8 10 8a17.6 17.6 0 0 1-2.16 3.19M6.6 6.6A17.4 17.4 0 0 0 2 12s3.5 8 10 8a9.7 9.7 0 0 0 5.4-1.6M14.12 14.12a3 3 0 1 1-4.24-4.24M2 2l20 20" /></svg>
);
export const AlertIcon = () => (
  <svg {...svg} width={18} height={18} aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
);
export const CheckIcon = () => (
  <svg {...svg} width={18} height={18} aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="m8 12 3 3 5-6" /></svg>
);
export const Spinner = ({ size = 18 }: { size?: number }) => (
  <svg {...svg} width={size} height={size} className="cms-spin" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.2-8.56" /></svg>
);

/** Monogram derived from the app name: "CoreFUEL" -> "FU". */
export function monogram(name: string) {
  const tail = name.replace(/^Core/i, "");
  return (tail || name).slice(0, 2).toUpperCase();
}

export function AppMark({ branding, size = 48 }: { branding: ResolvedBranding; size?: number }) {
  const style: CSSProperties = { width: size, height: size, fontSize: Math.round(size * 0.32) };
  if (branding.logo && typeof branding.logo !== "string") return <div className="cms-mark" style={style}>{branding.logo}</div>;
  return (
    <div className="cms-mark" style={style} aria-hidden="true">
      {typeof branding.logo === "string" ? <img src={branding.logo} alt="" /> : monogram(branding.appName)}
    </div>
  );
}

export function AuthShell({
  branding,
  contained,
  hero = true,
  heroHeadline,
  children,
}: {
  branding: ResolvedBranding;
  contained?: boolean;
  hero?: boolean;
  heroHeadline?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className={`cms-root${contained ? " cms-contained" : ""}`}
      style={{ ["--cms-accent" as string]: branding.accent, ...(contained ? { containerType: "inline-size" } : {}) }}
    >
      <CoreMSStyles />
      <div className="cms-shell">
        {hero && (
          <section className="cms-hero">
            {!branding.hideSuiteLogo && <img className="cms-suite-logo" src={SUITE_LOGO_SRC} alt="CoreMS — Core Mining Systems" />}
            <p className="cms-eyebrow">CoreMS enterprise suite</p>
            <h1>{heroHeadline ?? <>{branding.title}.<br />Centralised and secure.</>}</h1>
            <p className="cms-lede">{branding.tagline}</p>
          </section>
        )}
        {children}
      </div>
    </div>
  );
}

export function CardHeader({ branding, title, subtitle }: { branding: ResolvedBranding; title: string; subtitle?: string }) {
  return (
    <header className="cms-card-head">
      {!branding.hideSuiteLogo && (
        <div className="cms-suite-mobile"><img src={SUITE_LOGO_SRC} alt="CoreMS — Core Mining Systems" /></div>
      )}
      <div className="cms-brand-row">
        <AppMark branding={branding} />
        <div>
          <p className="cms-app-name">{branding.appName}</p>
          <h2 className="cms-title">{title}</h2>
        </div>
      </div>
      {subtitle && <p className="cms-sub">{subtitle}</p>}
    </header>
  );
}

export function Alert({ tone, title, children }: { tone: "error" | "ok"; title?: string; children: ReactNode }) {
  return (
    <div className={`cms-alert cms-alert-${tone}`} role={tone === "error" ? "alert" : "status"}>
      {tone === "error" ? <AlertIcon /> : <CheckIcon />}
      <div>{title && <strong>{title}</strong>}{children}</div>
    </div>
  );
}
