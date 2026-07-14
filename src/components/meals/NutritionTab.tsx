'use client'

import { useState, useEffect } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

// SA student foods with macro data per typical serving — budget-friendly focus
const SA_FOODS = [
  // Breakfast
  { name: 'Pap (200g)',          icon: '🌽', slot: 'breakfast', cal: 363, protein: 8,   carbs: 73, fat: 4,   price: 2  },
  { name: 'Eggs ×2',             icon: '🥚', slot: 'breakfast', cal: 140, protein: 12,  carbs: 0,  fat: 10,  price: 8  },
  { name: 'Brown bread ×2',      icon: '🍞', slot: 'breakfast', cal: 156, protein: 7,   carbs: 28, fat: 2.2, price: 5  },
  { name: 'Oats (200g cooked)',  icon: '🥣', slot: 'breakfast', cal: 142, protein: 5,   carbs: 24, fat: 2.8, price: 4  },
  { name: 'Amasi (100ml)',       icon: '🥛', slot: 'breakfast', cal: 64,  protein: 3.5, carbs: 4.9,fat: 3.5, price: 5  },
  { name: 'Milo with milk',      icon: '☕', slot: 'breakfast', cal: 220, protein: 9,   carbs: 29, fat: 8,   price: 9  },
  { name: 'Peanut butter toast', icon: '🫙', slot: 'breakfast', cal: 240, protein: 8,   carbs: 28, fat: 11,  price: 7  },
  { name: 'Weetbix ×3',         icon: '🌾', slot: 'breakfast', cal: 211, protein: 6,   carbs: 40, fat: 1.5, price: 6  },
  // Lunch
  { name: 'Rice (200g cooked)',  icon: '🍚', slot: 'lunch', cal: 260, protein: 5.4, carbs: 56, fat: 0.6, price: 5  },
  { name: 'Chakalaka (200g)',    icon: '🌶️', slot: 'lunch', cal: 90,  protein: 4,   carbs: 16, fat: 2,   price: 8  },
  { name: 'Tinned tuna (100g)', icon: '🐟', slot: 'lunch', cal: 116, protein: 26,  carbs: 0,  fat: 0.6, price: 15 },
  { name: 'Samp & beans (200g)',icon: '🫘', slot: 'lunch', cal: 390, protein: 14,  carbs: 76, fat: 2,   price: 10 },
  { name: 'Bunny chow (half)',  icon: '🥐', slot: 'lunch', cal: 700, protein: 25,  carbs: 90, fat: 28,  price: 40 },
  { name: 'Pasta (200g cooked)',icon: '🍝', slot: 'lunch', cal: 262, protein: 10,  carbs: 50, fat: 2.2, price: 8  },
  { name: 'Sardines on bread',  icon: '🐠', slot: 'lunch', cal: 280, protein: 22,  carbs: 28, fat: 9,   price: 12 },
  { name: 'Butternut soup',     icon: '🍜', slot: 'lunch', cal: 120, protein: 2,   carbs: 22, fat: 4,   price: 15 },
  // Supper
  { name: 'Braai chicken (100g)',icon: '🍗', slot: 'supper', cal: 239, protein: 27,  carbs: 0,  fat: 14,  price: 25 },
  { name: 'Boerewors (100g)',   icon: '🌭', slot: 'supper', cal: 384, protein: 17,  carbs: 1,  fat: 34,  price: 22 },
  { name: 'Sweet potato (150g)',icon: '🍠', slot: 'supper', cal: 129, protein: 2.4, carbs: 30, fat: 0.15,price: 8  },
  { name: 'Lentils (150g)',     icon: '🟤', slot: 'supper', cal: 174, protein: 13.5,carbs: 30, fat: 0.6, price: 6  },
  { name: 'Spinach & egg fry', icon: '🥬', slot: 'supper', cal: 180, protein: 13,  carbs: 5,  fat: 12,  price: 12 },
  { name: 'Umngqusho (200g)',   icon: '🍲', slot: 'supper', cal: 380, protein: 15,  carbs: 72, fat: 2,   price: 9  },
  { name: 'Mince & pap (200g)',icon: '🍖', slot: 'supper', cal: 450, protein: 28,  carbs: 46, fat: 16,  price: 30 },
  { name: 'Stir-fry veg & rice',icon: '🥦', slot: 'supper', cal: 320, protein: 8,  carbs: 55, fat: 6,   price: 18 },
  // Snacks
  { name: 'Mageu (200ml)',      icon: '🥤', slot: 'snack', cal: 145, protein: 4,   carbs: 30, fat: 1,   price: 8  },
  { name: 'Banana',             icon: '🍌', slot: 'snack', cal: 89,  protein: 1.1, carbs: 23, fat: 0.3, price: 4  },
  { name: 'Peanuts (28g)',      icon: '🥜', slot: 'snack', cal: 166, protein: 7.6, carbs: 4.8,fat: 14,  price: 7  },
  { name: 'Provita ×4',        icon: '🍘', slot: 'snack', cal: 88,  protein: 2.5, carbs: 16, fat: 1.5, price: 5  },
  { name: 'Fruit (apple/pear)', icon: '🍎', slot: 'snack', cal: 80,  protein: 0.4, carbs: 21, fat: 0.2, price: 6  },
  { name: 'Hard-boiled egg',    icon: '🥚', slot: 'snack', cal: 70,  protein: 6,   carbs: 0.5,fat: 5,   price: 4  },
]

