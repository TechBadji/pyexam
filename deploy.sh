#!/usr/bin/env bash
# deploy.sh — valide, pousse et déploie PyExam en production
# Usage : ./deploy.sh [message de commit optionnel]
set -euo pipefail

COOLIFY_URL="http://162.55.162.230:8000"
COOLIFY_TOKEN="1|8oiYYALht7MEzqVj9N5Kzyv8Y27xl0zJWQgqGdux10d73a70"
APP_UUID="mpcfznb4j0umtts8id58k8xy"
PROD_URL="https://pyexam.digitalmatis.com"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
ok()   { echo -e "${GREEN}[OK]${NC} $*"; }
info() { echo -e "${BLUE}[..]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
fail() { echo -e "${RED}[ERREUR]${NC} $*"; exit 1; }

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  PyExam — Déploiement production${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ── 1. Vérification TypeScript ─────────────────────────────────────────────────
info "Vérification TypeScript..."
cd "$(dirname "$0")/frontend"
if ! npx tsc --noEmit 2>&1; then
  fail "Erreurs TypeScript détectées. Corrige-les avant de déployer."
fi
ok "TypeScript OK"
cd ..

# ── 2. Vérification git ────────────────────────────────────────────────────────
info "Vérification du dépôt git..."
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  warn "Tu n'es pas sur la branche main (branche actuelle : $BRANCH)"
  read -r -p "Continuer quand même ? (o/N) " confirm
  [[ "$confirm" =~ ^[oO]$ ]] || fail "Déploiement annulé."
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  warn "Il y a des modifications non commitées."
  git status --short
  read -r -p "Continuer sans les committer ? (o/N) " confirm
  [[ "$confirm" =~ ^[oO]$ ]] || fail "Déploiement annulé. Committe tes changements d'abord."
fi
ok "Git OK (branche : $BRANCH)"

# ── 3. Push vers GitHub ────────────────────────────────────────────────────────
info "Push vers GitHub..."
git push origin main
ok "Push OK"

# ── 4. Déclenchement du déploiement Coolify ───────────────────────────────────
info "Déclenchement du déploiement Coolify..."
RESPONSE=$(curl -s -X POST "$COOLIFY_URL/api/v1/deploy?uuid=$APP_UUID" \
  -H "Authorization: Bearer $COOLIFY_TOKEN" \
  -H "Content-Type: application/json")

DEPLOY_UUID=$(echo "$RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
deployments = data.get('deployments', [])
if deployments:
    print(deployments[0].get('deployment_uuid', ''))
" 2>/dev/null)

if [ -z "$DEPLOY_UUID" ]; then
  fail "Impossible de récupérer l'UUID du déploiement. Réponse : $RESPONSE"
fi
ok "Déploiement en queue (UUID : $DEPLOY_UUID)"

# ── 5. Attente et suivi du déploiement ────────────────────────────────────────
info "Attente du résultat..."
MAX_WAIT=300  # 5 minutes max
ELAPSED=0
INTERVAL=8

while [ $ELAPSED -lt $MAX_WAIT ]; do
  sleep $INTERVAL
  ELAPSED=$((ELAPSED + INTERVAL))

  STATUS=$(curl -s "$COOLIFY_URL/api/v1/deployments/$DEPLOY_UUID" \
    -H "Authorization: Bearer $COOLIFY_TOKEN" | \
    python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','unknown'))" 2>/dev/null)

  case "$STATUS" in
    finished)
      echo ""
      ok "Déploiement terminé avec succès ! (${ELAPSED}s)"
      ok "Production : $PROD_URL"
      echo ""
      echo -e "${YELLOW}Pense à faire Ctrl+Shift+R dans le navigateur pour vider le cache.${NC}"
      echo ""
      exit 0
      ;;
    error|failed)
      echo ""
      fail "Le déploiement a échoué (statut : $STATUS). Consulte : $COOLIFY_URL"
      ;;
    in_progress|queued)
      echo -ne "\r${BLUE}[..]${NC} En cours... ${ELAPSED}s / ${MAX_WAIT}s"
      ;;
    *)
      echo -ne "\r${BLUE}[..]${NC} Statut : $STATUS — ${ELAPSED}s"
      ;;
  esac
done

fail "Timeout dépassé (${MAX_WAIT}s). Vérifie manuellement : $COOLIFY_URL"
