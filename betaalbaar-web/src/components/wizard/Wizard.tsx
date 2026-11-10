"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  type Intake, type Offering, emptyIntake, isEmail, isHttpUrl, label, missingFields,
  ACTIONS, EXTRA_FEATURES, FEATURES, PAGES, PALETTES, SECTORS, SECTOR_QUESTIONS, STYLES,
} from "@/lib/intake/schema";
import { brand, delivery, pricing } from "@/config/site";
import { euro, priceSummary } from "@/lib/pricing";
import { track } from "@/lib/analytics";
import { Check, Choice, Multi, StyleThumb, Text } from "./ui";

type Asset = { id: string; name: string; mime: string; size: number; purpose: string; placement: string };
type Session = { id: string; token: string };
type Confirm = { message: string; drop: () => void };

const GROUPS = ["Jouw bedrijf", "Doel en doelgroep", "Gevoel en ontwerp", "Inhoud en pagina's", "Beelden en functies", "Naam en logo", "Controle en starten"];
const ALL_STEPS = [
  { id: "branche", g: 0, title: "In welke branche werk je?" },
  { id: "type", g: 0, title: "Nieuwe website of vervanging?" },
  { id: "aanbod", g: 0, title: "Wat bied je aan?" },
  { id: "identiteit", g: 0, title: "Heb je een bedrijfsnaam en logo?" },
  { id: "actie", g: 1, title: "Wat moet een bezoeker vooral doen?" },
  { id: "klanten", g: 1, title: "Wie zijn je klanten?" },
  { id: "onderscheid", g: 1, title: "Wat maakt je bedrijf anders?" },
  { id: "stijl", g: 2, title: "Welke stijl past bij je bedrijf?" },
  { id: "kleuren", g: 2, title: "Welke kleuren passen bij je?" },
  { id: "sfeer", g: 2, title: "Licht of donker, foto's of tekst?" },
  { id: "inspiratie", g: 2, title: "Heb je voorbeelden die je mooi vindt?" },
  { id: "paginas", g: 3, title: "Welke pagina's wil je?" },
  { id: "gegevens", g: 3, title: "Welke gegevens komen op je website?" },
  { id: "branchevragen", g: 3, title: "Meer over je bedrijf" },
  { id: "teksten", g: 3, title: "Hoe komen de teksten tot stand?" },
  { id: "bestanden", g: 4, title: "Logo, foto's en andere bestanden" },
  { id: "functies", g: 4, title: "Wat moet je website kunnen?" },
  { id: "naam", g: 5, title: "Je nieuwe naam" },
  { id: "logo", g: 5, title: "Je logo" },
  { id: "administratie", g: 6, title: "Jouw gegevens voor de aanvraag" },
  { id: "controle", g: 6, title: "Controleer je aanvraag" },
] as const;
type StepId = (typeof ALL_STEPS)[number]["id"];

const PURPOSES = [
  { id: "logo", label: "Logo" }, { id: "foto", label: "Foto" },
  { id: "huisstijl", label: "Huisstijl" }, { id: "document", label: "Document" },
];
const SS_KEY = "bw-intake-sessie";

async function api(path: string, init: RequestInit & { token?: string } = {}) {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  if (init.token) headers["x-intake-token"] = init.token;
  if (typeof init.body === "string") headers["Content-Type"] = "application/json";
  try {
    const res = await fetch(path, { ...init, headers });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) return { ok: false as const, code: data?.code ?? "error", message: data?.message ?? "Er ging iets mis. Probeer het opnieuw." };
    return { ok: true as const, data };
  } catch {
    return { ok: false as const, code: "network", message: "Geen verbinding. Je antwoorden staan nog in dit venster; probeer het opnieuw." };
  }
}

