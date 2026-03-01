# Campus Compass 🧭

> **Your varsity life, fully organised.**
> The go-to super-app for every South African university student.

**A Mirembe Muse (Pty) Ltd product** — Built by Nanda Regine, Creative Technologist & AI Engineer

---

## The Vision

11 million South Africans are at university or TVET college. They navigate NSFAS deadlines, load shedding, financial stress, mental health pressure, meal planning on tight budgets, and academic pressure — all at once. Campus Compass is their operating system.

---

## V1 Features

### 🧭 Onboarding (5-step)
Name + avatar → University + year + faculty → Funding type + NSFAS + budget → Modules → Living situation + dietary preference + food budget

### 🏠 Home Dashboard
- Personalised greeting with teal hero banner
- Live stats: pending tasks, budget remaining, module count
- Load shedding alert banner (EskomSePush API integration ready)
- Module quick-access grid (2×2)
- Daily feed: deadlines, budget nudges, Nova prompt
- Budget progress bar widget

### 📚 Study Planner
- **Tasks tab** — Add/complete/filter assignments with module tagging, priority levels, due date countdown (overdue/urgent/normal)
- **Timetable tab** — Visual weekly grid (Mon–Fri, 07:00–17:00), click any slot to add a class, colour-coded by module
- **Exams tab** — Add exams with venue + time, countdown cards showing days remaining (red ≤7 days, amber ≤14)
- **Modules tab** — Manage all subject modules with colour coding

### 💰 Budget & NSFAS
- Animated donut ring showing % of budget used (colour changes: teal → amber → red)
- Category breakdown with progress bars (Food, Transport, Data, Stationery, etc.)
- Full expense log with date, category, delete
- CSV export
- **NSFAS tab** — Living, accommodation, books allowance tracking + balance calculation + myNSFAS portal link + important dates calendar

### 🍲 Meal Prep
- **Weekly Plan** — 7-day grid, 4 meal slots per day (Breakfast/Lunch/Supper/Snack), cost per day
- **Grocery List** — Add items with quantity + estimated price, tick-off, total estimator, clear checked items
- **Student Recipes** — 5 SA-specific budget recipes (under R50), with ingredients, steps, and pro tips
- **AI Recipe Generator** — Input what's in your kitchen, get a tailored recipe (GPT-4o-mini)

### 🌟 Nova — Mental Health AI Companion
- Full conversational AI chat powered by GPT-4o-mini
- Nova's personality: warm, South African-coded, empathetic, non-judgmental
- Understands SA student pressures: NSFAS, load shedding stress, imposter syndrome, homesickness, exam anxiety
- Mood quick-select chips: Good / Okay / Low / Anxious / Stressed / Exhausted / Struggling
- Quick prompt chips: assignments, financial stress, loneliness, motivation, breathing exercise
- **Crisis detection**: Keywords trigger SADAG (0800 21 4446) + Lifeline SA (0800 567 567) banner
- Persistent chat history (last 50 messages)
- Graceful AI fallback responses when no API key set
- Disclaimer: Nova is a companion, not a licensed therapist

---

## AI Features (GPT-4o-mini)

| Feature | Where | Cache |
|---------|-------|-------|
| Nova Mental Health Companion | nova.html | Full history |
| AI Recipe Generator | meals.html → Recipes | Per request |

---

## Setup

1. Add OpenAI API key to `shared.js`:
   ```js
   const OPENAI_KEY = 'your-key-here';
   ```

2. Deploy all files to Vercel / Netlify (static, no backend needed)

3. Place `sw.js` at domain root for PWA install support

4. To integrate real load shedding data, add your EskomSePush API key to `shared.js` and replace the `getLoadsheddingStatus()` mock

---

## Stack

- Vanilla HTML / CSS / JavaScript — zero dependencies, zero build step
- `localStorage` for all persistence (swap for Supabase in production)
- OpenAI `gpt-4o-mini` for Nova + Recipe AI
- PWA: installable, offline-capable via service worker

---

## Monetisation

| Tier | Price | What's included |
|------|-------|----------------|
| Free | R0 | Study Planner, Budget, Meal Prep, 10 Nova messages/month |
| Premium | R49/month | Unlimited Nova, AI Recipe Generator, export |
| University Partnership | Custom | White-label, campus SSO, analytics |
| Brand Sponsorship | Custom | In-app placement (telco, food, retail) |

---

## Roadmap (V2+)

- Res Life module (maintenance requests, roommate board)
- Career Hub (CV builder, bursary tracker, internship listings)
- Tutor Buddy (find/offer tutoring nearby — peer-to-peer)
- Campus social feed (events, societies, notices)
- Real load shedding integration (EskomSePush API)
- NSFAS appeal tracker + deadline notifications
- Offline-first data sync

---

**Mirembe Muse (Pty) Ltd**
Built by Nanda Regine · Creative Technologist & AI Engineer
📍 East London, Eastern Cape, South Africa
🌐 [creativelynanda.co.za](https://creativelynanda.co.za)
💬 [wa.me/27842916742](https://wa.me/27842916742)
✉️ hello@mirembemuse.co.za
