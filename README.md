# MoneyMap (mobile)

Native iPhone and Android personal finance tracker — the React Native companion to the [self-hosted MoneyMap web app](https://github.com/mannanomi/Expense-Tracker).

All data lives **on the phone** in app-private storage. No server, no account, no network calls — it works entirely offline, and a `.bak` copy is written on every save.

The two apps share the same `data.json` format, so a backup exported from either one imports cleanly into the other.

## Features

- Monthly dashboard with income, expenses and category breakdown
- Per-category budgets with progress tracking
- Credit cards — limits, balances, and repayments that split out interest and fees
- Savings goals and investment tracking
- Multiple accounts
- Year-to-date view and multi-year history browsing
- Trend and report charts, drawn with `react-native-svg`
- Full-text search across transactions
- Carry-forward handling between months
- Custom categories with icons
- Haptics, blur effects, and a Manrope type scale

## Tech stack

Expo (SDK 57) · React Native · TypeScript · Expo Router · Reanimated · react-native-svg · expo-file-system

Also builds to web via `react-native-web` — the same codebase deploys as a PWA.

## Run it on your phone (development)

```bash
npm install
npx expo start
```

Scan the QR code with the Expo Go app (same Wi-Fi). If Expo Go doesn't support this SDK yet, use a dev build:
`npx expo run:ios` / `npx expo run:android` (needs Xcode / Android Studio).

## Get your existing data in

In the web app copy `data.json`, send it to the phone (AirDrop / iCloud Drive / Drive / email), then in the app:
**More → Backup & import → Import data.json**.
**Export backup** writes the same format, so it can go back into the web app.

## Install a real app on your phone

```bash
npm install -g eas-cli
eas login
eas build --platform ios      # needs an Apple Developer account ($99/yr) for a device/TestFlight build
eas build --platform android  # produces an APK/AAB
```

## Layout

- `src/lib/logic.ts` — all money logic, ported 1:1 from the web app (totals, budgets, cards, plans, search, archive)
- `src/store.tsx` — state + persistence (JSON file on device, `.bak` copy on every save)
- `src/components/` — UI kit, charts (react-native-svg), forms
- `app/` — screens (expo-router): 5 tabs + pushed screens
