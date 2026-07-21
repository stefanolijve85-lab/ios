# Zelf hosten — migreren van Render naar je eigen server

Deze gids beschrijft hoe je XIT Games (de crash-game engine) van Render naar
je **eigen server** (VPS / dedicated / bare metal) verhuist. Er is niets
Render-specifieks in de code — de hele app draait uit één Node-proces
(`server.js`) dat Next.js én de Socket.io realtime-laag op **één poort**
serveert. Je hebt dus geen aparte websocket-service of load balancer nodig.

---

## 1. Alle bestanden ophalen

**Alles zit in de Git-repo** — code, thema's, én alle video/audio-assets
(`public/`, ~289 MB). Er zijn geen losse bestanden buiten de repo.

### Aanbevolen: `git clone` (op de nieuwe server)

```bash
git clone https://github.com/stefanolijve85-lab/ios.git xitgames
cd xitgames
git checkout claude/stash-crash-game-mvp-8ujkyz   # of de branch die je gemerged hebt
```

> Werk je vanuit `main`? Merge de feature-branch dan eerst, of clone gewoon de
> branch hierboven — die bevat de complete, actuele game.

### Alternatief: downloadbaar archief

Kun je op de doelserver niet `git clone`en (bv. geen GitHub-toegang daar), maak
dan lokaal een tarball en upload die met `scp`:

```bash
# op een machine die de repo al heeft
git archive --format=tar.gz -o xitgames.tar.gz claude/stash-crash-game-mvp-8ujkyz
scp xitgames.tar.gz  user@jouw-server:/opt/
# op de server
cd /opt && tar xzf xitgames.tar.gz && cd xitgames
```

`git archive` pakt precies wat in Git zit (incl. de ~289 MB assets), zónder
`node_modules`/`.next` — die bouw je op de server zelf.

---

## 2. Vereisten op de server

| Nodig            | Versie / opmerking                                    |
|------------------|-------------------------------------------------------|
| **Node.js**      | ≥ 18.18 (aanbevolen **20 LTS**, hetzelfde als Render) |
| **npm**          | komt met Node mee                                     |
| RAM              | 512 MB werkt; 1 GB comfortabel                         |
| Schijf           | ~1 GB (repo 290 MB + `node_modules` + `.next` build)  |
| Poort            | standaard **3000** (instelbaar via `PORT`)            |

Node 20 op Ubuntu/Debian:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

---

## 3. Draaien — twee routes

Kies **A (kaal Node)** of **B (Docker)**. Beide serveren app + websockets op één poort.

### Route A — kaal Node (systemd + nginx)

**Bouwen:**

```bash
cd /opt/xitgames
npm install            # of: npm ci  (met de meegeleverde package-lock.json)
npm run build          # next build
```

> `next build` heeft TypeScript + `@types` nodig. Die staan als gewone
> dependencies in `package.json`, dus een normale `npm install` volstaat — je
> hoeft de `--include=dev` truc van Render niet.

**Testen:**

```bash
NODE_ENV=production PORT=3000 npm start
# open http://SERVER_IP:3000
```

**Als service (start automatisch, herstart bij crash)** — `/etc/systemd/system/xitgames.service`:

```ini
[Unit]
Description=XIT Games (Next.js + Socket.io)
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/xitgames
Environment=NODE_ENV=production
Environment=PORT=3000
# Voeg hier je RGS-env toe (zie §4) of gebruik EnvironmentFile=
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=3
User=www-data

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now xitgames
sudo systemctl status xitgames
```

**nginx reverse proxy + HTTPS** — `/etc/nginx/sites-available/xitgames`:

```nginx
server {
    listen 80;
    server_name xitgames.com www.xitgames.com;

    # WebSocket-upgrade is essentieel voor Socket.io
    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 3600s;   # lang-levende websockets niet afkappen
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/xitgames /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d xitgames.com -d www.xitgames.com   # gratis HTTPS
```

> De `Upgrade`/`Connection "upgrade"`-headers zijn cruciaal — zonder die vallen
> de websockets stil en blijft het spel "verbinden…" hangen.

### Route B — Docker

Er ligt al een productie-`Dockerfile` (multi-stage, Node 20 Alpine) in de root.

```bash
cd /opt/xitgames
docker build -t xitgames .
docker run -d --name xitgames --restart unless-stopped \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e RGS_MODE=demo \
  xitgames
```

