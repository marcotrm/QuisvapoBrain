# QuisvapoBrain su Railway: vault + Jarvis + CLI claude in un container.
FROM node:22-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends git curl ca-certificates ripgrep procps \
 && rm -rf /var/lib/apt/lists/* \
 && npm install -g @anthropic-ai/claude-code

WORKDIR /vault
COPY . .

# Su Railway il server deve ascoltare su 0.0.0.0 (RAILWAY_ENVIRONMENT lo attiva già; questo è un fallback).
ENV JARVIS_PUBLIC=1

EXPOSE 8766
CMD ["sh", "90 Sistema/Deploy Railway/railway-start.sh"]
