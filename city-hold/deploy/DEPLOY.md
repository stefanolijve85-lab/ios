# RIOTS op de eigen server (dezelfde machine als Detepo en Kwizillo)

RIOTS is na `npm run build` alleen een map met bestanden (`dist/`): HTML, JavaScript,
3D-modellen, geluid en video. Er draait geen Node-proces: nginx serveert de map zelf,
naast de sites die er al staan. Die worden niet aangeraakt.

```
internet ──▶ nginx :443 ──┬─▶ /var/www/riots            (riots.xitgames.com, statisch)
                          ├─▶ Kwizillo (ongewijzigd)
                          └─▶ Detepo   (ongewijzigd)
```

Toegang zoals bij Kwizillo: via de WireGuard-tunnel, `ssh -i ~/.ssh/kwizillo_deploy solotech@10.88.0.2`.

## Eenmalig

1. **DNS** bij de beheerder van xitgames.com: A-record `riots` → `84.86.23.137` (TTL 300, geen AAAA).
   Controle: `dig +short riots.xitgames.com` geeft `84.86.23.137`.
   Het publieke adres van de server is `84.86.23.137` (zoals kwizillo.nl en xitgames.com); het oude
   `213.126.59.35` uit de Kwizillo-documentatie is niet meer van deze server.
2. **nginx** (`nginx-riots.conf` staat al op `riots.xitgames.com`), op de server:
   ```bash
   sudo cp nginx-riots.conf /etc/nginx/sites-available/riots
   sudo ln -s /etc/nginx/sites-available/riots /etc/nginx/sites-enabled/riots
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d riots.xitgames.com
   ```
   (`nginx-riots.conf` eerst naar de server: `scp -i ~/.ssh/kwizillo_deploy deploy/nginx-riots.conf solotech@10.88.0.2:`)

## Elke update

```bash
~/cityhold-game/city-hold/deploy/deploy.sh
```

Bouwt de game, stuurt alleen gewijzigde bestanden naar de server en zet ze in `/var/www/riots`.

## Waarom dit sneller laadt dan de tunnel

- De productieversie: één gebundeld script in plaats van honderden losse modules.
- nginx comprimeert code en modellen en laat de iPad alles bewaren: code een jaar (de naam
  verandert bij elke wijziging), modellen/geluid/beelden 30 dagen. Hun adres krijgt `?v=` met
  een hash van alle bestanden, dus na een update met nieuwe modellen wordt alles één keer
  opnieuw geladen, daarna komt het uit het geheugen.
- Geen omweg via de Mac thuis en zijn uploadsnelheid.

## Certificaat

Het eerste certificaat (geldig tot 2 februari 2027) is via een DNS-record gemaakt (`--manual`), omdat het
DNS-record toen nog naar het oude adres wees. Nu het adres klopt, kan het automatisch verlengen via
nginx zoals de andere sites. Eenmalig op de server:

```bash
sudo certbot --nginx -d riots.xitgames.com --force-renewal
sudo certbot renew --dry-run
```

## Bijwerken vanaf de server zelf (bijv. kantoor, PuTTY)

Geen Mac of WireGuard nodig: de server haalt de code van GitHub, bouwt en zet het online.

Eerste keer (in PuTTY, ingelogd als solotech):

    git clone --depth 1 -b claude/happy-hypatia-1smfhz https://github.com/stefanolijve85-lab/ios.git ~/riots-src
    bash ~/riots-src/city-hold/deploy/deploy-on-server.sh

Daarna steeds alleen:

    bash ~/riots-src/city-hold/deploy/deploy-on-server.sh

Vereist Node.js 20.19 of nieuwer op de server (het script zegt hoe je het installeert als het ontbreekt).
`~/riots-src` is alleen een bouwkopie: hij wordt elke keer gelijkgezet met GitHub.
