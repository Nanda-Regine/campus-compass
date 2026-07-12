# Full-Loop & UX Audit — 2026-07-12

A four-agent audit (ambient legibility + three content clusters) of whether every system closes its loop — **see → act → get feedback → see it persist** — plus what to enrich to make each system feel complete for a real SA student.

**Verdict:** the app is far more real than typical — nearly every feature has genuine Supabase persistence and there's almost no mock-data-masquerading-as-live. The gaps are concentrated in: broken cross-feature bridges, generated-then-discarded AI output, a few false-success toasts, client-authoritative gamification, and orphaned/dead components that are fully built but never mounted.

---

## ✅ Fixed in this pass (safe, high-confidence)

**Ambient legibility** — the systemic bug was `opacity=0.38` + `overlayColor="transparent"` over bright zones (~15 pages), killing text contrast. Applied the recipe from the newest rooms: bright zones → `opacity 0.13–0.16` + scrim `rgba(5,4,12,0.72–0.74)`; mid → `0.18 / 0.66`; dark → `0.26 / 0.55`. Files: auth Login/Signup, landing hero (via app/page), meals, profile, tutoring, work shifts/earnings/add-job/page, streak, upgrade, bursaries, career, budget, social, notes, demo, groups, campus-life.

**First-run UX** — the onboarding "Meet Nova" tour no longer stacks on top of the cookie-consent banner (gated behind `varsityos_cookie_consent`).

**Nova blank screen** — `/api/nova` failure (non-ok or network) now falls back to the welcome/daily-brief instead of rendering an empty chat.

**Correctness bugs** — JobApplicationTracker had a Rules-of-Hooks violation (`useState` inside `.map()`) that crashes the tab as the list changes → lifted to one parent `noteDraft`. StudyTwins settings, alumni mentor request, and become-a-mentor all showed false "success" on a failed write → now check the result. ExamsTab passed `module?.name` (undefined) to Nova exam-prep → fixed to `module_name`.

---

## 🔴 Broken loops (high priority — dead-ends a real student hits)

### Safety (weakest system — reports & walks go into a black hole)
- **Incident feed has no read side.** `SafetyOS.tsx:810` writes to `safety_incidents`; the built `GET` (`api/safety/incidents/route.ts:25`, anonymised, 30 recent) has **zero consumers**. Add a "Nearby incidents" tab filtered by `institution`.
- **SafeWalk never alerts the contact.** `SafeWalk.tsx:501` only shows the *user's own* phone a "call your contact" screen on timeout — no SMS/WhatsApp/push is sent, despite the promise. And only *completed* walks persist (`:199`); the dangerous overdue case is dropped. Fire a real WhatsApp/SMS on timeout (as SOS does) and POST-on-start/PATCH-on-end.
- **Dashboard Safety/Growth cards are hardcoded** (`DomainPulse.tsx:175/188/208`) "not set up yet" forever, even after contacts saved / reports filed. Wire to real state.

### Money bridges that never connect
- **Two disjoint stokvel systems** (`budget/StokvelCircle.tsx` on `stokvel_circle_*` tables vs `finance/StokvelOS.tsx` on `stokvel_*` tables). A circle made in one is invisible in the other. Pick one, route both surfaces to it, retire the other.
- **Stokvel rounds can't rotate** — no endpoint to advance `current_round`, no payout ledger. The circle freezes at round 1. Add "Confirm payout → next round".
- **Work earnings null for monthly/per-gig jobs** (`api/work/shifts/route.ts:72`) → those workers see R0 everywhere. Prorate / prompt.
- **Money streams that don't reach Budget:** side-hustle income (`SideHustleTracker`), rent payments (`HousingOS:209`), and the orphaned `NsfasWorkCheck` never flow into wallet/insights. Feed them in.
- **Marketplace messaging unreachable** — full `marketplace_messages` backend + MessagesTab exist, but browse cards only expose a WhatsApp link (no "Message seller"), `read_at` is never set, and messaging is blocked once sold. Listings also have no photo upload.
- **Tax & appeal re-typing** — tax refund calculator and the NSFAS appeal letter are generated then discarded; tax gross isn't pre-filled from earnings the app already stores; the NSFAS appeal *letter* (Budget tab) and appeal *tracker* (NSFAS tab) are two unlinked features.

