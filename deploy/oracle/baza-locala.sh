#!/usr/bin/env bash
# Mută baza de date a site-ului de pe Neon pe un PostgreSQL local (doar pe 127.0.0.1), fără să piardă date.
# Apelat de actualizeaza.sh la fiecare rulare (la 2 minute), ca root, sub lacătul lui. După comutare scrie
# /etc/cheiamea/baza-locala.gata și de atunci nu mai face nimic.
#
# Reguli (cerute de Rudy: „să nu se piardă nimic și să funcționeze site-ul”):
#  - Pregătește baza locală (PostgreSQL din Ubuntu, utilizator + bază „cheiamea”, migrările Prisma).
#  - Încearcă Neon. Dacă răspunde: oprește site-ul (ca să nu mai scrie nimeni în Neon), copiază TOATE datele
#    (citire READ ONLY), verifică numărul de rânduri, comută DATABASE_URL și pornește site-ul (zero pierderi).
#  - Dacă Neon nu răspunde (cota lunară a planului gratuit): restaurează cea mai nouă copie JSON de noapte și comută,
#    ca site-ul să meargă. Diferențele din Neon se recuperează manual, când revine: scripts/recupereaza-diferente.mjs.
#  - Orice eroare: nu se schimbă nimic (site-ul rămâne pe Neon); eroarea apare în jurnal și în /configurare/stare.
#  - Neon nu se modifică niciodată (doar citire). Parola bazei locale nu apare în jurnal.
set -Eeuo pipefail
BAZA=/opt/cheiamea
SURSA=$BAZA/sursa
ETC=/etc/cheiamea
ENV=$ETC/env.json
MARCAJ=$ETC/baza-locala.gata
STARE=$ETC/baza-locala.json
PAROLA_F=$ETC/baza-locala.parola
PREGATITA=$ETC/baza-locala.pregatita
AMANARE=$ETC/baza-locala.amanare
LUCRU=$BAZA/baza-locala-lucru
COPII=/var/lib/cheiamea-copii
LOG=/var/log/cheiamea-baza-locala.log

[ -f "$MARCAJ" ] && exit 0
export HOME=/root DEBIAN_FRONTEND=noninteractive
exec >>"$LOG" 2>&1
umask 077
log() { echo "$(date -Is) $*"; }

# Starea (fără secrete), citită de /configurare/stare. Câmpurile se adaugă peste cele existente.
stare() {
  node -e 'const fs=require("fs"),f=process.argv[1];let s={};try{s=JSON.parse(fs.readFileSync(f,"utf8"))}catch{}
Object.assign(s,JSON.parse(process.argv[2]));fs.writeFileSync(f+".nou",JSON.stringify(s,null,2),{mode:0o600});fs.renameSync(f+".nou",f)' "$STARE" "$1"
}
# Un text oarecare ca valoare JSON (fără probleme de ghilimele).
jtext() { node -e 'process.stdout.write(JSON.stringify(process.argv[1]))' "$1"; }

SITE_OPRIT=0
la_iesire() {
  local cod=$?
  # Dacă am oprit site-ul și n-am comutat, îl pornim la loc (rămâne pe Neon, ca înainte).
  if [ "$SITE_OPRIT" = 1 ]; then systemctl start cheiamea.service || true; log "Site pornit la loc (tot pe baza veche)."; fi
  if [ "$cod" != 0 ]; then
    stare "{\"eroare\":$(jtext "$(date -Is) $EROARE_CONTEXT")}" || true
    # O eroare de pregătire nu se reia la fiecare 2 minute (apt, npm), ci după 10 minute.
    date +%s > "$AMANARE"
    log "EROARE: $EROARE_CONTEXT (nu s-a schimbat nimic; site-ul rămâne pe baza veche)"
  fi
}
EROARE_CONTEXT="necunoscută"
trap 'EROARE_CONTEXT="linia $LINENO: $BASH_COMMAND"' ERR
trap la_iesire EXIT

# Deja comutat (de ex. a căzut serverul după comutare, înainte de marcaj): doar notăm.
if grep -Eq '"DATABASE_URL": *"postgres(ql)?://[^"]*@(127\.0\.0\.1|localhost)[:/]' "$ENV"; then
  date -Is > "$MARCAJ"; stare '{"baza":"locala","eroare":null}'; exit 0
fi
if [ -f "$AMANARE" ] && [ $(( $(date +%s) - $(cat "$AMANARE" 2>/dev/null || echo 0) )) -lt 600 ]; then exit 0; fi
rm -f "$AMANARE"

