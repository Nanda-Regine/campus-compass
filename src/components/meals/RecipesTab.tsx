'use client'

import { useState } from 'react'

// ── Recipe Database ──────────────────────────────────────────────────────────
type Difficulty = 'Easy' | 'Medium' | 'Hard'
type Tag = 'Budget' | 'Quick' | 'Protein' | 'Veg' | 'Bulk Cook' | 'Breakfast' | 'No Cook' | 'SA Classic'

interface Recipe {
  id: string
  name: string
  icon: string
  cost: string
  costNum: number
  time: string
  timeMin: number
  difficulty: Difficulty
  servings: number
  tags: Tag[]
  desc: string
  ingredients: string[]
  steps: string[]
  nutrition: { cal: number; protein: number; carbs: number; fat: number }
  tip?: string
}

const RECIPES: Recipe[] = [
  {
    id: 'chakalaka-pap',
    name: 'Chakalaka & Pap',
    icon: '🌶️', cost: 'R18', costNum: 18, time: '25 min', timeMin: 25,
    difficulty: 'Easy', servings: 2, tags: ['Budget', 'SA Classic'],
    desc: 'A South African classic — spiced bean and vegetable relish with smooth pap. Filling, nutritious, and under R20 for 2 people.',
    ingredients: ['2 cups maize meal', '1 tin chakalaka (R9)', 'Salt to taste', 'Water (1L)'],
    steps: [
      'Bring 3 cups of water to boil with a pinch of salt.',
      'Gradually stir in maize meal to avoid lumps. Reduce heat.',
      'Cook for 10 minutes, stirring constantly, until thick and smooth.',
      'Heat chakalaka in a separate pan or microwave for 2 minutes.',
      'Serve pap with chakalaka on the side.',
    ],
    nutrition: { cal: 420, protein: 10, carbs: 82, fat: 4 },
    tip: 'Add a fried egg on top for extra protein — still under R25 total.',
  },
  {
    id: 'egg-fried-rice',
    name: 'Egg Fried Rice',
    icon: '🍳', cost: 'R12', costNum: 12, time: '15 min', timeMin: 15,
    difficulty: 'Easy', servings: 1, tags: ['Quick', 'Budget', 'Protein'],
    desc: 'Zero-waste magic — uses leftover rice, 2 eggs, and soy sauce. Best student meal under R15.',
    ingredients: ['1 cup leftover cooked rice', '2 eggs', '1 tbsp oil', 'Soy sauce', 'Optional: frozen peas, garlic'],
    steps: [
      'Heat oil in a pan or pot over high heat.',
      'Beat eggs, pour into pan, scramble lightly for 30 seconds.',
      'Add cold rice and break up clumps with a spoon.',
      'Stir-fry everything together for 3–4 minutes.',
      'Add soy sauce (2 tsp), stir through, and serve hot.',
    ],
    nutrition: { cal: 380, protein: 18, carbs: 45, fat: 14 },
    tip: 'Cold rice works MUCH better than fresh rice — plan ahead and refrigerate overnight.',
  },
  {
    id: 'samp-beans',
    name: 'Umngqusho (Samp & Beans)',
    icon: '🫘', cost: 'R15', costNum: 15, time: '60 min', timeMin: 60,
    difficulty: 'Easy', servings: 4, tags: ['Budget', 'Bulk Cook', 'SA Classic'],
    desc: 'Sunday batch cook — soak overnight, simmer for an hour, and eat for 3 days. Nelson Mandela\'s favourite meal.',
    ingredients: ['250g samp (R8)', '250g sugar beans (R7)', 'Salt', 'Butter (optional)', '4 cups water'],
    steps: [
      'Soak samp and beans in cold water OVERNIGHT (8+ hours). This is essential — skip at your own risk.',
      'Drain, rinse, and cover with fresh water in a large pot.',
      'Bring to boil, then reduce to medium-low heat.',
      'Cook 45–60 minutes until both are soft, adding water as needed.',
      'Season with salt and a knob of butter. Serve with chakalaka or braai meat.',
    ],
    nutrition: { cal: 390, protein: 16, carbs: 75, fat: 2 },
    tip: 'Make a big batch on Sunday. Refrigerates for 4 days, great for quick reheating during the week.',
  },
  {
    id: 'tuna-pasta',
    name: 'Tuna Pasta',
    icon: '🐟', cost: 'R28', costNum: 28, time: '20 min', timeMin: 20,
    difficulty: 'Easy', servings: 2, tags: ['Budget', 'Protein', 'Quick'],
    desc: 'Tinned tuna, pasta, a tin of tomatoes, and dried herbs. Zero cooking skill needed.',
    ingredients: ['200g pasta (R6)', '1 tin tuna in brine (R15)', '1 tin chopped tomatoes (R8)', 'Garlic (optional)', 'Dried herbs'],
    steps: [
      'Boil salted water, cook pasta until al dente (follow packet instructions).',
      'In a separate pan, heat crushed garlic briefly in a drizzle of oil.',
      'Add tinned tomatoes, simmer 5 minutes, season with herbs, salt, and pepper.',
      'Drain pasta, mix into tomato sauce.',
      'Flake tuna through the pasta. Serve hot.',
    ],
    nutrition: { cal: 480, protein: 32, carbs: 68, fat: 6 },
    tip: 'Tuna in brine (not oil) is healthier and cheaper. Add a handful of frozen peas for extra nutrition.',
  },
  {
    id: 'peanut-butter-oats',
    name: 'Peanut Butter Oats',
    icon: '🥜', cost: 'R8', costNum: 8, time: '5 min', timeMin: 5,
    difficulty: 'Easy', servings: 1, tags: ['Budget', 'Quick', 'Breakfast', 'No Cook'],
    desc: 'The ultimate student breakfast — under R10, 5 minutes, keeps you full through a 3-hour lecture.',
    ingredients: ['½ cup oats (R3)', '1 tbsp peanut butter (R3)', '1 banana (R4)', 'Hot water or milk', 'Honey optional'],
    steps: [
      'Pour oats into a bowl.',
      'Add boiling water (or hot milk for extra calories) to cover oats.',
      'Wait 2–3 minutes for oats to absorb liquid.',
      'Stir in peanut butter.',
      'Slice banana on top. Done.',
    ],
    nutrition: { cal: 380, protein: 13, carbs: 54, fat: 12 },
    tip: 'Prep overnight oats the night before — soak in cold milk in a mug in the fridge. No morning cooking needed.',
  },
  {
    id: 'spinach-egg-scramble',
    name: 'Spinach & Egg Scramble',
    icon: '🥬', cost: 'R14', costNum: 14, time: '10 min', timeMin: 10,
    difficulty: 'Easy', servings: 1, tags: ['Quick', 'Protein', 'Budget'],
    desc: 'Iron + protein packed. Tinned spinach + eggs + bread = complete meal. Student brain fuel.',
    ingredients: ['3 eggs (R12)', '½ tin spinach or handful fresh (R5)', 'Bread ×2 slices (R2)', 'Salt, pepper', 'Oil'],
    steps: [
      'Heat a drizzle of oil in a pan over medium heat.',
      'Add spinach and cook 1–2 minutes until warm.',
      'Beat eggs, pour over spinach, scramble gently.',
      'Cook 2–3 minutes until just set (don\'t over-cook).',
      'Serve on toast with salt and pepper.',
    ],
    nutrition: { cal: 360, protein: 24, carbs: 26, fat: 16 },
    tip: 'Add a sprinkle of chilli flakes if you have them — spinach and egg are bland without seasoning.',
  },
  {
    id: 'lentil-soup',
    name: 'Lentil & Tomato Soup',
    icon: '🍲', cost: 'R22', costNum: 22, time: '30 min', timeMin: 30,
    difficulty: 'Easy', servings: 4, tags: ['Budget', 'Bulk Cook', 'Veg', 'Protein'],
    desc: 'Red lentils cook in 20 minutes, no soaking needed. High protein, cheap as chips, freezes beautifully.',
    ingredients: ['250g red lentils (R12)', '2 tins chopped tomatoes (R16)', '1 onion (R4)', 'Garlic ×2 cloves', 'Cumin, coriander, paprika', 'Salt', 'Oil'],
    steps: [
      'Dice onion and fry in oil until soft (5 min).',
      'Add garlic and spices, cook 1 minute until fragrant.',
      'Add rinsed lentils and tinned tomatoes. Mix well.',
      'Pour in 3 cups water, bring to boil.',
      'Simmer 20 minutes until lentils are mushy. Season with salt.',
      'Serve with bread or pap.',
    ],
    nutrition: { cal: 280, protein: 18, carbs: 42, fat: 4 },
    tip: 'Freeze in single portions. Lentil soup is AMAZING from frozen — better than fresh.',
  },
  {
    id: 'butternut-pap',
    name: 'Butternut & Pap',
    icon: '🎃', cost: 'R20', costNum: 20, time: '35 min', timeMin: 35,
    difficulty: 'Easy', servings: 3, tags: ['Budget', 'Veg', 'SA Classic'],
    desc: 'Roasted butternut with soft pap — comfort food that costs R20 for 3 people.',
    ingredients: ['½ butternut (R10)', '2 cups maize meal (R5)', 'Butter (R3)', 'Cinnamon (optional)', 'Salt', 'Water'],
    steps: [
      'Cube butternut, toss in a drizzle of oil and pinch of salt.',
      'Roast in oven at 200°C for 25 minutes (or microwave 8 min).',
      'Meanwhile, make stiff pap: boil 3 cups water, stir in maize meal gradually.',
      'Cook pap 15 minutes on low heat, stirring.',
      'Mash butternut with butter and serve alongside pap.',
    ],
    nutrition: { cal: 350, protein: 7, carbs: 68, fat: 6 },
    tip: 'No oven? Microwave the butternut in a bowl covered with cling wrap — works perfectly.',
  },
  {
    id: 'sardine-avo-toast',
    name: 'Sardine & Tomato Toast',
    icon: '🐠', cost: 'R16', costNum: 16, time: '5 min', timeMin: 5,
    difficulty: 'Easy', servings: 1, tags: ['Quick', 'No Cook', 'Protein', 'Breakfast'],
    desc: 'Sardines have more omega-3 than salmon, cost R12 a tin, and keep you sharp in lectures.',
    ingredients: ['1 tin sardines in tomato sauce (R12)', '2 slices bread (R2)', 'Lemon juice (optional)', 'Chilli sauce'],
    steps: [
      'Toast bread (or eat fresh — no toaster? No problem).',
      'Open tin of sardines.',
      'Mash sardines onto toast with a fork.',
      'Squeeze lemon if you have it, add chilli sauce.',
      'Eat immediately.',
    ],
    nutrition: { cal: 310, protein: 26, carbs: 28, fat: 10 },
    tip: 'Sardines in tomato sauce already have the sauce built in — easiest high-protein snack or meal.',
  },
  {
    id: 'bean-rice-bowl',
    name: 'Spiced Bean & Rice Bowl',
    icon: '🍱', cost: 'R15', costNum: 15, time: '20 min', timeMin: 20,
    difficulty: 'Easy', servings: 2, tags: ['Budget', 'Veg', 'Protein'],
    desc: 'Black or kidney beans over rice with spices — complete protein, under R15. Meal prep champion.',
    ingredients: ['1 cup rice (R5)', '1 tin kidney beans (R8)', 'Onion, garlic', 'Cumin, paprika, salt', 'Oil', 'Hot sauce optional'],
    steps: [
      'Cook rice as per packet (usually 2:1 water to rice, 15–20 min).',
      'Fry diced onion until soft. Add garlic, cook 1 min.',
      'Add drained beans and spices. Stir well.',
      'Heat through for 5 minutes, mashing some beans to thicken.',
      'Season well. Serve over rice with hot sauce.',
    ],
    nutrition: { cal: 420, protein: 18, carbs: 78, fat: 4 },
    tip: 'Beans + rice = complete protein. Your body gets all 9 essential amino acids — same as meat.',
  },
  {
    id: 'veggie-stir-fry',
    name: 'Veggie & Egg Stir-Fry',
    icon: '🥦', cost: 'R18', costNum: 18, time: '15 min', timeMin: 15,
    difficulty: 'Easy', servings: 1, tags: ['Quick', 'Veg', 'Protein'],
    desc: 'Any veg + eggs + soy sauce + rice = perfect meal. The formula never fails.',
    ingredients: ['Eggs ×2 (R8)', 'Frozen mixed veg 1 cup (R6)', '1 cup cooked rice', 'Soy sauce (R2)', 'Garlic, oil'],
    steps: [
      'Heat oil in pan on high heat.',
      'Add frozen veg — stir-fry until thawed and slightly charred (4 min).',
      'Push veg to the side, scramble eggs in the other half.',
      'Mix eggs and veg together, add rice, stir-fry 3 min.',
      'Splash in soy sauce, stir through. Serve.',
    ],
    nutrition: { cal: 400, protein: 20, carbs: 50, fat: 12 },
    tip: 'High heat is essential. The wok-style char on the veg makes this taste like a restaurant dish.',
  },
  {
    id: 'amasi-smoothie',
    name: 'Amasi Smoothie Bowl',
    icon: '🥛', cost: 'R12', costNum: 12, time: '3 min', timeMin: 3,
    difficulty: 'Easy', servings: 1, tags: ['Quick', 'Breakfast', 'No Cook', 'Protein'],
    desc: 'Amasi is South Africa\'s superfood — probiotic, high-protein, cheap. Blend with banana for breakfast.',
    ingredients: ['100ml amasi (R5)', '1 banana (R4)', '2 tbsp oats (R1)', 'Honey drizzle (R2)', 'Optional: berries'],
    steps: [
      'Put banana, amasi, and oats in a bowl or glass.',
      'Mash banana with a fork or blend with a hand blender.',
      'Stir everything together until smooth.',
      'Drizzle honey on top.',
      'Eat immediately or refrigerate 5 min.',
    ],
    nutrition: { cal: 220, protein: 8, carbs: 42, fat: 3 },
    tip: 'Amasi has live cultures that improve gut health. Your immune system will thank you during exam season.',
  },
  {
    id: 'mince-pap',
    name: 'Mince & Gravy Pap',
    icon: '🍖', cost: 'R45', costNum: 45, time: '30 min', timeMin: 30,
    difficulty: 'Medium', servings: 3, tags: ['Bulk Cook', 'Protein', 'SA Classic'],
    desc: 'The ultimate comfort meal. Cook once, eat twice. Gravy-soaked pap with spiced mince.',
    ingredients: ['500g beef mince (R35)', '2 cups maize meal (R5)', '1 onion (R4)', 'Brown onion soup mix (R3)', 'Salt, pepper, Worcestershire sauce'],
    steps: [
      'Brown mince in a dry pan, breaking up with a spoon (8 min).',
      'Add diced onion, cook 5 more minutes.',
      'Dissolve soup mix in 1 cup warm water, pour over mince.',
      'Simmer 10 minutes until gravy thickens. Season well.',
      'Make soft pap separately (2 cups maize meal in 4 cups water, 15 min).',
      'Serve mince and gravy poured over pap.',
    ],
    nutrition: { cal: 520, protein: 36, carbs: 48, fat: 20 },
    tip: 'Brown onion soup mix is the secret ingredient for rich gravy in under 15 minutes. Always keep a packet.',
  },
  {
    id: 'pap-morogo',
    name: 'Pap & Morogo (Spinach)',
    icon: '🌿', cost: 'R14', costNum: 14, time: '20 min', timeMin: 20,
    difficulty: 'Easy', servings: 2, tags: ['Budget', 'Veg', 'SA Classic'],
    desc: 'Traditional staple — cooked spinach (morogo) with stiff pap. Loaded with iron and calcium.',
    ingredients: ['2 cups maize meal (R5)', '1 bunch spinach or kale (R8)', 'Garlic ×2 cloves', 'Onion (R3)', 'Salt, oil'],
    steps: [
      'Make stiff pap: bring 3 cups salted water to boil, whisk in maize meal gradually.',
      'Cover and cook on very low heat for 15 min, stirring every 5 min.',
      'In a pan, fry onion until soft. Add garlic.',
      'Add washed, chopped spinach. Cook until wilted (3–4 min). Season.',
      'Serve pap topped with morogo.',
    ],
    nutrition: { cal: 310, protein: 9, carbs: 60, fat: 4 },
    tip: 'Tinned spinach works perfectly and is cheaper than fresh. Morogo is just the Setswana word for any leafy green.',
  },
  {
    id: 'campus-wrap',
    name: 'Budget Chicken Wrap',
    icon: '🌯', cost: 'R25', costNum: 25, time: '10 min', timeMin: 10,
    difficulty: 'Easy', servings: 1, tags: ['Quick', 'Protein'],
    desc: 'Rotisserie chicken + whatever\'s in the fridge + a tortilla or flatbread = best packed lunch.',
    ingredients: ['¼ rotisserie chicken (R20)', '1 large tortilla or flatbread (R4)', 'Lettuce, tomato', 'Mayo or chilli sauce', 'Cheese optional'],
    steps: [
      'Shred or chop chicken into small pieces.',
      'Lay tortilla flat, spread mayo down the middle.',
      'Layer chicken, lettuce, and sliced tomato.',
      'Add cheese if available.',
      'Fold in sides, roll tightly from bottom. Done.',
    ],
    nutrition: { cal: 480, protein: 38, carbs: 32, fat: 22 },
    tip: 'Buy a whole rotisserie chicken for R80–90 at Pick n Pay — makes 4 meals and costs less than buying parts separately.',
  },
  {
    id: 'sweet-potato-egg',
    name: 'Sweet Potato & Egg Hash',
    icon: '🍠', cost: 'R20', costNum: 20, time: '25 min', timeMin: 25,
    difficulty: 'Medium', servings: 2, tags: ['Budget', 'Protein', 'Veg'],
    desc: 'Sweet potato + eggs = slow-release carbs and protein. Keeps you full for 5+ hours during exam sessions.',
    ingredients: ['2 medium sweet potatoes (R12)', '3 eggs (R12)', 'Onion (R4)', 'Oil, cumin, paprika, salt'],
    steps: [
      'Dice sweet potato into small cubes.',
      'Heat oil in a wide pan, add sweet potato. Cook 10 min until soft, stirring often.',
      'Add diced onion, cook 5 more minutes until golden.',
      'Season with cumin, paprika, salt.',
      'Make 3 wells in the hash, crack an egg into each.',
      'Cover pan and cook 4–5 minutes until eggs are set to your liking.',
    ],
    nutrition: { cal: 380, protein: 18, carbs: 44, fat: 14 },
    tip: 'Sweet potato is one of the best exam-season foods — steady glucose release, no crash.',
  },
  {
    id: 'budget-bolognese',
    name: 'Budget Bolognese',
    icon: '🍝', cost: 'R50', costNum: 50, time: '30 min', timeMin: 30,
    difficulty: 'Medium', servings: 4, tags: ['Bulk Cook', 'Protein'],
    desc: 'Enough bolognese for 4 meals — R12.50 per meal. Freezes perfectly for the whole week.',
    ingredients: ['500g beef mince (R35)', '400g pasta (R12)', '2 tins chopped tomatoes (R16)', '1 onion (R4)', 'Garlic ×3 cloves', 'Italian herbs, salt, oil'],
    steps: [
      'Brown mince in a large pan, drain excess fat.',
      'Add diced onion and cook 5 min until soft.',
      'Add crushed garlic, cook 1 minute.',
      'Pour in tomatoes, add herbs. Simmer 20 minutes.',
      'Meanwhile, cook pasta as per packet.',
      'Season sauce well. Serve over pasta.',
    ],
    nutrition: { cal: 550, protein: 32, carbs: 62, fat: 18 },
    tip: 'Triple the sauce and freeze in zip-lock bags. Flat-freeze for efficient freezer storage.',
  },
  {
    id: 'banana-oat-pancakes',
    name: 'Banana Oat Pancakes',
    icon: '🥞', cost: 'R16', costNum: 16, time: '12 min', timeMin: 12,
    difficulty: 'Easy', servings: 2, tags: ['Breakfast', 'Budget', 'No Cook'],
    desc: '2 bananas + 2 eggs + ½ cup oats = pancakes. No flour, no sugar, no recipe needed.',
    ingredients: ['2 ripe bananas (R8)', '2 eggs (R8)', '½ cup oats (blended or as-is)', 'Oil for frying', 'Honey optional'],
    steps: [
      'Mash bananas very well in a bowl (or blend).',
      'Add eggs, beat into banana.',
      'Stir in oats (or blend for smoother texture).',
      'Heat oil in pan on medium heat.',
      'Pour small circles of batter, cook 2–3 min each side.',
      'Drizzle with honey.',
    ],
    nutrition: { cal: 280, protein: 12, carbs: 44, fat: 8 },
    tip: 'The riper the banana the sweeter the pancakes — use ones that are brown-spotted.',
  },
  {
    id: 'curry-chickpeas',
    name: 'Quick Chickpea Curry',
    icon: '🍛', cost: 'R22', costNum: 22, time: '20 min', timeMin: 20,
    difficulty: 'Easy', servings: 3, tags: ['Budget', 'Veg', 'Protein', 'Bulk Cook'],
    desc: 'Chickpeas are insane value — 30g protein per tin, costs R8, and absorbs curry flavour perfectly.',
    ingredients: ['2 tins chickpeas (R16)', '1 tin coconut milk or 1 tin tomatoes (R8)', 'Curry powder 2 tbsp', 'Onion (R4)', 'Garlic, ginger (R3)', 'Rice to serve'],
    steps: [
      'Fry onion in oil 5 min. Add garlic and ginger.',
      'Add curry powder, cook 1 minute until fragrant.',
      'Add drained chickpeas and coconut milk/tomatoes.',
      'Simmer 12–15 minutes until sauce thickens.',
      'Season with salt. Serve over rice with flatbread.',
    ],
    nutrition: { cal: 380, protein: 16, carbs: 52, fat: 12 },
    tip: 'Cape Malay curry is distinctly South African — use that seasoning for authenticity.',
  },
  {
    id: 'pot-noodle-upgrade',
    name: 'Upgraded Pot Noodle',
    icon: '🍜', cost: 'R15', costNum: 15, time: '5 min', timeMin: 5,
    difficulty: 'Easy', servings: 1, tags: ['Quick', 'Budget', 'No Cook'],
    desc: 'Take your R3.50 pot noodle from sad to actually good in 5 minutes with 2 eggs and leftover veg.',
    ingredients: ['1 packet instant noodles (R3.50)', '1–2 eggs', 'Any leftover veg', 'Soy sauce', 'Optional: chilli sauce, sesame oil'],
    steps: [
      'Cook noodles as per packet but use 30% less water than suggested for richer broth.',
      'While noodles cook, scramble or poach eggs separately.',
      'Add any leftover veg to the broth — frozen peas, shredded spinach, etc.',
      'Pour into bowl, top with egg.',
      'Add a splash of soy sauce and chilli for flavour depth.',
    ],
    nutrition: { cal: 320, protein: 16, carbs: 42, fat: 8 },
    tip: 'Halve the seasoning packet — it\'s extremely salty. Supplement with soy sauce and chilli for better flavour.',
  },
]

