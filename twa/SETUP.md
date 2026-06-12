# VarsityOS — TWA Android Setup Guide

> Trusted Web Activity wraps the VarsityOS PWA into a real Android APK published to the Play Store.
> **No code duplication. No separate app. Same codebase. Zero Play Store billing cut.**

---

## Prerequisites

Install these on your development machine (Mac/Windows/Linux):

```bash
# 1. Node.js 18+ (already have this)
node --version

# 2. Java JDK 17 (required for Android build tools)
# Mac:
brew install openjdk@17
# Windows: Download from https://adoptium.net

# 3. Bubblewrap CLI
npm install -g @bubblewrap/cli

# 4. Android SDK Command Line Tools (Bubblewrap can install this automatically)
# OR install Android Studio: https://developer.android.com/studio
```

---

## Step 1 — Verify Prerequisites

```bash
java -version        # Should show 17.x
bubblewrap --version # Should show 1.x
```

---

## Step 2 — Generate the Android Project

Run from the `twa/` directory:

```bash
cd twa
bubblewrap init --manifest https://varsityos.co.za/manifest.json
```

When prompted, confirm or customise:
- **Package ID**: `co.za.varsityos.app`
- **App name**: `VarsityOS — Student OS`
- **Launcher name**: `VarsityOS`
- **Theme colour**: `#0d9488`
- **Background colour**: `#080f0e`
- **Start URL**: `/dashboard`
- **Icon URL**: `https://varsityos.co.za/icon-512.png`
- **Maskable icon**: `https://varsityos.co.za/icon-maskable-512.png`
- **Display mode**: `standalone`
- **Orientation**: `portrait`
- **Min Android version**: 7.0 (API 24)

Bubblewrap will download Android SDK components automatically on first run (~500MB).

---

## Step 3 — Generate the Signing Key

**Do this ONCE. Store the keystore file securely — losing it means you can never update the Play Store listing.**

```bash
keytool -genkey -v \
  -keystore android-release.keystore \
  -alias varsityos-release \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

When prompted:
- **First and last name**: Nanda Regine
- **Organisation**: Mirembe Muse Pty Ltd
- **City**: [Your city]
- **State/Province**: [Your province]
- **Country code**: ZA

**Save these passwords in 1Password / Bitwarden immediately.** You will need them forever.

---

## Step 4 — Get the SHA-256 Fingerprint

```bash
keytool -list -v \
  -keystore android-release.keystore \
  -alias varsityos-release
```

Copy the **SHA-256** value — it looks like:
```
AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78
```

---

## Step 5 — Update Digital Asset Links

Open `../public/.well-known/assetlinks.json` and replace:
```
REPLACE_WITH_SHA256_FINGERPRINT_AFTER_KEYGEN
```
with your actual SHA-256 fingerprint (colons included).

Then deploy the web app so `https://varsityos.co.za/.well-known/assetlinks.json` serves the updated file.

**Verify it works:**
```bash
curl https://varsityos.co.za/.well-known/assetlinks.json
```

---

## Step 6 — Build the APK / AAB

```bash
# Debug APK (for testing on your device)
bubblewrap build

# Release AAB (for Play Store upload)
bubblewrap build --skipPwaValidation
```

The release AAB will be at:
```
twa/app/build/outputs/bundle/release/app-release.aab
```

---

## Step 7 — Test on Android Device

```bash
# Install debug APK on connected Android device
bubblewrap install
```

Verify:
- [ ] App launches and shows dashboard correctly
- [ ] No browser UI (URL bar should be hidden — this confirms TWA is working)
- [ ] Push notifications work
- [ ] Pull to refresh works
- [ ] Bottom navigation works
- [ ] Nova chat works
- [ ] PWA install prompt does NOT show (we're already installed)

---

## Step 8 — Play Store Submission

1. Create a **Google Play Console** account at play.google.com/console
   - One-time fee: **$25 USD (~R470)**

2. Create a new app:
   - App name: **VarsityOS — Student OS**
   - Default language: **English (South Africa)**
   - App or game: **App**
   - Free or paid: **Free** (subscriptions handled on web via PayFast)

3. Upload the `.aab` file to Internal Testing first

4. Complete store listing:
   - Short description (80 chars): *South Africa's student OS — study, budget, AI & wellness*
   - Full description: See `PLAY_STORE_LISTING.md`
   - Screenshots: minimum 2 phone screenshots
   - Feature graphic: 1024×500 image

5. Content rating: Complete the questionnaire (Education category)

6. Pricing: **Free** (critical — subscriptions go through PayFast on web)

7. Publish to Production

---

## Step 9 — Update the Web Manifest

After Play Store approval, update `../public/manifest.json`:

```json
"related_applications": [
  {
    "platform": "play",
    "url": "https://play.google.com/store/apps/details?id=co.za.varsityos.app",
    "id": "co.za.varsityos.app"
  }
],
"prefer_related_applications": false
```

---

## Updating the App

When you deploy new features to the web:
- **Users automatically get the update** — no new APK needed
- Chrome downloads updated assets in the background

When you need to update the APK (new Android permissions, splash screen, etc.):
```bash
cd twa
bubblewrap update
bubblewrap build --skipPwaValidation
# Upload new AAB to Play Store
```

---

## Environment Variables for CI/CD

Add to Vercel environment variables (already handled by deployment):

```bash
# These don't change — the TWA reads from the live domain
NEXT_PUBLIC_SITE_URL=https://varsityos.co.za
```

For automated Play Store uploads via GitHub Actions (future):
```bash
PLAY_STORE_KEY_JSON=...  # Service account JSON from Google Play Console
KEYSTORE_BASE64=...       # Base64-encoded keystore file
KEYSTORE_PASSWORD=...
KEY_ALIAS=varsityos-release
KEY_PASSWORD=...
```

---

## Troubleshooting

**"Digital Asset Links verification failed"**
→ Check `https://varsityos.co.za/.well-known/assetlinks.json` is accessible
→ Verify SHA-256 fingerprint matches exactly (including colons)
→ Wait 5 minutes after deploying — Google caches the file

**"App shows browser chrome / URL bar"**
→ Digital Asset Links not verified. See above.
→ Ensure the `assetlinks.json` Content-Type is `application/json`

**"Push notifications not working in TWA"**
→ Ensure Firebase is configured with the correct package name `co.za.varsityos.app`
→ Add the google-services.json if doing native push (usually not needed for TWA)

**Bubblewrap fails to download SDK**
→ Install Android Studio manually
→ Set `ANDROID_HOME` environment variable to the SDK path

---

## Files in this directory

```
twa/
├── SETUP.md              ← You are here
├── twa-manifest.json     ← Bubblewrap configuration (pre-filled)
├── PLAY_STORE_LISTING.md ← Copy for Play Store description
└── [generated by bubblewrap after init]
    ├── app/              ← Android project
    ├── build.gradle
    ├── gradle/
    └── ...
```

---

*VarsityOS TWA · Built with Google Bubblewrap · Deployed on Play Store*
*Package: co.za.varsityos.app · Domain: varsityos.co.za*
