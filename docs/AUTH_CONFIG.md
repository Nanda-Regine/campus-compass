# Supabase Auth configuration (NOT in git — restore from here)

⚠️ **These settings live in the Supabase project config, not in migrations or code.**
If the project is reset/restored, or someone changes them in the dashboard, **signups
can silently break**. This file is the source of truth for the required values.

Project ref: `newuipzxmnzqlolnsbml` · Set 2026-07-14.

## Required auth settings

| Setting | Required value | Why |
|---|---|---|
| `mailer_autoconfirm` | **`true`** | Email is OFF the critical path. `signUp()` returns a session immediately so students go straight to `/setup`. If this flips to `false`, every signup needs a confirmation email — and email delivery becomes a single point of failure that can strand users during a launch burst. |
| `rate_limit_email_sent` | **`1000`** (/hr) | Headroom for the *optional* async email-verification path. Was `30/hr` — far too low; a 1000-user burst stranded ~970 users on unsent confirmation emails. |
| `external_email_enabled` | `true` | Email/password signup enabled. |
| `external_google_enabled` | `true` | Google OAuth (the promoted primary signup CTA). Needs `external_google_client_id` + `external_google_secret` set. |
| `uri_allow_list` | must include `https://varsityos.co.za/auth/callback` | OAuth + any email links redirect here. |
| `site_url` | `https://varsityos.co.za` | |

## Also required OUTSIDE Supabase
- **Google Cloud Console → OAuth consent screen** must be **Published / In production**
  (not "Testing" — that caps Google sign-in at 100 users and shows an "unverified app"
  warning). This gates the promoted Google button.
- **Custom SMTP** is Resend (`smtp.resend.com`, sender `noreply@creativelynanda.co.za`).
  Only used for the *optional* async verification path now that autoconfirm is on.

## How to read / restore these (Management API)
Token: `.env.local` → `SUPABASE_ACCESS_TOKEN` (Management API only; never client-side).

```bash
PAT=$(grep -E '^SUPABASE_ACCESS_TOKEN=' .env.local | cut -d= -f2- | tr -d '"\r')
REF=newuipzxmnzqlolnsbml
# READ current config
curl -s -H "Authorization: Bearer $PAT" "https://api.supabase.com/v1/projects/$REF/config/auth"
# RESTORE the required signup-critical values
node -e "process.stdout.write(JSON.stringify({mailer_autoconfirm:true, rate_limit_email_sent:1000}))" > /tmp/cfg.json
curl -s -X PATCH "https://api.supabase.com/v1/projects/$REF/config/auth" \
  -H "Authorization: Bearer $PAT" -H "Content-Type: application/json" -d @/tmp/cfg.json
```

## Trade-offs accepted by `mailer_autoconfirm=true`
- Unverified / typo'd emails can create accounts → password reset can't reach them.
  Mitigation: optional async "verify to unlock X" nudge (not yet built).
- Bots can create accounts (no email gate). Mitigation: **Arcjet** (enabled).
- RLS still isolates every account, so unverified/duplicate accounts can't read others' data.