### Academic generated-then-discarded + bridges
- **Study Kit → Flashcards broken** — generated cards save to Supabase (SM-2 columns) but FlashcardsTab only loads DB decks for premium and expects FSRS columns. Free users never see their kit. Load DB decks for all tiers + reconcile columns.
- **Attendance has 3 sources of truth** (AttendanceTab DB-only, ModulesTab localStorage+DB, CalendarTab localStorage) that disagree on the <80% exam-exclusion warning. Make AttendanceTab the single DB writer.
- **AI plans discarded** — CatchUpPlanner, MockInterviewer sessions, SkillsGap 6-month plan, StudyAssistModal, TasksTab "break it down" all generate valuable output with no save/"add to tasks"/history. Reuse `ExamsTab.generatePlan`'s task-insert path.
- **Bursary Find → Track has no bridge** and curated bursaries have prose deadlines ("Usually opens April"), not dates, so the reminder engine can't fire. Add "Track this" + nullable `deadline_date`.
- **Mentor requests have no inbox** — students send `mentor_requests`, but a mentor has no view to accept/decline/reply; every request stays "pending" forever.

### Gamification (foundational)
- **XP is client-authoritative** (`lib/db/xp.ts:89`) — localStorage mutates then upserts an absolute `total_xp` the server trusts → forgeable, and clobbers on a new device. Move accrual server-side (event ledger) or validate deltas.
- **Domain flames only advance on compound days** (`compound-day/route.ts:40`) — daily single-domain effort never moves a flame; a daily studier sees "0". Increment a domain streak when it's first hit each day.
- **Dead mystery-box rewards** — `multiplier` writes a key nothing reads, `shield` never increments shields, `badge_fragment` has no counter. Wire or remove.
- **`user_chapter_xp` never written + `semester_chapters` never seeded** → ChapterBanner permanently "0 XP". Streak-milestone XP is displayed but never awarded.

### Orphaned components (fully built, never mounted)
`FoodInsecurityMode.tsx` (SA food banks, SASSA SRD, sub-R20 meals) · `BrainFoodGuide.tsx` (exam nutrition) · `SkillsToIncome.tsx` · `NsfasWorkCheck.tsx` · `MockInterviewCoach.tsx` + its API. These are complete builds delivering nothing today — mount them (gate FoodInsecurityMode on low food-budget).

---

## 🟡 Thin loops & 🟢 enrichment (make each system feel alive)

- **Health:** prescriptions are localStorage-only (dangerous for ARVs/contraceptives) with no "taken/refilled" action → persist + act. Clinic list covers only 7 unis → institution-keyed table. SexualHealth/GBV: nearest-TCC geolocation + PEP 72-hour countdown (the one time-critical element).
- **Regulate:** 3 practices (Extended Exhale, Eye Movement, reminder-intent) complete without logging → no streak/XP. Add `saveSession`.
- **Meals:** AI weekly plan & recipes are ephemeral (no "add to planner"), water intake localStorage-only, cooking-mode "log it" has no button.
- **Mutual-aid / Social:** browsing helpers have no "I can help" action; boards are national not institution-scoped; StudyTwins/mentor "connect" is WhatsApp-only with no in-app record.
- **Housing/Entrepreneur:** checklists, split calculator, business canvas/journal are localStorage-only → lost on reinstall (the low-end Android reality). Persist to Supabase.
- **Discounts:** 100% hardcoded array with dead `url:''` cards, no save/favourite, no savings tally. Move to a `student_discounts` table + saved list.
- **Dashboard:** logged mood never feeds Mind urgency or insights correlations (InsightsCard promises "mood" but the API ignores it); no mood sparkline.
- **International:** permit-expiry (the most consequential date) only seen if the page is opened → feed a dashboard nudge.

---

## Top 12 highest-impact "close the loop" actions (cross-cluster)
1. Safety incident read-feed (consume the existing GET).
2. SafeWalk actually alerts the contact + persists active/overdue walks.
3. XP server-authoritative (foundational for all gamification).
4. Fix domain flames to advance on daily activity.
5. Wire DomainPulse Safety/Growth/Future to real state.
6. Unify the two stokvel systems + make rounds rotate.
7. Work earnings for monthly/per-gig; feed side-hustle + rent into Budget.
8. Study Kit → Flashcards (load DB decks for all tiers, reconcile columns).
9. Unify attendance to one DB source.
10. Bursary Find → Track with real `deadline_date`.
11. Mount the 5 orphaned components (esp. FoodInsecurityMode on low budget).
12. Persist generated AI plans + mentor inbox + marketplace messaging entry point.

_All paths under `src/`. This doc is the backlog; the ✅ section is already applied and shipped._
