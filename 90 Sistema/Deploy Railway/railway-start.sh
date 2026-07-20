#!/bin/sh
# Avvio su Railway. Se al servizio è agganciato un Volume, il vault vive lì:
# le note scritte dagli agenti sopravvivono ai redeploy.
# - primo avvio: il volume viene popolato con tutto il contenuto dell'immagine;
# - avvii successivi: le parti di SISTEMA (agenti, Jarvis, CLAUDE.md, template)
#   vengono aggiornate dall'immagine, le NOTE (00-70) restano quelle del volume.
set -e

if [ -n "$RAILWAY_VOLUME_MOUNT_PATH" ]; then
  DATA="$RAILWAY_VOLUME_MOUNT_PATH/vault"
  if [ ! -f "$DATA/CLAUDE.md" ]; then
    echo "Primo avvio: copio il vault nel volume ($DATA)…"
    mkdir -p "$DATA"
    cp -a /vault/. "$DATA/"
  else
    echo "Aggiorno le parti di sistema nel volume (le note restano intatte)…"
    rm -rf "$DATA/.claude" "$DATA/90 Sistema"
    cp -a "/vault/.claude"    "$DATA/.claude"
    cp -a "/vault/90 Sistema" "$DATA/90 Sistema"
    cp -a "/vault/CLAUDE.md"  "$DATA/CLAUDE.md"
    cp -a "/vault/Home.md"    "$DATA/Home.md"
  fi
  cd "$DATA"
  exec node "90 Sistema/Jarvis/server.js"
fi

echo "ATTENZIONE: nessun Volume montato — le note scritte sul server andranno perse a ogni redeploy."
cd /vault
exec node "90 Sistema/Jarvis/server.js"
