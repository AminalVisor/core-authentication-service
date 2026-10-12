export interface SetPasswordScreenProps {
    /** "set" for invite links, "reset" for password recovery. Auto-detected from the URL when omitted. */
    mode?: "set" | "reset";
    /** Called after the password is saved (the user is signed out first). */
    onComplete?: () => void;
    onBackToSignIn?: () => void;
    minLength?: number;
    contained?: boolean;
}
export declare function strength(pw: string): number;
export declare function SetPasswordScreen({ mode: modeProp, onComplete, onBackToSignIn, minLength, contained }: SetPasswordScreenProps): import("react").JSX.Element;
