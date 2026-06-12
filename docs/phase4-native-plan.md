# VarsityOS Phase 4 — Native Mobile Plan

## Architecture: Turborepo + Expo Monorepo

```
varsityos/
├── apps/
│   ├── web/          ← current Next.js app (moved here)
│   └── mobile/       ← new Expo app
├── packages/
│   ├── ui/           ← shared design tokens, icons, colours
│   ├── api-client/   ← typed fetch wrappers for all /api routes
│   ├── supabase/     ← shared Supabase client + types
│   └── i18n/         ← shared messages/ translations
└── turbo.json
```

## Phase 4a — Android (Target: Q3 2026)

**Setup**
1. `npx create-turbo@latest` — scaffold monorepo
2. `npx create-expo-app apps/mobile --template expo-template-blank-typescript`
3. EAS Build + EAS Submit for Play Store
4. Shared Supabase auth via `@supabase/supabase-js` + Expo SecureStore tokens

**Key native features (beyond PWA)**
- Push notifications via Expo Notifications (Firebase FCM)
- Background fetch for NSFAS payment alerts
- Home screen widgets (Glance: today's budget remaining, next exam, load shedding status)
  - Android: `expo-widget-kit` or `react-native-widgetkit` + `react-native-android-widget`
- Biometric unlock (Expo LocalAuthentication)
- Deep linking: `varsityos://` scheme → app screens
- Offline mode: MMKV cache for budget + tasks (works on prepaid data)

**Screens to build (mirrors web app)**
- Onboarding (SetupFlow) — native form
- Dashboard with DayModeBanner
- Budget tracker + receipt OCR (Expo Camera + Google Vision)
- Nova AI chat (streaming via Server-Sent Events)
- Study tracker + timetable
- Notes marketplace (WebView or native)
- Campus Feed
- Peer tutoring
- Exam timer (background timer via Expo TaskManager)

## Phase 4b — iOS (Target: Q4 2026)

Same Expo codebase — most features work cross-platform.

**iOS-specific additions**
- Apple Pay for session payments (Stripe + PassKit)
- Siri Shortcuts: "Hey Siri, ask Nova..."
- iOS Live Activities: exam countdown on lock screen
- HealthKit: study hours → mindful minutes

## Phase 4c — Wearables (Target: Q1 2027)

**Wear OS (Android)**
- `react-native-watch-connectivity` for data sync
- Glance tile: current day mode + budget remaining
- Quick action: check library seat availability
- SOS button via watch tap

**Apple Watch**
- WatchKit complication: exam countdown
- Haptic alert when NSFAS payment arrives
- Breathing exercise during study breaks

## Migration Steps (web → monorepo)

1. `git mv campus-compass apps/web`
2. Add `turbo.json` at root
3. Add `packages/api-client` — extract fetch wrappers from components
4. Add `packages/supabase` — shared types from `src/types.ts`
5. Add `packages/ui` — extract colour tokens from `globals.css`
6. Scaffold `apps/mobile` with Expo
7. Wire up shared packages via `workspace:*` in package.json

## EAS Configuration (apps/mobile/eas.json)

```json
{
  "cli": { "version": ">= 7.0.0" },
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview":     { "distribution": "internal" },
    "production":  { "distribution": "store", "env": { "APP_ENV": "production" } }
  },
  "submit": {
    "production": {
      "android": { "serviceAccountKeyPath": "./secrets/google-play-key.json", "track": "internal" },
      "ios": { "appleId": "your@email.com", "ascAppId": "123456789" }
    }
  }
}
```

## Budget estimate

| Phase | Timeline | Key cost |
|-------|----------|----------|
| Monorepo setup | 1 week | Developer time |
| Android beta | 6 weeks | EAS Build minutes (~$29/mo) |
| Play Store | Week 8 | $25 one-time dev account |
| iOS beta | 4 weeks | Apple Dev Program ($99/yr) |
| Watch apps | 8 weeks | Watch hardware for testing |
