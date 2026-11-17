# CheiaMea pe Oracle Cloud (Always Free)

Mașină virtuală Ubuntu 24.04 cu Node 22, Caddy (HTTPS automat) și servicii systemd.
Serverul ia singur ultima versiune de pe `main` la fiecare 2 minute (`cheiamea-actualizare.timer`),
construiește într-un folder nou și schimbă versiunea doar dacă build-ul reușește.

## Instalare

La crearea instanței (Compute → Instances → Create instance → Advanced options → Management →
„Paste cloud-init script”):

```yaml
#cloud-config
runcmd:
  - curl -fsSL https://raw.githubusercontent.com/rudycwl/imobiliare-romania/main/deploy/oracle/instaleaza.sh -o /root/instaleaza.sh
  - bash /root/instaleaza.sh COD-CONFIGURARE > /var/log/cheiamea-instalare.log 2>&1
```

Apoi:
1. În rețeaua instanței (Security List) se permit porturile TCP 80 și 443 din 0.0.0.0/0.
2. În Netlify DNS: record A `nou` → IP-ul public al instanței.
3. Variabilele se completează în `https://nou.cheiamea.ro/configurare` (se cere codul o dată, apoi îl ține minte browserul 12 ore).
4. Când site-ul merge pe `nou.cheiamea.ro`, recordul A pentru `cheiamea.ro` se mută pe același IP
   (și `www`, `cheiamea.com`, `www.cheiamea.com`).

Starea publică (fără secrete): `/configurare/stare`.

## Baza de date locală (din 17.11.2026)

Neon (planul gratuit) a rămas fără cotă, așa că baza s-a mutat pe acest server: PostgreSQL din Ubuntu, doar pe 127.0.0.1.
Mutarea o face singur `baza-locala.sh`, apelat de `actualizeaza.sh` până reușește (apoi `/etc/cheiamea/baza-locala.gata`):
- dacă Neon răspunde: oprește site-ul, copiază tot din Neon (doar citire), comută, pornește site-ul (zero pierderi);
- altfel: restaurează cea mai nouă copie JSON de noapte din `/var/lib/cheiamea-copii` (sau din R2) și comută.
`DATABASE_URL` arată spre baza locală; vechea adresă rămâne ca `NEON_DATABASE_URL`. Parola bazei locale: `/etc/cheiamea/baza-locala.parola` (0600).
Jurnal: `/var/log/cheiamea-baza-locala.log`; stare publică: `/configurare/stare` → `baza`.

Copii de rezervă: JSON (aplicația) + `pg_dump -Fc` (`copie-pgdump.mjs`), în fiecare noapte, pe disc (14 zile) și în R2 `copie/baza/`.

Când Neon revine (după resetarea lunară), ce s-a scris acolo după copie se recuperează cu:
`cd /opt/cheiamea/baza-locala-lucru && sudo -u cheiamea env COPII_DIR=/var/lib/cheiamea-copii node scripts/recupereaza-diferente.mjs`
(întâi fără `--aplica`, ca să vezi ce ar face; apoi cu `--aplica`).
