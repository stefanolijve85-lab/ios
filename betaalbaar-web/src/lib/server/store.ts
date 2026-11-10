/**
 * Bestandsopslag voor dossiers en uploads (JSON per dossier, atomair geschreven).
 * DATA_DIR moet op een persistente schijf staan. Bevat persoonsgegevens:
 * nooit loggen, nooit publiek serveren.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  type Intake, type Status, type PaymentStatus, type Missing,
  SCHEMA_VERSION, STATUSES, PAYMENT_STATUSES, BUILD_STATUSES,
  sanitizeIntake, emptyIntake, missingFields,
} from "../intake/schema.ts";

export type Asset = {
  id: string;
  name: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  purpose: string;
  placement: string;
  description: string;
  uploadedAt: string;
};

export type Version = { at: string; by: "beheer"; note: string; briefing: Intake };
export type Change = { at: string; description: string; planningImpact: string; priceImpact: string };

export type Dossier = {
  schemaVersion: number;
  id: string;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  status: Status;
  paymentStatus: PaymentStatus;
  resumeEmail: string;
  tokenHash: string;
  submitKey: string | null;
  /** Werkversie van de klant; na indienen bevroren als `original`. */
  draft: Intake;
  /** Oorspronkelijke antwoorden zoals ingediend. Wordt nooit overschreven. */
  original: Intake | null;
  /** Bewerkte briefing van de beheerder. */
  briefing: Intake | null;
  versions: Version[];
  assets: Asset[];
  approvals: { customWorkReviewed: boolean; approvedAt: string | null };
  delivery: { startAt: string | null; deadline: string | null; customerStatus: string };
  changes: Change[];
  notes: string;
};

const dataDir = () => path.resolve(process.env.DATA_DIR || "./.data");
const ID_RE = /^BW-[A-Z2-9]{8}$/;
const ASSET_RE = /^A-[a-f0-9]{16}$/;

export const isDossierId = (id: string) => ID_RE.test(id);
export const isAssetId = (id: string) => ASSET_RE.test(id);

function newId(): string {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(8);
  return "BW-" + [...bytes].map((b) => abc[b % abc.length]).join("");
}
const sha = (v: string) => crypto.createHash("sha256").update(v).digest("hex");
const now = () => new Date().toISOString();

function file(id: string) {
  if (!isDossierId(id)) throw new Error("Ongeldig dossier-ID");
  return path.join(dataDir(), "dossiers", `${id}.json`);
}
export function assetPath(id: string, assetId: string) {
  if (!isDossierId(id) || !isAssetId(assetId)) throw new Error("Ongeldige verwijzing");
  return path.join(dataDir(), "uploads", id, assetId);
}

