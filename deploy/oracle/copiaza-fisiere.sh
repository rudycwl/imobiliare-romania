#!/usr/bin/env bash
# Copiază din repo scripturile, serviciile și Caddyfile-ul pe mașină (la instalare și după fiecare actualizare).
set -euo pipefail
SRC=/opt/cheiamea/sursa/deploy/oracle
# Folderul pozelor: scris de aplicație (cheiamea), citit de Caddy.
install -d -m 755 -o cheiamea -g cheiamea /var/lib/cheiamea-poze
# Cheia cu care timerele pornesc alertele pe email și copia pozelor; aplicația o citește (grupul cheiamea), nimeni n-o scrie de mână.
if [ ! -s /etc/cheiamea/cheie-alerte ]; then
  (umask 027; head -c 32 /dev/urandom | base64 | tr -d '/+=\n' > /etc/cheiamea/cheie-alerte)
  chown root:cheiamea /etc/cheiamea/cheie-alerte
fi
install -m 755 "$SRC/actualizeaza.sh" /opt/cheiamea/bin/actualizeaza.sh
install -m 644 "$SRC/configurare.mjs" "$SRC/servicii.mjs" "$SRC/cu-env.mjs" /opt/cheiamea/bin/
# Pagina de configurare rulează mereu: o repornim când s-au schimbat fișierele pe care le-a încărcat.
h=$(cat /opt/cheiamea/bin/configurare.mjs /opt/cheiamea/bin/servicii.mjs | sha256sum | cut -d' ' -f1)
if [ "$(cat /run/cheiamea-configurare.sha 2>/dev/null)" != "$h" ]; then
  systemctl restart cheiamea-configurare.service 2>/dev/null && echo "$h" > /run/cheiamea-configurare.sha || true
fi
schimbat=0
for u in cheiamea.service cheiamea-configurare.service cheiamea-actualizare.service cheiamea-actualizare.timer cheiamea-alerte.service cheiamea-alerte.timer cheiamea-copie-poze.service cheiamea-copie-poze.timer; do
  cmp -s "$SRC/$u" "/etc/systemd/system/$u" || { install -m 644 "$SRC/$u" /etc/systemd/system/; schimbat=1; }
done
if [ "$schimbat" = 1 ]; then
  systemctl daemon-reload
  systemctl restart cheiamea-actualizare.timer 2>/dev/null || true
fi
for t in cheiamea-alerte.timer cheiamea-copie-poze.timer; do
  systemctl is-enabled -q $t 2>/dev/null || systemctl enable --now $t 2>/dev/null || true
done
if ! cmp -s "$SRC/Caddyfile" /etc/caddy/Caddyfile; then
  install -m 644 "$SRC/Caddyfile" /etc/caddy/Caddyfile
  systemctl reload caddy 2>/dev/null || true
fi
