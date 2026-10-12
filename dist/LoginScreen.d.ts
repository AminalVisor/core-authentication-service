import { type ReactNode } from "react";
export interface LoginScreenProps {
    /** Called after a successful, fully gated sign-in. */
    onSuccess?: () => void;
    /** Where password-reset emails should send users. Default: `${origin}/reset-password`. */
    resetRedirectTo?: string;
    /** Render inside a parent box instead of filling the viewport. */
    contained?: boolean;
    /** Hide the large-screen marketing column. */
    hideHero?: boolean;
    heroHeadline?: ReactNode;
    footer?: ReactNode;
}
export declare function LoginScreen({ onSuccess, resetRedirectTo, contained, hideHero, heroHeadline, footer }: LoginScreenProps): import("react").JSX.Element;
