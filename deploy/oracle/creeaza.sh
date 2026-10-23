#!/usr/bin/env bash
# Creează în Oracle Cloud tot ce trebuie pentru CheiaMea: rețea, porturi deschise (22, 80, 443) și mașina virtuală.
# Se rulează în Oracle Cloud Shell (iconița >_ din dreapta sus), unde comanda `oci` e deja conectată la cont:
#   curl -fsSL https://raw.githubusercontent.com/rudycwl/imobiliare-romania/main/deploy/oracle/creeaza.sh | bash -s <cod-configurare>
# Poate fi rulat de mai multe ori: refolosește ce există deja. Cheia SSH e RSA (Cloud Shell rulează în mod FIPS, fără ed25519).
set -euo pipefail
COD="${1:?lipsește codul de configurare}"
T="${OCI_TENANCY:?nu găsesc contul (rulează comanda în Oracle Cloud Shell)}"
NUME=cheiamea
q() { "$@" --raw-output 2>/dev/null | sed 's/^null$//'; }

echo "1/5 Rețeaua..."
VCN=$(q oci network vcn list -c "$T" --display-name $NUME-vcn --lifecycle-state AVAILABLE --query 'data[0].id')
[ -n "$VCN" ] || VCN=$(q oci network vcn create -c "$T" --cidr-block 10.0.0.0/16 --display-name $NUME-vcn --dns-label $NUME --wait-for-state AVAILABLE --query data.id)
IGW=$(q oci network internet-gateway list -c "$T" --vcn-id "$VCN" --query 'data[0].id')
[ -n "$IGW" ] || IGW=$(q oci network internet-gateway create -c "$T" --vcn-id "$VCN" --is-enabled true --display-name $NUME-igw --wait-for-state AVAILABLE --query data.id)
RT=$(q oci network vcn get --vcn-id "$VCN" --query 'data."default-route-table-id"')
SL=$(q oci network vcn get --vcn-id "$VCN" --query 'data."default-security-list-id"')
oci network route-table update --rt-id "$RT" --force \
  --route-rules "[{\"destination\":\"0.0.0.0/0\",\"destinationType\":\"CIDR_BLOCK\",\"networkEntityId\":\"$IGW\"}]" >/dev/null

echo "2/5 Porturile 22, 80 și 443..."
port() { echo "{\"source\":\"0.0.0.0/0\",\"protocol\":\"6\",\"tcpOptions\":{\"destinationPortRange\":{\"min\":$1,\"max\":$1}}}"; }
oci network security-list update --security-list-id "$SL" --force \
  --ingress-security-rules "[$(port 22),$(port 80),$(port 443),{\"source\":\"0.0.0.0/0\",\"protocol\":\"1\",\"icmpOptions\":{\"type\":3,\"code\":4}}]" \
  --egress-security-rules '[{"destination":"0.0.0.0/0","protocol":"all"}]' >/dev/null

SUB=$(q oci network subnet list -c "$T" --vcn-id "$VCN" --lifecycle-state AVAILABLE --query 'data[0].id')
[ -n "$SUB" ] || SUB=$(q oci network subnet create -c "$T" --vcn-id "$VCN" --cidr-block 10.0.0.0/24 --display-name $NUME-subnet --dns-label public --wait-for-state AVAILABLE --query data.id)

echo "3/5 Cheia SSH (rămâne în Cloud Shell, în ~/.ssh/cheiamea)..."
[ -f ~/.ssh/cheiamea.pub ] || { mkdir -p ~/.ssh && ssh-keygen -q -t rsa -b 4096 -N '' -f ~/.ssh/cheiamea; }

cat > /tmp/cheiamea-cloud-init.yaml <<CI
#cloud-config
runcmd:
  - curl -fsSL https://raw.githubusercontent.com/rudycwl/imobiliare-romania/main/deploy/oracle/instaleaza.sh -o /root/instaleaza.sh
  - bash /root/instaleaza.sh $COD > /var/log/cheiamea-instalare.log 2>&1
CI

echo "4/5 Mașina virtuală..."
ID=$(q oci compute instance list -c "$T" --display-name $NUME --lifecycle-state RUNNING --query 'data[0].id')
if [ -z "$ID" ]; then
  ADS=$(oci iam availability-domain list -c "$T" --query 'data[].name' --raw-output | tr -d '[]", ' | grep -v '^$')
  porneste() { # $1 = forma, $2 = configurație (opțional)
    local IMG
    IMG=$(q oci compute image list -c "$T" --operating-system "Canonical Ubuntu" --operating-system-version "24.04" \
      --shape "$1" --sort-by TIMECREATED --sort-order DESC --limit 1 --query 'data[0].id')
    [ -n "$IMG" ] || return 1
    for AD in $ADS; do
      echo "   încerc $1 în $AD..."
      if ID=$(oci compute instance launch -c "$T" --availability-domain "$AD" --shape "$1" ${2:+--shape-config "$2"} \
        --image-id "$IMG" --subnet-id "$SUB" --assign-public-ip true --display-name $NUME \
        --ssh-authorized-keys-file ~/.ssh/cheiamea.pub --user-data-file /tmp/cheiamea-cloud-init.yaml \
        --wait-for-state RUNNING --query data.id --raw-output 2>>/tmp/cheiamea-erori.log) && [ -n "$ID" ]; then return 0; fi
    done
    return 1
  }
  porneste VM.Standard.A1.Flex '{"ocpus":2,"memoryInGBs":12}' || porneste VM.Standard.E2.1.Micro || {
    echo; grep -ho '"message": "[^"]*"' /tmp/cheiamea-erori.log | tail -n 2
    echo "EROARE: mașina nu a pornit. Dacă scrie „Out of host capacity”, încearcă din nou peste o oră."; exit 1; }
fi

echo "5/5 Adresa IP..."
IP=$(q oci compute instance list-vnics --instance-id "$ID" --query 'data[0]."public-ip"')
echo
echo "=============================================="
echo "  GATA. Adresa IP a serverului: $IP"
echo "=============================================="
