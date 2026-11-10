/** Validatie van uploads: type op basis van inhoud (niet de bestandsnaam), grootte en veilige SVG. */

export const MAX_FILE_BYTES = 8 * 1024 * 1024;
export const MAX_FILES = 25;
export const ALLOWED_LABEL = "JPG, PNG, WebP, SVG of PDF, maximaal 8 MB per bestand";

export type Checked = { ok: true; mime: string; width: number | null; height: number | null } | { ok: false; message: string };

function pngSize(b: Buffer) { return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) }; }
function jpegSize(b: Buffer) {
  let o = 2;
  while (o + 9 < b.length) {
    if (b[o] !== 0xff) return null;
    const m = b[o + 1];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc)
      return { height: b.readUInt16BE(o + 5), width: b.readUInt16BE(o + 7) };
    o += 2 + b.readUInt16BE(o + 2);
  }
  return null;
}

/** SVG mag geen scripts, event-handlers, externe verwijzingen of ingesloten HTML bevatten. */
export function svgIsSafe(text: string): boolean {
  if (!/<svg[\s>]/i.test(text)) return false;
  const bad = [
    /<\s*script/i, /<\s*foreignObject/i, /<\s*iframe/i, /<\s*embed/i, /<\s*object/i, /<\s*animate/i, /<\s*set[\s>]/i,
    /\son[a-z]+\s*=/i, /javascript\s*:/i, /<!ENTITY/i, /<!DOCTYPE[^>]*\[/i,
    /(?:href|src)\s*=\s*["']\s*(?!#|data:image\/(?:png|jpeg|webp);)/i, /url\(\s*["']?\s*(?!#)/i, /@import/i,
  ];
  return !bad.some((re) => re.test(text));
}

export function checkUpload(data: Buffer): Checked {
  if (data.length === 0) return { ok: false, message: "Het bestand is leeg." };
  if (data.length > MAX_FILE_BYTES) return { ok: false, message: "Het bestand is groter dan 8 MB." };
  if (data.length > 24 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return { ok: true, mime: "image/png", ...pngSize(data) };
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
    const s = jpegSize(data);
    return { ok: true, mime: "image/jpeg", width: s?.width ?? null, height: s?.height ?? null };
  }
  if (data.length > 12 && data.toString("latin1", 0, 4) === "RIFF" && data.toString("latin1", 8, 12) === "WEBP")
    return { ok: true, mime: "image/webp", width: null, height: null };
  if (data.toString("latin1", 0, 5) === "%PDF-") return { ok: true, mime: "application/pdf", width: null, height: null };
  const head = data.toString("utf8", 0, Math.min(data.length, 600)).trimStart();
  if (head.startsWith("<?xml") || head.startsWith("<svg")) {
    if (data.length > 1024 * 1024) return { ok: false, message: "Een SVG mag maximaal 1 MB zijn." };
    return svgIsSafe(data.toString("utf8"))
      ? { ok: true, mime: "image/svg+xml", width: null, height: null }
      : { ok: false, message: "Deze SVG bevat scripts of externe verwijzingen en kan niet veilig worden verwerkt. Lever het logo aan als PNG of als opgeschoonde SVG." };
  }
  return { ok: false, message: `Dit bestandstype wordt niet ondersteund. Gebruik ${ALLOWED_LABEL}.` };
}

/** Headers voor afgeschermde downloads: nooit inline uitvoeren. */
export function downloadHeaders(name: string, mime: string, inlineImage = false): HeadersInit {
  const safe = name.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "bestand";
  const inline = inlineImage && ["image/png", "image/jpeg", "image/webp"].includes(mime);
  return {
    "Content-Type": inline ? mime : "application/octet-stream",
    "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${safe}"`,
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; sandbox",
    "Cache-Control": "private, no-store",
  };
}
