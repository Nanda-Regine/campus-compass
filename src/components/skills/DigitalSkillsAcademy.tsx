'use client'
// ─── Digital Skills Academy ───────────────────────────────────
// 5 tracks: Python, AI Tools, Canva/Design, Excel/Data, Digital Security
import { useState } from 'react'

interface Lesson{id:string;title:string;duration:string;type:'read'|'practice'|'quiz';completed:boolean;content:string}
interface Track{id:string;title:string;emoji:string;color:string;description:string;xp:number;lessons:Lesson[]}

const STORAGE_KEY='varsityos-skills'
function loadProgress():Record<string,boolean>{if(typeof window==='undefined')return{};try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch{return{}}}
function saveProgress(p:Record<string,boolean>){localStorage.setItem(STORAGE_KEY,JSON.stringify(p))}

const TRACKS:Track[]=[
  {
    id:'python',title:'Python for Students',emoji:'🐍',color:'var(--teal)',xp:500,
    description:'Go from zero to writing real Python scripts in 2 weeks. No prior coding experience needed.',
    lessons:[
      {id:'py1',title:'Why Python? What it can do for you',duration:'5 min',type:'read',completed:false,content:`Python is the world's most beginner-friendly programming language. South African students use it to:
• Automate repetitive tasks (renaming files, sorting spreadsheets)
• Analyse data (sports stats, survey results, economic data)
• Build web scrapers (track prices, job listings)
• Create AI applications
• Do data science and machine learning

You can run Python free in your browser at colab.research.google.com — no install needed. Great for low-storage devices.`},
      {id:'py2',title:'Your first program: Hello, Nomvula!',duration:'10 min',type:'practice',completed:false,content:`Open Google Colab (colab.research.google.com) and type this:

\`\`\`python
name = "Nomvula"
print("Hello, " + name + "! Welcome to Python.")

# Ask a question
age = int(input("How old are you? "))
print("In 10 years you will be", age + 10, "years old.")
\`\`\`

Run it with Shift+Enter. Change the name to yours.

Concepts learned:
• Variables (name, age)
• print() — shows output
• input() — takes keyboard input
• int() — converts text to number`},
      {id:'py3',title:'Lists, loops, and your study timetable',duration:'15 min',type:'practice',completed:false,content:`\`\`\`python
# Your subjects as a list
subjects = ["Maths", "Physics", "Chemistry", "English"]

# Loop through and print each
for subject in subjects:
    print("Study session:", subject)

# Add a subject
subjects.append("Computer Science")

# How many subjects?
print("Total subjects:", len(subjects))
\`\`\`

Challenge: Add your own subjects and print how many hours to study each (hint: create a dictionary).`},
      {id:'py4',title:'Reading a CSV file: your marks data',duration:'20 min',type:'practice',completed:false,content:`\`\`\`python
import csv

# Create a sample marks file first:
marks = [
    ["Subject", "Test1", "Test2", "Exam"],
    ["Maths",    72,     65,     78],
    ["Science",  80,     75,     82],
]

with open("marks.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerows(marks)

# Now read and calculate average:
with open("marks.csv") as f:
    reader = csv.DictReader(f)
    for row in reader:
        scores = [int(row["Test1"]), int(row["Test2"]), int(row["Exam"])]
        avg = sum(scores) / len(scores)
        print(f"{row['Subject']}: average = {avg:.1f}%")
\`\`\`

This is exactly how data scientists start — reading real data and calculating statistics.`},
      {id:'py5',title:'Automate something useful: rename files',duration:'15 min',type:'practice',completed:false,content:`\`\`\`python
import os

# Create test files
for i in range(1, 6):
    open(f"assignment_{i}.txt", "w").close()

# Rename them with today's date prefix
from datetime import date
today = date.today().strftime("%Y%m%d")

for filename in os.listdir("."):
    if filename.startswith("assignment_"):
        new_name = f"{today}_{filename}"
        os.rename(filename, new_name)
        print(f"Renamed: {filename} → {new_name}")
\`\`\`

Real use: renaming downloaded lecture slides, photos, or notes by date.`},
    ]
  },
  {
    id:'ai',title:'AI Tools Mastery',emoji:'🤖',color:'var(--indigo,#6366F1)',xp:400,
    description:'Use AI to study 10x faster. Claude, ChatGPT, Gemini, Perplexity — for essays, research, coding, and more.',
    lessons:[
      {id:'ai1',title:'The AI landscape for students in 2025',duration:'5 min',type:'read',completed:false,content:`Free AI tools every student should know:

• **Claude (Anthropic)** — Best for long documents, essays, complex reasoning. claude.ai — free tier.
• **ChatGPT (OpenAI)** — Broadest capabilities. ChatGPT free or R200/month Plus.
• **Gemini (Google)** — Integrated with Google Docs and Drive. gemini.google.com — free.
• **Perplexity** — AI search with citations. Best for research. perplexity.ai — free.
• **Copilot (Microsoft)** — Free with your student Microsoft 365 account.
• **Canva AI** — Design, presentations, image generation.
• **GitHub Copilot** — Free with GitHub Student Pack. AI coding assistant.

Data tip: All these work via browser. No app downloads needed on low-storage phones.`},
      {id:'ai2',title:'Prompt engineering: get 10x better answers',duration:'15 min',type:'practice',completed:false,content:`The difference between a mediocre and brilliant AI response is your prompt.

**BAD prompt:** "Explain photosynthesis"
**GOOD prompt:** "Explain photosynthesis to a second-year biology student who understands cell respiration but is confused about the light-dependent reactions. Use an analogy. Then give me 3 exam-style questions with answers."

**The CRAFT formula:**
C — Context: who you are, what level, what course
R — Role: "Act as a patient tutor" or "Act as a strict exam marker"
A — Action: exactly what you want done
F — Format: bullet points, table, step-by-step, essay plan
T — Tone: formal/informal, technical/simple

**Practice now:** Take any concept from your current module and apply CRAFT to ask Claude or ChatGPT about it.`},
      {id:'ai3',title:'AI for essay writing (the ethical way)',duration:'15 min',type:'read',completed:false,content:`AI won't write your essay for you — that's plagiarism. But it can:

**Allowed uses:**
✓ Brainstorm: "Give me 8 angles I could take on this essay topic"
✓ Outline: "Create a structured outline for a 1,500-word essay on X"
✓ Improve: "What's weak about this paragraph? How can I improve it?"
✓ Research: "What are the key debates in the literature on X? (I'll verify in Google Scholar)"
✓ Citations: "In what format is this APA citation? Is it correct?"
✓ Grammar check: "Fix grammar and punctuation. Don't change my argument."

**Warning:** AI sometimes invents fake citations. Always verify every source in Google Scholar before using it. Perplexity.ai cites real sources — use it for research.

**The rule:** If you couldn't defend every sentence in a viva voce, don't submit it.`},
      {id:'ai4',title:'AI flashcards: study any textbook in 20 minutes',duration:'10 min',type:'practice',completed:false,content:`**Method:**

1. Paste a textbook section (or your own notes) into Claude
2. Use this prompt:
   "Convert this text into 15 flashcard-style Q&A pairs at university exam difficulty. Include one application question and one 'why does this matter?' question."
3. Copy the output into the Flashcards tab in VarsityOS

**For past papers:**
Paste a past paper question and ask: "Walk me through solving this step by step. Then create 3 similar practice questions."

**For understanding, not memorising:**
"What are the 5 things a student most commonly misunderstands about [concept]? Explain each one clearly."

This method takes 20 minutes per chapter and outperforms re-reading by 3x (spaced repetition research).`},
      {id:'ai5',title:'AI for coding: debugging and learning',duration:'15 min',type:'practice',completed:false,content:`**Debugging an error:**
Paste your code + the error message and ask:
"What is causing this error? Explain why it happens and show me the fix. Explain what I should understand so I don't make this mistake again."

**Learning by building:**
"I'm learning Python loops. Give me a small project (under 20 lines) that I can build today that would be useful in my student life. Walk me through it step by step."

**Code review:**
"Review this code for a beginner. What could be improved? What would a professional do differently?"

**Key rule for learning:** Never just copy AI code without understanding it. For every line you paste, be able to explain what it does. AI is a tutor, not a ghost-writer.`},
    ]
  },
  {
    id:'design',title:'Canva & Design',emoji:'🎨',color:'var(--rose,#FB7185)',xp:300,
    description:'Create professional-looking assignments, CVs, presentations and social content — all for free.',
    lessons:[
      {id:'d1',title:'Canva Pro — free for students',duration:'5 min',type:'read',completed:false,content:`**Get Canva Pro free:**
1. Go to canva.com/education
2. Click "Get Canva Pro free"
3. Verify with your student email
4. You now have access to: 100M+ premium images, 3000+ fonts, background remover, Magic Write AI, resize-to-any-format

**What you can make for free:**
• CVs and cover letters (download as PDF)
• Presentations (replace PowerPoint)
• Infographics (for assignments, science posters)
• Social media content (for your side hustle or student org)
• Business cards (print at CNA or online)
• Study timetables and trackers`},
      {id:'d2',title:'The 5 design rules that make everything look professional',duration:'10 min',type:'read',completed:false,content:`**1. Contrast** — Light text on dark background OR dark text on light background. Never similar shades together.

**2. Alignment** — Pick left-align or centre-align. Never mix randomly. Left alignment reads faster.

**3. Hierarchy** — Your most important point should be biggest. Subpoints smaller. Everything else smaller still.

**4. White space** — Empty space is not wasted space. It makes everything else look more professional.

**5. Colour rule of 3** — Maximum 3 colours: a dominant (60%), secondary (30%), accent (10%). Canva's colour palette generator helps.

**Fonts that always work:**
• Headings: Montserrat Bold, Playfair Display, Plus Jakarta Sans
• Body: Inter, Source Serif Pro, Lato
• Never: Comic Sans, Papyrus, Curlz`},
      {id:'d3',title:'Build a CV that gets interviews',duration:'20 min',type:'practice',completed:false,content:`**SA CV structure (1 page for students):**

1. Name + contact (email, LinkedIn, city)
2. Profile: 3-line summary of what you bring
3. Education: Degree, university, year, key subjects
4. Experience: Part-time, vacation work, volunteering
5. Projects: Anything you built, led, or contributed to
6. Skills: Software, languages, certifications
7. References: "Available on request" (saves space)

**In Canva:**
Search "CV" → filter "Free" → choose a clean, modern template → replace all text → Download as PDF.

**Rule:** ATS (automated screening) software can't read Canva CVs well. For big companies, use a plain Word/Google Docs format. For smaller companies, startups, and creative roles — Canva CV wins.`},
    ]
  },
  {
    id:'excel',title:'Excel & Data Skills',emoji:'📊',color:'var(--sky,#38BDF8)',xp:350,
    description:'The skill every employer asks for. Budgets, data analysis, and basic automation with formulas.',
    lessons:[
      {id:'e1',title:'Essential formulas every student needs',duration:'15 min',type:'practice',completed:false,content:`Open Google Sheets (free, works in browser) or Excel.

**The 10 formulas to master:**
\`\`\`
=SUM(A1:A10)          → Total a column
=AVERAGE(A1:A10)      → Average
=MAX(A1:A10)          → Highest value
=MIN(A1:A10)          → Lowest value
=COUNT(A1:A10)        → Count numbers
=COUNTA(A1:A10)       → Count non-empty cells
=IF(A1>50,"Pass","Fail")   → Condition check
=VLOOKUP(value,range,col,0) → Find matching data
=CONCATENATE(A1," ",B1)     → Join text
=TODAY()              → Today's date
\`\`\`

**Practice:** Build a marks tracker for your 5 modules with SUM, AVERAGE, and IF(mark>=50,"Pass","Fail").`},
      {id:'e2',title:'Build your personal budget in 30 minutes',duration:'30 min',type:'practice',completed:false,content:`**The VarsityOS Budget Template (Google Sheets):**

1. Column A: Category (Rent, Groceries, Data, Transport, Savings)
2. Column B: Budget amount (what you planned)
3. Column C: Actual amount (what you spent)
4. Column D: =B-C (difference — negative means over budget)
5. Column E: =IF(D<0,"OVER ⚠️","OK ✓")

**Add a totals row at the bottom:**
- Total budget: =SUM(B2:B10)
- Total actual: =SUM(C2:C10)
- Net: =SUM(B2:B10)-SUM(C2:C10)

**NSFAS budget tip:** Set your disbursement date as a "NSFAS IN" income row. Track every category from disbursement to depletion. You'll see where the money goes in month 1.`},
      {id:'e3',title:'Pivot tables: analyse anything in 5 minutes',duration:'20 min',type:'practice',completed:false,content:`A pivot table summarises large data in seconds. Example: you have 100 rows of expenses. A pivot table shows total per category with 3 clicks.

**In Google Sheets:**
1. Select your data (include headers)
2. Insert → Pivot table → Create
3. Rows: Category
4. Values: Amount (sum)
5. Done. You now have a summary.

**Real use cases for students:**
- Summarise spending by week vs month
- Compare marks by subject over time
- Analyse survey responses (if you're doing research)
- Create a weekly hours-worked tracker for part-time jobs

Employers love pivot table skills. It signals data literacy, which is valued across ALL industries.`},
    ]
  },
  {
    id:'security',title:'Digital Security',emoji:'🔐',color:'var(--emerald,#34D399)',xp:250,
    description:'Protect your phone, money, and identity. Scams targeting students are increasing in SA.',
    lessons:[
      {id:'s1',title:'The 5 biggest scams targeting SA students',duration:'10 min',type:'read',completed:false,content:`**Know these by name:**

1. **SIM Swap fraud** — Fraudsters call your network and swap your number to their SIM. Then they intercept banking OTPs. Protect yourself: Lock your number with your network. Use an authenticator app (Google Authenticator), not SMS OTPs.

2. **NSFAS impersonation** — WhatsApp messages claiming your NSFAS is blocked. The real NSFAS never contacts you on WhatsApp. Always go directly to nsfas.org.za.

3. **Fake job offers** — "Earn R5,000/week from home." These are either pyramid schemes, money mule fraud (illegal), or just fake. Legitimate jobs don't require upfront payment.

4. **Facebook Marketplace scams** — Buyer sends "proof of payment" that looks real (it's fake) and asks you to ship first. Use Facebook's checkout or meet in person.

5. **Vishing (voice phishing)** — Caller pretends to be your bank. They already know your name and last 4 digits of your card. They ask for your OTP "to stop a fraud." Hang up immediately. Your bank will NEVER ask for an OTP.`},
      {id:'s2',title:'Passwords: the one system that actually works',duration:'10 min',type:'practice',completed:false,content:`**The problem:** Most students use the same weak password everywhere. One data breach exposes everything.

**The solution: A password manager.**
Free options: Bitwarden (best free), KeePass (offline).
Paid: 1Password (R70/month).

**If you won't use a manager, use this system:**

Base: Choose a memorable phrase. "MyFirstCarWasACorsa" → MFC@C0rs@!
Add site prefix: For Gmail → G-MFC@C0rs@!
For Capitec → C-MFC@C0rs@!

**Absolutely required:**
• Unique password for your banking app (never reuse)
• Unique password for your student portal
• Different email password from everything else
• Enable 2FA (two-factor authentication) on all important accounts

**Check if your email was leaked:** Have I Been Pwned at haveibeenpwned.com`},
      {id:'s3',title:'Public WiFi: what to do and what to avoid',duration:'8 min',type:'read',completed:false,content:`Campus and coffee shop WiFi is convenient but risky. Here's the rule:

**Safe on public WiFi:**
✓ Browsing news, YouTube
✓ GitHub (HTTPS)
✓ Any site with the padlock (HTTPS) — your data is encrypted in transit

**Dangerous on public WiFi without a VPN:**
✗ Banking (use mobile data instead)
✗ Logging into email or social media
✗ Anything with your password or personal info

**Free VPN options:**
- Proton VPN — free tier, no data limit, good privacy policy
- Windscribe — 10GB/month free
- Avoid "no-log" VPNs with no company name or reputation

**The real risk:** Man-in-the-middle attacks on unencrypted connections. A hacker on the same WiFi can see your traffic. HTTPS reduces this risk, but a VPN eliminates it.

**Campus tip:** If your university provides eduroam — that's WPA2 Enterprise encryption. Far more secure than coffee shop WiFi.`},
    ]
  },
]

