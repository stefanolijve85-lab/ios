import type { MapDef } from '../maps/types';

/** City briefing: what makes each map different, drawn as a schematic map plus short notes per side. */

type Lang = 'nl' | 'en';
interface Feature { icon: string; title: string; text: string }
interface Brief { intro: string; features: Feature[]; defTip: string; lootTip: string }

export const CITY_BRIEF: Record<string, Record<Lang, Brief>> = {
  paris: {
    nl: {
      intro: 'Een plein met fontein, omringd door Haussmann-gevels. De oefenkaart: overzichtelijk, met vier aanvoerroutes.',
      features: [
        { icon: '⛲', title: 'Fontein in het midden', text: 'De fontein is een obstakel: iedereen loopt eromheen. Hij verdeelt het plein in een linker- en rechterhelft.' },
        { icon: '➜', title: 'Vier aanvoerroutes', text: 'Noordwest, noordoost, de voetgangersstraat in het zuiden en de westelijke passage.' },
        { icon: '🛡', title: 'Dienstweg oost', text: 'Hier komen de versterkingen van de verdediging binnen.' },
      ],
      defTip: 'De juwelier ligt het verst van de versterkingen in het oosten: zet je eerste barrière op de route die daar het dichtst bij ligt.',
      lootTip: 'De westelijke passage ligt ver van de dienstweg: daar is de beveiliging het traagst.',
    },
    en: {
      intro: 'A fountain square framed by Haussmann facades. The training map: easy to read, with four approaches.',
      features: [
        { icon: '⛲', title: 'Fountain in the middle', text: 'The fountain is an obstacle everyone walks around. It splits the square into a left and right half.' },
        { icon: '➜', title: 'Four approaches', text: 'North-west, north-east, the southern pedestrian street and the west passage.' },
        { icon: '🛡', title: 'East service road', text: 'Defence reinforcements arrive here.' },
      ],
      defTip: 'The jeweller is farthest from the reinforcements in the east: put your first barrier on the route closest to it.',
      lootTip: 'The west passage is far from the service road: security is slowest there.',
    },
  },
  amsterdam: {
    nl: {
      intro: 'Een gracht scheidt de winkelkade van het plein. Wie de bruggen beheerst, beheerst de kaart.',
      features: [
        { icon: '🌊', title: 'Gracht', text: 'Het water is niet over te steken. Je kunt alleen via de twee bruggen naar de overkant.' },
        { icon: '🌉', title: 'Twee bruggen', text: 'Elke brug is een knelpunt. Je mag één brug afsluiten, maar nooit allebei: er moet altijd een route open blijven.' },
        { icon: '➜', title: 'Drie aanvoerroutes', text: 'De westkade, het zuidplein en de oostkade.' },
      ],
      defTip: 'Een schildteam op een brug houdt een hele groep op. Sluit de andere brug af met een barrière.',
      lootTip: 'Kijk welke brug bewaakt wordt en stuur je groep over de andere. De kades langs de gracht zijn lang: dragers met veel buit zijn daar kwetsbaar.',
    },
    en: {
      intro: 'A canal separates the shopping quay from the square. Whoever controls the bridges controls the map.',
      features: [
        { icon: '🌊', title: 'Canal', text: 'The water cannot be crossed. The two bridges are the only way over.' },
        { icon: '🌉', title: 'Two bridges', text: 'Each bridge is a choke point. You may block one, never both: a route must always stay open.' },
        { icon: '➜', title: 'Three approaches', text: 'West quay, south square and east quay.' },
      ],
      defTip: 'A shield team on one bridge holds up a whole group. Block the other bridge with a barrier.',
      lootTip: 'Check which bridge is guarded and send your group over the other one. The quays are long: loaded carriers are exposed there.',
    },
  },
  london: {
    nl: {
      intro: 'Een drukke winkelstraat met een overdekte passage en een metro-ingang midden op straat.',
      features: [
        { icon: '🚇', title: 'Metrotrap', text: 'Plunderaars kunnen midden op straat uit de metro komen, dicht bij de winkels. Ook vluchten kan via de trap.' },
        { icon: '🏬', title: 'Overdekte passage', text: 'In de passage is het zicht slecht: beveiliging ziet daar maar half zo ver.' },
        { icon: '➜', title: 'Vier aanvoerroutes', text: 'De metrotrap, de passage, de oostelijke en de westelijke straat.' },
      ],
      defTip: 'Houd een team bij de metrotrap: van daar ben je in een paar seconden bij elke winkel.',
      lootTip: 'De passage is je beste vluchtroute: daar worden je dragers het laatst opgemerkt.',
    },
    en: {
      intro: 'A busy high street with a covered shopping passage and an Underground entrance in the middle of the road.',
      features: [
        { icon: '🚇', title: 'Underground stairs', text: 'Looters can appear from the Underground mid-street, close to the shops, and escape down it too.' },
        { icon: '🏬', title: 'Covered passage', text: 'Visibility is poor in the passage: security only sees half as far.' },
        { icon: '➜', title: 'Four approaches', text: 'The stairs, the passage, the east street and the west street.' },
      ],
      defTip: 'Keep a team near the stairs: from there every store is a few seconds away.',
      lootTip: 'The passage is your best escape route: carriers are spotted last there.',
    },
  },
  milan: {
    nl: {
      intro: 'Een piazza met aan de oostkant een lange arcade met zuilen.',
      features: [
        { icon: '🏛', title: 'Arcade', text: 'Je kunt onder de arcade door lopen. Onder het dak ziet de beveiliging maar half zo ver.' },
        { icon: '▮', title: 'Massieve zuilen', text: 'De zuilen blokkeren: je moet ertussendoor, en dat vertraagt groepen.' },
        { icon: '➜', title: 'Drie aanvoerroutes', text: 'Het noordeinde van de arcade, de weststraat en de trappen in het zuiden.' },
      ],
      defTip: 'Een camera bij de arcade compenseert het slechte zicht onder het dak.',
      lootTip: 'De elektronicazaak ligt aan de arcade, ver van de versterkingen in het westen: kom via het noorden binnen en blijf onder het dak.',
    },
    en: {
      intro: 'A piazza with a long colonnaded arcade on its east side.',
      features: [
        { icon: '🏛', title: 'Arcade', text: 'You can walk underneath the arcade. Under the roof security only sees half as far.' },
        { icon: '▮', title: 'Solid columns', text: 'Columns block movement: groups have to thread between them, which slows them down.' },
        { icon: '➜', title: 'Three approaches', text: 'The north end of the arcade, the west street and the south steps.' },
      ],
      defTip: 'A camera near the arcade makes up for the poor sight under the roof.',
      lootTip: 'The electronics store faces the arcade, far from the reinforcements in the west: come in from the north and stay under the roof.',
    },
  },
  berlin: {
    nl: {
      intro: 'Een brede straat met daarachter een binnenplaats. De juwelier zit diep in die binnenplaats.',
      features: [
        { icon: '🚪', title: 'Poort naar de binnenplaats', text: 'De binnenplaats is alleen bereikbaar via één poort. De muren zijn dicht.' },
        { icon: '🌑', title: 'Donkere doorgang', text: 'In de poort ziet de beveiliging maar half zo ver.' },
        { icon: '💎', title: 'Juwelier achterin', text: 'De juwelier ligt het verst van elke uitgang: een lange vluchtweg met volle handen.' },
      ],
      defTip: 'Eén team of schildteam in de poort beschermt de hele binnenplaats.',
      lootTip: 'Lok de beveiliging eerst naar de winkels aan de straat en ga dan pas door de poort.',
    },
    en: {
      intro: 'A wide street with a courtyard behind it. The jeweller sits deep inside that courtyard.',
      features: [
        { icon: '🚪', title: 'Gate to the courtyard', text: 'The courtyard can only be reached through one archway. The walls are solid.' },
        { icon: '🌑', title: 'Dark passage', text: 'Inside the archway security only sees half as far.' },
        { icon: '💎', title: 'Jeweller at the back', text: 'The jeweller is the farthest from any exit: a long escape with full hands.' },
      ],
      defTip: 'A single team or shield team in the archway protects the whole courtyard.',
      lootTip: 'Draw security to the street stores first, then go through the archway.',
    },
  },
  saopaulo: {
    nl: {
      intro: 'Een modern winkelplein met aan de achterkant een expeditiestraat voor bevoorrading.',
      features: [
        { icon: '🚚', title: 'Bevoorradingsvrachtwagen', text: 'Na de eerste golf (of na een minuut bij plunderen) rijdt een vrachtwagen over de expeditiestraat. Bij het laadperron levert hij één keer 200 budget op voor de verdediging.' },
        { icon: '✋', title: 'Stopt voor mensen', text: 'De vrachtwagen rijdt nooit iemand aan: wie ervoor staat, houdt hem tegen.' },
        { icon: '➜', title: 'Drie aanvoerroutes', text: 'De achterste expeditiestraat, de westlaan en het zuidplein.' },
      ],
      defTip: 'Houd de expeditiestraat vrij, dan komt de extra 200 budget snel binnen.',
      lootTip: 'Een renner voor de vrachtwagen houdt de bevoorrading van de beveiliging tegen.',
    },
    en: {
      intro: 'A modern retail forecourt with a service lane for deliveries at the back.',
      features: [
        { icon: '🚚', title: 'Supply truck', text: 'After the first wave (or after a minute when looting) a truck drives the service lane. At the loading bay it pays the defence 200 budget, once.' },
        { icon: '✋', title: 'Stops for people', text: 'The truck never runs anyone over: whoever stands in front of it holds it up.' },
        { icon: '➜', title: 'Three approaches', text: 'The rear service lane, the west avenue and the south forecourt.' },
      ],
      defTip: 'Keep the service lane clear and the extra 200 budget arrives quickly.',
      lootTip: 'A runner standing in front of the truck holds up the security’s supplies.',
    },
  },
};

