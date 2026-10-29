import type { AppKey, CoreMSAppMeta } from "./types";
import coreCtrlLogo from "./assets/CoreCTRL- Auth.png";

/** Registry of every app in the CoreMS suite. Accents keep >= 4.5:1 contrast with white text. */
export const COREMS_APPS: Record<AppKey, CoreMSAppMeta> = {
  ctrl: {
    key: "ctrl",
    name: "CoreCTRL",
    title: "CoreMS Control Centre",
    tagline: "Users, sites, assets and every app in the suite — centralised and secure.",
    accent: "#00D2BE",
    logo: coreCtrlLogo,
  },
  fuel: {
    key: "fuel",
    name: "CoreFUEL",
    title: "Fuel Manager",
    tagline: "Track every litre dispensed, reconciled and billed across your fleet.",
    accent: "#F59E0B",
  },
  shld: {
    key: "shld",
    name: "CoreSHLD",
    title: "Security Manager",
    tagline: "Security operations. Controlled and connected.",
    accent: "#EF4444",
  },
  loading: {
    key: "loading",
    name: "CoreLOAD",
    title: "Load Manager",
    tagline: "Live load counts, haul cycles and payload tracking from pit to plant.",
    accent: "#F97316",
  },
  production: {
    key: "production",
    name: "CoreMINE",
    title: "Mine Production",
    tagline: "Shift production, targets and variances in one operational view.",
    accent: "#38BDF8",
  },
  process: {
    key: "process",
    name: "CorePRCS",
    title: "Processing & Production",
    tagline: "Throughput, recovery and plant uptime at a glance.",
    accent: "#3B82F6",
  },
  mech: {
    key: "mech",
    name: "CoreMECH",
    title: "Maintenance and Fleetcare",
    tagline: "Breakdowns, services and equipment availability under control.",
    accent: "#EAB308",
  },
  safety: {
    key: "safety",
    name: "CoreRISK",
    title: "Safety & Compliance",
    tagline: "Incidents, inspections and corrective actions — nothing missed.",
    accent: "#EF4444",
  },
  qc: {
    key: "qc",
    name: "CoreLABS",
    title: "Quality Control",
    tagline: "Sampling, assays and grade control with full traceability.",
    accent: "#22C55E",
  },
  stock: {
    key: "stock",
    name: "CoreSTOR",
    title: "Stores & Inventory",
    tagline: "Stockpile volumes, movements and inventory reconciled daily.",
    accent: "#C47A3A",
  },
  port: {
    key: "port",
    name: "CorePORT",
    title: "Destination Receiving",
    tagline: "Vessel loading, rail arrivals and port stock in sync.",
    accent: "#22D3EE",
  },
  dashboard: {
    key: "dashboard",
    name: "CoreVIEW",
    title: "Executive Dashboard",
    tagline: "Suite-wide KPIs for every site, in real time.",
    accent: "#A855F7",
  },
};

export const APP_KEYS = Object.keys(COREMS_APPS) as AppKey[];

export function getAppMeta(appKey: AppKey): CoreMSAppMeta {
  return COREMS_APPS[appKey];
}
