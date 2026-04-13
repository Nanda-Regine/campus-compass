# Contributing to VarsityOS

VarsityOS is proprietary software owned by Mirembe Muse (Pty) Ltd. External contributions are not accepted at this time. This file is for internal development reference.

---

## Development Workflow

### Branching

- `main` — production branch, deployed to varsityos.co.za
- Feature branches: `feat/feature-name`
- Fixes: `fix/issue-description`

### Commit Style

Follow conventional commits:

```
feat: add budget 80% warning insight
fix: correct Scholar pricing from R29 to R39
docs: update README with correct Nova limits
chore: add PRODUCTION_SCHEMA_FIXES.sql
```

Each file or feature should get its own commit for easy rollback.

### Before Committing

```bash
npx tsc --noEmit          # TypeScript must pass
npm run lint              # ESLint must pass
npm run build             # Build must succeed with 0 errors
```

### Environment

- Copy `.env.example` → `.env.local`
- Never commit `.env.local` or any file containing real keys
- `PAYFAST_SANDBOX=true` in development

### Database Migrations

Always write migrations as idempotent SQL using `IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `CREATE OR REPLACE`, etc. so they can be re-run safely.

Run migrations in this order on a fresh Supabase project:
1. `schema.sql`
2. `MIGRATION_RUN_IN_SUPABASE.sql`
3. `MIGRATION_SCHOLAR_TIER.sql`
4. `GROUP_SCHEMA_MIGRATION.sql`
5. `REFERRAL_MIGRATION.sql`
6. `PRODUCTION_SCHEMA_FIXES.sql`

---

## Architecture Principles

- **No client-side secrets** — all API keys stay server-side
- **Rate limit all AI routes** — use `checkRateLimit()` from `@/lib/rateLimit`
- **RLS everywhere** — every new Supabase table must have RLS enabled
- **Pricing is canonical** — Free: 10 msg, Scholar R39: 75 msg, Premium R79: 200 msg (never "unlimited")
- **POPIA compliance** — all personal data must be deletable via `/api/account/delete`

---

## Contact

**Nanda Regine** — hello@varsityos.co.za