Zet nginx (Route A) ervoor voor HTTPS, of gebruik Traefik/Caddy. Voor
persistente RGS-data in productie: draai er een Postgres-container naast en geef
`DATABASE_URL` mee (zie §4).

---

## 4. Omgevingsvariabelen (env)

De game draait **out of the box** zonder enige env — dan staat de RGS-engine in
`demo`-modus met een ingebouwde lokale wallet (nepgeld). Voor productie /
echt-geld zet je onderstaande. Volledige uitleg staat in `docs/RGS.md`.

| Variabele              | Default            | Waarvoor                                             |
|------------------------|--------------------|-----------------------------------------------------|
| `PORT`                 | `3000`             | Poort waarop `server.js` luistert                    |
| `NODE_ENV`             | —                  | Zet op `production`                                  |
| `RGS_MODE`             | `demo`             | `demo` (nepgeld) of `seamless` (echt geld)           |
| `RGS_STORE`            | `memory`           | `memory` (weg bij herstart) of `postgres` (blijvend) |
| `DATABASE_URL`         | —                  | Postgres-connectiestring als `RGS_STORE=postgres`    |
| `RGS_SECRET`           | *insecure default* | **HMAC-secret — verplicht sterk zetten in prod**     |
| `RGS_WALLET_URL`       | —                  | Wallet-API van de operator (bij `seamless`)          |
| `RGS_WALLET_KEY`       | —                  | Auth-key voor die wallet-API                         |
| `RGS_CURRENCY`         | `EUR`              | Valuta                                               |
| `RG_STAKE_MAX_MINOR`   | `0` (uit)          | Max inzet per bet (in centen)                        |
| `RG_SESSION_LOSS_MAX_MINOR` | `0` (uit)     | Max netto verlies per sessie                         |
| `RG_REALITY_CHECK_MS`  | `0` (uit)          | Interval "je speelt al N min"-melding                |

> **Belangrijk voor echt geld:** zet altijd een sterke `RGS_SECRET` en gebruik
> `RGS_STORE=postgres` (met de meegeleverde `server/rgs/store/schema.sql`),
> anders is de ledger weg bij een herstart. De RGS-zelftest draai je met
> `npm run test:rgs`.

Env in systemd zet je met losse `Environment=`-regels of via een
`EnvironmentFile=/opt/xitgames/.env` (zet die file dan buiten Git).

---

## 5. Postgres opzetten (alleen voor productie / echt geld)

```bash
sudo apt-get install -y postgresql
sudo -u postgres createdb xitgames
sudo -u postgres psql xitgames -f /opt/xitgames/server/rgs/store/schema.sql
# DATABASE_URL=postgres://user:pass@localhost:5432/xitgames
```

---

## 6. Migratie-checklist (Render → eigen server)

1. [ ] Repo op de server (`git clone` of tarball) — §1
2. [ ] Node 20 geïnstalleerd — §2
3. [ ] `npm install && npm run build` slaagt — §3
4. [ ] `npm start` draait lokaal, spel opent op `:3000` — §3
5. [ ] systemd-service actief en herstart-bestendig — §3A
6. [ ] nginx reverse proxy mét websocket-upgrade-headers — §3A
7. [ ] HTTPS via certbot (Let's Encrypt) — §3A
8. [ ] DNS van `xitgames.com` naar het nieuwe server-IP (A-record)
9. [ ] Prod-env gezet: `RGS_SECRET`, evt. `RGS_MODE=seamless` + wallet — §4
10. [ ] `npm run test:rgs` groen — §4
11. [ ] Render-service uitzetten zodra DNS is overgezet en getest

> **DNS-tip:** verlaag eerst de TTL van je DNS-record (bv. naar 300s) een dag
> vóór de switch, test de nieuwe server via het IP, en zet dan pas het
> A-record om. Laat de Render-service nog even aan tot je zeker weet dat alles
> op de eigen server werkt.

---

## 7. Wat je NIET meer nodig hebt van Render

- `render.yaml` mag blijven staan (doet niks op je eigen server) of je verwijdert
  hem. De `buildCommand`/`startCommand` daarin zijn puur Render-config.
- Alle Render-omgevingsvariabelen zet je nu zelf via systemd/Docker (§4).

Verder is er **geen** vendor-lock-in: dezelfde `server.js` die op Render draaide
draait ongewijzigd op je eigen machine.
