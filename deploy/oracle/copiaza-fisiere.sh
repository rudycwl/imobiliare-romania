#!/usr/bin/env bash
# Copiază din repo scripturile, serviciile și Caddyfile-ul pe mașină (la instalare și după fiecare actualizare).
set -euo pipefail
SRC=/opt/cheiamea/sursa/deploy/oracle
install -m 755 "$SRC/actualizeaza.sh" /opt/cheiamea/bin/actualizeaza.sh
install -m 644 "$SRC/configurare.mjs" "$SRC/cu-env.mjs" /opt/cheiamea/bin/
schimbat=0
for u in cheiamea.service cheiamea-configurare.service cheiamea-actualizare.service cheiamea-actualizare.timer; do
  cmp -s "$SRC/$u" "/etc/systemd/system/$u" || { install -m 644 "$SRC/$u" /etc/systemd/system/; schimbat=1; }
done
[ "$schimbat" = 1 ] && systemctl daemon-reload
if ! cmp -s "$SRC/Caddyfile" /etc/caddy/Caddyfile; then
  install -m 644 "$SRC/Caddyfile" /etc/caddy/Caddyfile
  systemctl reload caddy 2>/dev/null || true
fi
