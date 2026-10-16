import type { AnySupabaseClient, AppKey, CoreMSBranding } from "./types";
export interface SetPasswordScreenProps {
    /** "set" for invite links, "reset" for password recovery. Auto-detected from the URL when omitted. */
    mode?: "set" | "reset";
    /** Called after the password is saved (the user is signed out first). */
    onComplete?: () => void;
    onBackToSignIn?: () => void;
    minLength?: number;
    contained?: boolean;
    /** Use when rendering outside <CoreMSAuthProvider>. */
    supabaseClient?: AnySupabaseClient;
    /** Branding overrides; falls back to the provider's branding. */
    branding?: CoreMSBranding;
    /** App key for standalone branding (defaults to the provider's, else "ctrl"). */
    appKey?: AppKey;
}
export declare function strength(pw: string): number;
export declare function SetPasswordScreen({ mode: modeProp, onComplete, onBackToSignIn, minLength, contained, supabaseClient, branding: brandingProp, appKey }: SetPasswordScreenProps): import("react").JSX.Element;
