// ─────────────────────────────────────────────────────────────────────────────
// Nova Resource Library — pre-built responses & curated links
// Purpose: answer common student questions without burning API credits.
// These are returned DIRECTLY (no Anthropic call) or APPENDED to responses.
// ─────────────────────────────────────────────────────────────────────────────

export interface NovaResource {
  title: string
  url: string
  type: 'video' | 'article' | 'tool' | 'helpline' | 'website'
  description?: string
}

export interface PrebuiltResponse {
  response: string
  resources?: NovaResource[]
  skipApi: boolean // if true, do NOT call Anthropic — return this directly
}

// ─────────────────────────────────────────────────────────────────────────────
// PRE-BUILT RESPONSES (zero API cost, instant)
// ─────────────────────────────────────────────────────────────────────────────

export const PREBUILT_RESPONSES: Record<string, PrebuiltResponse> = {
  breathing: {
    skipApi: true,
    response: `Let's do the 4-7-8 breathing exercise together. It activates your parasympathetic nervous system and calms anxiety within 2 minutes.

**Ready? Find a comfortable position.**

1. **Breathe in** through your nose for **4 seconds**
   _(inhale slowly... 1... 2... 3... 4)_

2. **Hold** your breath for **7 seconds**
   _(hold... 1... 2... 3... 4... 5... 6... 7)_

3. **Breathe out** through your mouth for **8 seconds**
   _(exhale fully... 1... 2... 3... 4... 5... 6... 7... 8)_

Repeat this 3–4 times. Most students feel calmer after the second cycle.

You can do this before an exam, before a difficult conversation, or anytime you feel overwhelmed. Want to talk about what's stressing you out?`,
    resources: [
      { title: 'Guided 4-7-8 Breathing (video)', url: 'https://www.youtube.com/results?search_query=4-7-8+breathing+exercise+anxiety', type: 'video' },
      { title: 'Box breathing technique', url: 'https://www.youtube.com/results?search_query=box+breathing+stress+relief', type: 'video' },
    ],
  },

  pomodoro: {
    skipApi: true,
    response: `The Pomodoro Technique is one of the most evidence-backed study methods. Here's how to use it:

**The method:**
1. Choose ONE task to work on
2. Set a timer for **25 minutes** — work with full focus (phone face down, no tabs open)
3. When the timer rings, take a **5-minute break** (walk, stretch, drink water)
4. After **4 Pomodoros**, take a longer **20–30 minute break**

**Why it works:**
- Breaks the "I don't know where to start" paralysis
- Trains your brain to focus in bursts
- The timer creates urgency that beats procrastination
- Breaks prevent mental fatigue from building up

**For exam prep:** One Pomodoro = one topic section. You'll be surprised how much you cover in 2 hours.

Want me to help you set up a study plan using Pomodoros for your upcoming exams?`,
    resources: [
      { title: 'Pomodoro Timer (free)', url: 'https://pomofocus.io', type: 'tool', description: 'Free web-based Pomodoro timer' },
      { title: 'The Pomodoro Technique explained', url: 'https://www.youtube.com/results?search_query=pomodoro+technique+study+method', type: 'video' },
    ],
  },

  spaced_repetition: {
    skipApi: true,
    response: `Spaced repetition is the most scientifically proven study technique — used by medical students worldwide. Here's the SA student version:

**The core idea:** Review material at increasing intervals:
- Day 1: Learn it
- Day 2: Review it (10 min)
- Day 4: Review again (5 min)
- Day 8: Quick review (3 min)
- Day 16: One last scan

Each review strengthens the neural pathway. By the 5th review, it's locked in long-term memory.

**Practical for varsity:**
- Don't re-read your notes — that's passive. Instead, close them and try to recall from memory
- Use flashcards (physical or Anki app — free)
- Do past papers as reviews, not just before the exam

**Start tonight:** Take one lecture you attended this week, close your notes, and write down everything you can remember. Then check. Those gaps = what to focus on.`,
    resources: [
      { title: 'Anki Flashcard App (free)', url: 'https://apps.ankiweb.net', type: 'tool', description: 'Free spaced repetition flashcard system' },
      { title: 'How spaced repetition works', url: 'https://www.youtube.com/results?search_query=spaced+repetition+study+technique+science', type: 'video' },
      { title: 'Siyavula (free SA textbooks)', url: 'https://www.siyavula.com', type: 'website', description: 'Free Gr 10-12 and university prep content' },
    ],
  },

  anxiety_exam: {
    skipApi: false, // Let Claude personalise this with their actual exam data
    response: '',
    resources: [
      { title: 'Exam anxiety — how to manage it', url: 'https://www.youtube.com/results?search_query=exam+anxiety+study+tips+university', type: 'video' },
      { title: 'SADAG Student Support', url: 'https://www.sadag.org/index.php?option=com_content&view=article&id=2285', type: 'helpline', description: 'Free mental health support for SA students' },
      { title: 'Mind Tools stress management', url: 'https://www.mindtools.com/pages/article/newTCS_08.htm', type: 'article' },
    ],
  },

  nsfas_help: {
    skipApi: false,
    response: '',
    resources: [
      { title: 'NSFAS Student Portal', url: 'https://my.nsfas.org.za', type: 'website', description: 'Login to check your NSFAS status and allowances' },
      { title: 'NSFAS 2024 Guide', url: 'https://www.nsfas.org.za/content/how-to-apply.html', type: 'article' },
      { title: 'NSFAS Helpline', url: 'tel:08000NSFAS', type: 'helpline', description: '0800 067 327 — free call' },
    ],
  },

  budget_tight: {
    skipApi: false,
    response: '',
    resources: [
      { title: 'Student budget tips SA', url: 'https://www.youtube.com/results?search_query=south+africa+student+budget+tips', type: 'video' },
      { title: 'Checkers Sixty60 student deals', url: 'https://www.sixty60.co.za', type: 'website' },
    ],
  },

  mental_health_crisis: {
    skipApi: true,
    response: `I hear you, and I'm glad you reached out. What you're feeling is real, and you don't have to face this alone.

**Please reach out to one of these right now:**

🆘 **SADAG (SA Depression & Anxiety Group)**
   📞 0800 21 4446 — toll-free, 24/7

🆘 **Lifeline South Africa**
   📞 0800 567 567 — toll-free, 24/7

💬 **SMS Support**
   📱 SMS to 31393

🏫 **Your university counselling centre**
   They offer free, confidential sessions — check your university's website for hours.

**If you're in immediate danger, call 10111 (SAPS) or 112 (emergency).**

I'm here to talk too — but please know that a trained counsellor can give you the real human support you deserve right now. You matter.`,
    resources: [
      { title: 'SADAG — Student Support', url: 'https://www.sadag.org', type: 'helpline' },
      { title: 'Lifeline SA', url: 'https://lifelinesa.co.za', type: 'helpline' },
    ],
  },

  procrastination: {
    skipApi: false,
    response: '',
    resources: [
      { title: 'Procrastination — why you do it (science)', url: 'https://www.youtube.com/results?search_query=procrastination+science+how+to+stop', type: 'video' },
      { title: 'The 2-minute rule for tasks', url: 'https://www.youtube.com/results?search_query=2+minute+rule+productivity+david+allen', type: 'video' },
    ],
  },

  sleep_study: {
    skipApi: true,
    response: `Sleep is not optional — it's when your brain consolidates everything you studied. Pulling an all-nighter before an exam literally erases the memories you built during the week.

**The evidence-based student sleep plan:**
- **7–8 hours** minimum, especially the night before an exam
- Sleep before midnight when possible — deep sleep happens in the first half of the night
- Review your notes 30 minutes before bed, then sleep — your brain will process them overnight
- Avoid screens 30 min before bed (blue light delays melatonin)
- A 20-minute nap (not longer) between study sessions boosts focus by 30%

**If you can't sleep due to anxiety:**
- Try the 4-7-8 breathing (ask me to guide you)
- Write your worries on paper — gets them out of your head
- Avoid checking your phone — it spikes cortisol

Are you struggling to sleep because of study stress or something else?`,
    resources: [
      { title: 'Why sleep is your secret study weapon', url: 'https://www.youtube.com/results?search_query=sleep+and+memory+consolidation+study', type: 'video' },
    ],
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// TOPIC → RESOURCES MAP (appended to Claude responses on matching topics)
// These supplement Nova's answer without replacing it
// ─────────────────────────────────────────────────────────────────────────────

export const TOPIC_RESOURCE_MAP: Record<string, NovaResource[]> = {
  mathematics: [
    { title: 'Khan Academy Maths (free)', url: 'https://www.khanacademy.org/math', type: 'website', description: 'Step-by-step from basics to advanced' },
    { title: 'Professor Leonard (calculus)', url: 'https://www.youtube.com/c/ProfessorLeonard', type: 'video', description: 'Best free calculus lectures on YouTube' },
    { title: 'Siyavula Maths Practice', url: 'https://www.siyavula.com/read/maths', type: 'website' },
  ],
  statistics: [
    { title: 'StatQuest (statistics, data science)', url: 'https://www.youtube.com/@statquest', type: 'video', description: 'Makes stats genuinely understandable' },
    { title: 'Khan Academy Statistics', url: 'https://www.khanacademy.org/math/statistics-probability', type: 'website' },
  ],
  chemistry: [
    { title: 'Crash Course Chemistry', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtPHzzYuWy6fYEaX9mQQ8oGr', type: 'video' },
    { title: 'Khan Academy Chemistry', url: 'https://www.khanacademy.org/science/chemistry', type: 'website' },
    { title: 'Siyavula Physical Sciences', url: 'https://www.siyavula.com/read/science/grade-12-physical-sciences', type: 'website' },
  ],
  physics: [
    { title: 'Physics with Professor Mike Sommers', url: 'https://www.youtube.com/results?search_query=university+physics+lectures', type: 'video' },
    { title: 'Khan Academy Physics', url: 'https://www.khanacademy.org/science/physics', type: 'website' },
    { title: 'HyperPhysics (quick reference)', url: 'http://hyperphysics.phy-astr.gsu.edu/hbase/hframe.html', type: 'website' },
  ],
  accounting: [
    { title: 'Accounting Stuff (YouTube)', url: 'https://www.youtube.com/@AccountingStuff', type: 'video', description: 'Best plain-English accounting explanations' },
    { title: 'Khan Academy Finance & Capital Markets', url: 'https://www.khanacademy.org/economics-finance-domain', type: 'website' },
  ],
  economics: [
    { title: 'Crash Course Economics', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtPGqUDPkIqApgvzaZK-DKIq', type: 'video' },
    { title: 'Khan Academy Economics', url: 'https://www.khanacademy.org/economics-finance-domain/ap-macroeconomics', type: 'website' },
  ],
  programming: [
    { title: 'freeCodeCamp (free full courses)', url: 'https://www.freecodecamp.org', type: 'website', description: 'Completely free — HTML to Python to databases' },
    { title: 'CS50 Harvard (free)', url: 'https://cs50.harvard.edu/x/', type: 'website', description: 'Best free intro to CS in the world' },
    { title: 'The Odin Project', url: 'https://www.theodinproject.com', type: 'website' },
  ],
  biology: [
    { title: 'Crash Course Biology', url: 'https://www.youtube.com/playlist?list=PL3EED4C1D684D3ADF', type: 'video' },
    { title: 'Khan Academy Biology', url: 'https://www.khanacademy.org/science/ap-biology', type: 'website' },
  ],
  law: [
    { title: 'SAFLII (free SA case law)', url: 'https://www.saflii.org', type: 'website', description: 'Free South African legal databases' },
    { title: 'SA Law Reform Commission', url: 'https://www.salrc.org.za', type: 'website' },
  ],
  essay_writing: [
    { title: 'Purdue OWL Writing Lab', url: 'https://owl.purdue.edu/owl/general_writing/', type: 'website', description: 'Best free academic writing guide' },
    { title: 'How to write a first-class essay', url: 'https://www.youtube.com/results?search_query=how+to+write+a+university+essay+first+class', type: 'video' },
  ],
  mental_health_general: [
    { title: 'SADAG Student Resources', url: 'https://www.sadag.org/index.php?option=com_content&view=article&id=2285', type: 'helpline' },
    { title: 'Anxiety and stress at university', url: 'https://www.youtube.com/results?search_query=university+student+anxiety+how+to+cope', type: 'video' },
    { title: 'Mindfulness for students (free)', url: 'https://www.youtube.com/results?search_query=mindfulness+meditation+students+5+minutes', type: 'video' },
  ],
  nsfas: [
    { title: 'NSFAS myNSFAS Portal', url: 'https://my.nsfas.org.za', type: 'website' },
    { title: 'NSFAS 0800 067 327', url: 'tel:0800067327', type: 'helpline', description: 'Free NSFAS helpline' },
  ],
  job_search: [
    { title: 'PNet Student Jobs', url: 'https://www.pnet.co.za/jobs/students/', type: 'website' },
    { title: 'Indeed SA Part-time', url: 'https://za.indeed.com/part-time-jobs', type: 'website' },
    { title: 'LinkedIn (build profile now)', url: 'https://www.linkedin.com', type: 'website' },
    { title: 'Careers24 Graduate Jobs', url: 'https://www.careers24.com/jobs/search/?type=graduate', type: 'website' },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// TOPIC DETECTION — fast keyword matching (no API call)
// ─────────────────────────────────────────────────────────────────────────────

const PREBUILT_PATTERNS: { key: keyof typeof PREBUILT_RESPONSES; patterns: string[] }[] = [
  { key: 'breathing', patterns: ['breath', 'breathing exercise', 'calm down', 'panic', 'breathe with me', 'relaxation exercise'] },
  { key: 'pomodoro', patterns: ['pomodoro', 'study timer', 'focus technique', 'time management study'] },
  { key: 'spaced_repetition', patterns: ['spaced repetition', 'flashcard', 'memorise', 'memorize', 'remember content', 'study technique'] },
  { key: 'sleep_study', patterns: ['can\'t sleep', 'cannot sleep', 'sleep tips', 'study and sleep', 'all nighter', 'pulling an all nighter', 'sleep before exam'] },
  { key: 'procrastination', patterns: ['procrastinat', 'can\'t start', 'cannot start', 'keep putting off', 'keep delaying'] },
]

const TOPIC_PATTERNS: { topic: keyof typeof TOPIC_RESOURCE_MAP; patterns: string[] }[] = [
  { topic: 'mathematics', patterns: ['calculus', 'derivative', 'integral', 'trigonometr', 'algebra', 'maths help', 'math help'] },
  { topic: 'statistics', patterns: ['statistic', 'regression', 'probability', 'distribution', 'hypothesis', 'variance', 'p-value'] },
  { topic: 'chemistry', patterns: ['chemistry', 'organic chem', 'molecule', 'chemical reaction', 'titrat', 'stoichiometr'] },
  { topic: 'physics', patterns: ['physics', 'mechanics', 'newton', 'electric field', 'magnetic', 'quantum'] },
  { topic: 'accounting', patterns: ['accounting', 'debit', 'credit', 'balance sheet', 'journal entry', 'income statement', 'ledger'] },
  { topic: 'economics', patterns: ['economics', 'supply and demand', 'gdp', 'inflation', 'microeconomics', 'macroeconomics'] },
  { topic: 'programming', patterns: ['programming', 'coding', 'debug', 'python', 'java', 'javascript', 'algorithm', 'data structures'] },
  { topic: 'biology', patterns: ['biology', 'cell biology', 'dna', 'genetics', 'photosynthesis', 'anatomy', 'evolution'] },
  { topic: 'law', patterns: ['law school', 'contract law', 'statute', 'constitutional law', 'delict', 'case law'] },
  { topic: 'essay_writing', patterns: ['essay', 'thesis', 'dissertation', 'bibliography', 'citation', 'referencing', 'apa', 'harvard referencing'] },
  { topic: 'mental_health_general', patterns: ['anxiety', 'depressed', 'lonely', 'overwhelmed', 'stressed out', 'mental health', 'struggling emotionally'] },
  { topic: 'nsfas', patterns: ['nsfas', 'bursary', 'allowance', 'funding appeal', 'nsfas appeal', 'student funding'] },
  { topic: 'job_search', patterns: ['find a job', 'part time job', 'internship', 'graduate job', 'job hunting', 'cv', 'resume'] },
]

export function detectPrebuilt(message: string): PrebuiltResponse | null {
  const lower = message.toLowerCase()

  // Crisis check first — highest priority
  const crisisWords = ['suicide', 'kill myself', 'want to die', 'end my life', 'can\'t go on', 'no point living', 'self harm']
  if (crisisWords.some(w => lower.includes(w))) {
    return PREBUILT_RESPONSES.mental_health_crisis
  }

  // Pattern match for pre-built responses
  for (const { key, patterns } of PREBUILT_PATTERNS) {
    if (patterns.some(p => lower.includes(p))) {
      const pb = PREBUILT_RESPONSES[key]
      if (pb.skipApi) return pb
    }
  }

  return null
}

export function detectTopicResources(message: string): NovaResource[] {
  const lower = message.toLowerCase()
  const matched: NovaResource[] = []

  for (const { topic, patterns } of TOPIC_PATTERNS) {
    if (patterns.some(p => lower.includes(p))) {
      const resources = TOPIC_RESOURCE_MAP[topic]
      if (resources) matched.push(...resources.slice(0, 2)) // max 2 per topic
    }
  }

  return matched.slice(0, 4) // max 4 total resources per response
}

export function formatResourceLinks(resources: NovaResource[]): string {
  if (resources.length === 0) return ''
  const lines = resources.map(r => {
    const icon = r.type === 'video' ? '▶' : r.type === 'helpline' ? '🆘' : r.type === 'tool' ? '🛠' : '🔗'
    return `${icon} [${r.title}](${r.url})`
  })
  return `\n\n---\n**Helpful resources:**\n${lines.join('\n')}`
}