export default function DigitalSkillsAcademy() {
  const [progress,setProgress]=useState<Record<string,boolean>>(loadProgress)
  const [activeTrack,setActiveTrack]=useState<string|null>(null)
  const [activeLesson,setActiveLesson]=useState<string|null>(null)

  const track=TRACKS.find(t=>t.id===activeTrack)
  const lesson=track?.lessons.find(l=>l.id===activeLesson)

  const toggleComplete=(lessonId:string)=>{
    const p={...progress,[lessonId]:!progress[lessonId]}
    setProgress(p);saveProgress(p)
  }

  const trackXP=(t:Track)=>t.lessons.filter(l=>progress[l.id]).length*Math.floor(t.xp/t.lessons.length)
  const totalXP=TRACKS.reduce((a,t)=>a+trackXP(t),0)
  const maxXP=TRACKS.reduce((a,t)=>a+t.xp,0)

  if(lesson&&track) return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{display:'flex',gap:10,alignItems:'center'}}>
        <button onClick={()=>setActiveLesson(null)} style={{padding:'6px 12px',background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:8,color:'var(--text-secondary)',fontSize:'0.7rem',cursor:'pointer'}}>← Back</button>
        <div style={{flex:1}}>
          <div style={{fontSize:'0.62rem',fontFamily:'var(--font-mono)',color:track.color}}>{track.emoji} {track.title}</div>
          <div style={{fontSize:'0.82rem',fontWeight:700,color:'var(--text-primary)',marginTop:1}}>{lesson.title}</div>
        </div>
        <span style={{fontSize:'0.62rem',padding:'3px 8px',background:'var(--bg-elevated)',border:'1px solid var(--border-subtle)',borderRadius:100,color:'var(--text-muted)',fontFamily:'var(--font-mono)'}}>{lesson.duration}</span>
      </div>
      <div style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:14,padding:'16px',whiteSpace:'pre-wrap',fontSize:'0.78rem',color:'var(--text-secondary)',lineHeight:1.75,fontFamily:lesson.type==='practice'?'var(--font-mono)':'inherit'}}>
        {lesson.content}
      </div>
      <button onClick={()=>{toggleComplete(lesson.id);setActiveLesson(null)}} style={{padding:'12px 0',background:progress[lesson.id]?'rgba(52,211,153,0.1)':'rgba(99,102,241,0.1)',border:`1px solid ${progress[lesson.id]?'rgba(52,211,153,0.25)':'rgba(99,102,241,0.25)'}`,borderRadius:12,color:progress[lesson.id]?'var(--teal)':'var(--indigo,#6366F1)',fontSize:'0.78rem',fontFamily:'var(--font-mono)',fontWeight:700,cursor:'pointer'}}>
        {progress[lesson.id]?'✓ Mark incomplete':'✓ Mark complete & continue'}
      </button>
    </div>
  )

  if(track) return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{display:'flex',gap:10,alignItems:'center'}}>
        <button onClick={()=>setActiveTrack(null)} style={{padding:'6px 12px',background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:8,color:'var(--text-secondary)',fontSize:'0.7rem',cursor:'pointer'}}>← All tracks</button>
        <div>
          <div style={{fontSize:'0.86rem',fontWeight:700,color:'var(--text-primary)'}}>{track.emoji} {track.title}</div>
          <div style={{fontSize:'0.68rem',color:'var(--text-tertiary)',marginTop:1}}>{trackXP(track)}/{track.xp} XP · {track.lessons.filter(l=>progress[l.id]).length}/{track.lessons.length} lessons done</div>
        </div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {track.lessons.map((l,i)=>(
          <button key={l.id} onClick={()=>setActiveLesson(l.id)} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:'var(--bg-surface)',border:`1px solid ${progress[l.id]?'rgba(52,211,153,0.2)':'var(--border-subtle)'}`,borderRadius:12,cursor:'pointer',textAlign:'left'}}>
            <div style={{width:28,height:28,borderRadius:'50%',background:progress[l.id]?'rgba(52,211,153,0.15)':'var(--bg-elevated)',border:`2px solid ${progress[l.id]?'var(--teal)':'var(--border-default)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.68rem',fontWeight:700,color:progress[l.id]?'var(--teal)':'var(--text-muted)',flexShrink:0}}>{progress[l.id]?'✓':(i+1)}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:'0.82rem',fontWeight:600,color:'var(--text-primary)'}}>{l.title}</div>
              <div style={{fontSize:'0.62rem',color:'var(--text-muted)',marginTop:2}}>{l.duration} · {l.type==='practice'?'Practice exercise':l.type==='quiz'?'Quiz':'Reading'}</div>
            </div>
            <span style={{fontSize:'0.6rem',color:'var(--text-muted)'}}>→</span>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{position:'relative',overflow:'hidden',background:'var(--bg-surface)',border:'1px solid rgba(99,102,241,0.25)',borderRadius:16,padding:'16px 18px'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,var(--indigo,#6366F1),transparent)'}}/>
        <div style={{fontSize:'0.58rem',fontFamily:'var(--font-mono)',color:'var(--indigo,#6366F1)',letterSpacing:'0.09em',marginBottom:4}}>DIGITAL SKILLS ACADEMY</div>
        <div style={{fontSize:'1rem',fontWeight:700,color:'var(--text-primary)'}}>Build the skills employers actually want</div>
        <div style={{fontSize:'0.73rem',color:'var(--text-secondary)',marginTop:3}}>Python · AI Tools · Design · Excel · Security</div>
      </div>

      <div style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:12,padding:'12px 14px'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
          <span style={{fontSize:'0.72rem',color:'var(--text-secondary)'}}>Total XP earned</span>
          <span style={{fontSize:'0.82rem',fontFamily:'var(--font-mono)',fontWeight:700,color:'var(--indigo,#6366F1)'}}>{totalXP}/{maxXP}</span>
        </div>
        <div style={{height:6,background:'var(--bg-elevated)',borderRadius:3,overflow:'hidden'}}>
          <div style={{width:`${(totalXP/maxXP)*100}%`,height:'100%',background:'linear-gradient(90deg,var(--indigo,#6366F1),var(--teal))',borderRadius:3,transition:'width 0.3s'}}/>
        </div>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {TRACKS.map(t=>{
          const done=t.lessons.filter(l=>progress[l.id]).length
          const pct=done/t.lessons.length
          return (
            <button key={t.id} onClick={()=>setActiveTrack(t.id)} style={{display:'flex',gap:14,padding:'14px',background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:14,cursor:'pointer',textAlign:'left',alignItems:'flex-start'}}>
              <div style={{width:42,height:42,borderRadius:12,background:`${t.color}15`,border:`1px solid ${t.color}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem',flexShrink:0}}>{t.emoji}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:3}}>
                  <div style={{fontSize:'0.86rem',fontWeight:700,color:'var(--text-primary)'}}>{t.title}</div>
                  <div style={{fontSize:'0.65rem',fontFamily:'var(--font-mono)',color:t.color,flexShrink:0,marginLeft:8}}>{done}/{t.lessons.length}</div>
                </div>
                <div style={{fontSize:'0.7rem',color:'var(--text-secondary)',marginBottom:8,lineHeight:1.4}}>{t.description}</div>
                <div style={{height:4,background:'var(--bg-elevated)',borderRadius:2,overflow:'hidden'}}>
                  <div style={{width:`${pct*100}%`,height:'100%',background:t.color,borderRadius:2,transition:'width 0.3s'}}/>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