interface NutritionLog {
  id: string
  logged_date: string
  meal_slot: string
  food_name: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

const DAILY_TARGETS = { calories: 2000, protein: 60, carbs: 250, fat: 65, water: 8 }
const SLOT_LABELS: Record<string, { label: string; color: string }> = {
  breakfast: { label: 'Breakfast', color: '#f59e0b' },
  lunch:     { label: 'Lunch',     color: '#4ecf9e' },
  supper:    { label: 'Supper',    color: '#e8834a' },
  snack:     { label: 'Snacks',    color: '#818CF8' },
}
const SLOT_ORDER = ['breakfast', 'lunch', 'supper', 'snack']

interface NutritionTabProps {
  supabase: SupabaseClient
  userId: string
  today: string
}

function MacroRing({ value, target, color, label, unit }: {
  value: number; target: number; color: string; label: string; unit: string
}) {
  const pct = Math.min(value / target, 1)
  const r = 22
  const circ = 2 * Math.PI * r
  const dash = circ * pct
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 60 }}>
      <svg width={56} height={56} viewBox="0 0 56 56">
        <circle cx={28} cy={28} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
        <circle
          cx={28} cy={28} r={r}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x={28} y={32} textAnchor="middle" fontSize={10} fontWeight="700" fill="white"
          style={{ fontFamily: 'var(--font-mono)' }}>
          {Math.round(value)}
        </text>
      </svg>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.53rem', color: 'rgba(255,255,255,0.38)', textAlign: 'center', lineHeight: 1.4 }}>
        {label}<br />
        <span style={{ color }}>/{target}{unit}</span>
      </div>
    </div>
  )
}

function WaterGrid({ water, onAdd }: { water: number; onAdd: (delta: number) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 60 }}>
      <div style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, width: 42, justifyContent: 'center' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <button
              key={i}
              onClick={() => onAdd(i < water ? -1 : 1)}
              title={i < water ? 'Remove glass' : 'Add glass'}
              style={{
                width: 13, height: 13,
                borderRadius: 3,
                background: i < water ? '#38BDF8' : 'rgba(255,255,255,0.07)',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s',
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>
      <button
        onClick={() => onAdd(1)}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.55rem',
          color: '#38BDF8',
          background: 'rgba(56,189,248,0.1)',
          border: '0.5px solid rgba(56,189,248,0.25)',
          borderRadius: 8, padding: '2px 6px',
          cursor: 'pointer',
        }}
      >
        +💧
      </button>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.53rem', color: 'rgba(255,255,255,0.38)', textAlign: 'center', lineHeight: 1.4 }}>
        Water<br />
        <span style={{ color: '#38BDF8' }}>{water}/8 gl</span>
      </div>
    </div>
  )
}