// ── Filter config ─────────────────────────────────────────────────────────────
const CATEGORIES: { id: Tag | 'All'; label: string; emoji: string }[] = [
  { id: 'All',       label: 'All',        emoji: '🍽️' },
  { id: 'Quick',     label: 'Quick',      emoji: '⚡' },
  { id: 'Budget',    label: 'Under R20',  emoji: '💸' },
  { id: 'Bulk Cook', label: 'Batch Cook', emoji: '📦' },
  { id: 'Protein',   label: 'High Protein', emoji: '💪' },
  { id: 'Veg',       label: 'Veg',        emoji: '🥦' },
  { id: 'Breakfast', label: 'Breakfast',  emoji: '🌅' },
  { id: 'SA Classic',label: 'SA Classic', emoji: '🇿🇦' },
]

const STYLE_ID = 'varsityos-recipes-styles'
function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = `
    @keyframes rt-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes rt-slide { from{transform:translateX(12px);opacity:0} to{transform:translateX(0);opacity:1} }
  `
  document.head.appendChild(el)
}

// ── Cooking mode modal ────────────────────────────────────────────────────────
function CookingMode({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const [step, setStep] = useState(0)
  const total = recipe.steps.length
  const done  = step >= total
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9800,
      background: 'rgba(4,6,18,0.97)', backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        maxWidth: 440, width: '100%', maxHeight: '85dvh', overflowY: 'auto',
        background: '#0d1225', borderRadius: 24, padding: '28px 26px',
        border: '1px solid rgba(255,255,255,0.08)',
        animation: 'rt-in 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#4ecf9e', letterSpacing: '0.18em' }}>
              COOKING MODE · {step < total ? `STEP ${step + 1} OF ${total}` : 'ALL DONE'}
            </div>
            <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 16, color: '#fff', marginTop: 2 }}>
              {recipe.name}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 18 }}>✕</button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.06)', marginBottom: 28, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 4, background: '#4ecf9e', width: `${(step / total) * 100}%`, transition: 'width 0.4s ease' }} />
        </div>

        {!done ? (
          <>
            <div style={{ display: 'flex', gap: 14, marginBottom: 28 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(78,207,158,0.15)', border: '1px solid rgba(78,207,158,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, fontSize: 14, color: '#4ecf9e',
              }}>
                {step + 1}
              </div>
              <div style={{
                fontFamily: 'Sora,sans-serif', fontSize: 16, color: '#fff', lineHeight: 1.65,
                animation: 'rt-slide 0.3s ease',
              }}>
                {recipe.steps[step]}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)} style={{
                  flex: 1, padding: '12px 0', borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.12)', background: 'transparent',
                  color: 'rgba(255,255,255,0.5)', fontFamily: 'Sora,sans-serif', fontSize: 13, cursor: 'pointer',
                }}>
                  ← Back
                </button>
              )}
              <button onClick={() => setStep(s => s + 1)} style={{
                flex: 2, padding: '12px 0', borderRadius: 12, border: 'none',
                background: '#4ecf9e', color: '#000',
                fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 14, cursor: 'pointer',
              }}>
                {step === total - 1 ? '✓ Done cooking' : 'Next step →'}
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 12 }}>🎉</div>
            <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 900, fontSize: 22, color: '#4ecf9e', marginBottom: 8 }}>
              Meal complete!
            </div>
            <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 24 }}>
              You cooked {recipe.name} for ~{recipe.cost}. Now log it in Nutrition →
            </div>
            {recipe.tip && (
              <div style={{
                padding: '12px 16px', borderRadius: 12,
                background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)',
                fontFamily: 'Sora,sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.55)',
                textAlign: 'left', marginBottom: 20, lineHeight: 1.6,
              }}>
                💡 {recipe.tip}
              </div>
            )}
            <button onClick={onClose} style={{
              width: '100%', padding: '13px 0', borderRadius: 12, border: 'none',
              background: '#4ecf9e', color: '#000',
              fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 14, cursor: 'pointer',
            }}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
