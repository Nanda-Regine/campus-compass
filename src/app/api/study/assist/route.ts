import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { type, taskId, taskTitle, moduleName, dueDate, examName, currentGrade, targetGrade, assessmentWeights } = body

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, year_of_study, faculty, ai_language')
      .eq('id', user.id)
      .single()

    const language = profile?.ai_language || 'English'
    const langLine = language !== 'English'
      ? `\nRESPONSE LANGUAGE: ${language} — write all human-readable text values in ${language}. Keep JSON field names and enum values in English.`
      : ''

    // ─── Study Plan Generator ───────────────────────────────
    if (type === 'study_plan') {
      const daysUntilDue = dueDate
        ? Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 7

      const prompt = `Create a realistic study/work plan for a South African university student.${langLine}

TASK: "${taskTitle}"
MODULE: ${moduleName || 'Unknown module'}
DUE: ${dueDate ? new Date(dueDate).toLocaleDateString('en-ZA') : 'No date set'} (${daysUntilDue} days away)
STUDENT YEAR: ${profile?.year_of_study || 'unknown'}
FACULTY: ${profile?.faculty || 'unknown'}

Create a day-by-day plan that is realistic for a student who also has other subjects and a life.
Account for SA realities: possible load shedding, data limitations for research, etc.

Respond with valid JSON only:
{
  "totalHours": <estimated total hours needed as number>,
  "dailyPlan": [
    {
      "day": <"Day 1" or specific day name>,
      "focus": <what to do this day>,
      "hours": <hours as number>,
      "tasks": [<specific actionable subtask strings>],
      "tip": <optional SA-specific tip for this day>
    }
  ],
  "resources": [<2-3 recommended resource types or free SA resources>],
  "warningFlags": [<any concern about the timeline>],
  "motivationNote": <1 encouraging sentence>
}`

      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
      })

      const rawText = response.content[0].type === 'text' ? response.content[0].text : '{}'
      const plan = JSON.parse(rawText.replace(/```json|```/g, '').trim())

      // Save as a nova insight for dashboard display
      if (plan.warningFlags?.length > 0) {
        await supabase.from('nova_insights').insert({
          user_id: user.id,
          insight_type: 'study_nudge',
          content: `Study plan for "${taskTitle}": ${plan.warningFlags[0]}`,
        })
      }

      return NextResponse.json({ plan })
    }

    // ─── Grade Calculator ────────────────────────────────────
    if (type === 'grade_calculator') {
      const prompt = `Calculate what a student needs on their remaining assessment(s) to achieve their target grade.${langLine}

CURRENT SITUATION:
- Module: ${moduleName}
- Current overall grade: ${currentGrade}%
- Target grade: ${targetGrade}%
- Assessment weights: ${assessmentWeights || 'Not provided — make reasonable assumptions for a SA university course'}

Calculate precisely and explain clearly. Respond with valid JSON only:
{
  "requiredScore": <number — what they need on remaining assessment>,
  "isAchievable": <boolean>,
  "currentStanding": <"passing" | "at_risk" | "failing">,
  "explanation": <clear 2-3 sentence explanation of the math>,
  "advice": <1-2 sentences of practical advice>,
  "alternativeScenarios": [
    { "targetGrade": <number>, "requiredScore": <number>, "label": <e.g. "To pass (50%)"> }
  ]
}`

      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      })

      const rawText = response.content[0].type === 'text' ? response.content[0].text : '{}'
      const result = JSON.parse(rawText.replace(/```json|```/g, '').trim())
      return NextResponse.json({ result })
    }

    // ─── Deadline Conflict Detector ──────────────────────────
    if (type === 'conflict_check') {
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*, module:modules(name)')
        .eq('user_id', user.id)
        .eq('done', false)
        .not('due_date', 'is', null)
        .order('due_date', { ascending: true })

      const { data: exams } = await supabase
        .from('exams')
        .select('*, module:modules(name)')
        .eq('user_id', user.id)
        .gte('exam_date', new Date().toISOString().split('T')[0])
        .order('exam_date', { ascending: true })

      const taskList = tasks?.map(t => ({
        title: t.title,
        module: t.module?.name,
        due: t.due_date,
        priority: t.priority,
        type: t.task_type,
      })) || []

      const examList = exams?.map(e => ({
        name: e.name,
        module: e.module?.name,
        date: e.exam_date,
      })) || []

      const prompt = `Analyse this student's upcoming deadlines for conflicts and overload.${langLine}

TASKS: ${JSON.stringify(taskList)}
EXAMS: ${JSON.stringify(examList)}
TODAY: ${new Date().toISOString().split('T')[0]}

Identify conflicts (multiple deadlines same day/week), overload periods, and suggest reprioritisation.

Respond with valid JSON only:
{
  "conflictPeriods": [
    {
      "dateRange": <e.g. "Mon 15 – Wed 17 Jan">,
      "items": [<task/exam titles in this period>],
      "severity": <"high" | "medium" | "low">,
      "suggestion": <1 sentence actionable advice>
    }
  ],
  "overallLoad": <"manageable" | "heavy" | "critical">,
  "topPriority": <title of the single most urgent item>,
  "rescheduleAdvice": <1-2 sentences overall strategy>,
  "burnoutRisk": <boolean>,
  "burnoutNote": <if burnout risk, 1 supportive sentence>
}`

      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      })

      const rawText = response.content[0].type === 'text' ? response.content[0].text : '{}'
      const analysis = JSON.parse(rawText.replace(/```json|```/g, '').trim())
      return NextResponse.json({ analysis, tasks: taskList, exams: examList })
    }

    // ─── Exam Prep Guide ─────────────────────────────────────
    if (type === 'exam_prep') {
      const daysUntilExam = dueDate
        ? Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 14

      const prompt = `Create an exam preparation guide for a South African university student.${langLine}

EXAM: ${examName || taskTitle}
MODULE: ${moduleName}
DAYS UNTIL EXAM: ${daysUntilExam}
STUDENT YEAR: ${profile?.year_of_study || 'unknown'}
FACULTY: ${profile?.faculty || 'unknown'}

Respond with valid JSON only:
{
  "prepPhases": [
    {
      "phase": <"Week 1: Foundation" etc>,
      "days": <day range>,
      "focus": <main focus>,
      "dailyHours": <number>,
      "techniques": [<2-3 specific study technique names>],
      "milestone": <what to have achieved by end of phase>
    }
  ],
  "studyTechniques": [
    { "name": <technique>, "description": <1 sentence>, "bestFor": <when to use> }
  ],
  "dayBeforeTips": [<3-4 specific tips for the day before>],
  "examDayTips": [<3-4 tips for exam morning/day>],
  "mentalHealthNote": <1 supportive sentence about exam anxiety>,
  "saResources": [<1-2 free SA-specific study resources, e.g. Siyavula, UCT OpenContent>]
}`

      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
      })

      const rawText = response.content[0].type === 'text' ? response.content[0].text : '{}'
      const guide = JSON.parse(rawText.replace(/```json|```/g, '').trim())
      return NextResponse.json({ guide })
    }

    return NextResponse.json({ error: 'Unknown study assist type' }, { status: 400 })
  } catch (error) {
    console.error('Study assist error:', error)
    return NextResponse.json({ error: 'Failed to generate study assistance' }, { status: 500 })
  }
}
