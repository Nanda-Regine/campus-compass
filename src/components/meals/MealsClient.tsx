'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/layout/TopBar'
import { type GroceryItem, type MealPlan, MEAL_SLOTS } from '@/types'
import { fmt, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { AmbientImage } from '@/components/ui/AmbientImage'
import NutritionTab from './NutritionTab'

const GROCERY_CATS = [
  { id: 'protein', icon: '🥩', label: 'Protein', color: '#FB7185', tip: 'eggs, tuna, lentils, chicken, beans' },
  { id: 'carbs',   icon: '🍞', label: 'Carbs',   color: '#f59e0b', tip: 'bread, rice, pasta, pap, potatoes' },
  { id: 'veg',     icon: '🥦', label: 'Veg/Fruit', color: '#4ecf9e', tip: 'tomatoes, spinach, bananas, apples' },
  { id: 'dairy',   icon: '🥛', label: 'Dairy',   color: '#38BDF8', tip: 'milk, amasi, yoghurt, cheese' },
  { id: 'pantry',  icon: '🧂', label: 'Pantry',  color: '#818CF8', tip: 'oil, salt, spices, sauces, stock' },
  { id: 'treats',  icon: '🍭', label: 'Treats',  color: '#e8834a', tip: 'biscuits, sweets, cold drinks' },
]

interface MealsClientProps {
  initialData: {
    mealPlans: MealPlan[]
    groceryItems: GroceryItem[]
    profile: { dietary_pref: string; living_situation: string | null; is_premium: boolean } | null
    foodBudget: number
    isPremium: boolean
    userId: string
    weekStart: string
  }
}

type TabId = 'ai_plan' | 'weekly' | 'grocery' | 'recipes' | 'nutrition'

const TABS = [
  { id: 'ai_plan'   as TabId, label: 'AI Planner', icon: '🤖' },
  { id: 'weekly'    as TabId, label: 'Weekly',     icon: '📅' },
  { id: 'grocery'   as TabId, label: 'Groceries',  icon: '🛒' },
  { id: 'recipes'   as TabId, label: 'Recipes',    icon: '👨‍🍳' },
  { id: 'nutrition' as TabId, label: 'Nutrition',  icon: '🥗' },
]

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const SAMPLE_RECIPES = [
  {
    name: 'Chakalaka & Pap',
    cost: 'R18',
    time: '25 min',
    desc: 'A SA classic — spiced bean and veg relish with smooth pap. Under R20 for 2.',
    icon: '🌶️',
  },
  {
    name: 'Egg Fried Rice',
    cost: 'R12',
    time: '15 min',
    desc: 'Leftover rice, eggs, soy sauce. Cheap, fast, filling.',
    icon: '🍳',
  },
  {
    name: 'Boerewors Roll',
    cost: 'R22',
    time: '20 min',
    desc: 'Grilled boerewors in a hotdog roll with tomato sauce. Student braai essential.',
    icon: '🌭',
  },
  {
    name: 'Samp & Beans',
    cost: 'R15',
    time: '45 min',
    desc: 'Batch cook on Sunday — lasts 3 days in the fridge. Nutritious and cheap.',
    icon: '🫘',
  },
  {
    name: 'Tuna Pasta',
    cost: 'R28',
    time: '20 min',
    desc: 'Tinned tuna, pasta, onion, and a tin of tomatoes. Classic student staple.',
    icon: '🐟',
  },
]

interface GeneratedRecipe {
  name: string
  totalCost: number
  costPerServing: number
  prepTime: string
  cookTime: string
  difficulty: string
  servings: number
  ingredients: { item: string; amount: string; estimatedCost: number }[]
  steps: { step: number; instruction: string }[]
  tips: string[]
  nutritionNote: string
  canMakeAhead: boolean
  storageTip: string
}

interface GeneratedPlan {
  weeklyTotal: number
  days: {
    day: string
    breakfast: { name: string; cost: number; prepMinutes: number }
    lunch: { name: string; cost: number; prepMinutes: number }
    supper: { name: string; cost: number; prepMinutes: number }
  }[]
  shoppingList: { item: string; estimatedCost: number; usedIn: string[] }[]
  mealPrepTip: string
}

const QUICK_SUGGESTIONS: Record<string, string[]> = {
  breakfast: ['Oats', 'Eggs & toast', 'Rooibos + rusks', 'Yoghurt & fruit', 'PB toast'],
  lunch: ['Sandwich', 'Rice & chicken', 'Pap & vleis', 'Leftover dinner', 'Noodles'],
  supper: ['Pasta', 'Rice & beans', 'Chakalaka & pap', 'Stir fry', 'Braai'],
  snack: ['Fruit', 'Biscuits', 'Nuts', 'Yoghurt'],
}

export default function MealsClient({ initialData }: MealsClientProps) {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<TabId>('ai_plan')

  // Weekly tab edit state
  const [localMeals, setLocalMeals] = useState<MealPlan[]>(initialData.mealPlans)
  const [editingSlot, setEditingSlot] = useState<{ day: string; slot: string } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [savingSlot, setSavingSlot] = useState(false)
  const [aiSuggesting, setAiSuggesting] = useState(false)

  // Grocery state
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>(initialData.groceryItems)
  const [groceryInput, setGroceryInput] = useState('')
  const [groceryPrice, setGroceryPrice] = useState('')
  const [selectedCat, setSelectedCat] = useState<string>('protein')
  const [itemCats, setItemCats] = useState<Record<string, string>>({})

  // Persist grocery categories in localStorage (no DB migration needed)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('grocery_item_cats')
      if (stored) setItemCats(JSON.parse(stored))
    } catch {}
  }, [])

  function saveItemCat(itemId: string, cat: string) {
    setItemCats(prev => {
      const next = { ...prev, [itemId]: cat }
      localStorage.setItem('grocery_item_cats', JSON.stringify(next))
      return next
    })
  }

  // AI Recipe state
  const [ingredients, setIngredients] = useState('')
  const [mealType, setMealType] = useState('')
  const [maxBudget, setMaxBudget] = useState('')
  const [generatedRecipe, setGeneratedRecipe] = useState<GeneratedRecipe | null>(null)
  const [recipeLoading, setRecipeLoading] = useState(false)

  // AI Meal Plan state
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null)
  const [planLoading, setPlanLoading] = useState(false)

  const saveMeal = async (day: string, slot: string, mealName: string) => {
    if (!mealName.trim()) return
    setSavingSlot(true)
    try {
      const { data: existing } = await supabase
        .from('meal_plans')
        .select('id')
        .eq('user_id', initialData.userId)
        .eq('week_start', initialData.weekStart)
        .eq('day_of_week', day)
        .eq('meal_slot', slot)
        .maybeSingle()

      let saved: MealPlan
      if (existing) {
        const { data, error } = await supabase
          .from('meal_plans')
          .update({ meal_name: mealName.trim() })
          .eq('id', existing.id)
          .select()
          .single()
        if (error) throw error
        saved = data as MealPlan
      } else {
        const { data, error } = await supabase
          .from('meal_plans')
          .insert({ user_id: initialData.userId, week_start: initialData.weekStart, day_of_week: day, meal_slot: slot, meal_name: mealName.trim() })
          .select()
          .single()
        if (error) throw error
        saved = data as MealPlan
      }

      setLocalMeals(prev => [...prev.filter(m => !(m.day_of_week === day && m.meal_slot === slot)), saved])
      setEditingSlot(null)
      setEditValue('')
      toast.success('Meal saved')
    } catch { toast.error('Failed to save meal') }
    finally { setSavingSlot(false) }
  }

  const aiSuggestMeal = async (day: string, slot: string) => {
    setAiSuggesting(true)
    try {
      const res = await fetch('/api/meals/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: 'typical student pantry: eggs, bread, rice, pasta, tinned tuna, onions, tomatoes, chicken',
          mealType: slot,
          maxBudget: initialData.foodBudget > 0 ? Math.round(initialData.foodBudget / 21) : 30,
          servings: 1,
        }),
      })
      const data = await res.json()
      if (data.recipe?.name) setEditValue(data.recipe.name)
    } catch { toast.error('Suggestion failed') }
    finally { setAiSuggesting(false) }
  }

  const groceryTotal = groceryItems.filter(i => !i.checked).reduce((s, i) => s + (i.price || 0), 0)

  const generateRecipe = async () => {
    if (!ingredients.trim()) {
      toast.error('Tell me what ingredients you have')
      return
    }
    setRecipeLoading(true)
    try {
      const res = await fetch('/api/meals/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients,
          maxBudget: maxBudget ? parseFloat(maxBudget) : null,
          mealType,
          servings: 2,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGeneratedRecipe(data.recipe)
      setActiveTab('recipes')
    } catch {
      toast.error('Recipe generation failed')
    } finally {
      setRecipeLoading(false)
    }
  }

  const generateWeeklyPlan = async () => {
    setPlanLoading(true)
    try {
      const res = await fetch('/api/meals/recipe')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGeneratedPlan(data.plan)
    } catch {
      toast.error('Meal plan generation failed')
    } finally {
      setPlanLoading(false)
    }
  }

  const addGroceryItem = async () => {
    if (!groceryInput.trim()) return
    try {
      const { data: item, error } = await supabase
        .from('grocery_items')
        .insert({
          user_id: initialData.userId,
          name: groceryInput.trim(),
          price: groceryPrice ? parseFloat(groceryPrice) : null,
        })
        .select()
        .single()

      if (error) throw error
      const newItem = item as GroceryItem
      setGroceryItems(prev => [newItem, ...prev])
      saveItemCat(newItem.id, selectedCat)
      setGroceryInput('')
      setGroceryPrice('')
    } catch {
      toast.error('Failed to add item')
    }
  }

  const toggleGroceryItem = async (id: string, checked: boolean) => {
    setGroceryItems(prev => prev.map(i => i.id === id ? { ...i, checked } : i))
    await supabase.from('grocery_items').update({ checked }).eq('id', id)
  }

  const deleteGroceryItem = async (id: string) => {
    setGroceryItems(prev => prev.filter(i => i.id !== id))
    await supabase.from('grocery_items').delete().eq('id', id)
  }

  const clearChecked = async () => {
    const checkedIds = groceryItems.filter(i => i.checked).map(i => i.id)
    setGroceryItems(prev => prev.filter(i => !i.checked))
    await supabase.from('grocery_items').delete().in('id', checkedIds)
  }

  const today = new Date().toISOString().split('T')[0]

  const TAB_ACCENTS: Record<TabId, string> = {
    ai_plan:   '#f59e0b',
    weekly:    '#4ecf9e',
    grocery:   '#7090d0',
    recipes:   '#e8834a',
    nutrition: '#FB7185',
  }
  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
      {/* Terracotta earth tones — African soil energy for the food domain */}
      <AmbientImage zone="meals" opacity={0.38} blurPx={5} saturation={1.3} overlayColor="transparent" />
      <TopBar title="Meal Prep" />

      {/* Tabs */}
      <div className="sticky top-[57px] z-20 border-b border-white/7" style={{ background: 'var(--bg-base)', transition: 'background 0.3s' }}>
        {/* Budget bar */}
        {initialData.foodBudget > 0 && (
          <div className="flex items-center gap-2 px-4 pt-2 pb-0 max-w-2xl mx-auto">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: 'rgba(78,207,158,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Food</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: '#4ecf9e', fontWeight: 700 }}>{fmt.currencyShort(initialData.foodBudget)}/mo</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: 'rgba(255,255,255,0.25)' }}>· {fmt.currencyShort(initialData.foodBudget / 30)}/day</span>
            {initialData.profile?.dietary_pref && initialData.profile.dietary_pref !== 'No restrictions' && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', padding: '2px 6px', borderRadius: 9999, background: 'rgba(78,207,158,0.08)', border: '0.5px solid rgba(78,207,158,0.2)', color: '#4ecf9e', marginLeft: 4 }}>{initialData.profile.dietary_pref}</span>
            )}
          </div>
        )}
        <div className="flex px-2 overflow-x-auto scrollbar-none max-w-2xl mx-auto">
          {TABS.map(tab => {
            const tabAccent = TAB_ACCENTS[tab.id]
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-3 font-display text-xs font-bold transition-all relative whitespace-nowrap"
                style={{
                  color: activeTab === tab.id ? tabAccent : 'rgba(255,255,255,0.4)',
                  borderBottom: activeTab === tab.id ? `2px solid ${tabAccent}` : '2px solid transparent',
                }}
              >
                <span className="hidden sm:inline">{tab.icon}</span>
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* ─── AI Planner Tab ─── */}
        {activeTab === 'ai_plan' && (
          <>
            {/* AI Weekly Plan Generator */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-500/15 rounded-xl flex items-center justify-center text-xl">📅</div>
                <div>
                  <div className="font-display font-bold text-white text-sm">AI Weekly Meal Plan</div>
                  <div className="font-mono text-[0.58rem] text-white/40">
                    Personalised for your budget & diet ({initialData.profile?.dietary_pref || 'No restrictions'})
                  </div>
                </div>
              </div>
              <button
                onClick={generateWeeklyPlan}
                disabled={planLoading}
                className="w-full font-display font-bold text-sm bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/30 text-amber-400 py-3 rounded-xl transition-all disabled:opacity-50"
              >
                {planLoading ? '🤖 Planning your week…' : '🤖 Generate My Week\'s Meals'}
              </button>

              {generatedPlan && (
                <div className="mt-4 space-y-3 animate-fade-up">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-[0.58rem] text-white/40 uppercase">Estimated weekly cost</div>
                    <div className="font-display font-black text-teal-400">{fmt.currencyShort(generatedPlan.weeklyTotal)}</div>
                  </div>

                  {generatedPlan.days.slice(0, 5).map(day => (
                    <div key={day.day} className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl p-3">
                      <div className="font-mono text-[0.6rem] text-white/40 uppercase tracking-widest mb-2">{day.day}</div>
                      <div className="space-y-1.5">
                        {(['breakfast', 'lunch', 'supper'] as const).map(slot => (
                          <div key={slot} className="flex items-center gap-2">
                            <div className="font-mono text-[0.55rem] text-white/30 w-16 capitalize">{slot}</div>
                            <div className="flex-1 font-body text-sm text-white">{day[slot].name}</div>
                            <div className="font-mono text-[0.58rem] text-teal-400">{fmt.currencyShort(day[slot].cost)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="bg-teal-900/20 border border-teal-600/20 rounded-xl p-3">
                    <div className="font-mono text-[0.58rem] text-teal-400 mb-1">💡 Meal prep tip</div>
                    <div className="font-body text-sm text-white/80">{generatedPlan.mealPrepTip}</div>
                  </div>

                  {/* Shopping list from plan */}
                  {generatedPlan.shoppingList.length > 0 && (
                    <div>
                      <div className="font-mono text-[0.58rem] text-white/40 uppercase tracking-widest mb-2">Shopping list</div>
                      <div className="space-y-1.5">
                        {generatedPlan.shoppingList.map((item, i) => (
                          <div key={i} className="flex items-center justify-between bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg px-3 py-2">
                            <div>
                              <div className="font-body text-sm text-white">{item.item}</div>
                              <div className="font-mono text-[0.55rem] text-white/30">Used: {item.usedIn.join(', ')}</div>
                            </div>
                            <div className="font-display font-bold text-sm text-white/60">{fmt.currencyShort(item.estimatedCost)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* AI Recipe from ingredients */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-teal-600/15 rounded-xl flex items-center justify-center text-xl">👨‍🍳</div>
                <div>
                  <div className="font-display font-bold text-white text-sm">What can I cook?</div>
                  <div className="font-mono text-[0.58rem] text-white/40">Tell me your ingredients → get a recipe</div>
                </div>
              </div>

              <div className="space-y-3">
                <textarea
                  value={ingredients}
                  onChange={e => setIngredients(e.target.value)}
                  placeholder="e.g. eggs, onions, tomatoes, pasta, tin of tuna, soya sauce..."
                  className="w-full bg-[var(--bg-base)] border border-white/10 focus:border-teal-600 rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-white/25 outline-none transition-all resize-none font-body"
                  rows={3}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="font-mono text-[0.58rem] text-white/40 uppercase tracking-wide mb-1.5">Meal type</div>
                    <div className="flex flex-wrap gap-1.5">
                      {['Breakfast', 'Lunch', 'Supper', 'Snack'].map(t => (
                        <button
                          key={t}
                          onClick={() => setMealType(mealType === t ? '' : t)}
                          className={cn(
                            'px-2.5 py-1 rounded-full font-mono text-[0.58rem] border transition-all',
                            mealType === t
                              ? 'bg-teal-600/20 border-teal-500/50 text-teal-400'
                              : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[0.58rem] text-white/40 uppercase tracking-wide mb-1.5">Max budget (R)</div>
                    <input
                      type="number"
                      value={maxBudget}
                      onChange={e => setMaxBudget(e.target.value)}
                      placeholder="e.g. 50"
                      className="w-full bg-[var(--bg-base)] border border-white/10 focus:border-teal-600 rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-white/25 outline-none transition-all"
                    />
                  </div>
                </div>
                <button
                  onClick={generateRecipe}
                  disabled={recipeLoading || !ingredients.trim()}
                  className="w-full font-display font-bold text-sm bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white py-3 rounded-xl transition-all"
                >
                  {recipeLoading ? '🤖 Cooking up a recipe…' : '🤖 Generate Recipe'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ─── Weekly Tab ─── */}
        {activeTab === 'weekly' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-display font-bold text-white">This week</div>
              <div className="flex items-center gap-3">
                <div className="font-mono text-[0.58rem] text-white/30">{initialData.weekStart}</div>
                <button
                  onClick={() => setActiveTab('nutrition')}
                  className="font-mono text-[0.55rem] bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 px-2.5 py-1 rounded-lg transition-all"
                >
                  🥗 Log nutrition →
                </button>
              </div>
            </div>
            {WEEKDAYS.map(day => (
              <div key={day} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
                  <div className="font-display font-bold text-white text-sm">{day}</div>
                  <div className="font-mono text-[0.55rem] text-white/25 uppercase">{day.slice(0, 3)}</div>
                </div>
                <div className="divide-y divide-white/5">
                  {MEAL_SLOTS.map(slot => {
                    const meal = localMeals.find(m => m.day_of_week === day && m.meal_slot === slot)
                    const isEditing = editingSlot?.day === day && editingSlot?.slot === slot
                    return (
                      <div key={slot}>
                        {isEditing ? (
                          <div className="px-4 py-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="font-mono text-[0.55rem] text-white/30 uppercase w-16 flex-shrink-0">{slot}</div>
                              <input
                                autoFocus
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') saveMeal(day, slot, editValue)
                                  if (e.key === 'Escape') { setEditingSlot(null); setEditValue('') }
                                }}
                                placeholder={`e.g. ${QUICK_SUGGESTIONS[slot.toLowerCase()]?.[0] ?? 'Enter meal name'}`}
                                className="flex-1 bg-[var(--bg-base)] border border-teal-600/40 focus:border-teal-500 rounded-lg px-2.5 py-1.5 text-sm text-white placeholder:text-white/25 outline-none transition-all"
                              />
                            </div>
                            <div className="flex items-center gap-2 pl-[4.5rem]">
                              <button
                                onClick={() => saveMeal(day, slot, editValue)}
                                disabled={savingSlot || !editValue.trim()}
                                className="font-mono text-[0.6rem] bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg transition-all"
                              >
                                {savingSlot ? '…' : 'Save'}
                              </button>
                              <button
                                onClick={() => aiSuggestMeal(day, slot)}
                                disabled={aiSuggesting}
                                className="font-mono text-[0.6rem] bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
                              >
                                {aiSuggesting ? '✦ …' : '✦ AI'}
                              </button>
                              <button
                                onClick={() => { setEditingSlot(null); setEditValue('') }}
                                className="font-mono text-[0.6rem] text-white/30 hover:text-white/60 px-2 py-1.5 transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                            <div className="flex gap-1.5 pl-[4.5rem] flex-wrap">
                              {(QUICK_SUGGESTIONS[slot.toLowerCase()] ?? []).map(s => (
                                <button
                                  key={s}
                                  onClick={() => setEditValue(s)}
                                  className="font-mono text-[0.55rem] bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white/80 px-2 py-1 rounded-full transition-all"
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingSlot({ day, slot }); setEditValue(meal?.meal_name ?? '') }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.04] transition-colors group"
                          >
                            <div className="font-mono text-[0.55rem] text-white/30 uppercase w-16 flex-shrink-0">{slot}</div>
                            <div className="flex-1 font-body text-sm">
                              {meal?.meal_name
                                ? <span className="text-white/70">{meal.meal_name}</span>
                                : <span className="text-white/20 group-hover:text-white/35 transition-colors">+ Add meal</span>
                              }
                            </div>
                            {meal?.cost && (
                              <div className="font-mono text-[0.58rem] text-teal-400">{fmt.currencyShort(meal.cost)}</div>
                            )}
                            <span className="opacity-0 group-hover:opacity-100 font-mono text-[0.55rem] text-white/25 transition-opacity flex-shrink-0">✎</span>
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Grocery Tab ─── */}
        {activeTab === 'grocery' && (() => {
          // Cart nutrition balance analysis
          const catCounts: Record<string, number> = {}
          groceryItems.filter(i => !i.checked).forEach(i => {
            const cat = itemCats[i.id] || 'pantry'
            catCounts[cat] = (catCounts[cat] || 0) + 1
          })
          const hasProtein = (catCounts['protein'] || 0) >= 1
          const hasVeg     = (catCounts['veg']     || 0) >= 1
          const hasCarbs   = (catCounts['carbs']   || 0) >= 1

          return (
            <>
              {/* Category chips */}
              <div className="space-y-2">
                <div className="font-mono text-[0.55rem] text-white/30 uppercase tracking-widest">Category</div>
                <div className="flex flex-wrap gap-1.5">
                  {GROCERY_CATS.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCat(cat.id)}
                      title={cat.tip}
                      className={cn(
                        'flex items-center gap-1 px-2.5 py-1.5 rounded-full font-mono text-[0.58rem] border transition-all',
                        selectedCat === cat.id
                          ? 'border-white/30 text-white'
                          : 'border-white/10 text-white/45 hover:text-white/70'
                      )}
                      style={selectedCat === cat.id ? { background: `${cat.color}18`, borderColor: `${cat.color}50`, color: cat.color } : {}}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add item */}
              <div className="flex gap-2">
                <input
                  value={groceryInput}
                  onChange={e => setGroceryInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addGroceryItem()}
                  placeholder={`Add ${GROCERY_CATS.find(c => c.id === selectedCat)?.label.toLowerCase() ?? 'item'}…`}
                  className="flex-1 bg-[var(--bg-surface)] border border-white/10 focus:border-teal-600 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all"
                />
                <input
                  type="number"
                  value={groceryPrice}
                  onChange={e => setGroceryPrice(e.target.value)}
                  placeholder="R"
                  className="w-20 bg-[var(--bg-surface)] border border-white/10 focus:border-teal-600 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all"
                />
                <button
                  onClick={addGroceryItem}
                  className="font-display font-bold text-sm bg-teal-600 hover:bg-teal-500 text-white px-4 py-2.5 rounded-xl transition-all"
                >
                  +
                </button>
              </div>

              {/* Cart balance insight */}
              {groceryItems.filter(i => !i.checked).length > 2 && (
                <div className="bg-[var(--bg-surface)] border border-white/8 rounded-xl p-3 space-y-2">
                  <div className="font-mono text-[0.55rem] text-white/35 uppercase tracking-widest">Cart balance</div>
                  <div className="flex gap-2 flex-wrap">
                    {GROCERY_CATS.map(cat => {
                      const count = catCounts[cat.id] || 0
                      return (
                        <div key={cat.id} className="flex items-center gap-1" style={{ opacity: count > 0 ? 1 : 0.3 }}>
                          <span style={{ fontSize: 13 }}>{cat.icon}</span>
                          <span className="font-mono text-[0.55rem]" style={{ color: count > 0 ? cat.color : 'rgba(255,255,255,0.3)' }}>
                            ×{count}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  {/* Smart suggestions */}
                  {!hasProtein && (
                    <div className="text-[0.7rem] text-rose-400/80">🥩 No protein yet — eggs, tinned tuna, or lentils keep you fuller for longer during study</div>
                  )}
                  {!hasVeg && (
                    <div className="text-[0.7rem] text-teal-400/80">🥦 Add some veg — tomatoes, spinach, or carrots boost iron and brain function</div>
                  )}
                  {hasProtein && hasVeg && hasCarbs && (
                    <div className="text-[0.7rem] text-white/50">✓ Balanced cart — protein, carbs, and veg all covered</div>
                  )}
                </div>
              )}

              {/* Total */}
              {groceryItems.length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="font-mono text-[0.6rem] text-white/40">
                    {groceryItems.filter(i => !i.checked).length} items · estimated total
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="font-display font-black text-teal-400">{fmt.currencyShort(groceryTotal)}</div>
                    {groceryItems.some(i => i.checked) && (
                      <button
                        onClick={clearChecked}
                        className="font-mono text-[0.58rem] text-white/30 hover:text-red-400 transition-colors"
                      >
                        Clear checked
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* List */}
              {groceryItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-3xl mb-3">🛒</div>
                  <p className="font-display font-bold text-white text-sm">Grocery list is empty</p>
                  <p className="font-mono text-[0.6rem] text-white/30 mt-1">Pick a category above, then add items.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {groceryItems.map(item => {
                    const cat = GROCERY_CATS.find(c => c.id === (itemCats[item.id] || ''))
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'flex items-center gap-3 bg-[var(--bg-surface)] border rounded-xl px-4 py-3 transition-all group',
                          item.checked ? 'border-white/5 opacity-50' : 'border-white/8'
                        )}
                      >
                        <button
                          onClick={() => toggleGroceryItem(item.id, !item.checked)}
                          className={cn(
                            'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                            item.checked ? 'border-teal-600 bg-teal-600' : 'border-white/30 hover:border-teal-600'
                          )}
                        >
                          {item.checked && (
                            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                              <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                        {/* Category dot */}
                        {cat && (
                          <span
                            className="text-sm flex-shrink-0"
                            title={cat.label}
                          >
                            {cat.icon}
                          </span>
                        )}
                        <div className="flex-1">
                          <div className={cn('font-body text-sm text-white', item.checked && 'line-through text-white/40')}>
                            {item.name}
                          </div>
                          {cat && (
                            <div className="font-mono text-[0.52rem]" style={{ color: `${cat.color}70` }}>{cat.label}</div>
                          )}
                        </div>
                        {item.price && (
                          <div className="font-display font-bold text-sm text-white/60">{fmt.currencyShort(item.price)}</div>
                        )}
                        <button
                          onClick={() => deleteGroceryItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )
        })()}

        {/* ─── Recipes Tab ─── */}
        {activeTab === 'recipes' && (
          <>
            {/* Generated recipe */}
            {generatedRecipe && (
              <div className="bg-gradient-to-br from-teal-900/20 to-teal-950/10 border border-teal-600/20 rounded-2xl p-5 animate-fade-up space-y-4">
                <div>
                  <div className="font-mono text-[0.58rem] text-teal-400 uppercase tracking-widest mb-1">AI Generated Recipe</div>
                  <div className="font-display font-black text-xl text-white">{generatedRecipe.name}</div>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="font-mono text-[0.6rem] bg-teal-600/15 text-teal-400 border border-teal-600/20 px-2 py-1 rounded-full">
                      {fmt.currencyShort(generatedRecipe.totalCost)} total
                    </span>
                    <span className="font-mono text-[0.6rem] text-white/40">{fmt.currencyShort(generatedRecipe.costPerServing)}/serving</span>
                    <span className="font-mono text-[0.6rem] text-white/40">⏱ {generatedRecipe.cookTime}</span>
                    <span className="font-mono text-[0.6rem] text-white/40 capitalize">{generatedRecipe.difficulty}</span>
                    <span className="font-mono text-[0.6rem] text-white/40">🍽 {generatedRecipe.servings} servings</span>
                  </div>
                </div>

                <div>
                  <div className="font-mono text-[0.58rem] text-white/40 uppercase tracking-widest mb-2">Ingredients</div>
                  <div className="space-y-1.5">
                    {generatedRecipe.ingredients.map((ing, i) => (
                      <div key={i} className="flex items-center gap-3 bg-[var(--bg-surface)] rounded-xl px-3 py-2">
                        <div className="w-1.5 h-1.5 bg-teal-600 rounded-full flex-shrink-0" />
                        <div className="flex-1 font-body text-sm text-white">{ing.item}</div>
                        <div className="font-mono text-[0.58rem] text-white/40">{ing.amount}</div>
                        <div className="font-mono text-[0.58rem] text-teal-400">{fmt.currencyShort(ing.estimatedCost)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="font-mono text-[0.58rem] text-white/40 uppercase tracking-widest mb-2">Steps</div>
                  <div className="space-y-2">
                    {generatedRecipe.steps.map((step) => (
                      <div key={step.step} className="flex gap-3">
                        <div className="w-6 h-6 bg-teal-600/20 text-teal-400 rounded-full flex items-center justify-center font-mono text-[0.6rem] font-bold flex-shrink-0 mt-0.5">
                          {step.step}
                        </div>
                        <div className="font-body text-sm text-white/80 leading-relaxed">{step.instruction}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {generatedRecipe.tips.length > 0 && (
                  <div className="bg-amber-500/8 border border-amber-500/15 rounded-xl p-3">
                    <div className="font-mono text-[0.58rem] text-amber-400 uppercase tracking-widest mb-2">💡 Tips</div>
                    {generatedRecipe.tips.map((tip, i) => (
                      <div key={i} className="font-body text-sm text-white/70">{tip}</div>
                    ))}
                  </div>
                )}

                <div className="font-mono text-[0.58rem] text-white/30">{generatedRecipe.nutritionNote}</div>
                {generatedRecipe.storageTip && (
                  <div className="font-mono text-[0.58rem] text-white/30">🥡 {generatedRecipe.storageTip}</div>
                )}
              </div>
            )}

            {/* Static sample recipes */}
            <div>
              <div className="font-mono text-[0.6rem] text-white/40 uppercase tracking-widest mb-3">Budget SA Recipes</div>
              <div className="space-y-3">
                {SAMPLE_RECIPES.map(recipe => (
                  <div key={recipe.name} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-white/15 rounded-2xl p-4 transition-all">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0">{recipe.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="font-display font-bold text-white text-sm">{recipe.name}</div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="font-mono text-[0.58rem] text-teal-400">{recipe.cost}</span>
                            <span className="font-mono text-[0.55rem] text-white/30">{recipe.time}</span>
                          </div>
                        </div>
                        <div className="font-body text-[0.8rem] text-white/55 leading-relaxed">{recipe.desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {!generatedRecipe && (
              <button
                onClick={() => setActiveTab('ai_plan')}
                className="w-full font-display font-bold text-sm bg-teal-600/10 hover:bg-teal-600/20 border border-teal-600/20 text-teal-400 py-3 rounded-xl transition-all"
              >
                🤖 Generate a recipe from your ingredients →
              </button>
            )}
          </>
        )}

        {/* ─── Nutrition Tab ─── */}
        {activeTab === 'nutrition' && (
          <NutritionTab
            supabase={supabase}
            userId={initialData.userId}
            today={today}
          />
        )}
      </div>
    </div>
  )
}
