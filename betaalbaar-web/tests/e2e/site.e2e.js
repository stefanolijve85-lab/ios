const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const [out, dataDir] = process.argv.slice(2);
const B = 'http://localhost:3210';
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(String(e)));

  // --- Homepage: navigatie, vergelijking ---
  await p.goto(B, { waitUntil: 'networkidle' });
  const rowTotals = async () => p.$$eval('#kosten table.compare tbody tr', (rs) => rs.map((r) => r.querySelector('td.tot').textContent.trim()));
  let t = await rowTotals();
  ok(t[0].startsWith('€807') && t[0].includes('laagste') && t[1].startsWith('€1.763') && t[2].startsWith('€1.297'), '1 jaar: 807 (laagste) / 1.763 / 1.297 -> ' + t.join(' | '));
  await p.locator('#kosten .toggle label', { hasText: '3 jaar' }).click();
  t = await rowTotals();
  ok(t[0].startsWith('€2.223') && !t[0].includes('laagste') && t[1].startsWith('€2.699') && t[2].startsWith('€1.993') && t[2].includes('laagste'), '3 jaar: 2.223 / 2.699 / 1.993 (laagste) -> ' + t.join(' | '));
  // toetsenbord op de schakelaar
  await p.locator('#kosten .toggle input').nth(1).focus(); await p.keyboard.press('ArrowLeft');
  ok((await rowTotals())[0].startsWith('€807'), 'schakelaar werkt met toetsenbord');
  for (const href of ['/voorbeelden', '/website-laten-maken', '/prijzen', '/werkwijze', '/contact', '/privacy', '/voorwaarden', '/voorbeelden/detepo', '/voorbeelden/casa-amoray', '/voorbeelden/bij-tanja']) {
    const r = await p.request.get(B + href); ok(r.status() === 200, 'route ' + href);
  }
  ok((await p.request.get(B + '/voorbeelden/bestaat-niet')).status() === 404, 'onbekend project geeft 404');
  await p.goto(B + '/prijzen'); const pt = await p.textContent('main');
  ok(pt.includes('€148') && pt.includes('€856') && pt.includes('€807') && pt.includes('€2.223'), 'prijzenpagina toont 148 / 856 / 807 / 2.223');
  await p.goto(B); await p.locator('header .header-cta a').click(); await p.waitForURL('**/start');
  ok(true, 'header-CTA opent de wizard');

  // --- Wizard ---
  const next = () => p.getByTestId('volgende').click();
  const h1 = () => p.textContent('.wz h1');
  const pick = (txt) => p.locator('.card', { hasText: txt }).first().click();
  await pick('Winkel'); await next();
  await pick('Een nieuwe website'); await p.getByRole('button', { name: 'Terug' }).click();
  ok(await p.locator('.card', { hasText: 'Winkel' }).locator('input').isChecked(), 'terug bewaart het antwoord');
  await next(); await next(); // aanbod
  await p.getByLabel('Naam van de dienst of het product').fill('Boerenkaas');
  await p.getByRole('button', { name: 'Voeg toe' }).click(); await next();
  // identiteit: nog geen van beide -> naam/logo optie
  await pick('Nog geen van beide');
  ok(await p.locator('.card input:checked').count() === 1, 'extra is niet vooraf geselecteerd');
  await pick('Laat een naam en logo maken'); await next();
  await pick('Winkel bezoeken'); await next(); // actie
  await pick('Particulieren'); await next(); await next(); // klanten, onderscheid
  // stijl: max 2
  await pick('Warm & persoonlijk'); await pick('Luxe & rustig');
  ok(await p.locator('.card', { hasText: 'Stoer & krachtig' }).locator('input').isDisabled(), 'maximaal 2 stijlen');
  ok(await p.getByText('Welke van de twee is leidend?').isVisible(), 'leidende stijl wordt gevraagd');
  await next(); await pick('Terracotta'); await next(); await pick('Donker');
  ok(await p.getByText('geen definitief ontwerp').isVisible(), 'preview is gelabeld als stijlvoorbeeld');
  await p.screenshot({ path: out + '/wizard-sfeer.png', fullPage: true });
  await next();
  // inspiratie: ongeldige link
  await p.getByLabel('Adres van de website').fill('geen-url'); await p.getByRole('button', { name: 'Voeg link toe' }).click();
  ok(await p.getByText('Vul een volledig adres in dat begint met https://').isVisible(), 'ongeldige inspiratielink wordt geweigerd');
  await p.getByLabel('Adres van de website').fill(''); await next();
  await pick('Home'); await pick('Contact'); await next(); // paginas
  await p.getByLabel('E-mailadres').fill('fout'); await next();
  ok(await p.getByText('Dit e-mailadres lijkt niet te kloppen.').isVisible(), 'formulierfout bij ongeldig e-mailadres');
  await p.getByLabel('E-mailadres').fill('info@voorbeeld.nl'); await next();
  ok((await h1()).includes('Meer over je bedrijf'), 'branchevragen verschijnen voor winkel');
  ok(await p.getByText('Welke productgroepen').isVisible() && !(await p.getByText('Welke behandelingen').count()), 'alleen relevante branchevelden');
  await p.getByLabel('Welke productgroepen wil je laten zien?').fill('Kaas en noten');
  // terug naar branche en wijzigen -> bevestiging
  for (let i = 0; i < 13; i++) await p.getByRole('button', { name: 'Terug' }).click();
  ok((await h1()).includes('branche'), 'terug naar eerste stap');
  await pick('Beauty & wellness');
  ok(await p.getByRole('alertdialog').isVisible(), 'afhankelijke antwoorden: bevestiging gevraagd');
  await p.getByRole('button', { name: 'Nee, bewaar ze' }).click();
  await pick('Winkel');
  for (let i = 0; i < 13; i++) await next();
  ok(await p.getByLabel('Welke productgroepen wil je laten zien?').inputValue() === 'Kaas en noten', 'antwoord bleef bewaard na "Nee, bewaar ze"');
  await next(); await pick('Ik lever teksten zelf aan'); await next();
  // bestanden: eerst bewaren
  ok((await h1()).includes('Logo'), 'stap bestanden');
  await p.getByLabel('Je e-mailadres').fill('x'); await p.getByRole('button', { name: 'Bewaar mijn voortgang' }).click();
  ok(await p.getByText('Vul een geldig e-mailadres in.').isVisible(), 'bewaren: ongeldig e-mailadres');
  await p.getByLabel('Je e-mailadres').fill('klant@voorbeeld.nl'); await p.getByRole('button', { name: 'Bewaar mijn voortgang' }).click();
  ok(await p.getByText('Geef eerst toestemming').isVisible(), 'bewaren vereist toestemming');
  ok(fs.existsSync(path.join(dataDir, 'dossiers')) === false, 'niets opgeslagen zonder toestemming');
  await p.locator('#bewaren .check input').check(); await p.getByRole('button', { name: 'Bewaar mijn voortgang' }).click();
  await p.locator('#files').waitFor();
  fs.writeFileSync(out + '/logo.png', png); fs.writeFileSync(out + '/nep.png', 'MZ dit is geen afbeelding');
  await p.setInputFiles('#files', out + '/nep.png');
  await p.getByText('Dit bestandstype wordt niet ondersteund').waitFor();
  ok(true, 'uploadfout: verkeerd bestandstype wordt geweigerd');
  await p.setInputFiles('#files', out + '/logo.png');
  await p.locator('.files li').waitFor();
  ok(await p.locator('.files li').count() === 1, 'upload gelukt en zichtbaar in overzicht');
  await pick('Ik lever foto'); await next();
  await pick('Contactformulier'); await pick('Webshop'); await next();
  ok((await h1()).includes('Je nieuwe naam'), 'naam/logo-stappen verschijnen alleen omdat de optie is gekozen');
  await p.getByLabel('Welke toon moet de naam hebben?').fill('Warm en lokaal'); await next(); await next();
  // administratie -> hervatlink ophalen via bestanden? sessie bestaat al; ga door
  await next();
  ok((await h1()).includes('Controleer'), 'controle-stap bereikt');
  ok((await p.getByTestId('eenmalig').textContent()) === '€148' && (await p.getByTestId('jaar1').textContent()) === '€856', 'prijs met naam/logo: 148 en 856');
  await p.locator('.pricebox .check input').uncheck();
  ok((await p.getByTestId('eenmalig').textContent()) === '€99' && (await p.getByTestId('jaar1').textContent()) === '€807', 'extra verwijderd: 99 en 807');
  ok(await p.getByRole('alertdialog').isVisible(), 'verwijderen extra vraagt of naam-antwoorden mogen vervallen');
  await p.getByRole('button', { name: 'Ja, laat vervallen' }).click();
  ok((await p.getByTestId('ontbreekt').textContent()).includes('Bedrijfsnaam'), 'overzicht toont wat nog ontbreekt voor de 7 dagen');
  await p.screenshot({ path: out + '/wizard-controle.png', fullPage: true });

  // hervatten in een nieuw venster via de beveiligde link
  const sess = JSON.parse(await p.evaluate(() => sessionStorage.getItem('bw-intake-sessie')));
  await p.waitForTimeout(500);
  const ctx2 = await b.newContext(); const p2 = await ctx2.newPage();
  await p2.goto(`${B}/start#hervat=${sess.id}.${sess.token}`); await p2.getByText('Je bewaarde antwoorden zijn geladen').waitFor();
  ok(!p2.url().includes('hervat'), 'token is uit de adresbalk verwijderd');
  ok(await p2.locator('.card', { hasText: 'Winkel' }).locator('input').isChecked(), 'hervatten laadt de antwoorden');
  const bad = await p2.request.post(B + '/api/intake/resume', { data: { id: sess.id, token: 'x'.repeat(43) } });
  ok(bad.status() === 404, 'hervatten met fout token wordt geweigerd');
  ok((await p2.request.get(`${B}/api/intake/${sess.id}/files/A-0000000000000000`)).status() === 404, 'bestand zonder token niet opvraagbaar');
  await ctx2.close();

  // versturen: validatie, serverfout, opnieuw proberen, dubbelklik
  await p.getByTestId('verstuur').click();
  ok((await p.getByTestId('fout').textContent()).includes('naam'), 'versturen zonder naam geeft een fout');
  await p.getByRole('button', { name: 'Wijzigen Jouw gegevens' }).click();
  await p.getByLabel('Je naam').fill('T. Voorbeeld'); await p.getByLabel('Je e-mailadres').fill('t@voorbeeld.nl'); await next();
  await p.locator('.wz-main > .wrap > .check input').check();
  await p.route('**/submit', (r) => r.abort());
  await p.getByTestId('verstuur').click();
  await p.getByText('Geen verbinding').waitFor();
  ok(await p.getByTestId('dossier-id').count() === 0, 'geen successtatus als opslaan faalt');
  ok((await p.getByTestId('eenmalig').textContent()) === '€99', 'antwoorden blijven behouden na fout');
  await p.unroute('**/submit');
  await p.getByTestId('verstuur').dblclick();
  await p.getByTestId('dossier-id').waitFor();
  const id = await p.getByTestId('dossier-id').textContent();
  ok(/^BW-[A-Z2-9]{8}$/.test(id), 'succes met dossier-ID na bevestiging server: ' + id);
  const files = fs.readdirSync(path.join(dataDir, 'dossiers'));
  ok(files.length === 1, 'dubbelklik maakt precies één dossier (' + files.length + ')');
  const again = await p.request.post(`${B}/api/intake/${id}/submit`, { headers: { 'x-intake-token': sess.token }, data: { intake: {}, submitKey: 'z' } });
  ok((await again.json()).repeated === true, 'herhaald indienen is idempotent');
  const stored = JSON.parse(fs.readFileSync(path.join(dataDir, 'dossiers', files[0]), 'utf8'));
  ok(stored.status === 'input_ontbreekt' && stored.delivery.startAt === null, 'onvolledige aanvraag: status "input ontbreekt", levertijd niet gestart');
  await p.screenshot({ path: out + '/wizard-klaar.png' });

  // --- Beheer ---
  ok((await p.request.get(`${B}/api/beheer/dossiers/${id}/export?type=prompt`)).status() === 401, 'export zonder inlog geweigerd');
  ok((await p.request.get(`${B}/api/beheer/dossiers/${id}/files/${stored.assets[0].id}`)).status() === 401, 'download zonder inlog geweigerd');
  await p.goto(`${B}/beheer/${id}`); await p.waitForURL('**/beheer');
  ok(await p.getByLabel('Wachtwoord').isVisible(), 'dossierpagina zonder inlog stuurt naar login');
  await p.getByLabel('Wachtwoord').fill('verkeerd'); await p.getByRole('button', { name: 'Inloggen' }).click();
  await p.getByText('Onjuist wachtwoord').waitFor(); ok(true, 'fout wachtwoord geweigerd');
  await p.getByLabel('Wachtwoord').fill('test-wachtwoord-123'); await p.getByRole('button', { name: 'Inloggen' }).click();
  await p.getByRole('link', { name: id }).click(); await p.waitForURL('**/beheer/' + id);
  const prompt = await p.getByTestId('bouwprompt').textContent();
  ok(prompt.includes('CONCEPTPROMPT — NIET BOUWKLAAR') && prompt.includes('Verduidelijkingsvragen'), 'bouwprompt is als concept gelabeld bij hiaten');
  ok(!prompt.includes('t@voorbeeld.nl') && !prompt.includes('T. Voorbeeld'), 'bouwprompt bevat geen administratieve gegevens');
  await p.selectOption('#st', 'goedgekeurd_voor_bouw'); await p.getByTestId('beheer-opslaan').click();
  await p.getByTestId('beheer-melding').waitFor();
  ok((await p.getByTestId('beheer-melding').textContent()).includes('Niet bouwklaar'), '"goedgekeurd voor bouw" geblokkeerd bij kritieke hiaten');
  for (const type of ['briefing', 'json', 'prompt']) ok((await p.request.get(`${B}/api/beheer/dossiers/${id}/export?type=${type}`)).status() === 200, 'export ' + type + ' met inlog');
  const dl = await p.request.get(`${B}/api/beheer/dossiers/${id}/files/${stored.assets[0].id}`);
  ok(dl.status() === 200 && dl.headers()['content-disposition'].startsWith('attachment'), 'afgeschermde download werkt als bijlage');
  await p.screenshot({ path: out + '/beheer.png', fullPage: true });
  ok(errors.length === 0, 'geen JavaScript-fouten ' + errors.join(' / '));

  // schermafbeeldingen voor visuele controle
  for (const [name, w, h] of [['desk', 1366, 900], ['mob', 390, 844]]) {
    const q = await b.newPage({ viewport: { width: w, height: h } });
    await q.goto(B, { waitUntil: 'networkidle' }); await q.screenshot({ path: `${out}/home-${name}-full.png`, fullPage: true });
    await q.goto(B + '/start'); await q.locator('.card').first().waitFor();
    const over = await q.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(over <= 0, `wizard ${name}: geen horizontale scroll`);
    await q.screenshot({ path: `${out}/wizard-${name}.png` });
    await q.close();
  }
  await b.close();
  console.log(fails ? `\n${fails} FAILS` : '\nALLES GESLAAGD');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('CRASH', e.message.split('\n').slice(0, 6).join('\n')); process.exit(2); });
