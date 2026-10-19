import { type ReactNode } from "react";
import type { AnySupabaseClient, AppKey, CoreMSAuthContextValue, CoreMSBranding, ProfileLoader, ResolvedBranding } from "./types";
export declare const DEFAULT_SUPER_ADMIN_ROLES: string[];
export interface CoreMSAuthProviderProps {
    supabaseClient: AnySupabaseClient;
    appKey: AppKey;
    branding?: CoreMSBranding;
    /** Consuming app build/release version, reported to telemetry. */
    appVersion?: string;
    /** Active service worker version / cache tag. */
    swVersion?: string;
    /** Offline IndexedDB schema version. */
    offlineSchemaVersion?: number;
    /** Override how the profile/roles are loaded. Defaults to `profiles` table + `get_user_roles` RPC. */
    loadProfile?: ProfileLoader;
    /** Role names treated as Super Admin (in addition to the `is_super_admin` RPC). */
    superAdminRoles?: string[];
    children: ReactNode;
}
export declare const defaultProfileLoader: ProfileLoader;
/** True while the user is on an invite / password-recovery link, where the session must survive the gates. */
export declare function isPasswordSetupFlow(): boolean;
export declare function resolveBranding(appKey: AppKey, overrides?: CoreMSBranding): ResolvedBranding;
export declare function CoreMSAuthProvider({ supabaseClient: supabase, appKey, branding: brandingOverrides, appVersion, swVersion, offlineSchemaVersion, loadProfile, superAdminRoles, children, }: CoreMSAuthProviderProps): import("react").JSX.Element;
/** Like useCoreMSAuth but returns undefined outside a provider. */
export declare function useOptionalCoreMSAuth(): CoreMSAuthContextValue | undefined;
export declare function useCoreMSAuth(): CoreMSAuthContextValue;
