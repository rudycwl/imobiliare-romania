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