const STORE_NL: Record<string, string> = { jewellery: 'Juwelier', electronics: 'Elektronica', fashion: 'Mode', sports: 'Sport', phones: 'Telefoons', department: 'Warenhuis', grocery: 'Supermarkt', cafe: 'Café', sneakers: 'Sneakers' };
const STORE_EN: Record<string, string> = { jewellery: 'Jewellery', electronics: 'Electronics', fashion: 'Fashion', sports: 'Sports', phones: 'Phones', department: 'Department store', grocery: 'Grocery', cafe: 'Café', sneakers: 'Sneakers' };

/** Schematic top-down map drawn straight from the map definition, so it can never disagree with the game. */
export function drawMinimap(cv: HTMLCanvasElement, m: MapDef, lang: Lang) {
  const b = m.bounds; const W = b.x1 - b.x0, H = b.z1 - b.z0;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  // fit both the column width and ~58% of the screen height (tall maps such as Berlin get narrower)
  const maxH = Math.max(220, window.innerHeight * 0.58);
  const cssW = Math.min(cv.parentElement?.clientWidth || 420, maxH * (W / H)); const cssH = cssW * (H / W);
  cv.style.width = `${cssW}px`; cv.style.height = `${cssH}px`; cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr);
  const c = cv.getContext('2d'); if (!c) return;
  const s = (cssW * dpr) / W;
  const X = (x: number) => (x - b.x0) * s, Z = (z: number) => (z - b.z0) * s;
  const rect = (r: { x0: number; z0: number; x1: number; z1: number }) => [X(r.x0), Z(r.z0), (r.x1 - r.x0) * s, (r.z1 - r.z0) * s] as const;
  c.fillStyle = '#3a3f47'; c.fillRect(0, 0, cv.width, cv.height); // street
  c.fillStyle = '#1f6a8f'; for (const r of m.water) c.fillRect(...rect(r));
  c.fillStyle = '#8a7a62'; for (const r of m.bridges) c.fillRect(...rect(r));
  for (const a of m.arcades) { c.strokeStyle = 'rgba(240,190,90,0.7)'; c.setLineDash([4 * dpr, 3 * dpr]); c.lineWidth = 1.5 * dpr; c.strokeRect(...rect(a.rect)); c.setLineDash([]); c.fillStyle = '#15181d'; for (const col of a.columns) { c.beginPath(); c.arc(X(col.x), Z(col.z), Math.max(1.5 * dpr, col.r * s), 0, Math.PI * 2); c.fill(); } }
  c.fillStyle = '#15181d'; for (const bd of m.buildings) c.fillRect(...rect(bd.rect));
  for (const w of m.walls) c.fillRect(...rect(w));
  c.fillStyle = '#3a3f47'; for (const bd of m.buildings) for (const ps of bd.passages ?? []) c.fillRect(...rect(ps)); // walk-through passages
  c.fillStyle = 'rgba(240,190,90,0.28)'; for (const r of m.lowSight) c.fillRect(...rect(r));
  if (m.fountain) { c.fillStyle = '#4a8fb0'; c.beginPath(); c.arc(X(m.fountain.x), Z(m.fountain.z), m.fountain.r * s, 0, Math.PI * 2); c.fill(); }
  if (m.supply) { c.strokeStyle = '#f6a13a'; c.lineWidth = 2 * dpr; c.setLineDash([6 * dpr, 4 * dpr]); c.beginPath(); m.supply.route.forEach((p, i) => (i ? c.lineTo(X(p.x), Z(p.z)) : c.moveTo(X(p.x), Z(p.z)))); c.stroke(); c.setLineDash([]);
    const lp = m.supply.route[m.supply.loadIndex]; c.fillStyle = '#f6a13a'; c.fillRect(X(lp.x) - 4 * dpr, Z(lp.z) - 4 * dpr, 8 * dpr, 8 * dpr); }
  // sockets
  for (const so of m.sockets) { c.fillStyle = so.size === 'large' ? 'rgba(120,220,140,0.75)' : 'rgba(120,200,240,0.75)'; c.beginPath(); c.arc(X(so.x), Z(so.z), (so.size === 'large' ? 3 : 2.2) * dpr, 0, Math.PI * 2); c.fill(); }
  // defender staging
  c.fillStyle = '#4f8cff'; c.beginPath(); c.arc(X(m.defenderSpawn.x), Z(m.defenderSpawn.z), 5 * dpr, 0, Math.PI * 2); c.fill();
  const font = (px: number) => `600 ${px * dpr}px Barlow, system-ui, sans-serif`;
  // stores
  const names = lang === 'nl' ? STORE_NL : STORE_EN;
  m.stores.forEach((st, i) => {
    const w = st.width * s, x = X(st.front.x), z = Z(st.front.z);
    const horiz = Math.abs(st.normal.z) > 0.5;
    c.fillStyle = '#' + st.color.toString(16).padStart(6, '0'); c.strokeStyle = '#ffd38a'; c.lineWidth = 2 * dpr;
    if (horiz) { c.fillRect(x - w / 2, z - 3 * dpr, w, 6 * dpr); c.strokeRect(x - w / 2, z - 3 * dpr, w, 6 * dpr); } else { c.fillRect(x - 3 * dpr, z - w / 2, 6 * dpr, w); c.strokeRect(x - 3 * dpr, z - w / 2, 6 * dpr, w); }
    const lx = x + st.normal.x * 14 * dpr, lz = z + st.normal.z * 14 * dpr;
    c.font = font(11); c.textAlign = 'center'; c.textBaseline = 'middle';
    const label = `${i + 1} ${names[st.kind] ?? st.name}`; const tw = c.measureText(label).width;
    c.fillStyle = 'rgba(10,12,16,0.8)'; c.fillRect(lx - tw / 2 - 4 * dpr, lz - 8 * dpr, tw + 8 * dpr, 16 * dpr);
    c.fillStyle = '#ffd38a'; c.fillText(label, lx, lz);
  });
  // entries: arrow pointing into the map
  for (const e of m.entries) {
    const x = X(e.x), z = Z(e.z);
    const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2; const a = Math.atan2(cz - e.z, cx - e.x);
    c.save(); c.translate(x, z); c.rotate(a); c.fillStyle = e.marker === 'stairs' ? '#c77dff' : '#ff5a4a';
    c.beginPath(); c.moveTo(9 * dpr, 0); c.lineTo(-6 * dpr, -7 * dpr); c.lineTo(-6 * dpr, 7 * dpr); c.closePath(); c.fill(); c.restore();
  }
}

