/**
 * Maakt van de statische export (out/) een versie die vanuit een submap kan
 * draaien, met alleen relatieve paden (nodig voor een claude.ai preview-link).
 *
 *   BT_EXPORT=1 NEXT_PUBLIC_CONCEPT=1 npx next build && node scripts/maak-preview.mjs
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OUT = path.resolve("out");
const routes = ["assortiment", "cadeaus", "contact", "over-tanja"];

if (fs.existsSync(path.join(OUT, "_next"))) fs.renameSync(path.join(OUT, "_next"), path.join(OUT, "nx"));

const bestanden = [];
const loop = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    e.isDirectory() ? loop(p) : bestanden.push(p);
  }
};
loop(OUT);

for (const f of bestanden) {
  const ext = path.extname(f);
  if (![".html", ".js", ".css", ".txt"].includes(ext)) continue;
  let s = fs.readFileSync(f, "utf8");
  if (ext === ".css") {
    s = s.replaceAll("/_next/static/media/", "../media/");
  } else {
    s = s.replaceAll("/_next/", "./nx/").replaceAll("/fotos/", "./fotos/");
    for (const r of routes) s = s.replaceAll(`"/${r}`, `"./${r}`);
    s = s.replaceAll('href="/"', 'href="./"').replaceAll('\\"href\\":\\"/\\"', '\\"href\\":\\"./\\"').replaceAll('href:"/"', 'href:"./"');
    s = s.replaceAll("�", "\\ufffd");
  }
  fs.writeFileSync(f, s);
}

for (const f of bestanden.filter((f) => f.endsWith(".jpg"))) {
  const buf = await sharp(f).resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true, progressive: true }).toBuffer();
  fs.writeFileSync(f, buf);
}
console.log("Preview klaar in out/");
