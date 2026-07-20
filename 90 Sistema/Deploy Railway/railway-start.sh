#!/bin/sh
# Avvio su Railway. Se al servizio è agganciato un Volume, il vault vive lì:
# le note scritte dagli agenti sopravvivono ai redeploy. Al primo avvio il
# volume viene popolato con il contenuto dell'immagine.
set -e

if [ -n "$RAILWAY_VOLUME_MOUNT_PATH" ]; then
  DATA="$RAILWAY_VOLUME_MOUNT_PATH/vault"
  if [ ! -f "$DATA/CLAUDE.md" ]; then
    echo "Primo avvio: copio il vault nel volume ($DATA)…"
    mkdir -p "$DATA"
    cp -a /vault/. "$DATA/"
  fi
  cd "$DATA"
  exec node "90 Sistema/Jarvis/server.js"
fi

echo "ATTENZIONE: nessun Volume montato — le note scritte sul server andranno perse a ogni redeploy."
cd /vault
exec node "90 Sistema/Jarvis/server.js"
