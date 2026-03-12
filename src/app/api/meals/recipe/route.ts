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
    const { ingredients, maxBudget, mealType, servings = 2 } = body

    const { data: profile } = await supabase
      .from('profiles')
      .select('dietary_pref, living_situation, ai_language')
      .eq('id', user.id)
      .single()

    const { data: budget } = await supabase
      .from('budgets')
      .select('food_budget')
      .eq('user_id', user.id)
      .single()

    const dietNote = profile?.dietary_pref && profile.dietary_pref !== 'No restrictions'
      ? `IMPORTANT: Student is ${profile.dietary_pref}. All ingredients and methods must respect this.`
      : ''

    const budgetCap = maxBudget || (budget?.food_budget ? Math.round(budget.food_budget / 30) * 2 : 50)
    const language = profile?.ai_language || 'English'
    const langLine = language !== 'English' ? `\nRESPONSE LANGUAGE: ${language} — write all human-readable text values in ${language}. Keep JSON field names and enum values (like "easy", "medium", "hard") in English.` : ''

    const prompt = `You are a South African student meal planner. Create a budget recipe using available ingredients.${langLine}

INGREDIENTS AVAILABLE: ${ingredients}
MAX BUDGET: R${budgetCap}
MEAL TYPE: ${mealType || 'Any'}
SERVINGS: ${servings}
LIVING SITUATION: ${profile?.living_situation || 'unknown'}
${dietNote}

SA CONTEXT: Student has limited cooking equipment (possibly just a microwave, single hotplate, or shared res kitchen). Use common SA pantry staples. Reference local brands where helpful (Checkers, Pick n Pay, Shoprite prices).

Respond with valid JSON only (no markdown):
{
  "name": <recipe name>,
  "totalCost": <estimated total cost in rands as number>,
  "costPerServing": <cost per serving in rands as number>,
  "prepTime": <e.g. "10 minutes">,
  "cookTime": <e.g. "20 minutes">,
  "difficulty": <"easy" | "medium" | "hard">,
  "servings": ${servings},
  "ingredients": [
    { "item": <ingredient name>, "amount": <amount>, "estimatedCost": <cost in rands as number> }
  ],
  "steps": [
    { "step": <step number as integer>, "instruction": <clear instruction> }
  ],
  "tips": [<1-2 SA-specific tips, e.g. where to buy cheap, substitutions, load shedding workaround>],
  "nutritionNote": <1 sentence on nutritional value>,
  "canMakeAhead": <boolean>,
  "storageTip": <how to store leftovers>
}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const clean = rawText.replace(/```json|```/g, '').trim()
    const recipe = JSON.parse(clean)

    return NextResponse.json({ recipe })
  } catch (error) {
    console.error('Recipe generation error:', error)
    return NextResponse.json({ error: 'Failed to generate recipe' }, { status: 500 })
  }
}

// Meal plan suggestion for the week
export async function GET(_request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [{ data: profile }, { data: budget }] = await Promise.all([
      supabase.from('profiles').select('dietary_pref, living_situation, ai_language').eq('id', user.id).single(),
      supabase.from('budgets').select('food_budget').eq('user_id', user.id).single(),
    ])

    const weeklyFoodBudget = budget?.food_budget || 200
    const diet = profile?.dietary_pref || 'No restrictions'
    const planLang = profile?.ai_language || 'English'
    const planLangLine = planLang !== 'English' ? `\nRESPONSE LANGUAGE: ${planLang} — write all human-readable text values in ${planLang}. Keep JSON field names in English.` : ''

    const prompt = `Create a 5-day (Mon–Fri) meal plan for a South African student.${planLangLine}

CONSTRAINTS:
- Weekly food budget: R${weeklyFoodBudget}
- Dietary preference: ${diet}
- Living situation: ${profile?.living_situation || 'student accommodation'}
- Keep meals simple, realistic for a student kitchen
- Use affordable SA ingredients (Checkers, Shoprite prices)

Respond with valid JSON only (no markdown):
{
  "weeklyTotal": <estimated total cost as number>,
  "days": [
    {
      "day": "Monday",
      "breakfast": { "name": <meal name>, "cost": <cost as number>, "prepMinutes": <number> },
      "lunch": { "name": <meal name>, "cost": <cost as number>, "prepMinutes": <number> },
      "supper": { "name": <meal name>, "cost": <cost as number>, "prepMinutes": <number> }
    }
  ],
  "shoppingList": [
    { "item": <item name>, "estimatedCost": <cost as number>, "usedIn": [<day names>] }
  ],
  "mealPrepTip": <1 batch-cooking tip to save time and money>
}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const clean = rawText.replace(/```json|```/g, '').trim()
    const plan = JSON.parse(clean)

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Meal plan error:', error)
    return NextResponse.json({ error: 'Failed to generate meal plan' }, { status: 500 })
  }
}