/** legend entries shown under the map (only for features this map has) */
export function legendFor(m: MapDef, lang: Lang): { color: string; label: string }[] {
  const nl = lang === 'nl';
  const out = [
    { color: '#ff5a4a', label: nl ? 'aanvoer- en vluchtroute' : 'approach / escape' },
    { color: '#ffd38a', label: nl ? 'doelwinkel' : 'target store' },
    { color: '#4f8cff', label: nl ? 'versterking verdediging' : 'defence staging' },
    { color: 'rgba(120,220,140,0.9)', label: nl ? 'plek voor barrière' : 'barrier spot' },
    { color: 'rgba(120,200,240,0.9)', label: nl ? 'plek voor camera' : 'camera spot' },
  ];
  if (m.entries.some((e) => e.marker === 'stairs')) out.push({ color: '#c77dff', label: nl ? 'metrotrap' : 'Underground stairs' });
  if (m.water.length) out.push({ color: '#1f6a8f', label: nl ? 'water (onbegaanbaar)' : 'water (impassable)' });
  if (m.bridges.length) out.push({ color: '#8a7a62', label: nl ? 'brug' : 'bridge' });
  if (m.lowSight.length) out.push({ color: 'rgba(240,190,90,0.55)', label: nl ? 'slecht zicht' : 'poor visibility' });
  if (m.supply) out.push({ color: '#f6a13a', label: nl ? 'route vrachtwagen + laadperron' : 'truck route + loading bay' });
  return out;
}

