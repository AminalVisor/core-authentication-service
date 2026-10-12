import type { ReactNode } from "react";
import type { ResolvedBranding } from "./types";
export declare const SUITE_LOGO_SRC: string;
export declare const EyeIcon: () => import("react").JSX.Element;
export declare const EyeOffIcon: () => import("react").JSX.Element;
export declare const AlertIcon: () => import("react").JSX.Element;
export declare const CheckIcon: () => import("react").JSX.Element;
export declare const Spinner: ({ size }: {
    size?: number;
}) => import("react").JSX.Element;
/** Monogram derived from the app name: "CoreFUEL" -> "FU". */
export declare function monogram(name: string): string;
export declare function AppMark({ branding, size }: {
    branding: ResolvedBranding;
    size?: number;
}): import("react").JSX.Element;
export declare function AuthShell({ branding, contained, hero, heroHeadline, children, }: {
    branding: ResolvedBranding;
    contained?: boolean;
    hero?: boolean;
    heroHeadline?: ReactNode;
    children: ReactNode;
}): import("react").JSX.Element;
export declare function CardHeader({ branding, title, subtitle }: {
    branding: ResolvedBranding;
    title: string;
    subtitle?: string;
}): import("react").JSX.Element;
export declare function Alert({ tone, title, children }: {
    tone: "error" | "ok";
    title?: string;
    children: ReactNode;
}): import("react").JSX.Element;
