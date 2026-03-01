// ============================================================
// Campus Compass — Shared Data Layer + Utilities
// ============================================================

const OPENAI_KEY = ''; // Set your OPENAI_API_KEY here

// ── Storage ──────────────────────────────────────────────────
const DB = {
  get:  (k, d=null) => { try { const v=localStorage.getItem(`cc_${k}`); return v?JSON.parse(v):d; } catch { return d; } },
  set:  (k, v)      => { try { localStorage.setItem(`cc_${k}`,JSON.stringify(v)); return true; } catch { return false; } },
  del:  (k)         => localStorage.removeItem(`cc_${k}`),
};

// ── ID ────────────────────────────────────────────────────────
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,5);

// ── Date helpers ──────────────────────────────────────────────
const fmt = {
  date:     d => new Date(d).toLocaleDateString('en-ZA',{day:'numeric',month:'short',year:'numeric'}),
  dateShort:d => new Date(d).toLocaleDateString('en-ZA',{day:'numeric',month:'short'}),
  day:      d => new Date(d).toLocaleDateString('en-ZA',{weekday:'long'}),
  currency: n => `R${Number(n).toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2})}`,
  pct:      (n,t) => t>0 ? Math.min(100,Math.round((n/t)*100)) : 0,
};

// ── Student Profile ───────────────────────────────────────────
const Profile = {
  get:     () => DB.get('profile'),
  set:     v  => DB.set('profile',v),
  isSetup: () => !!DB.get('profile'),
};

// ── Modules ───────────────────────────────────────────────────

// STUDY PLANNER
const Study = {
  modules:  () => DB.get('study_modules',[]),
  tasks:    () => DB.get('study_tasks',[]),
  setModules: v => DB.set('study_modules',v),
  setTasks:   v => DB.set('study_tasks',v),
  addTask: task => {
    const list = Study.tasks();
    const item = { id:uid(), ...task, done:false, createdAt:new Date().toISOString() };
    list.push(item); Study.setTasks(list); return item;
  },
  toggleTask: id => {
    Study.setTasks(Study.tasks().map(t => t.id===id ? {...t,done:!t.done} : t));
  },
  removeTask: id => Study.setTasks(Study.tasks().filter(t=>t.id!==id)),
  upcomingDeadlines: () => {
    const now = new Date();
    return Study.tasks()
      .filter(t => !t.done && t.dueDate && new Date(t.dueDate) >= now)
      .sort((a,b) => new Date(a.dueDate)-new Date(b.dueDate))
      .slice(0,3);
  },
};

// BUDGET TRACKER
const Budget = {
  get:        () => DB.get('budget',{ monthly:0, nsfas:false, nsfasAmount:0, spent:[] }),
  set:        v  => DB.set('budget',v),
  addExpense: (exp) => {
    const b = Budget.get();
    b.spent.push({ id:uid(), ...exp, date:exp.date||new Date().toISOString().split('T')[0] });
    Budget.set(b); return b;
  },
  removeExpense: id => {
    const b = Budget.get();
    b.spent = b.spent.filter(e=>e.id!==id);
    Budget.set(b);
  },
  totalSpent:  () => Budget.get().spent.reduce((s,e)=>s+Number(e.amount),0),
  remaining:   () => {
    const b = Budget.get();
    const monthly = Number(b.monthly) + (b.nsfas ? Number(b.nsfasAmount)||0 : 0);
    return monthly - Budget.totalSpent();
  },
  categories: ['Food','Transport','Data','Stationery','Accommodation','Entertainment','Health','Other'],
};

// MEAL PREP
const Meals = {
  plan:    () => DB.get('meal_plan',[]),
  setPlan: v  => DB.set('meal_plan',v),
  addMeal: meal => {
    const plan = Meals.plan();
    const item = { id:uid(), ...meal };
    plan.push(item); Meals.setPlan(plan); return item;
  },
  removeMeal: id => Meals.setPlan(Meals.plan().filter(m=>m.id!==id)),
  groceryList: () => DB.get('grocery_list',[]),
  setGrocery:  v  => DB.set('grocery_list',v),
  addGroceryItem: item => {
    const list = Meals.groceryList();
    list.push({ id:uid(), ...item, checked:false });
    Meals.setGrocery(list);
  },
  toggleGrocery: id => {
    Meals.setGrocery(Meals.groceryList().map(g=>g.id===id?{...g,checked:!g.checked}:g));
  },
};

// NOVA CHAT
const Nova = {
  history: () => DB.get('nova_history',[]),
  addMsg: msg => {
    const h = Nova.history();
    h.push({ id:uid(), ...msg, ts:new Date().toISOString() });
    // keep last 50 messages
    if (h.length>50) h.splice(0, h.length-50);
    DB.set('nova_history',h);
  },
  clearHistory: () => DB.del('nova_history'),
};

// ── AI Call ───────────────────────────────────────────────────
async function callAI(system, user, max=350) {
  if (!OPENAI_KEY) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${OPENAI_KEY}`},
      body:JSON.stringify({
        model:'gpt-4o-mini', max_tokens:max,
        messages:[{role:'system',content:system},{role:'user',content:user}],
      }),
    });
    const j = await res.json();
    return j.choices?.[0]?.message?.content?.trim()||null;
  } catch { return null; }
}

async function callAIConversation(system, messages, max=400) {
  if (!OPENAI_KEY) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${OPENAI_KEY}`},
      body:JSON.stringify({
        model:'gpt-4o-mini', max_tokens:max,
        messages:[{role:'system',content:system},...messages],
      }),
    });
    const j = await res.json();
    return j.choices?.[0]?.message?.content?.trim()||null;
  } catch { return null; }
}

