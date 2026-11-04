// Dutch for the in-match HUD. The HUD, the simulation messages and the 3D labels are written in English; when the
// language setting is NL a MutationObserver rewrites every text node (and button titles) under the match root using
// whole phrases first, then patterns with numbers/names, then single words. One place, no changes to game logic.

/** longer phrases are matched before shorter ones (sorted at start-up) */
const PHRASES: [string, string][] = [
  // top bar and controls
  ['STORES WITH STOCK', 'WINKELS MET VOORRAAD'], ['TIME LEFT', 'RESTERENDE TIJD'], ['EXTRACTED', 'WEGGEHAALD'], ['BUDGET', 'BUDGET'],
  ['DEFENCE', 'VERDEDIGEN'], ['LOOTERS', 'PLUNDEREN'], ['PAUSED', 'GEPAUZEERD'], ['Skip tips', 'Tips overslaan'],
  ['Pause (P)', 'Pauze (P)'], ['Speed', 'Snelheid'], ['Restart', 'Opnieuw'], ['Settings', 'Instellingen'], ['Menu', 'Menu'], ['Resume', 'Verder'],
  ['Details & upgrades', 'Details en upgrades'], ['Hide', 'Verbergen'], ['Next city', 'Volgende stad'],
  ['Controls: drag to pan · wheel / pinch to zoom · tap a unit, then the ground to move · P pause · WASD pan.',
    'Bediening: slepen om te schuiven · scrollen/knijpen om te zoomen · tik een eenheid, dan de grond om te verplaatsen · P pauze · WASD schuiven.'],
  ['Mobile quality — lighter: no reflections, glow or shadows (applies on restart)', 'Mobiele kwaliteit — lichter: geen reflecties, gloed of schaduwen (na herstart)'],
  ['Show tutorial tips', 'Speltips tonen'], ['HUD size', 'HUD-grootte'], ['Vibrate on events', 'Trillen bij gebeurtenissen'], ['Volume', 'Volume'], ['Music', 'Muziek'],
  // cards
  ['Security team', 'Beveiligingsteam'], ['Shield team', 'Schildteam'], ['Romeo team', 'Romeo-team'], ['Water cannon', 'Waterkanon'], ['Fire tender', 'Bluswagen'], ['Drives to a fire · puts it out', 'Rijdt naar een brand · blust'], ['Tap a burning shop or car', 'Tik een brandende winkel of auto aan'], ['No way through to that fire', 'Geen doorgang naar die brand'], ['The fire tender is busy', 'De bluswagen is bezig'], ['Nothing is burning', 'Er brandt niets'], ['Knocks rioters down · tap the spot', 'Spuit relschoppers omver · tik de plek'], ['Camera · shutter · fake call', 'Camera · rolluik · afleiding'], ['Plainclothes duo · crowd or van', 'Duo in burger · publiek of bus'], ['Firefighter', 'Brandweer'], ['Heavy carrier', 'Zware drager'],
  ['Security', 'Beveiliging'], ['Barrier', 'Dranghek'], ['Concrete', 'Betonblok'], ['Camera', 'Camera'],
  ['Runner', 'Renner'], ['Carrier', 'Drager'], ['Thrower', 'Werper'], ['Vandal', 'Vandaal'],
  ['Fast · intercepts one offender', 'Snel · onderschept één dader'], ['Slow · holds up to 3', 'Traag · houdt er tot 3 vast'],
  ['Slows a lane · breakable', 'Remt een route af · breekbaar'], ['2× durability · large socket', '2× sterker · grote plek'],
  ['Detection · no damage', 'Detectie · geen schade'], ['Extinguishes fires', 'Blust branden'],
  ['Throws at the target store or cars', 'Gooit naar de doelwinkel of auto\'s'], ['Breaks shutters', 'Breekt rolluiken'],
  ['20% slower than carrier', '20% trager dan drager'], ['faster', 'sneller'], ['throws', 'worpen'], ['carries', 'draagt'], ['Normal', 'Normaal'], ['Fast', 'Snel'],
  // tutorial
  ['HOLD THE DISTRICT', 'HOUD DE WIJK'], ['BUILD A BARRIER', 'PLAATS EEN DRANGHEK'], ['MOVE THE RESERVE', 'VERPLAATS DE RESERVE'],
  ['START THE WAVE', 'START DE GOLF'], ['UPGRADE THE STOREFRONT', 'VERSTERK DE PUI'], ['ADD CAMERA COVERAGE', 'VOEG CAMERA\'S TOE'],
  ['CHOOSE A TARGET', 'KIES EEN DOEL'], ['CHOOSE A ROUTE', 'KIES EEN ROUTE'], ['RECRUIT A GROUP', 'WERF EEN GROEP'], ['DISPATCH', 'STUUR OP PAD'], ['ESCAPE WITH THE LOOT', 'ONTSNAP MET DE BUIT'],
  ['Teams intercept detected offenders automatically. Loaded carriers are slower — only extracted goods are lost.', 'Teams onderscheppen ontdekte daders vanzelf. Beladen dragers zijn trager — alleen weggehaalde goederen gaan verloren.'],
  ['Spend budget to slow one approach: tap the Barrier card, then a green socket.', 'Rem één route af: tik de kaart Dranghek en daarna een groene plek.'],
  ['Tap your security team (cyan ring), then tap the ground near a store.', 'Tik je beveiligingsteam (blauwe ring) en daarna de grond bij een winkel.'],
  ['Orange arrows mark where offenders will enter. Press Start wave when ready.', 'Oranje pijlen tonen waar daders binnenkomen. Druk op Start golf als je klaar bent.'],
  ['Tap a store label, then Upgrade shutter. Level 2 adds 60 structure.', 'Tik een winkellabel en dan Rolluik versterken. Niveau 2 geeft 60 sterkte erbij.'],
  ['Tap one of the three stores to mark it as your target.', 'Tik een van de drie winkels om die als doel te kiezen.'],
  ['Tap an orange arrow (or Route) to pick the approach and extraction route.', 'Tik een oranje pijl (of Route) om de aanloop- en vluchtroute te kiezen.'],
  ['Recruit runners and carriers. Carriers are slower but hold more.', 'Werf renners en dragers. Dragers zijn trager maar dragen meer.'],
  ['Press Dispatch. You can retarget approaching units by selecting them and tapping another store.', 'Druk op Stuur op pad. Je kunt naderende eenheden selecteren en een andere winkel tikken.'],
  ['Carriers move slower when loaded. Only extracted goods count', 'Beladen dragers zijn trager. Alleen weggehaalde goederen tellen'],
  ['Cameras detect offenders sooner and extend your teams\' reach.', 'Camera\'s ontdekken daders eerder en vergroten het bereik van je teams.'],
  // game loop checklist
  ['GAME LOOP', 'SPELVERLOOP'], ['Place defences', 'Verdediging plaatsen'], ['Start a wave', 'Golf starten'], ['Protect a store', 'Winkel beschermen'],
  ['Intercept loot', 'Buit onderscheppen'], ['Wave reward', 'Golfbeloning'], ['Buy an upgrade', 'Upgrade kopen'], ['Recruit a group', 'Groep werven'],
  ['Loot a store', 'Winkel plunderen'], ['Extract the loot', 'Buit wegbrengen'], ['Extraction reward', 'Buitbeloning'],
  // actions and info
  ['Your crew is back:', 'Je crew is terug:'], ['rioters from the last mission joined the group', 'rioters van de vorige missie doen weer mee'],
  ['Turn it: tap where it should point, or use the arrows · then Place', 'Draai hem: tik waar hij naartoe moet wijzen of gebruik de pijlen · daarna Plaatsen'], ['Place', 'Plaatsen'],
  ['Flashbang: tap where it should land', 'Flashbang: tik waar hij moet landen'], ['Cancel flashbang', 'Flashbang annuleren'], ['Flashbang only during a wave', 'Flashbang alleen tijdens een golf'], ['Flashbang ready in', 'Flashbang klaar over'],
  ['A rioter threw the tear gas back!', 'Een rioter gooit het traangas terug!'], ['A rioter threw the flashbang back!', 'Een rioter gooit de flashbang terug!'],
  ['Select all security', 'Alle beveiliging selecteren'], ['Cancel tear gas', 'Traangas annuleren'], ['Tear gas: tap where it should land', 'Traangas: tik waar het moet landen'],
  ['Tear gas only during a wave', 'Traangas alleen tijdens een golf'], ['Needs an officer to throw it', 'Er is een agent nodig om te gooien'], ['Tear gas ready in', 'Traangas klaar over'],
  ['No officer within', 'Geen agent binnen'], ['Camera alarm: guards responding', 'Cameralarm: beveiligers komen eraan'], ['Camera alarm', 'Cameralarm'], ['Baton strike', 'Wapenstokslag'], ['Tear gas', 'Traangas'], ['Select approaching', 'Naderende selecteren'], ['Cancel placement', 'Plaatsen annuleren'],
  ['Dispatch', 'Stuur op pad'], ['Start wave', 'Start golf'], ['Tap a unit or store for details.', 'Tik een eenheid of winkel voor details.'],
  ['Recruit units with the cards', 'Werf eenheden met de kaarten'], ['Tap a store', 'Tik een winkel'],
  ['offenders remaining', 'daders over'], ['IN PROGRESS', 'BEZIG'], ['INCOMING', 'KOMT ERAAN'], ['TARGET STORE', 'DOELWINKEL'], ['TARGET', 'DOEL'], ['ROUTE', 'ROUTE'],
  ['GROUP UPGRADE (choose one)', 'GROEPSUPGRADE (kies één)'], ['GROUP', 'GROEP'], ['SECURITY TEAMS', 'BEVEILIGINGSTEAMS'], ['CAMERAS', 'CAMERA\'S'], ['SHUTTER', 'ROLLUIK'],
  ['Upgrade shutter', 'Rolluik versterken'], ['Maximum level', 'Maximaal niveau'], ['Board up', 'Dichttimmeren'], ['Repair glass & shutter', 'Glas en rolluik herstellen'],
  ['between waves · stock is not refilled', 'tussen golven · voorraad wordt niet aangevuld'], ['protection layer (does not repair)', 'beschermlaag (herstelt niets)'],
  ['repairs only the added capacity', 'herstelt alleen de extra sterkte'], ['before the shutter', 'vóór het rolluik'],
  ['Train to level 2', 'Train naar niveau 2'], ['choose one specialisation', 'kies één specialisatie'], ['unlocks specialisation', 'geeft specialisatie vrij'],
  ['Mobile response', 'Mobiele inzet'], ['Fixed protection', 'Vaste bewaking'], ['Wider coverage', 'Groter bereik'], ['Faster detection', 'Snellere detectie'],
  ['Wide coverage', 'Groot bereik'], ['Fast detection', 'Snelle detectie'], ['Carrying capacity', 'Draagvermogen'], ['Capacity', 'Draagvermogen'],
  ['faster restraint near post', 'sneller vasthouden bij de post'], ['response', 'bereik'], ['active', 'actief'],
  ['Each extracted stock point earns', 'Elk weggehaald voorraadpunt levert'], ['budget', 'budget'],
  ['being carried off', 'wordt weggedragen'], ['carrying', 'draagt'], ['structure', 'sterkte'], ['stock', 'voorraad'], ['shutter', 'rolluik'],
  ['radius', 'straal'], ['detection', 'detectie'], ['restraint', 'vasthouden'], ['speed', 'snelheid'], ['Level', 'Niveau'], ['level', 'niveau'], ['Next', 'Volgende'], ['max', 'max'],
  ['Boards', 'Planken'], ['Radius', 'Straal'],
  // result
  ['VICTORY', 'GEWONNEN'], ['DEFEAT', 'VERLOREN'], ['WAVE SECURED', 'GOLF AFGESLAGEN'], ['INTERCEPTED', 'ONDERSCHEPT'],
  ['Waves cleared: ', 'Golven afgeslagen: '], ['Stores holding stock: ', 'Winkels met voorraad: '], ['Stock lost (extracted): ', 'Voorraad verloren (weggehaald): '],
  ['Interceptions: ', 'Onderscheppingen: '], ['goods recovered: ', 'goederen teruggehaald: '], ['Stock extracted: ', 'Voorraad weggehaald: '], ['Time used: ', 'Gebruikte tijd: '],
  ['Research points earned: ', 'Onderzoekspunten verdiend: '], ['Specialisations used: ', 'Gebruikte specialisaties: '], ['Unlocked: ', 'Vrijgespeeld: '], ['total', 'totaal'],
  ['District held', 'Wijk behouden'], ['District lost', 'Wijk verloren'], ['No units left', 'Geen eenheden meer'], ['Time is up', 'De tijd is op'],
  // simulation messages
  ['Insufficient budget', 'Onvoldoende budget'], ['Already boarded', 'Al dichtgetimmerd'], ['Already trained', 'Al getraind'], ['Cannot move there', 'Kan daar niet heen'],
  ['Choose a target store', 'Kies een doelwinkel'], ['Group limit reached', 'Groep is vol'], ['No route', 'Geen route'], ['Nothing to repair', 'Niets te herstellen'],
  ['Only approaching units can be retargeted', 'Alleen naderende eenheden kunnen een nieuw doel krijgen'], ['Place a camera mast first', 'Plaats eerst een cameramast'],
  ['Recruit units first', 'Werf eerst eenheden'], ['Repairs only between waves', 'Herstellen kan alleen tussen golven'], ['Requires security level 2', 'Vereist beveiliging niveau 2'],
  ['Select a firefighter to extinguish fires', 'Selecteer de brandweer om te blussen'], ['Shutter already at maximum level', 'Rolluik is al maximaal'],
  ['Specialisation already chosen', 'Specialisatie al gekozen'], ['Camera specialisation already chosen', 'Cameraspecialisatie al gekozen'],
  ['Unit limit reached', 'Maximum aantal eenheden'], ['Upgrade already chosen', 'Upgrade al gekozen'], ['Cameras need a small socket', 'Camera\'s horen op een kleine plek'],
  ['Concrete barriers need a large socket', 'Betonblokken horen op een grote plek'], ['Invalid location', 'Ongeldige plek'], ['Not available', 'Niet beschikbaar'],
  ['Socket occupied', 'Plek bezet'], ['Units are standing there', 'Daar staan eenheden'], ['Would block every route', 'Zou alle routes blokkeren'],
  ['Barrier knocked over', 'Dranghek omvergeduwd'], ['Defence AI deployed a security team', 'Verdediging zette een beveiligingsteam in'],
  ['Defence AI placed a concrete barrier', 'Verdediging plaatste een betonblok'], ['Fire extinguished', 'Brand geblust'], ['Shield contact', 'Schildcontact'],
  ['Intercept ordered', 'Onderschepping bevolen'], ['Not a legal build socket — placement cancelled', 'Geen geldige plek — plaatsen geannuleerd'],
  ['Fire — select a firefighter, then tap the fire', 'Brand — selecteer de brandweer en tik daarna op het vuur'],
  ['ready at the van — tap the map to move it', 'staat klaar bij het busje — tik de kaart om te verplaatsen'],
  ['Tap a green socket to place the', 'Tik een groene plek om te plaatsen:'],
  ['storefront repaired', 'pui hersteld'], ['stock stays at', 'voorraad blijft'], ['boarded up', 'dichtgetimmerd'], ['protection', 'bescherming'],
  ['boards torn down', 'planken weggetrokken'], ['shutter breached', 'rolluik doorbroken'], ['shutter level', 'rolluik niveau'],
  ['stock recovered for', 'voorraad terug naar'], ['stock extracted from', 'voorraad weggehaald uit'], ['took', 'pakte'], ['intercepted', 'onderschept'],
  ['recruited', 'geworven'], ['retargeted to', 'krijgt nieuw doel:'], ['unit(s)', 'eenheid/eenheden'], ['units dispatched via', 'eenheden op pad via'],
  ['Supply delivered', 'Bevoorrading geleverd'], ['secured', 'afgeslagen'], ['stores hold stock', 'winkels hebben voorraad'], ['started', 'gestart'], ['offenders', 'daders'],
  ['Wave', 'Golf'], ['WAVE', 'GOLF'], ['Route', 'Route'], ['units', 'eenheden'],
  // cities and districts in the top bar
  ['PARIS', 'PARIJS'], ['LONDON', 'LONDEN'], ['MILAN', 'MILAAN'], ['BERLIN', 'BERLIJN'], ['RIO DE JANEIRO', 'RIO DE JANEIRO'], ['AMSTERDAM', 'AMSTERDAM'],
  ['FOUNTAIN DISTRICT', 'FONTEINWIJK'], ['CANAL QUARTER', 'GRACHTENGORDEL'], ['HIGH STREET', 'WINKELSTRAAT'], ['PIAZZA AND ARCADE', 'PIAZZA EN ARCADE'],
  ['COURTYARDS', 'BINNENPLAATSEN'], ['COPACABANA', 'COPACABANA'],
  // in-world labels
  ['EXTINGUISHING', 'BLUSSEN'], ['FIRE (burns out)', 'BRAND (dooft vanzelf)'], ['FIRE — send firefighter', 'BRAND — stuur de brandweer'], ['HOLD', 'VAST'],
  ['JEWELLERY', 'JUWELIER'], ['ELECTRONICS', 'ELEKTRONICA'], ['FASHION', 'MODE'], ['PHONES', 'TELEFOONS'], ['DEPARTMENT', 'WARENHUIS'], ['SPORTS', 'SPORT'], ['COURTYARD JEWELLER', 'JUWELIER BINNENPLAATS'],
  ['prep', 'voorbereiding'], ['need', 'nodig'], ['from', 'via'], ['via', 'via'], ['carrying', 'draagt'],
  ['Jewellery', 'Juwelier'], ['Electronics', 'Elektronica'], ['Fashion', 'Mode'], ['Phones', 'Telefoons'], ['Department', 'Warenhuis'], ['Sports', 'Sport'],
  ['Courtyard jeweller', 'Juwelier op de binnenplaats'], ['moving', 'onderweg'],
  ['North-west street', 'Noordwestelijke straat'], ['North-east street', 'Noordoostelijke straat'], ['South pedestrian street', 'Zuidelijke voetgangersstraat'], ['West passage', 'Westelijke doorgang'],
  ['West quay', 'Westkade'], ['East quay', 'Oostkade'], ['South square', 'Zuidplein'], ['Underground stairs', 'Metrotrap'], ['Shopping passage', 'Winkelpassage'],
  ['East street', 'Oostelijke straat'], ['West street', 'Westelijke straat'], ['Arcade north', 'Arcade noord'], ['South steps', 'Zuidtrappen'],
  ['West road', 'Westweg'], ['East road', 'Oostweg'], ['South road', 'Zuidweg'], ['Rear service lane', 'Achterste laadstraat'], ['West avenue', 'Westlaan'], ['South forecourt', 'Zuidelijk voorplein'],
  // unit states
  ['approach', 'nadert'], ['breach', 'breekt in'], ['collect', 'pakt buit'], ['extract', 'vlucht'], ['restrained', 'vastgehouden'], ['escorted', 'weggeleid'],
  ['restrain', 'houdt vast'], ['escort', 'leidt weg'], ['brace', 'houdt stand'], ['extinguish', 'blust'], ['held', 'vastgehouden'], ['idle', 'wacht'], ['move', 'loopt'], ['guard', 'bewaakt'],
];

