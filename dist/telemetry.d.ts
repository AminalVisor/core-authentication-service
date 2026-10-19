import type { AnySupabaseClient, AppKey } from "./types";
/** Current version of @corems/auth. Keep in sync with package.json. */
export declare const COREMS_AUTH_VERSION = "0.2.0";
export declare function getDeviceId(): string | undefined;
export declare function detectSupabaseJsVersion(client: AnySupabaseClient): string;
export interface TelemetryOptions {
    appKey: AppKey;
    appVersion?: string | undefined;
    swVersion?: string | undefined;
    offlineSchemaVersion?: number | undefined;
}
export declare function buildTelemetryPayload(client: AnySupabaseClient, o: TelemetryOptions): {
    p_app_key: AppKey;
    p_auth_version: string;
    p_app_version: string | null;
    p_sw_version: string | null;
    p_sw_active: boolean;
    p_offline_schema: number | null;
    p_supabase_js: string;
    p_platform: string | null;
    p_device_id: string | null;
};
/** Fire-and-forget: telemetry failures never affect authentication. */
export declare function reportTelemetry(client: AnySupabaseClient, o: TelemetryOptions): Promise<void>;