async function write(d: Dossier) {
  const f = file(d.id);
  await fs.mkdir(path.dirname(f), { recursive: true });
  const tmp = `${f}.${crypto.randomBytes(4).toString("hex")}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(d, null, 2), { mode: 0o600 });
  await fs.rename(tmp, f);
}

export async function getDossier(id: string): Promise<Dossier | null> {
  if (!isDossierId(id)) return null;
  try {
    return JSON.parse(await fs.readFile(file(id), "utf8")) as Dossier;
  } catch {
    return null;
  }
}

export async function listDossiers(): Promise<Dossier[]> {
  try {
    const dir = path.join(dataDir(), "dossiers");
    const names = (await fs.readdir(dir)).filter((n) => n.endsWith(".json"));
    const all = await Promise.all(names.map((n) => getDossier(n.replace(/\.json$/, ""))));
    return all.filter((d): d is Dossier => !!d).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

/** Maakt een concept aan. Geeft het token één keer terug; alleen de hash wordt bewaard. */
export async function createDraft(intake: unknown, email: string): Promise<{ dossier: Dossier; token: string }> {
  const token = crypto.randomBytes(32).toString("base64url");
  const t = now();
  const dossier: Dossier = {
    schemaVersion: SCHEMA_VERSION,
    id: newId(),
    createdAt: t, updatedAt: t, submittedAt: null,
    status: "concept", paymentStatus: "niet_gestart",
    resumeEmail: email, tokenHash: sha(token), submitKey: null,
    draft: sanitizeIntake(intake ?? emptyIntake()),
    original: null, briefing: null, versions: [], assets: [],
    approvals: { customWorkReviewed: false, approvedAt: null },
    delivery: { startAt: null, deadline: null, customerStatus: "" },
    changes: [], notes: "",
  };
  await write(dossier);
  return { dossier, token };
}

/** Controleert het klanttoken in constante tijd. */
export async function authDossier(id: string, token: string | null): Promise<Dossier | null> {
  const d = await getDossier(id);
  if (!d || !token) return null;
  const a = Buffer.from(sha(token)), b = Buffer.from(d.tokenHash);
  return a.length === b.length && crypto.timingSafeEqual(a, b) ? d : null;
}

export class StoreError extends Error {
  code: string;
  constructor(code: string, message: string) { super(message); this.code = code; }
}

export async function saveDraft(d: Dossier, intake: unknown): Promise<Dossier> {
  if (d.status !== "concept") throw new StoreError("locked", "Deze aanvraag is al verstuurd en kan hier niet meer worden gewijzigd.");
  d.draft = sanitizeIntake(intake);
  d.updatedAt = now();
  await write(d);
  return d;
}

/**
 * Definitief indienen. Idempotent: een tweede aanroep (dubbelklik, retry)
 * levert hetzelfde dossier op en maakt geen tweede aanvraag.
 * Onvolledige intakes mogen worden ingediend; de levertijd start hierdoor NIET.
 */
export async function submitDossier(d: Dossier, intake: unknown, submitKey: string): Promise<{ dossier: Dossier; repeated: boolean }> {
  if (d.status !== "concept") return { dossier: d, repeated: true };
  const clean = sanitizeIntake(intake);
  const t = now();
  d.draft = clean;
  d.original = structuredClone(clean);
  d.briefing = structuredClone(clean);
  d.submitKey = submitKey.slice(0, 80);
  d.submittedAt = t;
  d.updatedAt = t;
  d.status = buildBlockers(d).length > 0 ? "input_ontbreekt" : "klaar_voor_beoordeling";
  await write(d);
  return { dossier: d, repeated: false };
}

/** De intake waar beheer en exports mee werken. */
export const currentIntake = (d: Dossier): Intake => d.briefing ?? d.original ?? d.draft;

/** Wat nog ontbreekt of beoordeeld moet worden vóór 'goedgekeurd voor bouw'. */
export function buildBlockers(d: Dossier): Missing[] {
  return missingFields(currentIntake(d), d.assets.length).filter((m) => {
    if (!m.critical) return false;
    if (m.key === "media.extraFeatures" && d.approvals.customWorkReviewed) return false;
    return true;
  });
}

export async function addAsset(d: Dossier, asset: Omit<Asset, "id" | "uploadedAt">, data: Buffer): Promise<Asset> {
  const a: Asset = { ...asset, id: "A-" + crypto.randomBytes(8).toString("hex"), uploadedAt: now() };
  const p = assetPath(d.id, a.id);
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, data, { mode: 0o600 });
  d.assets.push(a);
  d.updatedAt = now();
  await write(d);
  return a;
}

export async function removeAsset(d: Dossier, assetId: string): Promise<void> {
  if (d.status !== "concept") throw new StoreError("locked", "Deze aanvraag is al verstuurd.");
  if (!d.assets.some((a) => a.id === assetId)) return;
  d.assets = d.assets.filter((a) => a.id !== assetId);
  d.updatedAt = now();
  await write(d);
  await fs.rm(assetPath(d.id, assetId), { force: true });
}

export async function readAsset(d: Dossier, assetId: string): Promise<{ asset: Asset; data: Buffer } | null> {
  const asset = d.assets.find((a) => a.id === assetId);
  if (!asset) return null;
  try {
    return { asset, data: await fs.readFile(assetPath(d.id, assetId)) };
  } catch {
    return null;
  }
}

export type AdminUpdate = {
  status?: string;
  paymentStatus?: string;
  briefing?: unknown;
  versionNote?: string;
  notes?: string;
  customWorkReviewed?: boolean;
  delivery?: { startAt?: string | null; deadline?: string | null; customerStatus?: string };
  change?: { description?: string; planningImpact?: string; priceImpact?: string };
};

const s = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max).trim() : "");
const dateOrNull = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

/** Beheerwijzigingen. De oorspronkelijke antwoorden blijven altijd behouden. */
export async function adminUpdate(d: Dossier, u: AdminUpdate): Promise<Dossier> {
  const t = now();
  if (u.briefing !== undefined) {
    if (!d.original) throw new StoreError("not_submitted", "Een concept van de klant kan niet door beheer worden bewerkt.");
    if (d.briefing) d.versions.push({ at: t, by: "beheer", note: s(u.versionNote, 300) || "Briefing bijgewerkt", briefing: d.briefing });
    d.briefing = sanitizeIntake(u.briefing);
  }
  if (typeof u.notes === "string") d.notes = s(u.notes, 4000);
  if (typeof u.customWorkReviewed === "boolean") d.approvals.customWorkReviewed = u.customWorkReviewed;
  if (u.delivery) {
    if ("startAt" in u.delivery) d.delivery.startAt = dateOrNull(u.delivery.startAt);
    if ("deadline" in u.delivery) d.delivery.deadline = dateOrNull(u.delivery.deadline);
    if (typeof u.delivery.customerStatus === "string") d.delivery.customerStatus = s(u.delivery.customerStatus, 300);
  }
  if (u.change && s(u.change.description, 1000)) {
    d.changes.push({
      at: t,
      description: s(u.change.description, 1000),
      planningImpact: s(u.change.planningImpact, 300),
      priceImpact: s(u.change.priceImpact, 300),
    });
  }
  if (u.paymentStatus !== undefined) {
    if (!(PAYMENT_STATUSES as readonly string[]).includes(u.paymentStatus)) throw new StoreError("invalid", "Onbekende betalingsstatus.");
    // Betalingsstatus staat los van de dossierstatus en start nooit automatisch de levertijd.
    d.paymentStatus = u.paymentStatus as PaymentStatus;
  }
  if (u.status !== undefined && u.status !== d.status) {
    if (!(STATUSES as readonly string[]).includes(u.status)) throw new StoreError("invalid", "Onbekende status.");
    const next = u.status as Status;
    if (next !== "concept" && !d.original) throw new StoreError("not_submitted", "Dit dossier is nog niet ingediend.");
    if (BUILD_STATUSES.includes(next)) {
      const blockers = buildBlockers(d);
      if (blockers.length > 0)
        throw new StoreError("blocked", "Niet bouwklaar. Eerst oplossen: " + blockers.map((b) => b.label).join("; "));
      if (!d.delivery.startAt || !d.delivery.deadline)
        throw new StoreError("blocked", "Leg eerst het startmoment en de afgesproken deadline vast.");
    }
    if (next === "goedgekeurd_voor_bouw") d.approvals.approvedAt = t;
    d.status = next;
  }
  d.updatedAt = t;
  await write(d);
  return d;
}
