#!/usr/bin/env bash
# Publică ultima versiune de pe main: rulează la 2 minute (cheiamea-actualizare.timer).
# Construiește într-un folder nou și schimbă versiunea doar dacă build-ul reușește, deci site-ul nu cade.
set -euo pipefail
BAZA=/opt/cheiamea
SURSA=$BAZA/sursa
LOG=$BAZA/ultimul-build.log
exec 9>/run/cheiamea-actualizare.lock
flock -n 9 || exit 0

stare() { printf '{"stare":"%s","versiune":"%s","cand":"%s"}\n' "$1" "$2" "$(date -Is)" > $BAZA/stare.json; }

git -C "$SURSA" fetch -q origin main
git -C "$SURSA" reset -q --hard origin/main
SHA=$(git -C "$SURSA" rev-parse --short=12 HEAD)
bash "$SURSA/deploy/oracle/copiaza-fisiere.sh"

FORTEAZA=0; [ -f $BAZA/forteaza ] && FORTEAZA=1 && rm -f $BAZA/forteaza
[ "$FORTEAZA" = 0 ] && [ "$(cat $BAZA/versiune 2>/dev/null)" = "$SHA" ] && exit 0
[ "$FORTEAZA" = 0 ] && [ "$(cat $BAZA/esuat 2>/dev/null)" = "$SHA" ] && exit 0
if ! grep -q '"DATABASE_URL": *"postgres' /etc/cheiamea/env.json; then
  stare "asteapta-configurare" "$SHA"; exit 0
fi

DIR=$BAZA/releases/$SHA
# Comenzile de build rulează ca utilizatorul cheiamea, cu variabilele din env.json.
run() { runuser -u cheiamea -- env HOME=$BAZA NEXT_TELEMETRY_DISABLED=1 node $BAZA/bin/cu-env.mjs "$@"; }
stare "construieste" "$SHA"
{
  echo "== $(date -Is) build $SHA" &&
  rm -rf "$DIR" && mkdir -p "$DIR" &&
  git -C "$SURSA" archive HEAD | tar -x -C "$DIR" &&
  chown -R cheiamea:cheiamea "$DIR" &&
  cd "$DIR" &&
  run npm ci --no-audit --no-fund &&
  run npx prisma migrate deploy &&
  run npx next build
} > "$LOG" 2>&1 || { echo "$SHA" > $BAZA/esuat; stare "eroare" "$SHA"; exit 1; }

ln -sfn "$DIR" $BAZA/curent.nou && mv -T $BAZA/curent.nou $BAZA/curent
systemctl restart cheiamea.service
echo "$SHA" > $BAZA/versiune
rm -f $BAZA/esuat
stare "gata" "$SHA"
echo "== $(date -Is) publicat $SHA" >> "$LOG"

# Păstrăm doar versiunea curentă și pe cea dinainte.
cd $BAZA/releases
for d in $(ls -1t | tail -n +3); do
  [ "$BAZA/releases/$d" = "$(readlink -f $BAZA/curent)" ] || rm -rf "$d"
done