interface Props {
  generatedRecipe?: {
    name: string; totalCost: number; costPerServing: number; prepTime: string; cookTime: string;
    difficulty: string; servings: number;
    ingredients: { item: string; amount: string; estimatedCost: number }[];
    steps: { step: number; instruction: string }[];
    tips: string[]; nutritionNote: string; canMakeAhead: boolean; storageTip: string;
  } | null
  onGoToAIPlanner?: () => void
  fmt?: { currencyShort: (n: number) => string }
}

export default function RecipesTab({ generatedRecipe, onGoToAIPlanner, fmt }: Props) {
  const [filter,    setFilter]    = useState<Tag | 'All'>('All')
  const [search,    setSearch]    = useState('')
  const [expanded,  setExpanded]  = useState<string | null>(null)
  const [cooking,   setCooking]   = useState<Recipe | null>(null)

  // Inject animation styles on client only
  if (typeof window !== 'undefined') injectStyles()

  const filtered = RECIPES.filter(r => {
    if (filter !== 'All' && !r.tags.includes(filter)) return false
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !r.desc.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const fmtCurrency = fmt?.currencyShort ?? ((n: number) => `R${n}`)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* AI generated recipe (if exists) */}
      {generatedRecipe && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(78,207,158,0.08) 0%, rgba(0,207,160,0.04) 100%)',
          border: '1px solid rgba(78,207,158,0.2)', borderRadius: 18, padding: '18px 20px',
          animation: 'rt-in 0.3s ease',
        }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: '#4ecf9e', letterSpacing: '0.18em', marginBottom: 4 }}>
            🤖 AI GENERATED FOR YOU
          </div>
          <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 900, fontSize: 18, color: '#fff', marginBottom: 8 }}>
            {generatedRecipe.name}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {[
              `${fmtCurrency(generatedRecipe.totalCost)} total`,
              `${fmtCurrency(generatedRecipe.costPerServing)}/serving`,
              `⏱ ${generatedRecipe.cookTime}`,
              generatedRecipe.difficulty,
              `🍽 ${generatedRecipe.servings} servings`,
            ].map(chip => (
              <span key={chip} style={{
                fontFamily: '"JetBrains Mono",monospace', fontSize: 9, padding: '4px 10px',
                background: 'rgba(78,207,158,0.1)', border: '1px solid rgba(78,207,158,0.2)',
                borderRadius: 20, color: '#4ecf9e',
              }}>{chip}</span>
            ))}
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: 'rgba(255,255,255,0.3)', marginBottom: 8, letterSpacing: '0.14em' }}>INGREDIENTS</div>
            {generatedRecipe.ingredients.map((ing, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ flex: 1, fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{ing.item}</span>
                <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{ing.amount}</span>
                <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#4ecf9e' }}>{fmtCurrency(ing.estimatedCost)}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: 'rgba(255,255,255,0.3)', marginBottom: 8, letterSpacing: '0.14em' }}>STEPS</div>
            {generatedRecipe.steps.map(s => (
              <div key={s.step} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(78,207,158,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: '"JetBrains Mono",monospace', fontSize: 10, fontWeight: 700, color: '#4ecf9e',
                }}>{s.step}</div>
                <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.65 }}>{s.instruction}</div>
              </div>
            ))}
          </div>
          {generatedRecipe.storageTip && (
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
              🥡 {generatedRecipe.storageTip}
            </div>
          )}
        </div>
      )}

      {/* Section header */}
      <div>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.18em', marginBottom: 10 }}>
          📖 RECIPE LIBRARY — {RECIPES.length} SA STUDENT RECIPES
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search recipes..."
          style={{
            width: '100%', padding: '10px 14px', marginBottom: 10,
            fontFamily: 'DM Sans,sans-serif', fontSize: 13,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, color: '#fff', outline: 'none', boxSizing: 'border-box',
          }}
        />

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id as Tag | 'All')}
              style={{
                padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontFamily: '"JetBrains Mono",monospace', fontSize: 9, fontWeight: 700,
                background: filter === cat.id ? '#e8834a' : 'rgba(255,255,255,0.06)',
                color: filter === cat.id ? '#000' : 'rgba(255,255,255,0.45)',
                transition: 'all 0.15s',
              }}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Recipe count */}
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(255,255,255,0.25)', marginBottom: 10 }}>
          {filtered.length} recipe{filtered.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Recipe cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(recipe => {
          const isOpen = expanded === recipe.id
          return (
            <div
              key={recipe.id}
              style={{
                background: 'rgba(255,255,255,0.03)', border: `1px solid ${isOpen ? 'rgba(232,131,74,0.35)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 16, overflow: 'hidden', transition: 'border-color 0.2s',
              }}
            >
              {/* Card header */}
              <button
                onClick={() => setExpanded(isOpen ? null : recipe.id)}
                style={{
                  width: '100%', padding: '14px 16px', background: 'transparent',
                  border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', gap: 12, alignItems: 'flex-start',
                }}
              >
                <span style={{ fontSize: 24, flexShrink: 0 }}>{recipe.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, color: '#fff' }}>{recipe.name}</span>
                    {recipe.tags.slice(0, 2).map(tag => (
                      <span key={tag} style={{
                        fontFamily: '"JetBrains Mono",monospace', fontSize: 7.5, padding: '2px 7px', borderRadius: 10,
                        background: 'rgba(232,131,74,0.12)', color: '#e8834a', border: '1px solid rgba(232,131,74,0.2)',
                      }}>{tag}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#4ecf9e', fontWeight: 700 }}>{recipe.cost}</span>
                    <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>⏱ {recipe.time}</span>
                    <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>🍽 {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}</span>
                    <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(255,255,255,0.25)', marginLeft: 'auto' }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>
              </button>

              {/* Expanded content */}
              {isOpen && (
                <div style={{ padding: '0 16px 16px', animation: 'rt-in 0.25s ease' }}>
                  <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 14, lineHeight: 1.6 }}>
                    {recipe.desc}
                  </div>

                  {/* Nutrition bar */}
                  <div style={{
                    display: 'flex', gap: 12, padding: '8px 12px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.04)', marginBottom: 14, flexWrap: 'wrap',
                  }}>
                    <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#f59e0b' }}>🔥 {recipe.nutrition.cal} kcal</span>
                    <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#FB7185' }}>P {recipe.nutrition.protein}g</span>
                    <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#f59e0b' }}>C {recipe.nutrition.carbs}g</span>
                    <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#818CF8' }}>F {recipe.nutrition.fat}g</span>
                    <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>per serving</span>
                  </div>

                  {/* Ingredients */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.14em', marginBottom: 6 }}>INGREDIENTS</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {recipe.ingredients.map((ing, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#e8834a', flexShrink: 0 }} />
                          <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{ing}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {recipe.tip && (
                    <div style={{
                      padding: '10px 14px', borderRadius: 10, marginBottom: 14,
                      background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)',
                    }}>
                      <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#f59e0b' }}>💡 </span>
                      <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{recipe.tip}</span>
                    </div>
                  )}

                  {/* Cook button */}
                  <button
                    onClick={() => setCooking(recipe)}
                    style={{
                      width: '100%', padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg, #e8834a, #f59e0b)',
                      color: '#000', fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 14,
                    }}
                  >
                    👨‍🍳 Start cooking — step by step
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Generate AI recipe CTA */}
      {!generatedRecipe && onGoToAIPlanner && (
        <button
          onClick={onGoToAIPlanner}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 14, border: '1px solid rgba(78,207,158,0.25)',
            background: 'rgba(78,207,158,0.06)', color: '#4ecf9e',
            fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}
        >
          🤖 Generate a personalised recipe from your ingredients →
        </button>
      )}

      {/* Cooking mode modal */}
      {cooking && <CookingMode recipe={cooking} onClose={() => setCooking(null)} />}
    </div>
  )
}