// ── SA Universities ───────────────────────────────────────────
const SA_UNIS = [
  'University of Cape Town (UCT)',
  'University of the Witwatersrand (Wits)',
  'University of Pretoria (UP)',
  'Stellenbosch University (SU)',
  'University of KwaZulu-Natal (UKZN)',
  'University of Johannesburg (UJ)',
  'University of the Western Cape (UWC)',
  'Nelson Mandela University (NMU)',
  'University of Fort Hare (UFH)',
  'Walter Sisulu University (WSU)',
  'University of Limpopo (UL)',
  'University of Venda (UNIVEN)',
  'University of Zululand (UNIZULU)',
  'Sol Plaatje University (SPU)',
  'Sefako Makgatho Health Sciences (SMU)',
  'North-West University (NWU)',
  'University of the Free State (UFS)',
  'UNISA (Distance Learning)',
  'Durban University of Technology (DUT)',
  'Cape Peninsula University of Technology (CPUT)',
  'Tshwane University of Technology (TUT)',
  'Vaal University of Technology (VUT)',
  'Central University of Technology (CUT)',
  'Mangosuthu University of Technology (MUT)',
  'Rhodes University',
  'Other / TVET College',
];

// ── Drawer ────────────────────────────────────────────────────
function renderDrawer(activePage) {
  const profile = Profile.get();
  const name  = profile?.name  || 'Student';
  const uni   = profile?.uni   || 'University';
  const emoji = profile?.emoji || '🎓';

  return `
  <div class="drawer-overlay" id="drawer-overlay" onclick="closeDrawer()"></div>
  <nav class="drawer" id="drawer">
    <div class="drawer-header">
      <div class="drawer-logo">
        <div class="drawer-logo-mark">🧭</div>
        <div>
          <div class="drawer-logo-text">Campus Compass</div>
          <div class="drawer-logo-sub">Your varsity OS</div>
        </div>
      </div>
      <div class="drawer-student">
        <div class="drawer-avatar">${emoji}</div>
        <div>
          <div class="drawer-student-name">${name}</div>
          <div class="drawer-student-uni">${uni.split('(')[0].trim()}</div>
        </div>
      </div>
    </div>

    <nav class="drawer-nav">
      <div class="drawer-section-label">Home</div>
      <a href="index.html"  class="drawer-link ${activePage==='home'  ?'active':''}">
        <span class="drawer-link-icon">🏠</span> Dashboard
      </a>

      <div class="drawer-section-label">Modules</div>
      <a href="study.html"  class="drawer-link ${activePage==='study' ?'active':''}">
        <span class="drawer-link-icon">📚</span> Study Planner
      </a>
      <a href="budget.html" class="drawer-link ${activePage==='budget'?'active':''}">
        <span class="drawer-link-icon">💰</span> Budget & NSFAS
      </a>
      <a href="meals.html"  class="drawer-link ${activePage==='meals' ?'active':''}">
        <span class="drawer-link-icon">🍲</span> Meal Prep
      </a>
      <a href="nova.html"   class="drawer-link ${activePage==='nova'  ?'active':''}">
        <span class="drawer-link-icon">🌟</span> Nova — AI Companion
      </a>

      <div class="drawer-section-label">Account</div>
      <a href="setup.html"  class="drawer-link">
        <span class="drawer-link-icon">⚙️</span> Settings
      </a>
    </nav>

    <div class="drawer-footer">
      <p>Campus Compass v1<br/>
      Built by <a href="https://creativelynanda.co.za" target="_blank">Nanda Regine</a><br/>
      Mirembe Muse (Pty) Ltd · <a href="https://mirembemuse.co.za" target="_blank">mirembemuse.co.za</a></p>
    </div>
  </nav>`;
}

function openDrawer() {
  document.getElementById('drawer')?.classList.add('open');
  document.getElementById('drawer-overlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  document.getElementById('drawer')?.classList.remove('open');
  document.getElementById('drawer-overlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

// ── Require setup ─────────────────────────────────────────────
function requireSetup() {
  if (!Profile.isSetup() && !window.location.pathname.includes('setup')) {
    window.location.href = 'setup.html';
  }
}

// ── Greeting ──────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── Load shedding (mock - would use EskomSePush API) ──────────
function getLoadsheddingStatus() {
  // Mock data — integrate EskomSePush API in production
  const stages = ['No load shedding', 'Stage 2', 'Stage 4', 'No load shedding'];
  const times  = ['', '10:00 – 12:30 & 22:00 – 00:30', '08:00 – 10:30 & 16:00 – 18:30', ''];
  const idx = new Date().getDay() % 4;
  return { stage: stages[idx], time: times[idx], active: idx > 0 };
}

// ── Toast ─────────────────────────────────────────────────────
function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('show'), 10);
  setTimeout(() => { el.classList.remove('show'); setTimeout(()=>el.remove(),300); }, 3000);
}

// ── Modal helpers ─────────────────────────────────────────────
function openModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.style.display = 'flex';
  setTimeout(() => m.classList.add('show'), 10);
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.remove('show');
  document.body.style.overflow = '';
  setTimeout(() => m.style.display='none', 250);
}