const sorted = PHRASES.slice().sort((a, b) => b[0].length - a[0].length);
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// word-like phrases only replace at word boundaries (so "stock" does not hit "restock"), symbols anywhere
const rules = sorted.map(([en, nl]) => [new RegExp((/^\w/.test(en) ? '\\b' : '') + esc(en) + (/\w$/.test(en) ? '\\b' : ''), 'g'), nl] as [RegExp, string]);

export function toDutch(text: string): string {
  if (!/[A-Za-z]{2}/.test(text)) return text;
  // single pass per rule over the string; placeholders keep translated parts from being matched again
  const parts: string[] = []; let out = text;
  for (const [re, nl] of rules) out = out.replace(re, () => { parts.push(nl); return `\u0000${parts.length - 1}\u0000`; });
  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => parts[Number(i)]);
}

/** keep everything under `root` in Dutch while it changes */
export function translateLive(root: HTMLElement): () => void {
  const done = new WeakMap<Node, string>();
  const fixText = (n: Node) => {
    const v = n.nodeValue ?? ''; if (done.get(n) === v) return;
    const t = toDutch(v); done.set(n, t); if (t !== v) n.nodeValue = t;
  };
  const fixEl = (el: Element) => { const t = el.getAttribute('title'); if (t) { const d = toDutch(t); if (d !== t) el.setAttribute('title', d); } };
  const walk = (n: Node) => {
    if (n.nodeType === 3) { fixText(n); return; }
    if (n.nodeType !== 1) return;
    fixEl(n as Element);
    const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    for (let c = w.nextNode(); c; c = w.nextNode()) { if (c.nodeType === 3) fixText(c); else fixEl(c as Element); }
  };
  walk(root);
  const mo = new MutationObserver((ms) => { for (const m of ms) { if (m.type === 'characterData') fixText(m.target); else if (m.type === 'attributes') fixEl(m.target as Element); else m.addedNodes.forEach(walk); } });
  mo.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['title'] });
  return () => mo.disconnect();
}
