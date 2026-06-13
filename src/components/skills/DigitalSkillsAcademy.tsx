'use client'
// ─── Digital Skills Academy ───────────────────────────────────
// Tracks: Google Workspace · Academic Research · AI Tools · Excel · Professional Skills · Digital Security · Python

import { useState } from 'react'

interface Lesson { id: string; title: string; duration: string; type: 'read' | 'practice' | 'quiz'; completed: boolean; content: string }
interface Track  { id: string; title: string; emoji: string; color: string; description: string; xp: number; lessons: Lesson[] }

const STORAGE_KEY = 'varsityos-skills'
function loadProgress(): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}
function saveProgress(p: Record<string, boolean>) { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)) }

// Simple markdown renderer: **bold**, `code`, ```block```
function renderMd(text: string) {
  const lines = text.split('\n')
  return lines.map((line, li) => {
    // Code block lines already handled via monospace container — just output as-is
    const parts: React.ReactNode[] = []
    let remaining = line
    let key = 0
    while (remaining.length > 0) {
      const boldIdx = remaining.indexOf('**')
      const codeIdx = remaining.indexOf('`')
      if (boldIdx === -1 && codeIdx === -1) { parts.push(remaining); break }
      const firstMark = boldIdx === -1 ? codeIdx : codeIdx === -1 ? boldIdx : Math.min(boldIdx, codeIdx)
      if (firstMark > 0) parts.push(remaining.slice(0, firstMark))
      if (firstMark === boldIdx) {
        const end = remaining.indexOf('**', boldIdx + 2)
        if (end === -1) { parts.push(remaining.slice(boldIdx)); break }
        parts.push(<strong key={key++} style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700 }}>{remaining.slice(boldIdx + 2, end)}</strong>)
        remaining = remaining.slice(end + 2)
      } else {
        const end = remaining.indexOf('`', codeIdx + 1)
        if (end === -1) { parts.push(remaining.slice(codeIdx)); break }
        parts.push(<code key={key++} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 4, padding: '1px 5px', fontFamily: 'var(--font-mono)', fontSize: '0.85em', color: '#4ecf9e' }}>{remaining.slice(codeIdx + 1, end)}</code>)
        remaining = remaining.slice(end + 1)
      }
    }
    return <span key={li}>{parts}<br /></span>
  })
}

