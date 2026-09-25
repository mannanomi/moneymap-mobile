#!/usr/bin/env bash
# Builds the website into dist/. Vercel silently drops any folder named node_modules,
# and Expo puts font/icon files under assets/node_modules, so rename it to assets/vendor.
set -euo pipefail
cd "$(dirname "$0")/.."
echo "export const BUILD = \"$(date '+%Y-%m-%d %H:%M')\";" > src/buildInfo.ts
npx expo export --platform web
if [ -d dist/assets/node_modules ]; then
  mv dist/assets/node_modules dist/assets/vendor
  grep -rlF "assets/node_modules/" dist --include='*.js' --include='*.html' --include='*.json' \
    | xargs sed -i '' 's#assets/node_modules/#assets/vendor/#g'
fi
cp vercel.json dist/vercel.json
echo "Built dist/ — deploy with: npm run deploy:web"