export default function Wizard() {
  const [intake, setIntake] = useState<Intake>(emptyIntake);
  const [stepId, setStepId] = useState<StepId>("branche");
  const [session, setSession] = useState<Session | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<{ field?: string; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ id: string; status: string } | null>(null);
  const [resumeMsg, setResumeMsg] = useState("");
  const [saveEmail, setSaveEmail] = useState("");
  const [saveConsent, setSaveConsent] = useState(false);
  const [submitConsent, setSubmitConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [purpose, setPurpose] = useState("logo");
  const [placement, setPlacement] = useState("");
  const [draftOffer, setDraftOffer] = useState<Offering>({ name: "", description: "", distinction: "", price: "" });
  const [draftLink, setDraftLink] = useState({ url: "", note: "" });
  const [copied, setCopied] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const submitKey = useRef("");
  const dirty = useRef(false);
  const started = useRef(false);

  const steps = useMemo(() => ALL_STEPS.filter((s) => {
    if (s.g === 5) return intake.extras.nameLogo;
    if (s.id === "branchevragen") return (SECTOR_QUESTIONS[intake.business.sector] ?? []).length > 0;
    return true;
  }), [intake.extras.nameLogo, intake.business.sector]);
  const idx = Math.max(0, steps.findIndex((s) => s.id === stepId));
  const step = steps[idx];
  const groups = useMemo(() => [...new Set(steps.map((s) => s.g))], [steps]);

  const upd = useCallback(<K extends keyof Intake>(k: K, patch: Partial<Intake[K]>) => {
    dirty.current = true;
    if (!started.current) { started.current = true; track("form_start"); }
    setIntake((p) => ({ ...p, [k]: { ...p[k], ...patch } }));
  }, []);
  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  /* Hervatten: via beveiligde link (#hervat=ID.TOKEN) of de sessie van dit tabblad. */
  useEffect(() => {
    let creds: Session | null = null;
    const m = window.location.hash.match(/^#hervat=(BW-[A-Z2-9]{8})\.([\w-]{20,})$/);
    if (m) {
      creds = { id: m[1], token: m[2] };
      // Haal het token uit de adresbalk en de geschiedenis.
      window.history.replaceState(null, "", window.location.pathname);
    } else {
      try { creds = JSON.parse(window.sessionStorage.getItem(SS_KEY) ?? "null"); } catch { creds = null; }
    }
    if (!creds) return;
    const c = creds;
    api("/api/intake/resume", { method: "POST", body: JSON.stringify(c) }).then((r) => {
      if (!r.ok) {
        try { window.sessionStorage.removeItem(SS_KEY); } catch {}
        if (m) setResumeMsg(r.message);
        return;
      }
      if (r.data.status !== "concept") { setDone({ id: r.data.id, status: r.data.status }); return; }
      setIntake(r.data.intake);
      setAssets(r.data.assets);
      setSession(c);
      setSaveEmail(r.data.email ?? "");
      try { window.sessionStorage.setItem(SS_KEY, JSON.stringify(c)); } catch {}
      started.current = true;
      setResumeMsg("Je bewaarde antwoorden zijn geladen. Je kunt verdergaan waar je was.");
    });
  }, []);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty.current && !done) e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [done]);

  const persist = useCallback(async (s: Session | null = session) => {
    if (!s) return true;
    setSaveState("saving");
    const r = await api(`/api/intake/${s.id}`, { method: "PUT", token: s.token, body: JSON.stringify({ intake }) });
    setSaveState(r.ok ? "saved" : "error");
    if (r.ok) dirty.current = false;
    return r.ok;
  }, [intake, session]);

  const go = (id: StepId) => {
    setError(null);
    setConfirm(null);
    setStepId(id);
    if (session && dirty.current) void persist();
    requestAnimationFrame(() => { heading.current?.focus(); window.scrollTo({ top: 0 }); });
  };

  /** Controleert alleen de vorm van wat is ingevuld; overslaan mag altijd. */
  const validate = (): { field: string; message: string } | null => {
    if (step.id === "type" && intake.business.existingUrl && !isHttpUrl(intake.business.existingUrl))
      return { field: "existingUrl", message: "Vul een volledig adres in, bijvoorbeeld https://www.mijnbedrijf.nl" };
    if (step.id === "gegevens" && intake.content.email && !isEmail(intake.content.email))
      return { field: "content.email", message: "Dit e-mailadres lijkt niet te kloppen." };
    return null;
  };
  const next = () => {
    const v = validate();
    if (v) { setError(v); return; }
    if (idx < steps.length - 1) go(steps[idx + 1].id);
  };
  const back = () => idx > 0 && go(steps[idx - 1].id);

  /* ---- Afhankelijke antwoorden nooit stilletjes weggooien ---- */
  const setSector = (sector: string) => {
    const old = intake.business.sector;
    const oldKeys = Object.keys(intake.content.sectorAnswers).filter((k) => k.startsWith(old + "."));
    upd("business", { sector });
    if (old && old !== sector && oldKeys.length > 0) {
      setConfirm({
        message: `Je had al vragen voor de branche '${label(SECTORS, old)}' beantwoord. Mogen die antwoorden vervallen?`,
        drop: () => setIntake((p) => {
          const sa = { ...p.content.sectorAnswers };
          for (const k of oldKeys) delete sa[k];
          return { ...p, content: { ...p.content, sectorAnswers: sa } };
        }),
      });
    }
  };
  const namingFilled = Object.values(intake.naming).some((v) => v !== "");
  const setNameLogo = (on: boolean) => {
    upd("extras", { nameLogo: on });
    if (!on && namingFilled) {
      setConfirm({
        message: "Je hebt de optie 'naam en logo' verwijderd, maar je had er al vragen over beantwoord. Mogen die antwoorden vervallen?",
        drop: () => setIntake((p) => ({ ...p, naming: emptyIntake().naming })),
      });
    }
  };
  const setIdentity = (identity: Intake["business"]["identity"]) => {
    upd("business", { identity });
    if (identity === "beide" && intake.extras.nameLogo) {
      setConfirm({
        message: `Je koos eerder voor 'naam en logo laten maken' (${euro(pricing.nameLogo)} eenmalig). Je geeft nu aan beide al te hebben. Mag die optie vervallen?`,
        drop: () => setIntake((p) => ({ ...p, extras: { nameLogo: false }, business: { ...p.business, missingIdentity: "" } })),
      });
    }
  };

  /* ---- Bewaren na toestemming ---- */
  const createSession = async (email: string): Promise<Session | null> => {
    const r = await api("/api/intake", { method: "POST", body: JSON.stringify({ intake, email, consent: true, website: honeypot }) });
    if (!r.ok) { setError({ field: r.code === "email" ? "saveEmail" : undefined, message: r.message }); return null; }
    const s = { id: r.data.id as string, token: r.data.token as string };
    setSession(s);
    dirty.current = false;
    setSaveState("saved");
    try { window.sessionStorage.setItem(SS_KEY, JSON.stringify(s)); } catch {}
    return s;
  };
  const saveProgress = async () => {
    setError(null);
    if (!isEmail(saveEmail.trim())) { setError({ field: "saveEmail", message: "Vul een geldig e-mailadres in." }); return; }
    if (!saveConsent) { setError({ field: "saveConsent", message: "Geef eerst toestemming om je voortgang te bewaren." }); return; }
    setBusy(true);
    await createSession(saveEmail.trim());
    setBusy(false);
  };
  const resumeLink = session && typeof window !== "undefined" ? `${window.location.origin}/start#hervat=${session.id}.${session.token}` : "";

  /* ---- Uploads ---- */
  const upload = async (files: FileList | null) => {
    if (!files || !session) return;
    setUploadErrors([]);
    setBusy(true);
    const errs: string[] = [];
    for (const f of Array.from(files)) {
      if (f.size > 8 * 1024 * 1024) { errs.push(`${f.name}: groter dan 8 MB.`); continue; }
      const fd = new FormData();
      fd.append("file", f); fd.append("purpose", purpose); fd.append("placement", placement);
      const r = await api(`/api/intake/${session.id}/files`, { method: "POST", token: session.token, body: fd });
      if (!r.ok) { errs.push(`${f.name}: ${r.message}`); continue; }
      const a = r.data.asset as Asset;
      setAssets((p) => [...p, a]);
      if (/^image\/(png|jpeg|webp)$/.test(a.mime)) setThumbs((p) => ({ ...p, [a.id]: URL.createObjectURL(f) }));
    }
    setUploadErrors(errs);
    setBusy(false);
  };
  const removeFile = async (a: Asset) => {
    if (!session) return;
    const r = await api(`/api/intake/${session.id}/files/${a.id}`, { method: "DELETE", token: session.token });
    if (r.ok) setAssets((p) => p.filter((x) => x.id !== a.id));
    else setUploadErrors([`${a.name}: ${r.message}`]);
  };
  // Thumbnails van eerder geüploade afbeeldingen (na hervatten) afgeschermd ophalen.
  useEffect(() => {
    if (!session) return;
    for (const a of assets) {
      if (thumbs[a.id] || !/^image\/(png|jpeg|webp)$/.test(a.mime)) continue;
      fetch(`/api/intake/${session.id}/files/${a.id}`, { headers: { "x-intake-token": session.token } })
        .then((r) => (r.ok ? r.blob() : null))
        .then((b) => b && setThumbs((p) => (p[a.id] ? p : { ...p, [a.id]: URL.createObjectURL(b) })))
        .catch(() => {});
    }
  }, [assets, session]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- Versturen: succes alleen na bevestiging door de server, dubbelklik maakt geen tweede aanvraag ---- */
  const submit = async () => {
    if (busy) return;
    setError(null);
    if (!intake.billing.contactName.trim()) { setError({ field: "billing.contactName", message: "Vul je naam in bij 'Jouw gegevens voor de aanvraag'." }); return; }
    if (!isEmail(intake.billing.email.trim())) { setError({ field: "billing.email", message: "Vul een geldig e-mailadres in bij 'Jouw gegevens voor de aanvraag'." }); return; }
    if (!submitConsent) { setError({ field: "submitConsent", message: "Geef toestemming om je aanvraag op te slaan en te behandelen." }); return; }
    setBusy(true);
    const s = session ?? (await createSession(intake.billing.email.trim()));
    if (!s) { setBusy(false); return; }
    if (!submitKey.current) submitKey.current = crypto.randomUUID();
    const r = await api(`/api/intake/${s.id}/submit`, { method: "POST", token: s.token, body: JSON.stringify({ intake, submitKey: submitKey.current }) });
    setBusy(false);
    if (!r.ok) { setError({ field: r.code.startsWith("billing.") ? r.code : undefined, message: r.message }); return; }
    dirty.current = false;
    try { window.sessionStorage.removeItem(SS_KEY); } catch {}
    track("request_success", { withNameLogo: intake.extras.nameLogo });
    setDone({ id: r.data.id, status: r.data.status });
    window.scrollTo({ top: 0 });
  };

  const price = priceSummary(intake.extras.nameLogo);
  const missing = missingFields(intake, assets.length);
  const err = (f: string) => (error?.field === f ? error.message : undefined);
  const b = intake.business, g = intake.goals, d = intake.design, c = intake.content, m = intake.media, n = intake.naming;

  if (done) {
    return (
      <div className="wz">
        <main className="wz-main"><div className="wrap">
          <p className="eyebrow">{brand.name}</p>
          <h1 tabIndex={-1}>Je aanvraag is ontvangen.</h1>
          <p className="lead">Dossiernummer: <strong data-testid="dossier-id">{done.id}</strong></p>
          <div className="note info" style={{ margin: "20px 0" }}>
            <strong>Wat gebeurt er nu?</strong> We bekijken je aanvraag en nemen per e-mail contact met je op over inhoud, prijs en planning.
            Je hebt nog niets besteld en niets betaald. De {delivery.days} dagen gaan pas in na je akkoord en zodra alle noodzakelijke input compleet is.
          </div>
          {done.status === "input_ontbreekt" && <p>Je aanvraag is nog niet compleet. Dat is geen probleem: we laten je weten wat we nog van je nodig hebben.</p>}
          <p className="muted">Bewaar je dossiernummer; daarmee kunnen we je aanvraag snel terugvinden.</p>
          <Link href="/" className="btn btn-secondary">Terug naar de website</Link>
        </div></main>
      </div>
    );
  }

  const savePanel = (intro: string) => (
    <div className="item" id="bewaren">
      <h2 style={{ fontSize: "1.1rem" }}>Bewaar je voortgang</h2>
      {session ? (
        <>
          <p className="status-ok">Je voortgang wordt bewaard. {saveState === "error" && <span className="err">Het laatste opslaan mislukte. <button className="btn-ghost btn" type="button" onClick={() => persist()}>Opnieuw proberen</button></span>}</p>
          <div className="field">
            <label htmlFor="hervatlink">Je persoonlijke hervatlink</label>
            <input id="hervatlink" type="text" readOnly value={resumeLink} onFocus={(e) => e.target.select()} />
            <p className="small muted">Bewaar deze link op een veilige plek: daarmee ga je later verder. Iedereen met de link kan je concept bekijken, dus deel hem niet.</p>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigator.clipboard?.writeText(resumeLink).then(() => setCopied(true))}>
            {copied ? "Link gekopieerd" : "Kopieer link"}
          </button>
        </>
      ) : (
        <>
          <p className="muted">{intro}</p>
          <Text label="Je e-mailadres" type="email" autoComplete="email" value={saveEmail} onChange={setSaveEmail} error={err("saveEmail")} />
          <div className="hp" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} /></label></div>
          <Check checked={saveConsent} onChange={setSaveConsent}>Ik geef toestemming om mijn antwoorden en bestanden op te slaan, zodat ik later verder kan gaan.</Check>
          {err("saveConsent") && <p className="err" role="alert">{err("saveConsent")}</p>}
          {error && !error.field && <p className="err" role="alert">{error.message}</p>}
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={saveProgress}>{busy ? "Bezig met bewaren…" : "Bewaar mijn voortgang"}</button>
        </>
      )}
    </div>
  );

  const pal = PALETTES.find((p) => p.id === d.palette)?.colors ?? ["#0b1f3a", "#1f6feb", "#f7f4ee"];
  const lead = d.leadStyle || d.styles[0] || "strak";
  const dark = d.mode === "donker";
  const preview = (
    <figure style={{ margin: "0 0 24px" }}>
      <div className="preview">
        <div className="preview-inner" style={{
          background: dark ? pal[0] : pal[2], color: dark ? pal[2] : pal[0],
          fontFamily: lead === "luxe" || lead === "warm" ? "var(--serif)" : "var(--font)",
          textAlign: lead === "luxe" ? "center" : "left", justifyItems: lead === "luxe" ? "center" : "start",
        }}>
          <div className="pt" style={{ textTransform: lead === "stoer" || lead === "strak" ? "uppercase" : "none", fontWeight: lead === "luxe" ? 400 : lead === "stoer" ? 900 : 700, fontStyle: lead === "luxe" ? "italic" : "normal" }}>
            {b.businessName || "Jouw bedrijfsnaam"}
          </div>
          {d.imagery !== "tekst" && <div className="pimg ph" style={{ width: "100%", borderRadius: lead === "fris" || lead === "speels" || lead === "warm" ? 16 : 0 }}>plek voor je foto</div>}
          <div>{b.offerings[0]?.name || "Korte uitleg van wat je doet"}</div>
          <div className="pb" style={{ background: pal[1], color: "#fff", borderRadius: lead === "strak" || lead === "stoer" ? 0 : 999 }}>
            {label(ACTIONS, g.primaryAction) || "Neem contact op"}
          </div>
        </div>
      </div>
      <figcaption className="small muted">Stijlvoorbeeld op basis van je keuzes. Dit is een indicatie, geen definitief ontwerp.</figcaption>
    </figure>
  );

  const sectorQs = SECTOR_QUESTIONS[b.sector] ?? [];
  const needIdentityChoice = b.identity === "geen" || b.identity === "naam";
  const missingFiles = [
    b.identity === "beide" && !assets.some((a) => a.purpose === "logo") ? "Je logo" : "",
    m.photos === "upload" && !assets.some((a) => a.purpose === "foto") ? "Je foto's" : "",
    d.palette === "eigen" && !d.customColors && !assets.some((a) => a.purpose === "huisstijl") ? "Je huisstijl of kleurcodes" : "",
  ].filter(Boolean);

  const body: Record<StepId, React.ReactNode> = {
    branche: (
      <>
        <Choice legend="Kies wat het beste past" options={SECTORS} value={b.sector} onChange={setSector} />
        {b.sector === "anders" && <Text label="Welke branche?" value={b.sectorOther} onChange={(v) => upd("business", { sectorOther: v })} example="hondentrimsalon, fotograaf, rijschool" />}
      </>
    ),
    type: (
      <>
        <Choice legend="Wat is van toepassing?" value={b.siteType} onChange={(v) => upd("business", { siteType: v as Intake["business"]["siteType"] })}
          options={[{ id: "nieuw", label: "Een nieuwe website", hint: "Ik heb nog geen website" }, { id: "vervanging", label: "Vervanging", hint: "Ik heb al een website" }]} />
        {b.siteType === "vervanging" && <Text label="Adres van je huidige website" optional type="url" value={b.existingUrl} onChange={(v) => upd("business", { existingUrl: v })} example="https://www.mijnbedrijf.nl" error={err("existingUrl")} />}
      </>
    ),
    aanbod: (
      <>
        <p className="muted">Voeg je diensten of producten één voor één toe. Kort is prima; je kunt later aanvullen.</p>
        {b.offerings.map((o, k) => (
          <div className="item" key={k}>
            <div className="item-head"><strong>{o.name}</strong>
              <button type="button" className="btn btn-ghost" onClick={() => upd("business", { offerings: b.offerings.filter((_, x) => x !== k) })}>Verwijder<span className="sr-only"> {o.name}</span></button>
            </div>
            <p className="small muted" style={{ margin: 0 }}>{[o.description, o.distinction && `Onderscheid: ${o.distinction}`, o.price && `Prijs: ${o.price}`].filter(Boolean).join(" · ") || "Geen toelichting"}</p>
          </div>
        ))}
        <div className="item">
          <Text label="Naam van de dienst of het product" value={draftOffer.name} onChange={(v) => setDraftOffer({ ...draftOffer, name: v })} example="Badkamerrenovatie" />
          <Text label="Korte uitleg" optional multiline value={draftOffer.description} onChange={(v) => setDraftOffer({ ...draftOffer, description: v })} example="Complete renovatie van sloop tot tegelwerk, door één vast team." />
          <div className="grid2">
            <Text label="Wat is hier bijzonder aan?" optional value={draftOffer.distinction} onChange={(v) => setDraftOffer({ ...draftOffer, distinction: v })} example="Vaste opleverdatum" />
            <Text label="Prijs, als je die wilt tonen" optional value={draftOffer.price} onChange={(v) => setDraftOffer({ ...draftOffer, price: v })} example="vanaf €4.500" />
          </div>
          <button type="button" className="btn btn-secondary" disabled={!draftOffer.name.trim()} onClick={() => { upd("business", { offerings: [...b.offerings, draftOffer] }); setDraftOffer({ name: "", description: "", distinction: "", price: "" }); }}>
            Voeg toe
          </button>
        </div>
      </>
    ),
    identiteit: (
      <>
        <Choice legend="Wat heb je al?" value={b.identity} onChange={(v) => setIdentity(v as Intake["business"]["identity"])}
          options={[{ id: "beide", label: "Naam en logo" }, { id: "naam", label: "Alleen een naam" }, { id: "geen", label: "Nog geen van beide" }]} />
        {(b.identity === "beide" || b.identity === "naam") && <Text label="Je bedrijfsnaam" value={b.businessName} onChange={(v) => upd("business", { businessName: v })} example="Bakkerij De Korenbloem" />}
        {needIdentityChoice && (
          <>
            <Choice wide legend={b.identity === "naam" ? "Hoe wil je het logo regelen?" : "Hoe wil je naam en logo regelen?"} value={b.missingIdentity}
              onChange={(v) => { upd("business", { missingIdentity: v as Intake["business"]["missingIdentity"] }); setNameLogo(v === "naamlogo"); }}
              options={[
                { id: "later", label: "Ik lever het later aan", hint: "Geen extra kosten" },
                { id: "naamlogo", label: `Laat een naam en logo maken — ${euro(pricing.nameLogo)} eenmalig extra`, hint: "Samen met ons, geen terugkerende toeslag" },
              ]} />
            <p className="small muted">Dit is een vrije keuze; je hoeft niets extra's af te nemen.{b.identity === "naam" && " Er is één prijs voor naam en logo samen; een los logotarief is er niet."}</p>
            {b.identity === "naam" && b.missingIdentity === "naamlogo" && (
              <Choice legend="Wil je je bestaande naam behouden?" value={b.keepName} onChange={(v) => upd("business", { keepName: v as "ja" | "nee" })}
                options={[{ id: "ja", label: "Ja, alleen een logo erbij" }, { id: "nee", label: "Nee, ik wil ook een nieuwe naam" }]} />
            )}
          </>
        )}
      </>
    ),
    actie: (
      <>
        <Choice legend="Kies één hoofdactie" options={ACTIONS} value={g.primaryAction} onChange={(v) => upd("goals", { primaryAction: v, secondaryAction: g.secondaryAction === v ? "" : g.secondaryAction })} />
        {g.primaryAction === "anders" && <Text label="Welke actie?" value={g.actionOther} onChange={(v) => upd("goals", { actionOther: v })} example="een proefles boeken" />}
        <Choice legend="Eventueel een tweede actie (optioneel)" value={g.secondaryAction} onChange={(v) => upd("goals", { secondaryAction: v === "geen" ? "" : v })}
          options={[...ACTIONS.filter((a) => a.id !== g.primaryAction && a.id !== "anders"), { id: "geen", label: "Geen tweede actie" }]} />
      </>
    ),
    klanten: (
      <>
        <Choice legend="Aan wie verkoop je?" value={g.customerType} onChange={(v) => upd("goals", { customerType: v as Intake["goals"]["customerType"] })}
          options={[{ id: "particulier", label: "Particulieren" }, { id: "zakelijk", label: "Bedrijven" }, { id: "beide", label: "Beide" }]} />
        <Text label="Omschrijf je klanten" multiline value={g.audience} onChange={(v) => upd("goals", { audience: v })} example="Huiseigenaren van 35 tot 65 jaar die hun badkamer willen vernieuwen en ontzorgd willen worden." />
        <div className="grid2">
          <Text label="Werkgebied" value={g.area} onChange={(v) => upd("goals", { area: v })} example="Emmen en 30 km daaromheen" />
          <Text label="Taal van je klanten" value={g.language} onChange={(v) => upd("goals", { language: v })} example="Nederlands" />
        </div>
      </>
    ),
    onderscheid: (
      <>
        <Text label="Noem concrete feiten over je bedrijf" multiline value={g.differentiators} onChange={(v) => upd("goals", { differentiators: v })}
          example="Sinds 2011 actief, vast team van vier, we werken met een vaste opleverdatum." />
        <p className="small muted">We gebruiken alleen wat jij aanlevert en verzinnen er geen superlatieven bij.</p>
      </>
    ),
    stijl: (
      <>
        <Multi wide legend="Kies maximaal twee stijlen" options={STYLES} values={d.styles} max={2} render={(o) => <StyleThumb id={o.id} />}
          onToggle={(id) => { const styles = toggle(d.styles, id); upd("design", { styles, leadStyle: styles.includes(d.leadStyle) ? d.leadStyle : styles[0] ?? "", styleAdvice: false }); }} />
        {d.styles.length === 2 && (
          <Choice legend="Welke van de twee is leidend?" value={d.leadStyle} onChange={(v) => upd("design", { leadStyle: v })} options={STYLES.filter((s) => d.styles.includes(s.id))} />
        )}
        <Check checked={d.styleAdvice} onChange={(v) => upd("design", { styleAdvice: v, ...(v ? { styles: [], leadStyle: "" } : {}) })}>Adviseer mij: kies een stijl die bij mijn bedrijf past.</Check>
        <Text label="Welke uitstraling past juist níet?" optional value={d.avoid} onChange={(v) => upd("design", { avoid: v })} example="Niet te kinderachtig en geen felle kleuren." />
      </>
    ),
    kleuren: (
      <>
        <Choice wide legend="Kies een kleurpalet" value={d.palette} onChange={(v) => upd("design", { palette: v })}
          options={[...PALETTES.map((p) => ({ id: p.id, label: p.label })), { id: "eigen", label: "Mijn eigen kleuren of huisstijl" }, { id: "logo", label: "Haal kleuren uit mijn logo", hint: "Je bevestigt het resultaat daarna" }, { id: "advies", label: "Adviseer mij" }]}
          render={(o) => { const p = PALETTES.find((x) => x.id === o.id); return p ? <span className="swatches" aria-hidden="true">{p.colors.map((x) => <i key={x} style={{ background: x }} />)}</span> : null; }} />
        {d.palette === "eigen" && <Text label="Je kleurcodes" optional value={d.customColors} onChange={(v) => upd("design", { customColors: v })} example="#1a3c5e en #e8b04b. Je huisstijl kun je uploaden bij 'Bestanden'." />}
        {d.palette === "logo" && <p className="note info">Upload je logo bij de stap 'Bestanden'. We stellen daarna kleuren voor en jij bevestigt ze.</p>}
      </>
    ),
    sfeer: (
      <>
        <Choice legend="Licht of donker?" value={d.mode} onChange={(v) => upd("design", { mode: v as Intake["design"]["mode"] })} options={[{ id: "licht", label: "Licht" }, { id: "donker", label: "Donker" }, { id: "advies", label: "Adviseer mij" }]} />
        <Choice legend="Wat staat centraal?" value={d.imagery} onChange={(v) => upd("design", { imagery: v as Intake["design"]["imagery"] })} options={[{ id: "foto", label: "Foto's", hint: "Beeld bepaalt de sfeer" }, { id: "tekst", label: "Rustig en tekstgericht" }, { id: "advies", label: "Adviseer mij" }]} />
        <Choice legend="Beweging op de pagina" value={d.motion} onChange={(v) => upd("design", { motion: v as Intake["design"]["motion"] })} options={[{ id: "subtiel", label: "Subtiele beweging" }, { id: "geen", label: "Geen beweging" }, { id: "advies", label: "Adviseer mij" }]} />
        {preview}
      </>
    ),
    inspiratie: (
      <>
        <p className="muted">Maximaal drie websites. We gebruiken ze om je smaak te begrijpen; we nemen geen teksten, beelden of complete vormgeving over.</p>
        {d.inspiration.map((x, k) => (
          <div className="item" key={k}>
            <div className="item-head"><strong style={{ overflowWrap: "anywhere" }}>{x.url}</strong>
              <button type="button" className="btn btn-ghost" onClick={() => upd("design", { inspiration: d.inspiration.filter((_, y) => y !== k) })}>Verwijder<span className="sr-only"> link {k + 1}</span></button></div>
            <p className="small muted" style={{ margin: 0 }}>{x.note || "Geen toelichting"}</p>
          </div>
        ))}
        {d.inspiration.length < 3 && (
          <div className="item">
            <Text label="Adres van de website" type="url" value={draftLink.url} onChange={(v) => setDraftLink({ ...draftLink, url: v })} example="https://www.voorbeeld.nl" error={err("draftLink")} />
            <Text label="Wat spreekt je hierin aan?" optional value={draftLink.note} onChange={(v) => setDraftLink({ ...draftLink, note: v })} example="De rustige indeling en de grote foto's." />
            <button type="button" className="btn btn-secondary" disabled={!draftLink.url.trim()} onClick={() => {
              if (!isHttpUrl(draftLink.url.trim())) { setError({ field: "draftLink", message: "Vul een volledig adres in dat begint met https://" }); return; }
              setError(null); upd("design", { inspiration: [...d.inspiration, { url: draftLink.url.trim(), note: draftLink.note }] }); setDraftLink({ url: "", note: "" });
            }}>Voeg link toe</button>
          </div>
        )}
      </>
    ),
    paginas: (
      <>
        <Multi legend="Kies de pagina's die je wilt" options={PAGES} values={c.pages} onToggle={(id) => upd("content", { pages: toggle(c.pages, id), pagesAdvice: false })}
          note="Dit is je wens. Hoeveel pagina's binnen het basispakket vallen, bevestigen we in je overzicht voordat je akkoord geeft." />
        <Check checked={c.pagesAdvice} onChange={(v) => upd("content", { pagesAdvice: v, ...(v ? { pages: [] } : {}) })}>Adviseer mij: stel een indeling voor die bij mijn bedrijf past.</Check>
      </>
    ),
    gegevens: (
      <>
        <p className="muted">Deze gegevens komen zichtbaar op je website. Je eigen gegevens voor de administratie vragen we later apart.</p>
        <div className="grid2">
          <Text label="Telefoonnummer" optional type="tel" value={c.phone} onChange={(v) => upd("content", { phone: v })} example="0591 12 34 56" />
          <Text label="E-mailadres" optional type="email" value={c.email} onChange={(v) => upd("content", { email: v })} example="info@mijnbedrijf.nl" error={err("content.email")} />
        </div>
        <Text label="Adres" optional value={c.address} onChange={(v) => upd("content", { address: v })} example="Hoofdstraat 1, 7811 AA Emmen" />
        {c.address && <Choice legend="Mag dit adres op de website staan?" value={c.addressPublic} onChange={(v) => upd("content", { addressPublic: v as "ja" | "nee" })} options={[{ id: "ja", label: "Ja, openbaar" }, { id: "nee", label: "Nee, niet tonen" }]} />}
        <Text label="Openingstijden" optional multiline value={c.hours} onChange={(v) => upd("content", { hours: v })} example="di t/m vr 9.00–17.30, za 9.00–16.00" />
        <div className="grid2">
          <Text label="Sociale media" optional value={c.socials} onChange={(v) => upd("content", { socials: v })} example="instagram.com/mijnbedrijf" />
          <Text label="Bestaande domeinnaam" optional value={c.domain} onChange={(v) => upd("content", { domain: v })} example="mijnbedrijf.nl" />
        </div>
        <Text label="Over je bedrijf" optional multiline value={c.about} onChange={(v) => upd("content", { about: v })} example="In 2011 begonnen als eenmanszaak, nu een team van vier vakmensen uit Emmen." />
      </>
    ),
    branchevragen: (
      <>
        {sectorQs.map((q) => (
          <Text key={q.id} label={q.label} optional multiline value={c.sectorAnswers[`${b.sector}.${q.id}`] ?? ""} example={q.example.replace(/^Bijv\. /, "")}
            onChange={(v) => upd("content", { sectorAnswers: { ...c.sectorAnswers, [`${b.sector}.${q.id}`]: v } })} />
        ))}
        <Text label="Wat moet er absoluut op staan?" optional multiline value={c.mustHave} onChange={(v) => upd("content", { mustHave: v })} example="Dat we ook op zaterdag werken." />
        <Text label="Wat mag juist níet openbaar worden?" optional multiline value={c.mustNotPublish} onChange={(v) => upd("content", { mustNotPublish: v })} example="Mijn privéadres en mobiele nummer." />
      </>
    ),
    teksten: (
      <>
        <Choice wide legend="Wie zorgt voor de teksten?" value={c.texts} onChange={(v) => upd("content", { texts: v as Intake["content"]["texts"] })}
          options={[
            { id: "zelf", label: "Ik lever teksten zelf aan" },
            { id: "bestaand", label: "Gebruik mijn bestaande teksten", hint: "Ik mag deze teksten gebruiken" },
            { id: "voorstel", label: "Ik wil een tekstvoorstel", hint: "Op basis van mijn antwoorden" },
          ]} />
        {c.texts === "voorstel" && <p className="note">Of een tekstvoorstel binnen het basispakket valt, staat nog niet vast. Je ziet dit in je overzicht voordat je akkoord geeft.</p>}
        <Text label="In welke taal of talen wil je de website?" value={c.languages} onChange={(v) => upd("content", { languages: v })} example="Nederlands" />
        <p className="small muted">Meer dan één taal is extra werk en bevestigen we apart.</p>
      </>
    ),
    bestanden: (
      <>
        {!session ? savePanel("Om bestanden veilig te kunnen opslaan, bewaren we eerst je intake. Daarna kun je uploaden.") : (
          <>
            <div className="item">
              <div className="grid2">
                <div className="field"><label htmlFor="purpose">Wat upload je?</label>
                  <select id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)}>{PURPOSES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select></div>
                <Text label="Waar wil je het gebruiken?" optional value={placement} onChange={setPlacement} example="bovenaan de homepage" />
              </div>
              <div className="field">
                <label htmlFor="files">Kies bestanden</label>
                <input id="files" type="file" multiple accept=".jpg,.jpeg,.png,.webp,.svg,.pdf" disabled={busy} onChange={(e) => { void upload(e.target.files); e.target.value = ""; }} />
                <p className="small muted">JPG, PNG, WebP, SVG of PDF, maximaal 8 MB per bestand. Upload nooit wachtwoorden of inloggegevens.</p>
              </div>
              {busy && <p role="status">Bezig met uploaden…</p>}
              {uploadErrors.length > 0 && <div role="alert">{uploadErrors.map((e) => <p className="err" key={e}>{e}</p>)}</div>}
            </div>
            {assets.length > 0 && (
              <ul className="files" aria-label="Geüploade bestanden">
                {assets.map((a) => (
                  <li key={a.id}>
                    <span className="thumb">{thumbs[a.id] ? <img src={thumbs[a.id]} alt="" /> : a.mime.split("/")[1].replace("+xml", "").toUpperCase()}</span>
                    <span><strong style={{ overflowWrap: "anywhere" }}>{a.name}</strong><br /><span className="small muted">{label(PURPOSES, a.purpose)}{a.placement && ` · ${a.placement}`} · {Math.ceil(a.size / 1024)} kB</span></span>
                    <button type="button" className="btn btn-ghost" onClick={() => removeFile(a)}>Verwijder<span className="sr-only"> {a.name}</span></button>
                  </li>
                ))}
              </ul>
            )}
            {missingFiles.length > 0 && <p className="note">Nog niet aangeleverd: {missingFiles.join(", ").toLowerCase()}. Je kunt dit ook later doen.</p>}
          </>
        )}
        <Choice wide legend="Hoe zit het met foto's?" value={m.photos} onChange={(v) => upd("media", { photos: v as Intake["media"]["photos"] })}
          options={[{ id: "upload", label: "Ik upload mijn foto's hier" }, { id: "later", label: "Ik lever foto's later aan" }, { id: "bespreken", label: "Ik heb geen foto's: bespreek de beeldkeuze met mij" }]} />
        {m.photos === "bespreken" && <p className="note">Beeld zoeken of maken is geen vast onderdeel van het pakket. We bespreken de mogelijkheden en eventuele kosten vooraf met je.</p>}
        <Check checked={m.rightsConfirmed} onChange={(v) => upd("media", { rightsConfirmed: v })}>Ik bevestig dat ik het materiaal dat ik aanlever mag gebruiken op mijn website.</Check>
        <Choice legend="Wil je reacties van klanten tonen?" value={m.referencesConsent} onChange={(v) => upd("media", { referencesConsent: v as "ja" | "nee" })}
          options={[{ id: "ja", label: "Ja, ik lever ze aan", hint: "Met toestemming van de klant" }, { id: "nee", label: "Nee" }]} />
        <p className="small muted">Wij schrijven of verzinnen geen reviews.</p>
      </>
    ),
    functies: (
      <>
        <Multi legend="Kies wat je nodig hebt" options={FEATURES} values={m.features} onToggle={(id) => upd("media", { features: toggle(m.features, id) })} />
        {m.features.includes("afspraakaanvraag") && <p className="note info">Een afspraakaanvraag is een formulier: jij bevestigt de afspraak zelf. Het is geen agenda waarin klanten direct een tijd vastleggen.</p>}
        {m.features.includes("boekingslink") && <Text label="Welk boekingssysteem gebruik je?" value={m.bookingProvider} onChange={(v) => upd("media", { bookingProvider: v })} example="de naam van het systeem en de link naar je boekingspagina" />}
        <Multi legend="Uitgebreidere functies (apart te beoordelen)" options={EXTRA_FEATURES} values={m.extraFeatures} onToggle={(id) => upd("media", { extraFeatures: toggle(m.extraFeatures, id) })}
          note={`Deze functies vallen niet automatisch onder de ${euro(pricing.oneOff)} of de ${delivery.days} dagen. We beoordelen ze apart en je krijgt eerst een prijsafspraak.`} />
        {m.extraFeatures.length > 0 && (
          <Text label="Wat moet het precies doen, en met welk systeem?" optional multiline value={m.integrationNotes} onChange={(v) => upd("media", { integrationNotes: v })}
            example="Klanten moeten direct een tijd kunnen kiezen in mijn bestaande agenda." />
        )}
        <p className="small muted">Vul hier geen wachtwoorden of inlogcodes in. Die wisselen we zo nodig later uit via een aparte, veilige weg.</p>
      </>
    ),
    naam: (
      <>
        <p className="note info">Naam en logo samen: {euro(pricing.nameLogo)} eenmalig extra. Het aantal voorstellen, de correctierondes en de bestandsformaten leggen we vast in je afspraken. Eerst keur je naam en logo goed, daarna start de bouw van je website.</p>
        {b.keepName === "ja"
          ? <p>Je houdt je bestaande naam: <strong>{b.businessName || "(nog niet ingevuld)"}</strong>. We maken er een logo bij.</p>
          : <>
              <Text label="Welke toon moet de naam hebben?" value={n.tone} onChange={(v) => upd("naming", { tone: v })} example="Betrouwbaar en lokaal, niet te hip." />
              <div className="grid2">
                <Text label="Taal van de naam" optional value={n.language} onChange={(v) => upd("naming", { language: v })} example="Nederlands" />
                <Text label="Gewenste naamstijl" optional value={n.nameStyle} onChange={(v) => upd("naming", { nameStyle: v })} example="Kort, één woord, eventueel met mijn achternaam" />
                <Text label="Woorden die erin mogen" optional value={n.wordsYes} onChange={(v) => upd("naming", { wordsYes: v })} example="hout, werkplaats" />
                <Text label="Woorden die er niet in mogen" optional value={n.wordsNo} onChange={(v) => upd("naming", { wordsNo: v })} example="geen 'solutions'" />
              </div>
            </>}
        <Text label="Wat beloof je je klanten?" value={n.promise} onChange={(v) => upd("naming", { promise: v })} example="Maatwerk meubels die een leven lang meegaan." />
        <p className="small muted">Naamvoorstellen zijn niet juridisch gecontroleerd. Of een naam vrij is als handelsnaam, merk of domeinnaam moet apart worden nagegaan.</p>
      </>
    ),
    logo: (
      <>
        <Choice legend="Wat voor logo wil je?" value={n.logoType} onChange={(v) => upd("naming", { logoType: v as Intake["naming"]["logoType"] })}
          options={[{ id: "woordmerk", label: "Woordmerk", hint: "Alleen de naam, in een eigen letter" }, { id: "beeldmerk", label: "Beeldmerk met naam", hint: "Een teken met de naam erbij" }, { id: "advies", label: "Adviseer mij" }]}
          render={(o) => o.id === "advies" ? null : (
            <span aria-hidden="true" style={{ display: "flex", alignItems: "center", gap: 8, height: 44, fontFamily: "var(--serif)", fontSize: "1.3rem" }}>
              {o.id === "beeldmerk" && <i style={{ width: 26, height: 26, borderRadius: "50% 50% 0 50%", background: "var(--ink)" }} />}Naam
            </span>
          )} />
        <Text label="Kleurvoorkeuren voor het logo" optional value={n.colorPrefs} onChange={(v) => upd("naming", { colorPrefs: v })} example="Donkergroen, geen rood." />
        <Text label="Waar ga je het logo gebruiken?" optional value={n.uses} onChange={(v) => upd("naming", { uses: v })} example="Website, werkkleding en visitekaartjes." />
      </>
    ),
    administratie: (
      <>
        <p className="muted">Deze gegevens zijn alleen voor ons, om contact met je op te nemen over je aanvraag. Ze komen niet op je website.</p>
        <Text label="Je naam" autoComplete="name" value={intake.billing.contactName} onChange={(v) => upd("billing", { contactName: v })} error={err("billing.contactName")} />
        <Text label="Je e-mailadres" type="email" autoComplete="email" value={intake.billing.email} onChange={(v) => upd("billing", { email: v })} error={err("billing.email")} />
        <div className="grid2">
          <Text label="Telefoonnummer" optional type="tel" autoComplete="tel" value={intake.billing.phone} onChange={(v) => upd("billing", { phone: v })} />
          <Text label="Bedrijfsnaam voor de administratie" optional autoComplete="organization" value={intake.billing.companyName} onChange={(v) => upd("billing", { companyName: v })} />
        </div>
        <Text label="Nog iets dat we moeten weten?" optional multiline value={intake.billing.notes} onChange={(v) => upd("billing", { notes: v })} />
        {!session && savePanel("Nog niet klaar? Bewaar je voortgang en ga later verder via een persoonlijke link.")}
      </>
    ),
    controle: (() => {
      const R = ({ title, to, rows }: { title: string; to: StepId; rows: [string, string][] }) => (
        <section className="review">
          <div className="review-head"><h2>{title}</h2><button type="button" className="btn btn-ghost" onClick={() => go(to)}>Wijzigen<span className="sr-only"> {title}</span></button></div>
          <dl>{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v || <span className="muted">Nog niet ingevuld</span>}</dd></div>)}</dl>
        </section>
      );
      const crit = missing.filter((x) => x.critical);
      return (
        <>
          <p className="muted">Dit is je briefing. Klopt alles? Je kunt elk onderdeel nog aanpassen.</p>
          <R title="Jouw bedrijf" to="branche" rows={[
            ["Bedrijfsnaam", b.businessName || (intake.extras.nameLogo ? "Wordt samen gemaakt" : "")],
            ["Branche", label(SECTORS, b.sector)], ["Aanbod", b.offerings.map((o) => o.name).join(", ")]]} />
          <R title="Doel en doelgroep" to="actie" rows={[
            ["Hoofdactie", label(ACTIONS, g.primaryAction)], ["Tweede actie", label(ACTIONS, g.secondaryAction) || "Geen"], ["Klanten", [g.customerType, g.area].filter(Boolean).join(" · ")]]} />
          <R title="Stijl en kleuren" to="stijl" rows={[
            ["Stijl", d.styleAdvice ? "Advies van ons" : d.styles.map((s) => label(STYLES, s) + (s === d.leadStyle && d.styles.length > 1 ? " (leidend)" : "")).join(", ")],
            ["Kleuren", PALETTES.find((p) => p.id === d.palette)?.label ?? ({ eigen: "Eigen kleuren", logo: "Uit mijn logo", advies: "Advies van ons" } as Record<string, string>)[d.palette] ?? ""]]} />
          {preview}
          <R title="Pagina's en inhoud" to="paginas" rows={[
            ["Pagina's", c.pagesAdvice ? "Advies van ons" : c.pages.map((p) => label(PAGES, p)).join(", ")],
            ["Teksten", ({ zelf: "Lever ik zelf aan", bestaand: "Bestaande teksten", voorstel: "Tekstvoorstel gewenst" } as Record<string, string>)[c.texts] ?? ""],
            ["Contact op de website", [c.phone, c.email].filter(Boolean).join(" · ")]]} />
          <R title="Beelden en functies" to="bestanden" rows={[
            ["Bestanden", assets.length ? `${assets.length} geüpload` : "Geen"],
            ["Functies", m.features.map((f) => label(FEATURES, f)).join(", ") || "Geen gekozen"],
            ["Apart te beoordelen", m.extraFeatures.map((f) => label(EXTRA_FEATURES, f) + " — eerst prijsafspraak").join(", ") || "Geen"]]} />
          <R title="Jouw gegevens (niet op de website)" to="administratie" rows={[["Naam", intake.billing.contactName], ["E-mail", intake.billing.email]]} />

          <div className="pricebox">
            <h2 style={{ fontSize: "1.15rem" }}>Prijs</h2>
            <table>
              <tbody>
                <tr><td>Website, eenmalig</td><td>{euro(pricing.oneOff)}</td></tr>
                {intake.extras.nameLogo && <tr><td>Naam en logo, eenmalig</td><td>{euro(pricing.nameLogo)}</td></tr>}
                <tr className="sum"><td>Eenmalig totaal</td><td data-testid="eenmalig">{euro(price.oneOff)}</td></tr>
                <tr><td>Hosting en service, per maand</td><td>{euro(price.monthly)}</td></tr>
                <tr><td>Jaar 1 bij 12 maanden</td><td data-testid="jaar1">{euro(price.year1)}</td></tr>
              </tbody>
            </table>
            <p className="small muted" style={{ margin: "10px 0 14px" }}>{pricing.vatLabel}. Meerwerk krijgt altijd eerst een prijsafspraak; er komen geen onverwachte toeslagen bij.</p>
            <Check checked={intake.extras.nameLogo} onChange={(v) => { setNameLogo(v); if (v && !b.missingIdentity) upd("business", { missingIdentity: "naamlogo" }); if (!v && b.missingIdentity === "naamlogo") upd("business", { missingIdentity: "" }); }}>
              Laat ook een naam en logo maken (+ {euro(pricing.nameLogo)} eenmalig)
            </Check>
          </div>

          <section className="review">
            <h2>Wanneer gaan de {delivery.days} dagen in?</h2>
            <p>{delivery.startCondition}</p>
            {crit.length > 0 ? (
              <>
                <p><strong>Dit hebben we nog nodig voordat de termijn kan starten:</strong></p>
                <ul className="ticks plain" data-testid="ontbreekt">{crit.map((x) => <li key={x.key}>{x.label}</li>)}</ul>
                <p className="small muted">Je kunt je aanvraag nu al versturen; we vullen het daarna samen aan.</p>
              </>
            ) : <p className="status-ok">Je intake bevat alle essentiële onderdelen.</p>}
          </section>

          <Check checked={submitConsent} onChange={setSubmitConsent}>Ik geef toestemming om mijn antwoorden en bestanden op te slaan en te gebruiken om mijn aanvraag te behandelen en contact met mij op te nemen.</Check>
          {error && <p className="err" role="alert" data-testid="fout">{error.message}</p>}
          <button type="button" className="btn btn-primary" disabled={busy} onClick={submit} data-testid="verstuur">{busy ? "Bezig met versturen…" : "Verstuur mijn aanvraag"}</button>
          <p className="small muted" style={{ marginTop: 12 }}>Een aanvraag is geen bestelling. Je betaalt nu niets; eerst bevestig je inhoud, prijs en planning.</p>
        </>
      );
    })(),
  };

  const last = idx === steps.length - 1;
  return (
    <div className="wz">
      <header className="wz-top">
        <div className="wrap">
          <Link href="/" className="logo" style={{ marginRight: 0 }} aria-label={`${brand.name}, terug naar de website`}><span className="logo-mark" aria-hidden="true" /></Link>
          <div className="wz-progress" role="group" aria-label="Voortgang">
            <ol aria-hidden="true">{groups.map((gi) => <li key={gi} className={gi < step.g ? "done" : gi === step.g ? "now" : ""} />)}</ol>
            <p>Onderdeel {groups.indexOf(step.g) + 1} van {groups.length}: {GROUPS[step.g]} · vraag {idx + 1} van {steps.length}</p>
          </div>
          {session && <span className="small muted" role="status">{saveState === "saving" ? "Bewaren…" : saveState === "error" ? "Niet bewaard" : "Bewaard"}</span>}
        </div>
      </header>
      <main className="wz-main">
        <div className="wrap">
          {resumeMsg && <p className="note info" role="status">{resumeMsg}</p>}
          <p className="eyebrow">Stel mijn website samen</p>
          <h1 ref={heading} tabIndex={-1}>{step.title}</h1>
          {confirm && (
            <div className="dialog" role="alertdialog" aria-label="Bevestig je keuze">
              <p><strong>{confirm.message}</strong></p>
              <div className="btn-row">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => { confirm.drop(); setConfirm(null); }}>Ja, laat vervallen</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirm(null)}>Nee, bewaar ze</button>
              </div>
            </div>
          )}
          {body[step.id]}
        </div>
      </main>
      <footer className="wz-foot">
        <div className="wrap">
          <button type="button" className="btn btn-secondary" onClick={back} disabled={idx === 0}>Terug</button>
          {!last && <button type="button" className="btn btn-primary" onClick={next} data-testid="volgende">Volgende</button>}
        </div>
      </footer>
    </div>
  );
}