SHA=$(git -C "$SURSA" rev-parse --short=12 HEAD)
run_c() { runuser -u cheiamea -- env HOME=$BAZA NEXT_TELEMETRY_DISABLED=1 COPII_DIR=$COPII "$@"; }

# ---------- 1. pregătirea (o dată; migrările și dependențele din nou doar când se schimbă versiunea) ----------
if [ "$(cat "$PREGATITA" 2>/dev/null)" != "$SHA" ] || ! systemctl is-active -q postgresql; then
  log "== Pregătesc baza locală (versiunea $SHA)"
  stare '{"etapa":"pregatire"}'
  if ! command -v pg_ctlcluster >/dev/null || [ -z "$(ls /etc/postgresql 2>/dev/null)" ]; then
    log "Instalez PostgreSQL (pachetul Ubuntu)..."
    apt-get -o DPkg::Lock::Timeout=600 update -q
    apt-get -o DPkg::Lock::Timeout=600 install -y -q postgresql
  fi
  VER=$(ls /etc/postgresql | sort -V | tail -1)
  CONF=/etc/postgresql/$VER/main/conf.d/cheiamea.conf
  DORIT="# CheiaMea: baza ascultă doar local (vezi deploy/oracle/baza-locala.sh)
listen_addresses = '127.0.0.1'"
  if [ "$(cat "$CONF" 2>/dev/null)" != "$DORIT" ]; then
    install -d -m 755 "$(dirname "$CONF")"
    printf '%s\n' "$DORIT" > "$CONF"; chmod 644 "$CONF"
    systemctl enable postgresql
    systemctl restart postgresql
  fi
  systemctl is-active -q postgresql || systemctl start postgresql
  for _ in $(seq 1 30); do pg_isready -q -h 127.0.0.1 && break; sleep 2; done
  pg_isready -q -h 127.0.0.1
  PORT=$(pg_lsclusters -h | awk -v v="$VER" '$1==v && $2=="main"{print $3}')
  echo "${PORT:-5432}" > "$ETC/baza-locala.port"

  # Parola: aleatoare, doar litere și cifre (fără probleme în URL), păstrată 0600 la root.
  [ -s "$PAROLA_F" ] || { head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n' > "$PAROLA_F"; chmod 600 "$PAROLA_F"; }
  # Parola merge prin stdin (nu apare în lista de procese sau în jurnal).
  # Ieșirea psql trece prin sed: orice rând cu PASSWORD (de ex. contextul unei erori) nu ajunge în jurnal.
  runuser -u postgres -- psql -q -At -v ON_ERROR_STOP=1 -d postgres 2>&1 <<SQL | sed '/PASSWORD/Id'
DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'cheiamea') THEN CREATE ROLE cheiamea LOGIN; END IF; END \$\$;
ALTER ROLE cheiamea WITH LOGIN PASSWORD '$(cat "$PAROLA_F")';
SELECT 'CREATE DATABASE cheiamea OWNER cheiamea ENCODING ''UTF8'' TEMPLATE template0' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'cheiamea')
\gexec
SQL

  # Codul aplicației (cu dependențe) într-un folder separat de cel al site-ului.
  if [ "$(cat "$LUCRU/.sha" 2>/dev/null)" != "$SHA" ]; then
    rm -rf "$LUCRU" && mkdir -p "$LUCRU"
    git -C "$SURSA" archive HEAD | tar -x -C "$LUCRU"
    chown -R cheiamea:cheiamea "$LUCRU"
    (cd "$LUCRU" && run_c npm ci --no-audit --no-fund --loglevel=error)
    echo "$SHA" > "$LUCRU/.sha"
  fi
  export DATABASE_URL="postgresql://cheiamea:$(cat "$PAROLA_F")@127.0.0.1:$(cat "$ETC/baza-locala.port")/cheiamea?schema=public"
  (cd "$LUCRU" && run_c npx prisma migrate deploy)
  unset DATABASE_URL
  echo "$SHA" > "$PREGATITA"
  stare "{\"bazaLocalaPregatita\":{\"la\":\"$(date -Is)\",\"versiune\":\"$SHA\",\"postgresql\":\"$VER\"},\"eroare\":null}"
  log "Baza locală e pregătită (PostgreSQL $VER)."
fi

export TINTA_DATABASE_URL="postgresql://cheiamea:$(cat "$PAROLA_F")@127.0.0.1:$(cat "$ETC/baza-locala.port")/cheiamea?schema=public"
RAPORT=$LUCRU/raport.json
restaurare() { rm -f "$RAPORT"; (cd "$LUCRU" && run_c node scripts/restaureaza-copie.mjs --mod "$1" --raport "$RAPORT" --lucru "$LUCRU"); }
raport() { cat "$RAPORT" 2>/dev/null || echo '{}'; }

