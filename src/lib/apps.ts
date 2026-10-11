import type { AppKey, CoreMSAppMeta } from "./types";

/** Registry of every app in the CoreMS suite. Accents keep >= 4.5:1 contrast with white text. */
export const COREMS_APPS: Record<AppKey, CoreMSAppMeta> = {
  ctrl: { key: "ctrl", name: "CoreCTRL", title: "CoreMS Control Centre", tagline: "Users, sites, assets and every app in the suite — centralised and secure.", accent: "#0F8A5F" },
  fuel: { key: "fuel", name: "CoreFUEL", title: "Fuel Manager", tagline: "Track every litre dispensed, reconciled and billed across your fleet.", accent: "#B45309" },
  loading: { key: "loading", name: "CoreLOAD", title: "Load Manager", tagline: "Live load counts, haul cycles and payload tracking from pit to plant.", accent: "#1D4ED8" },
  production: { key: "production", name: "CoreMINE", title: "Mine Production", tagline: "Shift production, targets and variances in one operational view.", accent: "#A16207" },
  process: { key: "process", name: "CorePRCS", title: "Processing & Production", tagline: "Throughput, recovery and plant uptime at a glance.", accent: "#0E7490" },
  mech: { key: "mech", name: "CoreMECH", title: "Maintenance and Fleetcare", tagline: "Breakdowns, services and equipment availability under control.", accent: "#B91C1C" },
  safety: { key: "safety", name: "CoreRISK", title: "Safety & Compliance", tagline: "Incidents, inspections and corrective actions — nothing missed.", accent: "#BE123C" },
  qc: { key: "qc", name: "CoreLABS", title: "Quality Control", tagline: "Sampling, assays and grade control with full traceability.", accent: "#4D7C0F" },
  stock: { key: "stock", name: "CoreSTOR", title: "Stockpiles & Inventory", tagline: "Stockpile volumes, movements and inventory reconciled daily.", accent: "#6D28D9" },
  port: { key: "port", name: "CorePORT", title: "Port Logistics", tagline: "Vessel loading, rail arrivals and port stock in sync.", accent: "#1E40AF" },
  dashboard: { key: "dashboard", name: "CoreVIEW", title: "Executive Dashboard", tagline: "Suite-wide KPIs for every site, in real time.", accent: "#475569" },
};

export const APP_KEYS = Object.keys(COREMS_APPS) as AppKey[];

export function getAppMeta(appKey: AppKey): CoreMSAppMeta {
  return COREMS_APPS[appKey];
}