export default function NutritionTab({ supabase, userId, today }: NutritionTabProps) {
  const [logs, setLogs] = useState<NutritionLog[]>([])
  const [loading, setLoading] = useState(true)
  const [water, setWater] = useState(0)
  const [openSlot, setOpenSlot] = useState<string | null>(null)
  const [customName, setCustomName] = useState('')
  const [customCal, setCustomCal] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadLogs()
    const stored = localStorage.getItem(`water_${today}`)
    if (stored) setWater(parseInt(stored))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today])

  async function loadLogs() {
    setLoading(true)
    const { data } = await supabase
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('logged_date', today)
      .order('created_at', { ascending: true })
    setLogs((data || []) as NutritionLog[])
    setLoading(false)
  }

  async function addFood(food: typeof SA_FOODS[number]) {
    setSaving(true)
    const { data, error } = await supabase
      .from('nutrition_logs')
      .insert({
        user_id: userId,
        logged_date: today,
        meal_slot: food.slot,
        food_name: food.name,
        calories: food.cal,
        protein_g: food.protein,
        carbs_g: food.carbs,
        fat_g: food.fat,
        quantity_g: 100,
      })
      .select()
      .single()
    if (error) { toast.error('Failed to log food'); setSaving(false); return }
    setLogs(prev => [...prev, data as NutritionLog])
    setSaving(false)
    toast.success(`${food.name} logged ✓`)
  }

  async function addCustom(slot: string) {
    if (!customName.trim() || !customCal) return
    setSaving(true)
    const { data, error } = await supabase
      .from('nutrition_logs')
      .insert({
        user_id: userId,
        logged_date: today,
        meal_slot: slot,
        food_name: customName.trim(),
        calories: parseInt(customCal),
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        quantity_g: 100,
      })
      .select()
      .single()
    if (error) { toast.error('Failed to log'); setSaving(false); return }
    setLogs(prev => [...prev, data as NutritionLog])
    setCustomName('')
    setCustomCal('')
    setSaving(false)
    toast.success('Food logged ✓')
  }

  async function deleteLog(id: string) {
    setLogs(prev => prev.filter(l => l.id !== id))
    await supabase.from('nutrition_logs').delete().eq('id', id)
    toast.success('Removed')
  }

  function handleWater(delta: number) {
    const next = Math.max(0, Math.min(water + delta, 12))
    setWater(next)
    localStorage.setItem(`water_${today}`, String(next))
  }

  const totals = logs.reduce(
    (acc, l) => ({
      calories: acc.calories + (l.calories || 0),
      protein: acc.protein + (l.protein_g || 0),
      carbs: acc.carbs + (l.carbs_g || 0),
      fat: acc.fat + (l.fat_g || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const calPct = Math.min(totals.calories / DAILY_TARGETS.calories, 1)
  const calColor = calPct > 1.05 ? '#FB7185' : calPct > 0.85 ? '#4ecf9e' : '#f59e0b'

  // Health score 0–100: calories in range (40pts) + protein met (20pts) + carbs met (20pts) + hydration (20pts)
  const healthScore = Math.round(
    (calPct > 0.6 && calPct <= 1.1 ? 40 : calPct > 0.3 ? 20 : 0) +
    Math.min(totals.protein / DAILY_TARGETS.protein, 1) * 20 +
    Math.min(totals.carbs   / DAILY_TARGETS.carbs,   1) * 20 +
    Math.min(water          / DAILY_TARGETS.water,   1) * 20
  )
  const scoreColor = healthScore >= 75 ? '#4ecf9e' : healthScore >= 45 ? '#f59e0b' : '#FB7185'
  const scoreLabel = healthScore >= 75 ? 'On track' : healthScore >= 45 ? 'Getting there' : 'Log more meals'

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-display font-bold text-white">Today&apos;s Nutrition</div>
        <div className="flex items-center gap-2">
          <div className="font-mono text-[0.58rem] text-white/55">{today}</div>
          {logs.length > 0 && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
              style={{ background: `${scoreColor}12`, borderColor: `${scoreColor}35` }}
            >
              <span className="font-mono text-[0.6rem] font-bold" style={{ color: scoreColor }}>{healthScore}</span>
              <span className="font-mono text-[0.65rem]" style={{ color: `${scoreColor}80` }}>{scoreLabel}</span>
            </div>
          )}
        </div>
      </div>

      {/* Macro summary card */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-4">
        {/* Calorie progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <div className="font-mono text-[0.58rem] text-white/65 uppercase tracking-wide">Calories</div>
            <div className="font-mono text-[0.6rem] font-bold" style={{ color: calColor }}>
              {Math.round(totals.calories)} / {DAILY_TARGETS.calories} kcal
            </div>
          </div>
          <div className="h-2 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${calPct * 100}%`, background: calColor }}
            />
          </div>
          {totals.calories === 0 && (
            <div className="font-mono text-[0.55rem] text-white/45 mt-1">Log your first meal below to track your day</div>
          )}
        </div>

        {/* Macro rings row */}
        <div className="flex items-start justify-around">
          <MacroRing value={totals.protein} target={DAILY_TARGETS.protein} color="#FB7185" label="Protein" unit="g" />
          <MacroRing value={totals.carbs}   target={DAILY_TARGETS.carbs}   color="#f59e0b" label="Carbs"   unit="g" />
          <MacroRing value={totals.fat}     target={DAILY_TARGETS.fat}     color="#818CF8" label="Fat"     unit="g" />
          <WaterGrid water={water} onAdd={handleWater} />
        </div>
      </div>

      {/* Meal slots */}
      {SLOT_ORDER.map(slot => {
        const { label, color } = SLOT_LABELS[slot]
        const slotLogs = logs.filter(l => l.meal_slot === slot)
        const slotCal  = slotLogs.reduce((s, l) => s + (l.calories || 0), 0)
        const foods    = SA_FOODS.filter(f => f.slot === slot)
        const isOpen   = openSlot === slot

        return (
          <div key={slot} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
            {/* Slot header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div>
                <span
                  className="font-display font-bold text-sm"
                  style={{ color: slotLogs.length > 0 ? color : 'white' }}
                >
                  {label}
                </span>
                {slotCal > 0 && (
                  <span className="ml-2 font-mono text-[0.55rem] text-white/55">{slotCal} kcal</span>
                )}
              </div>
              <button
                onClick={() => setOpenSlot(isOpen ? null : slot)}
                className={cn(
                  'font-mono text-[0.6rem] px-3 py-1.5 rounded-lg border transition-all',
                  isOpen
                    ? 'bg-white/8 border-white/20 text-white/60'
                    : 'bg-[var(--bg-base)] border-white/10 hover:border-teal-600/50 text-white/68 hover:text-teal-400'
                )}
              >
                {isOpen ? '↑ Close' : '+ Add'}
              </button>
            </div>

            {/* Logged items */}
            {slotLogs.length > 0 && (
              <div className="divide-y divide-white/5">
                {slotLogs.map(log => (
                  <div key={log.id} className="flex items-center gap-3 px-4 py-2.5 group">
                    <div className="flex-1 min-w-0">
                      <div className="font-body text-sm text-white/80 truncate">{log.food_name}</div>
                      <div className="font-mono text-[0.53rem] text-white/52">
                        {log.calories} kcal
                        {log.protein_g > 0 && ` · P ${Math.round(log.protein_g)}g`}
                        {log.carbs_g   > 0 && ` · C ${Math.round(log.carbs_g)}g`}
                        {log.fat_g     > 0 && ` · F ${Math.round(log.fat_g)}g`}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteLog(log.id)}
                      className="opacity-0 group-hover:opacity-100 text-white/45 hover:text-red-400 transition-all text-xs flex-shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {slotLogs.length === 0 && !isOpen && (
              <div className="px-4 py-3">
                <div className="font-mono text-[0.58rem] text-white/40">Nothing logged yet — tap + Add</div>
              </div>
            )}

            {/* Quick-add panel */}
            {isOpen && (
              <div className="border-t border-white/8 p-3 space-y-3 animate-fade-up">
                <div className="font-mono text-[0.55rem] text-white/52 uppercase tracking-widest">SA food quick-add</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {foods.map(food => (
                    <button
                      key={food.name}
                      onClick={() => addFood(food)}
                      disabled={saving}
                      className="flex items-center gap-2 bg-[var(--bg-base)] hover:bg-white/5 border border-white/7 hover:border-white/15 rounded-xl px-2.5 py-2 text-left transition-all disabled:opacity-50"
                    >
                      <span className="text-base flex-shrink-0">{food.icon}</span>
                      <div className="min-w-0">
                        <div className="font-body text-[0.72rem] text-white/80 leading-tight truncate">{food.name}</div>
                        <div className="font-mono text-[0.65rem] text-white/55 flex gap-2">
                          <span>{food.cal} kcal</span>
                          {food.protein > 5 && <span className="text-rose-400/60">P{Math.round(food.protein)}g</span>}
                          {'price' in food && <span className="text-emerald-400/50">~R{(food as typeof food & {price:number}).price}</span>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Custom entry row */}
                <div className="flex gap-2">
                  <input
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    placeholder="Other food name"
                    className="flex-1 bg-[var(--bg-base)] border border-white/10 focus:border-teal-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/45 outline-none transition-all"
                  />
                  <input
                    type="number"
                    value={customCal}
                    onChange={e => setCustomCal(e.target.value)}
                    placeholder="kcal"
                    className="w-16 bg-[var(--bg-base)] border border-white/10 focus:border-teal-600 rounded-lg px-2 py-2 text-sm text-white placeholder:text-white/45 outline-none"
                  />
                  <button
                    onClick={() => addCustom(slot)}
                    disabled={!customName.trim() || !customCal || saving}
                    className="font-display font-bold text-sm bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white px-3 py-2 rounded-lg transition-all"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Study brain fuel tip */}
      {healthScore >= 75 && totals.protein >= 40 && (
        <div className="bg-indigo-500/8 border border-indigo-500/15 rounded-xl px-4 py-3">
          <div className="font-mono text-[0.58rem] text-indigo-400 mb-1">🧠 Brain fuelled</div>
          <div className="font-body text-sm text-white/65">
            Good protein + carbs today means sustained focus. Your brain needs glucose every 2–3 hours — keep a snack nearby during long study sessions.
          </div>
        </div>
      )}

      {/* Contextual nutrition tips */}
      {totals.calories > 0 && totals.protein < 30 && (
        <div className="bg-rose-500/8 border border-rose-500/15 rounded-xl px-4 py-3">
          <div className="font-mono text-[0.58rem] text-rose-400 mb-1">💡 Low protein today</div>
          <div className="font-body text-sm text-white/65">
            Add eggs, tinned tuna, or lentils — cheap, high-protein options that keep you full during long study sessions.
          </div>
        </div>
      )}
      {totals.calories > DAILY_TARGETS.calories * 1.15 && (
        <div className="bg-amber-500/8 border border-amber-500/15 rounded-xl px-4 py-3">
          <div className="font-mono text-[0.58rem] text-amber-400 mb-1">📊 Over target</div>
          <div className="font-body text-sm text-white/65">
            You&apos;re {Math.round(totals.calories - DAILY_TARGETS.calories)} kcal over today&apos;s target. A light supper with samp, chakalaka or a salad will balance things out.
          </div>
        </div>
      )}
      {water < 4 && (
        <div className="bg-sky-500/8 border border-sky-500/15 rounded-xl px-4 py-3">
          <div className="font-mono text-[0.58rem] text-sky-400 mb-1">💧 Stay hydrated</div>
          <div className="font-body text-sm text-white/65">
            Dehydration tanks concentration. Aim for 8 glasses — tap the water grid above each time you drink.
          </div>
        </div>
      )}
    </div>
  )
}
