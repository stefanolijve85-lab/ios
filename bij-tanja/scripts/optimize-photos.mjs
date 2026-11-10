/**
 * Fotoverwerking voor Bij Tanja
 * ------------------------------------------------------------
 * Zet je eigen foto's in  fotos/origineel/  en draai:
 *
 *     npm run fotos
 *
 * Het script:
 *  - leest JPG, JPEG, PNG, WebP en HEIC/HEIF
 *  - draait de foto rechtop (EXIF-oriëntatie) en verwijdert GPS/metadata
 *  - verkleint naar max. 2400 px breed (originelen blijven ongewijzigd)
 *  - schrijft een web-JPG naar  public/fotos/bij-tanja/<naam>.jpg
 *  - schrijft afmetingen + een kleine blur-preview naar
 *    src/content/fotos.generated.ts (niet met de hand aanpassen)
 *  - meldt welke foto's nog niet in src/content/fotos.ts staan
 *
 * Next.js levert de foto's daarna automatisch als AVIF/WebP in het
 * juiste formaat per scherm.
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const IN = path.join(ROOT, "fotos", "origineel");
const OUT = path.join(ROOT, "public", "fotos", "bij-tanja");
const MANIFEST = path.join(ROOT, "src", "content", "fotos.ts");
const GENERATED = path.join(ROOT, "src", "content", "fotos.generated.ts");
const MAX_WIDTH = 2400;
const OK = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"]);

const slug = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

async function readInput(file) {
  const ext = path.extname(file).toLowerCase();
  const buf = await fs.readFile(file);
  if (ext !== ".heic" && ext !== ".heif") return buf;
  // HEIC: eerst proberen met sharp, anders met het optionele pakket heic-convert.
  try {
    await sharp(buf).metadata();
    return buf;
  } catch {
    try {
      const { default: convert } = await import("heic-convert");
      return Buffer.from(await convert({ buffer: buf, format: "JPEG", quality: 0.95 }));
    } catch {
      throw new Error(
        `HEIC kan niet gelezen worden. Installeer eenmalig:  npm i -D heic-convert  (of exporteer de foto als JPG).`
      );
    }
  }
}

await fs.mkdir(OUT, { recursive: true });
let files = [];
try {
  files = (await fs.readdir(IN)).filter((f) => OK.has(path.extname(f).toLowerCase()));
} catch {
  console.error(`Map niet gevonden: ${IN}\nMaak hem aan en zet je foto's erin.`);
  process.exit(1);
}

const manifest = await fs.readFile(MANIFEST, "utf8").catch(() => "");
const missing = [];

for (const f of files) {
  const name = slug(path.parse(f).name) + ".jpg";
  const target = path.join(OUT, name);
  try {
    const input = await readInput(path.join(IN, f));
    const info = await sharp(input)
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true, progressive: true })
      .toFile(target);
    console.log(`✓ ${f}  →  public/fotos/bij-tanja/${name}  (${info.width}×${info.height}, ${Math.round(info.size / 1024)} KB)`);
    if (!manifest.includes(`"${name}"`)) missing.push(name);
  } catch (e) {
    console.error(`✗ ${f}: ${e.message}`);
  }
}

// Afmetingen en blur-preview voor ALLE web-foto's (ook die je handmatig in public zette)
const meta = {};
for (const f of (await fs.readdir(OUT)).filter((f) => OK.has(path.extname(f).toLowerCase())).sort()) {
  const img = sharp(path.join(OUT, f));
  const { width, height } = await img.metadata();
  const tiny = await img.clone().resize(16).jpeg({ quality: 50 }).toBuffer();
  meta[f] = { width, height, blurDataURL: `data:image/jpeg;base64,${tiny.toString("base64")}` };
}
await fs.writeFile(
  GENERATED,
  `// Automatisch gegenereerd door \`npm run fotos\`. Niet met de hand aanpassen.\n` +
    `export const fotoMeta: Record<string, { width: number; height: number; blurDataURL: string }> = ${JSON.stringify(meta, null, 2)};\n`
);
console.log(`\n✓ ${Object.keys(meta).length} foto's vastgelegd in src/content/fotos.generated.ts`);

if (missing.length) {
  console.log(`\nNog niet in src/content/fotos.ts (voeg ze toe om ze te tonen):`);
  for (const m of missing) console.log(`  - ${m}`);
}
console.log(`\nKlaar. ${files.length} foto('s) verwerkt.`);