# ---------- 2. Neon răspunde? Dacă da, copie directă (zero pierderi); dacă nu, din cea mai nouă copie de noapte ----------
comuta() {
  local sursa=$1
  # env.json: DATABASE_URL -> baza locală; valoarea veche rămâne ca NEON_DATABASE_URL. Copie a fișierului vechi, 0600.
  [ -f "$ENV.inainte-de-baza-locala" ] || install -m 600 "$ENV" "$ENV.inainte-de-baza-locala"
  node -e '
const fs=require("fs"),{execFileSync}=require("child_process"),f=process.argv[1];
const env=JSON.parse(fs.readFileSync(f,"utf8"));
if(!/@(127\.0\.0\.1|localhost)[:/]/.test(env.DATABASE_URL||"")&&!env.NEON_DATABASE_URL) env.NEON_DATABASE_URL=env.DATABASE_URL;
env.DATABASE_URL=process.env.TINTA_DATABASE_URL;
fs.writeFileSync(f+".nou",JSON.stringify(env,null,2));
fs.chmodSync(f+".nou",0o640);execFileSync("chown",["root:cheiamea",f+".nou"]);fs.renameSync(f+".nou",f);' "$ENV"
  # Verificare: aplicația (grupul cheiamea) trebuie să poată citi fișierul.
  runuser -u cheiamea -- test -r "$ENV"
  date -Is > "$MARCAJ"
  stare "{\"comutat\":{\"la\":\"$(date -Is)\",\"sursa\":\"$sursa\",\"restaurare\":$(raport)},\"astept\":null,\"eroare\":null,\"etapa\":\"gata\"}"
  # Build nou (chiar dacă versiunea e aceeași sau a eșuat pe Neon): rulează migrările pe baza locală și repornește.
  rm -f $BAZA/esuat; touch $BAZA/forteaza
  SITE_OPRIT=0
  if [ -e $BAZA/curent ]; then systemctl restart cheiamea.service || log "Atenție: repornirea site-ului a eșuat; build-ul care urmează îl repornește."; fi
  log "== COMUTAT pe baza locală (sursa: $sursa)."
}

cod=0; restaurare sonda || cod=$?
if [ "$cod" = 0 ]; then
  stare "{\"neonRaspunde\":$(raport | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const r=JSON.parse(s).neon||{};process.stdout.write(JSON.stringify({raspunde:"da",la:r.incercatLa}))})')}"
  log "Neon răspunde: opresc site-ul ca să nu se mai scrie în Neon, apoi copiez tot."
  stare '{"etapa":"copiez-din-neon"}'
  SITE_OPRIT=1
  systemctl stop cheiamea.service
  cod=0; restaurare neon || cod=$?
  if [ "$cod" = 0 ]; then
    comuta neon
    exit 0
  fi
  # 3 = Neon a căzut în timpul citirii (cota s-a terminat chiar acum): mergem pe copie, ca mai jos.
  [ "$cod" = 3 ] || { EROARE_CONTEXT="copierea din Neon a eșuat cu codul $cod (vezi $LOG); site-ul rămâne pe Neon"; exit 1; }
fi
[ "$cod" = 3 ] || { EROARE_CONTEXT="sonda Neon a eșuat cu codul $cod"; exit 1; }
stare "{\"neonRaspunde\":$(raport | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const r=JSON.parse(s).neon||{};process.stdout.write(JSON.stringify({raspunde:"nu",la:r.incercatLa,mesaj:r.mesaj}))})')}"

# ---------- 3. Neon nu răspunde (cota planului gratuit): site-ul trebuie să meargă acum ----------
# Restaurăm cea mai nouă copie de noapte și comutăm. Ce s-a scris în Neon după copie se recuperează mai târziu,
# când Neon revine, cu scripts/recupereaza-diferente.mjs (NEON_DATABASE_URL rămâne în env.json).
log "Neon nu răspunde: restaurez din cea mai nouă copie de rezervă și comut."
stare '{"etapa":"restaurez-din-copie"}'
# Site-ul nu e oprit aici: baza locală nu e încă a lui, iar paginile din cache merg în continuare.
if restaurare copie; then
  comuta copie
  exit 0
fi
EROARE_CONTEXT="restaurarea din copie a eșuat (vezi $LOG); site-ul rămâne pe Neon"
exit 1
