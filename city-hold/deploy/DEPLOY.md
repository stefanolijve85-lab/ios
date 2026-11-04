# RIOTS op de eigen server (dezelfde machine als Detepo en Kwizillo)

RIOTS is na `npm run build` alleen een map met bestanden (`dist/`): HTML, JavaScript,
3D-modellen, geluid en video. Er draait geen Node-proces: nginx serveert de map zelf,
naast de sites die er al staan. Die worden niet aangeraakt.

```
internet ──▶ nginx :443 ──┬─▶ /var/www/riots            (riots.<domein>, statisch)
                          ├─▶ Kwizillo (ongewijzigd)
                          └─▶ Detepo   (ongewijzigd)
```

Toegang zoals bij Kwizillo: via de WireGuard-tunnel, `ssh -i ~/.ssh/kwizillo_deploy solotech@10.88.0.2`.

## Eenmalig

1. **DNS**: een A-record voor de gekozen naam (bijv. `riots` onder je domein) naar `213.126.59.35`.
2. **nginx**: in `nginx-riots.conf` `riots.example.nl` vervangen door de echte naam (2×), dan op de server:
   ```bash
   sudo cp nginx-riots.conf /etc/nginx/sites-available/riots
   sudo ln -s /etc/nginx/sites-available/riots /etc/nginx/sites-enabled/riots
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d riots.<domein>
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
