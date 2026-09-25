#!/usr/bin/env bash
# Deploys dist/ to the Vercel project "moneymap" (link stored in .vercel-deploy/).
set -euo pipefail
cd "$(dirname "$0")/.."
./scripts/build-web.sh
mkdir -p .vercel-deploy
rm -rf .vercel-deploy/site && cp -r dist .vercel-deploy/site
[ -d .vercel-deploy/.vercel ] && cp -r .vercel-deploy/.vercel .vercel-deploy/site/.vercel
cd .vercel-deploy/site && npx vercel deploy --prod --yes
[ -d .vercel ] && rm -rf ../.vercel && cp -r .vercel ../.vercel
