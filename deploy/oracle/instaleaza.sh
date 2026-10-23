#!/usr/bin/env bash
# Pregătește o mașină virtuală Ubuntu (Oracle Cloud Always Free) pentru CheiaMea.
# Rulează o singură dată, ca root, din cloud-init:  bash instaleaza.sh <cod-configurare>
# După instalare, variabilele (DATABASE_URL, chei) se completează în https://nou.cheiamea.ro/configurare?cod=...
set -euxo pipefail
COD="${1:?lipsește codul de configurare}"
REPO=https://github.com/rudycwl/imobiliare-romania.git
BAZA=/opt/cheiamea
export DEBIAN_FRONTEND=noninteractive
# cloud-init rulează fără HOME; git și npm au nevoie de el.
export HOME="${HOME:-/root}"

# Memorie de rezervă: build-ul Next.js are nevoie de mai mult de 1 GB pe forma mică.
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q /swapfile /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

apt-get update
apt-get install -y git curl ca-certificates gnupg debian-keyring debian-archive-keyring apt-transport-https

# Imaginile Ubuntu de la Oracle blochează tot în afară de SSH; deschidem 80 și 443.
for p in 80 443; do
  iptables -C INPUT -p tcp -m state --state NEW --dport "$p" -j ACCEPT 2>/dev/null \
    || iptables -I INPUT 1 -p tcp -m state --state NEW --dport "$p" -j ACCEPT
done
command -v netfilter-persistent >/dev/null && netfilter-persistent save || true

# Node.js 22
if ! node -v 2>/dev/null | grep -q '^v22'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

# Caddy (HTTPS automat)
if ! command -v caddy >/dev/null; then
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt -o /etc/apt/sources.list.d/caddy-stable.list
  apt-get update
  apt-get install -y caddy
fi

id cheiamea >/dev/null 2>&1 || useradd --system --create-home --home-dir "$BAZA" --shell /usr/sbin/nologin cheiamea
mkdir -p "$BAZA/releases" "$BAZA/bin" /etc/cheiamea
chown cheiamea:cheiamea "$BAZA" "$BAZA/releases"
[ -d "$BAZA/sursa/.git" ] || git clone "$REPO" "$BAZA/sursa"

# Codul pentru pagina de configurare și fișierul cu variabile (citit de aplicație).
umask 077
echo -n "$COD" > /etc/cheiamea/cod
[ -f /etc/cheiamea/env.json ] || echo '{}' > /etc/cheiamea/env.json
chown root:cheiamea /etc/cheiamea /etc/cheiamea/env.json
chmod 750 /etc/cheiamea
chmod 640 /etc/cheiamea/env.json
umask 022

bash "$BAZA/sursa/deploy/oracle/copiaza-fisiere.sh"
systemctl daemon-reload
systemctl enable --now caddy cheiamea-configurare.service cheiamea-actualizare.timer
systemctl enable cheiamea.service
echo "CheiaMea: instalare terminată."