const TRACKS: Track[] = [
  // ──────────────────────────────────────────────────────────────────
  // 1. Google Workspace Essentials
  // ──────────────────────────────────────────────────────────────────
  {
    id: 'workspace', title: 'Google Workspace for Assignments', emoji: '🖥️', color: '#4285F4', xp: 400,
    description: 'The tools you use every day for assignments. Google Docs, Sheets, Slides, Drive — set up to actually work.',
    lessons: [
      {
        id: 'w1', title: 'Set up Google Docs for academic submissions', duration: '10 min', type: 'practice', completed: false,
        content: `Most assignments have strict formatting requirements. Here is how to match them every time.

**FONT & SIZE**
Format → Paragraph styles → Normal text → Edit → Times New Roman, 12pt
(Or Calibri 11pt — check your department's style guide)

**MARGINS**
File → Page setup → Margins: 2.54 cm all sides (1 inch)
This is the APA and Harvard standard used at most SA universities.

**LINE SPACING**
Format → Line & paragraph spacing → 2.0 (double-space) for most academic work
→ "Remove space before paragraph" to prevent gaps between paragraphs

**PAGE NUMBERS**
Insert → Headers & footers → Page number → Bottom of page, right
Top-right: your surname and student number (Insert → Headers & footers → Header)

**WORD COUNT LIVE COUNTER**
Tools → Word count → tick "Display word count while typing"
Now the count appears bottom-left while you write.

**Save as default:** Format → Paragraph styles → Options → Save as my default styles
Every new Docs document will now start correctly formatted.`,
      },
      {
        id: 'w2', title: 'Headings, styles, and automatic Table of Contents', duration: '12 min', type: 'practice', completed: false,
        content: `An automatic Table of Contents updates itself as you write. This takes 2 minutes to set up and impresses every lecturer.

**WHY HEADING STYLES MATTER**
Using styles (not just making text bigger/bold manually) enables:
• Automatic Table of Contents with accurate page numbers
• Easy navigation (jump to sections)
• Consistent formatting throughout
• Accessibility (screen readers)

**HOW TO APPLY HEADINGS**
1. Click on your chapter/section title
2. Click the Styles dropdown (shows "Normal text" by default)
3. Select Heading 1 for main sections
4. Heading 2 for sub-sections, Heading 3 for sub-sub-sections

**INSERT THE TABLE OF CONTENTS**
1. Set up all your headings first
2. Click after your cover page
3. Insert → Table of contents → select "with page numbers"
4. Done — it auto-populates

**UPDATE AFTER WRITING MORE**
Click anywhere in the ToC → click the refresh icon (↻)
The ToC updates with new headings and corrected page numbers.

**MODIFY HEADING STYLES**
Right-click any heading in the Styles panel → Edit style → change font, size, colour → Apply
This changes every Heading 1 in the document at once.`,
      },
      {
        id: 'w3', title: 'Group assignments in Drive without chaos', duration: '10 min', type: 'practice', completed: false,
        content: `Group assignments fall apart because people work on separate copies. Here is the right system.

**RULE 1: DOCUMENT LIVES IN DRIVE — NOT ON ANYONE'S LAPTOP**
One person creates the document in Google Drive.
Share → "Anyone with the link" → set to Editor.
Everyone edits the same file. No emailing versions. No "which one is final?"

**RULE 2: ASSIGN SECTIONS WITH COMMENTS**
Click where a section starts → Insert → Comment (Ctrl+Alt+M)
@tag your teammate: "@Thandi you write the literature review here"
They get an email notification. Assigned tasks are visible to everyone.

**RULE 3: USE SUGGESTING MODE FOR FEEDBACK**
Edit → Suggesting (not Editing)
Your changes appear as suggestions in a different colour.
Others can Accept or Reject each suggestion — nothing is changed without consent.

**RULE 4: VERSION HISTORY IS YOUR SAFETY NET**
File → Version history → See version history
Every version is saved automatically with timestamp and editor name.
If someone accidentally deletes content → restore to an earlier version.

**RULE 5: FINAL SUBMISSION PROCESS**
1. Final editor switches to Editing mode and accepts all remaining suggestions
2. File → Download as → PDF (preserves formatting on any computer)
3. Submit the PDF — never submit a Docs link (link access can change)

**Never email the document.** Everyone with the link always has the latest version.`,
      },
      {
        id: 'w4', title: 'Google Slides: academic presentations that score', duration: '10 min', type: 'read', completed: false,
        content: `A presentation is a performance aid — not a document you read from. Slides that work have one idea per slide.

**STRUCTURE FOR A 10-MINUTE ACADEMIC PRESENTATION**
1. Title slide — topic, your name, student number, date, module code
2. Outline (optional) — "I will cover: X, Y, Z"
3. Body slides — one key argument per slide
4. Conclusion — restate thesis + 3 takeaways
5. References slide — at minimum 3 credible sources

**DESIGN RULES THAT ALWAYS WORK**
• **1 idea per slide.** If you need to say more, add a slide.
• **Font size minimum 24pt** — lecturers mark from the back of the room.
• **Max 6 lines of text per slide.** Bullets, not sentences.
• **High contrast:** white text on dark background OR dark text on white. Never medium-on-medium.
• **Consistent colour palette:** pick 2–3 colours and stick to them throughout.

**FREE TEMPLATES IN SLIDES**
Slideshow → Themes → choose a clean, minimal theme
Or: search Google for "Google Slides academic template free" → File → Import slides

**PRESENTING PROFESSIONALLY**
View → Presenter view
• You see your speaker notes; audience sees your slide
• Shows next slide preview — no surprises
• Built-in timer

**EXPORT**
File → Download → PDF (for submission)
File → Download → PowerPoint (.pptx) if your lecturer requires it`,
      },
      {
        id: 'w5', title: 'Google Drive folder structure that saves you at exam time', duration: '8 min', type: 'practice', completed: false,
        content: `You will spend hours searching for files if your Drive is chaotic. Build this structure once:

\`\`\`
📂 UNIVERSITY [Your Name]
  📂 2024 — Year 2
    📂 Semester 1
      📂 CSC2010 - Data Structures
        📁 Lecture Slides
        📁 Assignments
        📁 Practicals
        📁 Past Papers
      📂 STA2021 - Statistics
      📂 ENG2001 - Technical Writing
    📂 Semester 2
      ...
  📂 2025 — Year 3
    ...
📂 CV & Career
  📄 CV - Nomvula Mokoena - June 2024
  📄 Cover Letter Template
  📁 Job Applications
📂 Finance & NSFAS
  📄 NSFAS Funding Letter
  📄 Budget Tracker
📂 Research & Reading
  📁 Academic Articles (saved PDFs)
\`\`\`

**NAMING CONVENTION FOR ASSIGNMENTS**
[Module code] [Task] [Your Name] [Version]
Example: CSC2010 Assignment 2 Nomvula Mokoena v1.docx

**WHY VERSION IT?**
CSC2010 Assignment 2 Nomvula Mokoena **v2** → v3 → **FINAL**
You can always go back. "FINAL" and "FINAL_FINAL" are signs you need this system.

**SHORTCUT**
Star (⭐) your current semester folder. It appears under "Starred" for instant access.

Set this up in 10 minutes now. You will thank yourself in exam season.`,
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // 2. Academic Research & Citations
  // ──────────────────────────────────────────────────────────────────
  {
    id: 'research', title: 'Academic Research & Citations', emoji: '📚', color: '#f59e0b', xp: 450,
    description: 'Find credible sources, reference them correctly (APA / Harvard), and never lose marks for citations again.',
    lessons: [
      {
        id: 'r1', title: 'Finding credible academic sources', duration: '12 min', type: 'practice', completed: false,
        content: `Google gives you blogs and opinions. For university assignments, you need peer-reviewed sources.

**GOOGLE SCHOLAR (scholar.google.com) — start here**
Type your topic: "effect of load shedding on student academic performance"
• Filter by date → "Since 2020" for recent research
• "Cited by X" shows how influential a paper is — higher = more credible
• Click "All X versions" → often a free PDF is available
• Click ⭐ to save to "My Library"

**JSTOR (jstor.org) — humanities, law, social sciences**
Free for registered users — sign up with your student email
File → "Access through your institution" at most SA universities

**RESEARCHGATE (researchgate.net)**
Free PDFs directly from authors. Works well when JSTOR is paywalled.
Tip: search the exact paper title + "ResearchGate"

**SA-SPECIFIC DATABASES**
• SABINET (sabinet.co.za) — SA journals, law, education, nursing
• African Journals Online — ajol.info — open access African research
• UNISA's EBSCO database — via your student library portal

**EVALUATING SOURCES: THE CRAAP TEST**
Currency → When was it published? Science: use sources under 5 years. History: older is fine.
Relevance → Does it actually answer your research question?
Authority → What are the author's qualifications? Which institution?
Accuracy → Are the claims backed by data and references?
Purpose → Is it written to inform, persuade, or sell something?

**WHAT COUNTS AS A CREDIBLE SOURCE**
✓ Peer-reviewed journal articles
✓ Published books from academic publishers (Oxford, Routledge, HSRC Press)
✓ Government reports (Stats SA, National Treasury)
✓ WHO, UN, World Bank reports

✗ Wikipedia (use it to find sources, not as a source)
✗ News articles (unless you're analysing news coverage)
✗ Random websites, blogs, social media`,
      },
      {
        id: 'r2', title: 'APA 7th edition: the SA university standard', duration: '15 min', type: 'read', completed: false,
        content: `APA 7th edition is used at most SA universities for social sciences, psychology, education, business, and health sciences. Here is what you actually need to know.

**IN-TEXT CITATIONS**
One author:           (Mthembu, 2022)
Two authors:          (Mthembu & Dlamini, 2022)
Three or more:        (Mthembu et al., 2022)
Direct quote:         (Mthembu, 2022, p. 45)
Corporate author:     (Statistics South Africa, 2023)

**REFERENCE LIST: FORMAT BY SOURCE TYPE**

Journal article:
Mthembu, L., & Dlamini, T. (2022). Financial stress and academic performance among NSFAS students. *South African Journal of Education, 42*(3), 1–14. https://doi.org/10.15700/saje.v42n3a2145

Book:
Ndebele, N. (2006). *Fools and other stories* (3rd ed.). Ravan Press.

Book chapter:
Tlali, M. (2019). Writing in the margins. In N. Ndebele (Ed.), *New voices from South Africa* (pp. 23–41). HSRC Press.

Website:
Statistics South Africa. (2023, March 14). *Quarterly labour force survey, Quarter 4 2022*. https://www.statssa.gov.za

**KEY FORMATTING RULES**
• Reference list: alphabetical by first author's surname
• Hanging indent: second and subsequent lines indent 1.27 cm
• Italicise: journal name AND volume number, book titles
• DOI as hyperlink: https://doi.org/... at the end
• No "Retrieved from" before URLs (removed in APA 7th)

**QUICK REFERENCE: WHAT TO NOTE WHEN READING A SOURCE**
Author surname(s), initials
Year
Title of article / chapter
Journal name / book title
Volume, issue, pages
DOI or URL

Save these details immediately — searching for them later wastes hours.`,
      },
      {
        id: 'r3', title: 'Zotero: never format a reference manually again', duration: '12 min', type: 'practice', completed: false,
        content: `Zotero auto-generates correctly formatted references in APA, Harvard, Chicago, or any style your department requires. It is free and saves hours per assignment.

**SETUP (10 minutes, once)**
1. Download Zotero at zotero.org → install the desktop app (free)
2. In Chrome/Firefox: install the Zotero Connector browser extension
3. Create a free Zotero account (for cloud sync across devices)
4. In Google Docs: Extensions → Add-ons → Zotero Connector
   (Or Extensions → Manage add-ons → search "Zotero")

**SAVING A SOURCE (5 seconds per source)**
Open any journal article, Google Scholar page, or book page
Click the Zotero icon in your browser toolbar
Zotero saves the source — title, authors, year, DOI, everything

**CITING WHILE WRITING IN GOOGLE DOCS**
Extensions → Zotero → Add/Edit Citation
Search your saved sources by author or title → click → Zotero inserts (Mthembu, 2022)

**GENERATING THE REFERENCE LIST**
Place cursor at the end of your document
Extensions → Zotero → Add/Edit Bibliography
Zotero generates a complete, correctly formatted reference list

**CHANGING CITATION STYLE**
Extensions → Zotero → Document Preferences → select style
Switch from APA 7 to Harvard to Chicago with one click — all citations and the reference list update instantly

**ONE IMPORTANT NOTE**
Zotero auto-fills from what publishers provide — always check the generated reference against the APA format. Occasionally a field is missing and you need to complete it manually in Zotero → right-click source → Edit item.

Lecturers can tell within seconds if references were manually formatted or came from a tool. This is worth 10 minutes of setup.`,
      },
      {
        id: 'r4', title: 'Plagiarism: what it really is and how to avoid it', duration: '10 min', type: 'read', completed: false,
        content: `Plagiarism is broader than most students think. Universities use Turnitin and SafeAssign — and they detect more than copy-paste.

**TYPES OF PLAGIARISM**

**Verbatim plagiarism** — copying text word-for-word without quoting and citing. Clear violation.

**Mosaic plagiarism** — changing a few words or synonyms but keeping the sentence structure and ideas. Still plagiarism even with a citation. You paraphrase ideas, not just swap words.

**Incorrect paraphrasing** — rewriting someone's idea in your own words but forgetting to cite the source. The idea is still theirs.

**Self-plagiarism** — submitting a previous assignment (even your own) for a new submission without permission. Both assignments may fail.

**WHAT IS NOT PLAGIARISM**
✓ Paraphrasing an idea in your own words + citing the source
✓ Quoting directly (in "quotation marks") + citing with page number
✓ Common knowledge: historical facts, scientific constants (no citation needed)
✓ Your own original analysis and arguments

**HOW TO PARAPHRASE CORRECTLY**
1. Read the source carefully until you understand it
2. Close or minimise it
3. Write the concept from memory in your own words and sentence structure
4. Re-read the original — if the structure matches, rewrite again
5. Add the in-text citation

**TURNITIN STRATEGIES**
High similarity % is not automatically plagiarism — it includes:
• Your own in-text citations (expected)
• Common academic phrases ("This essay will argue that...")
• Your own headings

A 12% similarity with 0% matching another student's paper is fine.
A 12% similarity where 8% matches one other student's submission is a serious problem.

**FREE PLAGIARISM CHECKERS (before submission)**
• Grammarly free tier — basic check
• Quetext (quetext.com) — 500 words free per search
• PlagScan (plagscan.com) — limited free tier`,
      },
      {
        id: 'r5', title: 'Essay vs report: structure that earns marks', duration: '12 min', type: 'read', completed: false,
        content: `Using the wrong structure for the assignment type loses marks before the lecturer reads a word.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
ESSAY STRUCTURE (humanities, social sciences, business)
━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Introduction (10–15% of words)**
• Hook (a striking fact, question, or statement)
• Background context (2–3 sentences)
• Thesis statement: "This essay argues that X because Y and Z."
• Outline: "Firstly, ... Secondly, ... Finally, ..."

**Body paragraphs (each = 1 argument)**
• Topic sentence: states the argument of this paragraph
• Evidence: quote or paraphrase + citation
• Explanation: how does this support your thesis?
• Link: connect back to the thesis or to the next paragraph

**Conclusion (10% of words)**
• Restate thesis in different words
• Summarise key arguments briefly
• Broader implication or recommendation
• No new information in the conclusion

━━━━━━━━━━━━━━━━━━━━━━━━━━━
REPORT STRUCTURE (science, engineering, business, education)
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cover page → Table of Contents (auto in Docs) → Executive Summary/Abstract → Introduction (background + purpose + scope) → Literature Review → Methodology → Findings / Results → Discussion / Analysis → Recommendations → Conclusion → References → Appendices

**THE CRITICAL DIFFERENCE**
Essays: argue a position using evidence and reasoning. First person sometimes allowed.
Reports: present findings objectively. Past tense. Third person. Headings required. Tables/figures labelled.

Mixing the styles is the most common mark-loser. Check your assignment brief: "critically discuss" = essay. "Investigate and report on" = report.

**ONE MORE RULE**
Your conclusion cannot contain new arguments. If something is important enough to say — say it in the body.`,
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // 3. AI Tools Mastery
  // ──────────────────────────────────────────────────────────────────
  {
    id: 'ai', title: 'AI Tools Mastery', emoji: '🤖', color: '#6366F1', xp: 400,
    description: 'Claude, ChatGPT, Perplexity, NotebookLM — use AI to study smarter and work faster without crossing academic lines.',
    lessons: [
      {
        id: 'ai1', title: 'The AI toolkit every SA student should know', duration: '8 min', type: 'read', completed: false,
        content: `These are free (or free tier) and work in your browser — no app download, no expensive subscriptions.

**FOR STUDYING & ASSIGNMENTS**
• **Claude (claude.ai)** — Best for long documents, nuanced essays, step-by-step reasoning, SA context. Free tier: generous daily limit.
• **ChatGPT (chatgpt.com)** — Broadest general knowledge. Free tier is strong. R200/month for Plus (GPT-4 with images).
• **Perplexity (perplexity.ai)** — AI search with real citations. Use this for research — it shows sources, unlike ChatGPT. Free.
• **Google Gemini (gemini.google.com)** — Integrates with Google Docs, Sheets, Gmail. Free with Google account.
• **Microsoft Copilot** — Free with your student Microsoft 365 account via your university. Works in Word and Teams.

**FOR STUDYING SPECIFICALLY**
• **NotebookLM (notebooklm.google.com)** — Upload your lecture slides, textbook chapters, or notes. Ask it questions, get summaries, generate a podcast-style audio discussion from your content. Free, game-changing for exam revision.

**FOR CODING**
• **GitHub Copilot** — Free with GitHub Student Developer Pack (github.com/education). AI autocomplete inside VS Code.

**FOR DESIGN**
• **Canva AI** (canva.com/education → free Pro) — Magic Write for copy, text-to-image, background remover, AI presentations.

**DATA TIP**
All of these work in your browser — no downloads. Claude and ChatGPT work well on mobile data. NotebookLM requires uploading files (do this on WiFi).`,
      },
      {
        id: 'ai2', title: 'Prompt engineering: get 10x better answers', duration: '15 min', type: 'practice', completed: false,
        content: `The difference between a mediocre and brilliant AI response is your prompt. Here is the exact method.

**BAD PROMPT vs GOOD PROMPT**

Bad:  "Explain the water crisis"
Good: "Explain South Africa's water crisis to a 2nd-year Geography student who understands resource management but is confused about the political and infrastructure factors. Use simple language. Then give me 3 possible essay thesis statements on this topic."

**THE CRAFT FORMULA**
C — **Context**: who you are, your level, your course
R — **Role**: "Act as a patient tutor" / "Act as a strict exam marker" / "Act as a hiring manager"
A — **Action**: exactly what you want (explain / compare / generate / critique / summarise)
F — **Format**: bullet points / table / step-by-step / essay outline / Q&A
T — **Tone/Level**: university level / simple / technical

**ASSIGNMENT-SPECIFIC PROMPTS**

Essay brainstorm:
"I'm writing a 2,000-word essay on [topic] for a 2nd-year [subject] course. Give me 8 different angles or arguments I could take. For each, suggest 2 academic sources I should look for."

Essay structure check:
"Here is my essay introduction: [paste]. Does it have a clear thesis? Does it outline the structure? What is weak? How would you improve it?"

Understanding a concept:
"I'm a [year]-year [subject] student. Explain [concept] as if you're a patient tutor. Use a relatable SA example. Then give me 3 exam questions on this topic with model answers."

Literature review direction:
"What are the 5 major debates in the academic literature on [topic]? I need this for a literature review. Mention key scholars and their positions — I will verify in Google Scholar."

**IMPORTANT:** For literature reviews and research, use Perplexity instead of ChatGPT/Claude — it shows real citations you can verify.`,
      },
      {
        id: 'ai3', title: 'NotebookLM: turn your notes into a study engine', duration: '12 min', type: 'practice', completed: false,
        content: `NotebookLM (notebooklm.google.com) is a free Google tool that reads YOUR uploaded materials and only answers from them. No hallucinated sources.

**HOW IT WORKS**
1. Go to notebooklm.google.com (sign in with Google)
2. Create a new notebook for each module
3. Upload: lecture slides (PDF), your own notes, textbook chapters, past papers
4. Ask questions — it answers only from what you uploaded
5. All answers show which source each claim comes from

**WHAT IT CAN DO FOR YOU**

Study guide generation:
"Generate a study guide for this module. Include key concepts, definitions, and likely exam topics."

Flashcard creation:
"Create 20 Q&A flashcards from this lecture. Make them exam-difficulty."

Audio overview (game-changing):
Click "Audio Overview" → NotebookLM generates a podcast-style conversation explaining your uploaded content. Listen while commuting or doing chores.

Past paper practice:
Upload past papers + your notes. Ask: "For this exam question: [paste], what content from my notes is most relevant? Give me a model answer plan."

Concept clarification:
"I don't understand [concept] from Lecture 4. Explain it using only the content I've uploaded."

**BEST USE: EXAM REVISION**
Upload all your lecture slides the week before exams.
Ask: "What are the 10 most important concepts across all my lectures?"
Then: "For each concept, give me a 3-sentence summary and a possible exam question."

**LIMITATION**
NotebookLM only knows what you upload. For broader research, use Claude or Perplexity.`,
      },
      {
        id: 'ai4', title: 'AI for assignments: the ethical boundaries', duration: '10 min', type: 'read', completed: false,
        content: `AI is a powerful tool — and a serious academic risk if misused. Here is exactly where the line is.

**ALLOWED (you are the author)**
✓ Brainstorm arguments and angles for your essay
✓ Explain a concept you don't understand (then write in your own words)
✓ Critique and improve your own draft: "What is weak about this argument?"
✓ Suggest academic sources to search for in Google Scholar (verify before using)
✓ Fix grammar and punctuation on YOUR written work
✓ Format APA citations you have already sourced
✓ Generate practice exam questions for self-testing
✓ Summarise a paper you have already read (to check your own understanding)

**NOT ALLOWED (academic misconduct)**
✗ Submitting AI-generated text as your own work
✗ Using AI to answer exam questions during an exam
✗ Having AI write sections of your assignment
✗ Using AI without disclosure when your institution requires it

**THE TEST**
Ask yourself: "Could I defend every sentence in this submission if my lecturer asked me to explain my argument in person?"
If no → you have used AI improperly.

**AI DETECTORS**
Turnitin now has an AI detection feature at many SA universities. It is not perfect but it flags statistically likely AI text. The safest approach: use AI as a thinking tool, write everything yourself.

**THE REAL SKILL**
AI makes it easy to produce average work. Students who learn to prompt well AND think and write clearly will outcompete everyone — because the AI + critical thinking combination is what employers are hiring for.`,
      },
      {
        id: 'ai5', title: 'AI for coding: debugging and learning faster', duration: '12 min', type: 'practice', completed: false,
        content: `Whether you are in a CS degree or just learning Python for data — AI accelerates coding dramatically.

**DEBUGGING AN ERROR (most common use)**
Paste your code + the full error message, then ask:
"What is causing this error? Explain why it happens. Show me the fix. Explain what I need to understand so I don't make this mistake again."

This is more valuable than just getting the fix — you learn from every bug.

**UNDERSTANDING CODE YOU DIDN'T WRITE**
Paste a confusing function or algorithm and ask:
"Explain what this code does, line by line. What is the purpose of each section? What would happen if [variable] was changed to 0?"

**LEARNING BY BUILDING**
"I am learning Python loops (beginner level). Give me a small, useful project — under 30 lines — I can build today that would help me as a university student. Walk me through it step by step."

**CODE REVIEW**
Paste your working code and ask:
"Review this for a beginner. What would a professional do differently? What could break? How would you improve the structure?"

**PREPARING FOR PRACTICALS**
"I have a Python practical on [topic] in 2 days. I understand basics but struggle with [specific concept]. Explain it with 3 short examples, then give me 2 practice exercises at practical difficulty."

**THE GOLDEN RULE**
Never copy code you cannot explain line by line. If a lecturer asks "what does this do?" you must have an answer. AI is your tutor, not your ghost-writer.

**GitHub Copilot (free with GitHub Student Pack)**
Autocompletes code inside VS Code as you type. Apply at: github.com/education`,
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // 4. Excel & Google Sheets
  // ──────────────────────────────────────────────────────────────────
  {
    id: 'excel', title: 'Excel & Google Sheets', emoji: '📊', color: '#38BDF8', xp: 350,
    description: 'The skill most employers test in interviews. Formulas, budgeting, pivot tables, and data analysis.',
    lessons: [
      {
        id: 'e1', title: 'The 12 formulas every student must know', duration: '15 min', type: 'practice', completed: false,
        content: `Open Google Sheets (sheets.google.com — free) or Excel. These work in both.

**ESSENTIAL FORMULAS**
\`=SUM(A1:A10)\`        → Total a range of numbers
\`=AVERAGE(A1:A10)\`    → Calculate the mean
\`=MAX(A1:A10)\`        → Find the highest value
\`=MIN(A1:A10)\`        → Find the lowest value
\`=COUNT(A1:A10)\`      → Count cells with numbers
\`=COUNTA(A1:A10)\`     → Count all non-empty cells
\`=IF(A1>=50,"Pass","Fail")\`  → Conditional logic
\`=COUNTIF(A1:A10,">50")\`     → Count cells meeting a condition
\`=SUMIF(A1:A10,">50")\`       → Sum only cells meeting a condition
\`=VLOOKUP(value,A1:C10,3,0)\` → Look up a value and return related data
\`=CONCATENATE(A1," ",B1)\`    → Join text from multiple cells
\`=TODAY()\`            → Today's date (auto-updates)

**MARKS TRACKER — BUILD THIS NOW**
Column A: Subject name
Column B: Test 1 mark
Column C: Test 2 mark
Column D: Exam mark
Column E: \`=AVERAGE(B2:D2)\`       → your average
Column F: \`=IF(E2>=50,"Pass","Fail")\` → pass/fail

Row 11 (totals): \`=AVERAGE(E2:E10)\` → your overall average

**$ NOTATION — CRITICAL**
\`=A1*B1\` → both change when you copy the formula
\`=A1*\$B\$1\` → \$B\$1 stays fixed (good for tax rate, exchange rate, etc.)
\`=\$A1\` → column A fixed, row changes
\`=A\$1\` → row 1 fixed, column changes`,
      },
      {
        id: 'e2', title: 'Build your personal budget in Sheets', duration: '25 min', type: 'practice', completed: false,
        content: `NSFAS funds run out before month end for most students because spending is never tracked. This template fixes that in 30 minutes.

**SHEET STRUCTURE: "Budget" tab**
Column A: Category
Column B: Budgeted (R)
Column C: Actual Spent (R)
Column D: \`=B-C\` (Difference — negative = over budget)
Column E: \`=IF(D2<0,"OVER ⚠️","OK ✓")\`

**CATEGORIES TO INCLUDE**
Rent / Res fees
Groceries / Food
Data & Airtime
Transport (taxi, Uber)
Textbooks / Printing
Entertainment
Toiletries
Clothing
Emergency fund
Savings

**TOTAL ROW (row 12)**
Total budget:  \`=SUM(B2:B11)\`
Total actual:  \`=SUM(C2:C11)\`
Net:           \`=SUM(B2:B11)-SUM(C2:C11)\`

**CONDITIONAL FORMATTING — VISUAL ALERTS**
Select column E → Format → Conditional formatting
Text contains "OVER" → fill red, text white
Text contains "OK" → fill green, text white
Now you can see at a glance where you are overspending.

**SECOND SHEET: "Transactions"**
Column A: Date
Column B: Description
Column C: Amount
Column D: Category (dropdown — Data → Data validation → list of your categories)

Use a pivot table to summarise spending by category (see next lesson).

**NSFAS TIP**
Set your NSFAS disbursement date as "NSFAS Income" at the top. Track weekly. By week 2 you will see which category is eating your budget.`,
      },
      {
        id: 'e3', title: 'Pivot tables: analyse anything in 5 clicks', duration: '20 min', type: 'practice', completed: false,
        content: `A pivot table summarises large data into meaningful totals — no formulas needed. Employers test this in almost every data-related job interview.

**WHAT IT DOES**
You have 50 rows of transactions. A pivot table tells you the total per category, per week, or per person — with 5 clicks.

**IN GOOGLE SHEETS**
1. Select your data including headers (e.g., A1:D50)
2. Insert → Pivot table → New sheet → Create
3. In the Pivot table editor panel:
   - Rows: add your Category column
   - Values: add your Amount column (set to SUM)
4. Done. You see total spending per category.

**ADD MORE ANALYSIS**
Add Date to Rows → see totals by date AND category
Add a second Values field → see count AND sum side by side
Filter → click the dropdown on any row to filter to specific categories

**IN MICROSOFT EXCEL**
1. Click any cell in your data
2. Insert → PivotTable → New worksheet → OK
3. Drag "Category" to Rows
4. Drag "Amount" to Values (defaults to SUM)
5. Done.

**REAL USE CASES**
• Spending by category across 3 months
• Module marks comparison across semesters
• Survey response analysis (research assignments)
• Shift hours per week (for part-time work)
• Stock/inventory tracking (for a side business)

Pivot table knowledge signals data literacy. Every employer in finance, marketing, HR, operations, and research values this skill.`,
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // 5. Professional Digital Skills
  // ──────────────────────────────────────────────────────────────────
  {
    id: 'professional', title: 'Professional Digital Skills', emoji: '💼', color: '#a78bfa', xp: 350,
    description: 'Emails that get responses, a LinkedIn profile that works, virtual interview technique, and your digital portfolio.',
    lessons: [
      {
        id: 'p1', title: 'Write emails that get responses', duration: '12 min', type: 'practice', completed: false,
        content: `Email is how you communicate with lecturers, employers, and clients. Badly written emails are ignored or judged harshly.

**SUBJECT LINE FORMULA**
[Action] – [Topic] – [Your Name / Student Number]

Examples:
• "Extension Request – Assignment 2 – Nomvula Mokoena 220012345"
• "Internship Enquiry – Marketing – BSc 3rd Year – Nomvula Mokoena"
• "Reference Letter Request – Final Year – Nomvula Mokoena"

Never: "Hi", "Question", blank subject

**BODY STRUCTURE**
1. Greeting: "Dear Prof Khumalo," / "Dear Mr Naidoo,"
   (Not "Hi," or "Good Day, Sir/Madam" unless you know their preference)
2. Context: "I am a 3rd-year BCom Accounting student in your ACC301 class (2024)."
3. Request: One clear ask, briefly explained
4. Action needed + deadline: "Would it be possible to respond by Friday?"
5. Thank you + sign-off

Sign-off: "Kind regards," / "Regards," / "Thank you,"
Never: "Cheers," "Later," or no sign-off

**EMAIL TEMPLATE: REQUESTING AN EXTENSION**
---
Subject: Extension Request – Assignment 3 – Thandi Dlamini 221034567

Dear Prof Mkhize,

I am a 2nd-year BSc student in your STA201 class. I am writing to request a short extension for Assignment 3, due on 15 November.

[Brief honest reason — family emergency, medical, work shift conflict. Attach a supporting document if you have one.]

I would be grateful for a 3-day extension to 18 November. I apologise for the inconvenience and assure you the work will be submitted by then.

Thank you for your consideration.

Kind regards,
Thandi Dlamini
221034567 | BSc Statistics, Year 2
thandi.dlamini@students.wits.ac.za
---

**RULE: ONE EMAIL = ONE REQUEST**
Do not bundle three questions into one email. Lecturers often answer only the first one.`,
      },
      {
        id: 'p2', title: 'LinkedIn profile that recruiters actually find', duration: '15 min', type: 'practice', completed: false,
        content: `South African recruiters actively search LinkedIn. Your profile is an always-on job application — even in 2nd year.

**PROFILE PHOTO (the most-clicked part)**
• Solo, professional, face takes up 60% of frame
• Good natural lighting (face a window)
• Plain or blurred background
• Smile. Appropriate clothing.
✗ No group photos, sunglasses, full-body shots, or obvious selfie angles

**HEADLINE (the line under your name)**
Don't write: "Student at UCT"
Write: [Degree] | [Your top 2–3 skills] | [Goal]

Examples:
"BSc Computer Science | Python & SQL | Seeking 2025 Internship"
"BA Law Student | Moot Court | Constitutional Law | Graduate 2026"
"BCom Accounting | Excel & Financial Analysis | SAICA Articles Aspirant"

**ABOUT SECTION (500 characters max — 3 short paragraphs)**
Para 1: Who you are (degree, year, university)
Para 2: What you have done (projects, experience, achievements — even if small)
Para 3: What you are looking for (internship, grad programme, field)

**EXPERIENCE: WHAT TO LIST**
Everything. Part-time jobs, vacation work, volunteering, tutoring, student rep, committee member, SRC officer. Add what you did and what you delivered: "Managed social media accounts, grew Instagram following from 200 to 1,400 in 6 months."

**SKILLS: AIM FOR 25+**
Python, Excel, Google Workspace, Research, Data Analysis, Academic Writing, Customer Service, Leadership, Teamwork, Communication... add all of them.

**GETTING STARTED CONNECTIONS**
Connect with: classmates, lecturers you liked, speakers from events you attended, alumni from your department.
500+ connections significantly increases your profile's visibility in search.

**MONTHLY HABIT**
Post one thing related to your field each month: a course you completed, an article you found interesting, a project update. Recruiters see this activity.`,
      },
      {
        id: 'p3', title: 'Virtual interviews and online meetings: how to look professional', duration: '10 min', type: 'read', completed: false,
        content: `Virtual interviews are now standard. Technical problems happen — what separates candidates is how they prepare and recover.

**BEFORE THE INTERVIEW: 30 MINUTES PREP**
• Test your camera and microphone (open Zoom → test audio/video)
• Check your background — tidy, neutral wall, or use a virtual background
• Check your lighting: face a window or sit under a ceiling light. If the window is behind you, you will appear as a silhouette.
• Camera at eye level — raise your laptop on books if needed
• Headphones prevent echo. Earphones with a mic work fine.
• Join 5 minutes early. Log in with your full name on the account.

**DURING THE INTERVIEW**
• Look at the camera when speaking — not at the screen. This simulates eye contact.
• Mute yourself when the interviewer is speaking in a group panel.
• Pause 2 seconds before answering — connection delays are normal and this prevents talking over each other.
• If your connection drops: rejoin immediately. Do not wait for them to contact you. Say "I apologise for the connection issue" and carry on.

**COMMON MISTAKE**
Sitting too far from the camera so only your torso is visible. Sit close enough that your face and upper chest fill the frame.

**DURING ONLINE CLASSES**
• Camera on where possible — lecturers notice and remember names of students who engage.
• Chat box: professional language only. Assume it can be screenshotted.
• Mute your microphone unless responding to a question.
• Background distractions (TV, family, eating on camera) are visible and signal disrespect.

**WHEN YOUR TECH FAILS**
Stay calm. Call or WhatsApp the interviewer immediately from your phone.
"I apologise — my connection dropped. I am calling from my phone. Can we continue?"
Having their number saved before the interview is part of preparation.`,
      },
      {
        id: 'p4', title: 'Build a free digital portfolio in one afternoon', duration: '15 min', type: 'practice', completed: false,
        content: `A portfolio is evidence that you can do the work. One good project shown clearly is worth more than a long list of skills on a CV.

**WHAT TO INCLUDE**
• About: 3 sentences — who you are, what you study, what you can do
• Projects: 2–4 things you have built, researched, or contributed to
  → University assignments count. Group projects count. Side projects count.
  → For each: What was the problem? What did you do? What was the result?
• Skills: with context (not just "Excel" — "Used Excel pivot tables to analyse 3 months of sales data for a campus business")
• Links: LinkedIn profile, GitHub (if you code), email address

**FREE TOOLS BY FIELD**
Tech / coding       → GitHub Pages (github.io — free, looks professional to developers)
Design / creative   → Behance (behance.net) or Adobe Portfolio (free with Adobe account)
General / business  → Google Sites (sites.google.com — free, connects to your Google account)
                    → Carrd.co (free tier, single-page, clean)
Education / media   → Canva Website (canva.com → create design → website)

**GITHUB PAGES — SIMPLEST TECH PORTFOLIO**
1. Create a GitHub account at github.com
2. New repository → name it: yourusername.github.io
3. Create index.html (or upload a template)
4. Settings → Pages → Source: main branch
5. Your portfolio is live at yourusername.github.io

**THE 30-MINUTE RULE**
A simple portfolio with 2 real projects beats a perfect portfolio you never publish.
Use a template. Add your own text. Publish it today.

Add your portfolio URL to your LinkedIn profile and the top of your CV.`,
      },
      {
        id: 'p5', title: 'Microsoft Word: formatting reports that look right', duration: '12 min', type: 'practice', completed: false,
        content: `Some universities require .docx submissions. Word has features most students never use — and they cost marks.

**ESSENTIAL SETUP FOR ACADEMIC REPORTS**

Font: Home → Font → Times New Roman 12pt (or Calibri 11pt)
Margins: Layout → Margins → Normal (2.54 cm all sides)
Line spacing: Home → Line and Paragraph Spacing → 2.0
Paragraph spacing: Same menu → "Remove Space After Paragraph" (prevents double gaps)

**USING STYLES PROPERLY (critical for long reports)**
Home → Styles panel
• Heading 1 → main sections (Chapter 1, Chapter 2)
• Heading 2 → sub-sections
• Normal → body text

Modify a style: right-click → Modify → change font/size
This updates every instance in the document at once.

**AUTO TABLE OF CONTENTS**
1. Apply Heading styles throughout
2. Click at start of document
3. References → Table of Contents → Automatic Table 1
4. To update: click ToC → Update Table → "Update entire table"

**TRACK CHANGES (for group work or supervisor feedback)**
Review → Track Changes → on
Every edit appears in coloured markup with the editor's name
When finalising: Review → Accept All Changes

**CONVERT TO PDF CORRECTLY**
File → Save As → PDF (not Print → Save as PDF)
The difference: File → Save As preserves hyperlinks and is APA-compliant.
Print → PDF sometimes loses hyperlinks and embedded fonts.

**MAIL MERGE (useful for group project data tables)**
Mailings → Start Mail Merge
Connects Word to an Excel spreadsheet to auto-fill personalised documents — useful for certificates, personalised letters, or data reports.`,
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // 6. Digital Security
  // ──────────────────────────────────────────────────────────────────
  {
    id: 'security', title: 'Digital Security', emoji: '🔐', color: '#34D399', xp: 250,
    description: 'Protect your phone, money, and identity. Scams targeting SA students are increasing — know the tactics.',
    lessons: [
      {
        id: 's1', title: 'The 5 biggest scams targeting SA students', duration: '10 min', type: 'read', completed: false,
        content: `These are real, current, and targeting students specifically.

**1. SIM SWAP FRAUD**
Fraudsters call your network (Vodacom, MTN, Telkom), impersonate you, and move your number to their SIM. Then they intercept your banking OTPs.
Protect yourself:
• Add a SIM swap protection PIN at your network's USSD (*111# for Vodacom)
• Use an authenticator app (Google Authenticator, Authy) instead of SMS OTPs for banking
• Set up travel blocks / SIM protection via your bank app

**2. NSFAS IMPERSONATION**
WhatsApp or SMS: "Your NSFAS funding is blocked. Click this link to verify."
Rule: NSFAS never contacts you on WhatsApp. Never click links claiming to be NSFAS. Always go directly to nsfas.org.za.

**3. FAKE JOB OFFERS**
"Earn R5,000/week from home, no experience needed." These are:
• Pyramid schemes (illegal)
• Money mule fraud (you are used to transfer stolen money — you face criminal charges)
• Data harvesting (your ID and banking details, stolen)
Legitimate jobs never require upfront payment. Verify on the company's official website.

**4. FACEBOOK MARKETPLACE / GUMTREE SCAMS**
Buyer sends a fake "proof of payment" screenshot and asks you to ship first.
Rule: Only accept payment after confirming funds are in your account. For high-value items, meet in person at a safe public location.

**5. VISHING (VOICE PHISHING)**
A caller claims to be your bank. They already know your name, last 4 digits of your card, and your ID number (from data leaks).
They ask for your OTP "to cancel a fraudulent transaction."
Rule: Your bank will NEVER ask for your OTP or PIN. Hang up immediately. Call the number on the back of your card.`,
      },
      {
        id: 's2', title: 'Passwords: the one system that actually works', duration: '10 min', type: 'practice', completed: false,
        content: `Most students use the same weak password everywhere. One data breach — and there are many — exposes everything.

**THE SOLUTION: USE A PASSWORD MANAGER**
Free options:
• **Bitwarden** (bitwarden.com) — best free option, open source, works on Android
• **KeePass** — offline only, no sync, maximum privacy

How it works: one strong master password unlocks a vault of unique passwords for every site.

**IF YOU WON'T USE A MANAGER: USE THIS SYSTEM**

Base passphrase: choose a memorable sentence
"MyFirstCarWasACorsa" → MFC@C0rs@!

Add a site-specific prefix:
Gmail    → G-MFC@C0rs@!
Capitec  → CAP-MFC@C0rs@!
Student portal → STU-MFC@C0rs@!

Every account has a different password. If one is compromised, the rest are safe.

**NON-NEGOTIABLE RULES**
• Unique password for your banking app — never reused anywhere
• Unique password for your student portal (your academic record lives here)
• Your email password must be different from everything else (email = master key to all accounts)
• Enable 2FA (two-factor authentication) on: Gmail, student portal, Capitec, Nedbank/FNB, WhatsApp, LinkedIn

**HAS YOUR EMAIL BEEN LEAKED?**
Go to haveibeenpwned.com → enter your email address
Free, safe, immediate. If breached: change that password now.

**ANDROID SECURITY (most SA students use Android)**
Settings → Security → Screen lock: use PIN or fingerprint
Settings → Privacy → Permission manager: check which apps have camera, mic, location access
Remove permissions from apps that don't need them. Flashlight apps do not need microphone access.`,
      },
      {
        id: 's3', title: 'Public WiFi and mobile data: what is actually safe', duration: '8 min', type: 'read', completed: false,
        content: `Campus and coffee shop WiFi is convenient but carries real risks.

**WHAT IS SAFE ON PUBLIC WIFI**
✓ Watching YouTube, browsing news
✓ Any site with HTTPS (the padlock in your browser) — your data is encrypted in transit
✓ GitHub, Google Docs, VarsityOS

**DANGEROUS ON PUBLIC WIFI WITHOUT A VPN**
✗ Mobile banking — use your data instead, always
✗ Entering passwords on new devices or browsers
✗ Accessing sensitive university portals
✗ Sending or receiving private files

**THE RISK EXPLAINED**
On an open or poorly-secured WiFi network, someone on the same network can intercept unencrypted traffic. HTTPS encrypts the content of your connection. But without a VPN, they can still see which websites you visit (DNS queries are usually unencrypted).

**FREE VPNs THAT ACTUALLY WORK**
• **Proton VPN** (protonvpn.com) — free tier with no data limit, based in Switzerland, strong privacy policy. Best free VPN.
• **Windscribe** — 10GB/month free
Avoid any VPN with no clear company behind it — "free VPN" apps with no reputation may sell your data.

**CAMPUS EDUROAM WIFI**
If your university has eduroam — this is WPA2 Enterprise encryption, far more secure than coffee shop WiFi. Use your student credentials. It is safer than most home WiFi.

**BANKING ON MOBILE DATA: STILL USE THE APP, NOT THE BROWSER**
The Capitec, FNB, Standard Bank apps encrypt data end-to-end and have fraud detection built in.
Never enter banking credentials in a browser — even a legitimate-looking one.
Bookmark your bank's URL and always check the address bar before entering any credentials.`,
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // 7. Python for Students
  // ──────────────────────────────────────────────────────────────────
  {
    id: 'python', title: 'Python for Students', emoji: '🐍', color: '#4ecf9e', xp: 500,
    description: 'Write real Python from day one. No prior coding needed. Runs free in your browser at Google Colab.',
    lessons: [
      {
        id: 'py1', title: 'Why Python? What it can actually do for you', duration: '5 min', type: 'read', completed: false,
        content: `Python is the world's most beginner-friendly programming language and the #1 language for data science and automation.

**WHAT SA STUDENTS USE PYTHON FOR**
• Automate repetitive tasks — rename 100 files in 5 seconds, merge PDFs, batch edit spreadsheets
• Analyse data — your own marks, survey data for research assignments, economic/social data
• Web scraping — track prices at Takealot, scrape job listings from Indeed, monitor NSFAS updates
• Data science and machine learning — the foundation of 80% of data careers
• Build simple apps and APIs
• Financial modelling — essential in finance, economics, actuarial

**YOU DO NOT NEED TO INSTALL ANYTHING**
Open **Google Colab** at colab.research.google.com
Sign in with Google → New notebook → start coding immediately
Works in any browser. Perfect for low-storage phones or laptops.

**CAREER RELEVANCE IN SA**
Every major employer — Standard Bank, Discovery, Nedbank, Capitec, Stats SA, PwC, Deloitte, all tech startups — is hiring people with Python and data skills. It is the single highest-ROI technical skill a non-CS student can add to their CV.

Python knowledge + your subject knowledge (law, psychology, economics, education) = rare combination that is highly employable.`,
      },
      {
        id: 'py2', title: 'Your first program: input, variables, output', duration: '10 min', type: 'practice', completed: false,
        content: `Open Google Colab (colab.research.google.com). New notebook. Type in a code cell:

\`\`\`python
name = "Nomvula"
print("Hello, " + name + "! Welcome to Python.")

age = int(input("How old are you? "))
print("In 10 years you will be", age + 10, "years old.")
\`\`\`

Run it with Shift+Enter. Change the name to yours.

**CONCEPTS LEARNED**
Variables → named containers: name = "Nomvula" stores text
print() → shows output on screen
input() → pauses and waits for keyboard input
int() → converts text to a number so you can do maths

**PRACTICE: BUILD A GRADE CALCULATOR**
\`\`\`python
subject = input("Subject name: ")
mark = float(input("Your mark (0-100): "))

if mark >= 75:
    grade = "Distinction"
elif mark >= 60:
    grade = "Merit"
elif mark >= 50:
    grade = "Pass"
else:
    grade = "Fail"

print(subject + ": " + str(mark) + "% — " + grade)
\`\`\`

Change the cutoff percentages to match your university's grading system.
Add more subjects: repeat the input/if block inside a loop (see next lesson).`,
      },
      {
        id: 'py3', title: 'Lists, loops, and your study timetable', duration: '15 min', type: 'practice', completed: false,
        content: `Lists store multiple items. Loops repeat code for each item. These two concepts are used in almost every Python program.

\`\`\`python
# A list of your subjects
subjects = ["Maths", "Physics", "Chemistry", "English"]

# Loop through and print each
for subject in subjects:
    print("Today's study session:", subject)

# Add a subject
subjects.append("Computer Science")

# How many subjects?
print("Total subjects:", len(subjects))

# Access a specific item (index starts at 0)
print("First subject:", subjects[0])
print("Last subject:", subjects[-1])
\`\`\`

**BUILD A STUDY HOURS TRACKER**
\`\`\`python
# Dictionary: key → value pairs
study_hours = {
    "Maths": 0,
    "Physics": 0,
    "Chemistry": 0
}

# Log study time
for subject in study_hours:
    hours = float(input(f"Hours studied for {subject} today: "))
    study_hours[subject] += hours

# Print summary
print("\\n--- Today's Study Summary ---")
for subject, hours in study_hours.items():
    print(f"{subject}: {hours:.1f} hours")

total = sum(study_hours.values())
print(f"Total: {total:.1f} hours")
\`\`\`

Replace the subject names with your own. Run it daily to track your study time.`,
      },
      {
        id: 'py4', title: 'Read and analyse CSV data: your real marks', duration: '20 min', type: 'practice', completed: false,
        content: `CSV (Comma-Separated Values) is how data is stored in spreadsheets. Python can read, calculate, and analyse any CSV.

\`\`\`python
import csv

# First, create a sample marks file
marks_data = [
    ["Subject", "Test1", "Test2", "Exam"],
    ["Maths",    72,     65,     78],
    ["Chemistry", 80,    75,     82],
    ["Statistics", 68,   71,     74],
]

with open("marks.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerows(marks_data)

# Now read it and calculate averages
print("--- Subject Report ---")
with open("marks.csv") as f:
    reader = csv.DictReader(f)
    for row in reader:
        scores = [int(row["Test1"]), int(row["Test2"]), int(row["Exam"])]
        avg = sum(scores) / len(scores)
        status = "✓ Pass" if avg >= 50 else "✗ Fail"
        print(f"{row['Subject']:12} avg: {avg:.1f}%  {status}")
\`\`\`

**WHAT THIS TEACHES**
This is the same core code data analysts use every day — read a file, loop through rows, calculate statistics, report results.

**NEXT LEVEL**
Replace the sample data with your real marks. Create the CSV in Google Sheets (File → Download → CSV).
Then load it with Python: exactly the same code, just change the filename.

The pandas library makes this even more powerful — but for now, you understand the fundamentals.`,
      },
      {
        id: 'py5', title: 'Automate something real: batch rename files', duration: '15 min', type: 'practice', completed: false,
        content: `Automation is where Python pays off immediately. Rename 100 files in 2 seconds, organise downloads, batch convert formats.

**RENAME FILES WITH A DATE PREFIX**
\`\`\`python
import os
from datetime import date

# Create some test files
for i in range(1, 6):
    open(f"lecture_{i}.txt", "w").close()

# Today's date as a prefix
today = date.today().strftime("%Y%m%d")

# Rename each file
for filename in os.listdir("."):
    if filename.startswith("lecture_"):
        new_name = f"{today}_{filename}"
        os.rename(filename, new_name)
        print(f"Renamed: {filename}  →  {new_name}")

print("Done.")
\`\`\`

**REAL USES**
• Rename all downloaded lecture slides from "Lecture 1.pdf" to "2024_CSC201_Lecture_1.pdf"
• Add your student number to all assignment files before submission
• Organise photos by date taken
• Batch convert .txt notes to a single merged document

**WHY THIS IS VALUABLE**
This script runs in 1 second and does what would take you 20 minutes manually.
Now you understand: loops + os.listdir() + string formatting = any batch file operation.

**NEXT STEPS FROM HERE**
• pandas library — analyse any spreadsheet with 5 lines of code
• requests library — fetch data from any website or API
• matplotlib — plot your data as charts
• All free on Google Colab. No install needed.`,
      },
    ],
  },
]

export default function DigitalSkillsAcademy() {
  const [progress,    setProgress]    = useState<Record<string, boolean>>(loadProgress)
  const [activeTrack, setActiveTrack] = useState<string | null>(null)
  const [activeLesson,setActiveLesson]= useState<string | null>(null)

  const track  = TRACKS.find(t => t.id === activeTrack)
  const lesson = track?.lessons.find(l => l.id === activeLesson)

  const toggleComplete = (lessonId: string) => {
    const p = { ...progress, [lessonId]: !progress[lessonId] }
    setProgress(p); saveProgress(p)
  }

  const trackXP    = (t: Track) => t.lessons.filter(l => progress[l.id]).length * Math.floor(t.xp / t.lessons.length)
  const totalXP    = TRACKS.reduce((a, t) => a + trackXP(t), 0)
  const maxXP      = TRACKS.reduce((a, t) => a + t.xp, 0)
  const totalDone  = TRACKS.reduce((a, t) => a + t.lessons.filter(l => progress[l.id]).length, 0)
  const totalLessons = TRACKS.reduce((a, t) => a + t.lessons.length, 0)

  // ── Lesson view ──
  if (lesson && track) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          onClick={() => setActiveLesson(null)}
          style={{ padding: '6px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: '0.7rem', cursor: 'pointer', flexShrink: 0 }}
        >← Back</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: track.color }}>{track.emoji} {track.title}</div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 1, lineHeight: 1.3 }}>{lesson.title}</div>
        </div>
        <span style={{ fontSize: '0.62rem', padding: '3px 8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 100, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{lesson.duration}</span>
      </div>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '16px 18px', lineHeight: 1.8 }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          {renderMd(lesson.content)}
        </div>
      </div>

      <button
        onClick={() => { toggleComplete(lesson.id); setActiveLesson(null) }}
        style={{
          padding: '12px 0',
          background: progress[lesson.id] ? 'rgba(52,211,153,0.1)' : `${track.color}18`,
          border: `1px solid ${progress[lesson.id] ? 'rgba(52,211,153,0.25)' : `${track.color}40`}`,
          borderRadius: 12,
          color: progress[lesson.id] ? 'var(--teal)' : track.color,
          fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer',
        }}
      >
        {progress[lesson.id] ? '↩ Mark incomplete' : '✓ Mark complete'}
      </button>
    </div>
  )

  // ── Track view ──
  if (track) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          onClick={() => setActiveTrack(null)}
          style={{ padding: '6px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: '0.7rem', cursor: 'pointer', flexShrink: 0 }}
        >← All tracks</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{track.emoji} {track.title}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {trackXP(track)}/{track.xp} XP · {track.lessons.filter(l => progress[l.id]).length}/{track.lessons.length} lessons done
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {track.lessons.map((l, i) => (
          <button
            key={l.id}
            onClick={() => setActiveLesson(l.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px',
              background: 'var(--bg-surface)',
              border: `1px solid ${progress[l.id] ? 'rgba(52,211,153,0.2)' : 'var(--border-subtle)'}`,
              borderRadius: 12, cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: progress[l.id] ? 'rgba(52,211,153,0.15)' : 'var(--bg-elevated)',
              border: `2px solid ${progress[l.id] ? 'var(--teal)' : 'var(--border-default)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.68rem', fontWeight: 700,
              color: progress[l.id] ? 'var(--teal)' : 'var(--text-muted)', flexShrink: 0,
            }}>{progress[l.id] ? '✓' : (i + 1)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{l.title}</div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {l.duration} · {l.type === 'practice' ? 'Practice exercise' : l.type === 'quiz' ? 'Quiz' : 'Reading'}
              </div>
            </div>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', flexShrink: 0 }}>→</span>
          </button>
        ))}
      </div>
    </div>
  )

  // ── Track list (home) ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--bg-surface)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 16, padding: '16px 18px' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#6366F1,#4ecf9e,transparent)' }} />
        <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: '#6366F1', letterSpacing: '0.09em', marginBottom: 4 }}>DIGITAL SKILLS ACADEMY</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Skills for school, assignments & work</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.5 }}>Google Workspace · Research & Citations · AI Tools · Excel · Professional Skills · Security · Python</div>
      </div>

      {/* XP progress */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{totalDone} of {totalLessons} lessons completed</span>
          <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#6366F1' }}>{totalXP}/{maxXP} XP</span>
        </div>
        <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${(totalXP / maxXP) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#6366F1,#4ecf9e)', borderRadius: 3, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Track cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {TRACKS.map(t => {
          const done = t.lessons.filter(l => progress[l.id]).length
          const pct  = done / t.lessons.length
          return (
            <button
              key={t.id}
              onClick={() => setActiveTrack(t.id)}
              style={{
                display: 'flex', gap: 14, padding: '14px',
                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                borderRadius: 14, cursor: 'pointer', textAlign: 'left', alignItems: 'flex-start',
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${t.color}15`, border: `1px solid ${t.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>{t.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t.title}</div>
                  <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: t.color, flexShrink: 0, marginLeft: 8 }}>{done}/{t.lessons.length}</div>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.4 }}>{t.description}</div>
                <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${pct * 100}%`, height: '100%', background: t.color, borderRadius: 2, transition: 'width 0.3s' }} />
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
