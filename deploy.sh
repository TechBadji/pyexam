#!/bin/bash
# PyExam — script de déploiement pour AWS Bitnami Apache
# Appelé par le webhook GitHub (deploy_pyexam.php) ou manuellement
# Les images sont pré-buildées par GitHub Actions — aucun build sur le serveur
set -e

PYEXAM_DIR=/opt/pyexam
REPO_URL=https://github.com/TechBadji/pyexam.git
COMPOSE_CMD="docker compose -f docker-compose.yml -f docker-compose.aws.yml"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

# ── 1. Installer Docker si absent ────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
    log "Installation de Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker bitnami
    log "Docker installé."
fi

# ── 2. Clone ou pull du repo ─────────────────────────────────────────────────
if [ -d "$PYEXAM_DIR/.git" ]; then
    log "Mise à jour du repo..."
    git -C "$PYEXAM_DIR" pull origin main
else
    log "Clonage du repo..."
    sudo git clone "$REPO_URL" "$PYEXAM_DIR"
    sudo chown -R bitnami:bitnami "$PYEXAM_DIR"
fi

cd "$PYEXAM_DIR"

# ── 3. Vérification du .env ──────────────────────────────────────────────────
if [ ! -f ".env" ]; then
    log "ERREUR : fichier .env manquant dans $PYEXAM_DIR"
    log "  cp $PYEXAM_DIR/.env.example $PYEXAM_DIR/.env && nano $PYEXAM_DIR/.env"
    exit 1
fi

# ── 4. Pull des images pré-buildées (pas de build sur le serveur) ────────────
log "Pull des images depuis GitHub Container Registry..."
$COMPOSE_CMD pull backend frontend celery_worker celery_beat

# ── 5. Démarrage sans rebuild ─────────────────────────────────────────────────
log "Démarrage des containers..."
$COMPOSE_CMD up -d --no-build

# ── 6. Nettoyage des anciennes images ────────────────────────────────────────
sudo docker image prune -f

log "Attente du health check..."
for i in $(seq 1 30); do
    if curl -sf http://localhost:8888/health | grep -q 'ok'; then
        log "PyExam opérationnel sur http://localhost:8888"
        break
    fi
    sleep 3
done

log "Déploiement terminé."
$COMPOSE_CMD ps