/** Fill a host element with the briefing for a city. */
export function renderBriefing(host: HTMLElement, m: MapDef, cityId: string, lang: Lang, title: string) {
  const br = CITY_BRIEF[cityId]?.[lang] ?? CITY_BRIEF[cityId]?.en;
  const nl = lang === 'nl';
  host.innerHTML = `<div class="bf-map"><canvas aria-label="${nl ? 'plattegrond' : 'map'}"></canvas>
      <ul class="bf-legend">${legendFor(m, lang).map((l) => `<li><i style="background:${l.color}"></i>${l.label}</li>`).join('')}</ul></div>
    <div class="bf-text"><h2 class="bf-title">${title}</h2>
      ${br ? `<p class="bf-intro">${br.intro}</p>
      <ul class="bf-feat">${br.features.map((f) => `<li><span class="bf-ic" aria-hidden="true">${f.icon}</span><div><b>${f.title}</b><p>${f.text}</p></div></li>`).join('')}</ul>
      <div class="bf-tips"><div><b>${nl ? 'Tip verdedigen' : 'Defence tip'}</b><p>${br.defTip}</p></div><div><b>${nl ? 'Tip plunderen' : 'Looting tip'}</b><p>${br.lootTip}</p></div></div>` : ''}
    </div>`;
  const cv = host.querySelector('canvas')!;
  requestAnimationFrame(() => drawMinimap(cv, m, lang));
}
