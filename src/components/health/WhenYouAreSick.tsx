'use client'
// ─── When You're Sick ─────────────────────────────────────────
// Tabs: Symptoms · Home Remedies · Clinic Finder · Prescriptions · Women's Health · Medical Science
import { useState } from 'react'
import { sastToday } from '@/lib/utils'

type Tab = 'symptoms'|'remedies'|'clinics'|'prescriptions'|'womens'|'science'
const TABS: {id:Tab;label:string;icon:string}[] = [
  {id:'symptoms',    label:'Symptoms',    icon:'🌡️'},
  {id:'remedies',    label:'Remedies',    icon:'🍵'},
  {id:'clinics',     label:'Clinics',     icon:'🏥'},
  {id:'prescriptions',label:'Meds',       icon:'💊'},
  {id:'womens',      label:"Women's",     icon:'💜'},
  {id:'science',     label:'Body Science',icon:'🔬'},
]

const SYMPTOMS: {name:string;possible:string;action:string;urgent:boolean}[] = [
  {name:'High fever (>38.5°C)',possible:'Flu, COVID, infection',action:'Rest, paracetamol, fluids. Seek care if >39°C or 48h+',urgent:true},
  {name:'Sore throat',possible:'Viral or bacterial infection',action:'Salt-water gargle, rooibos with honey, throat lozenges',urgent:false},
  {name:'Severe headache',possible:'Tension, dehydration, migraine',action:'Hydrate, rest in dark room, paracetamol. Stiff neck = go to ER',urgent:true},
  {name:'Stomach pain / nausea',possible:'Food poisoning, gastro',action:'BRAT diet (banana, rice, applesauce, toast), ORS rehydration',urgent:false},
  {name:'Chest pain / difficulty breathing',possible:'Cardiac, asthma, anxiety',action:'Go to emergency immediately — do not wait',urgent:true},
  {name:'Persistent cough (>2 weeks)',possible:'Possible TB exposure',action:'Get tested at campus clinic — TB is curable when caught early',urgent:true},
  {name:'Dizziness / fainting',possible:'Low blood pressure, anaemia',action:'Lie down, hydrate, eat something. Recurring = see a doctor',urgent:false},
  {name:'Skin rash',possible:'Allergy, heat rash, infection',action:'Cool compress, calamine. Spreading/painful rash = seek care',urgent:false},
  {name:'UTI symptoms',possible:'Urinary tract infection',action:'Drink plenty of water. UTIs do not clear without antibiotics — see clinic',urgent:false},
  {name:'Eye redness / discharge',possible:'Conjunctivitis (pink eye)',action:'Wash hands, do not share towels. Bacterial = needs antibiotic drops',urgent:false},
]

const REMEDIES: {ailment:string;remedy:string;ingredients:string;notes:string;warning?:string}[] = [
  {ailment:'Sore throat',remedy:'Rooibos & honey',ingredients:'1 cup rooibos, 1 tsp raw honey, squeeze of lemon',notes:'Rooibos has anti-inflammatory antioxidants (aspalathin, nothofagin). Honey has natural antimicrobial properties. Add a pinch of ginger for extra effect.'},
  {ailment:'Cold & flu',remedy:'Ginger steam & tea',ingredients:'2cm fresh ginger, boiled water, honey',notes:'Inhale steam for 10 min (towel over head) — loosens mucus. Ginger contains gingerols which reduce inflammation. Drink the tea after.'},
  {ailment:'Headache',remedy:'Hydration + cold compress',ingredients:'2–3 glasses of water, cold cloth for forehead',notes:'80% of headaches are dehydration-related. Drink water first — always. A cold compress constricts blood vessels and reduces tension headaches. Only reach for paracetamol if no improvement after 30 min.'},
  {ailment:'Gastro / vomiting / diarrhoea',remedy:'ORS — Oral Rehydration Solution',ingredients:'1 litre clean water, 6 level teaspoons sugar, 1/2 teaspoon salt',notes:'This is the WHO formula. It saves lives. Gastro kills through dehydration, not the bug itself. Sip 200ml every hour. Vomiting? Sip 1 teaspoon every 2–3 minutes. Buy pharmacy sachets (Rehidrat) or make it at home. The BRAT diet (banana, rice, applesauce, toast) helps settle the gut.', warning:'Seek care if you cannot keep fluids down after 6 hours, see blood in stool, or have a fever above 39°C.'},
  {ailment:'Nausea',remedy:'Ginger water or pressure point',ingredients:'1 tsp grated ginger, warm water; or: P6 acupressure point (inner wrist)',notes:'Ginger: sip slowly. P6 point: press firmly 3 finger-widths below wrist crease for 2 min each side. This is evidence-backed for nausea and is used in oncology.'},
  {ailment:'Blocked nose',remedy:'Saline rinse',ingredients:'1/4 tsp non-iodised salt, 1 cup warm water',notes:'Sniff gently into one nostril, tilt head. Clears mucus, reduces swelling, and helps flush out viral particles. More effective than decongestant sprays for long-term use. Decongestant sprays (Otrivin) are addictive if used more than 3 days.'},
  {ailment:'Stomach cramps',remedy:'Peppermint tea',ingredients:'Peppermint tea bag or fresh mint, hot water',notes:'Peppermint relaxes smooth muscle in the gut (antispasmodic). Avoid for GERD or acid reflux. Let cool slightly before drinking. A hot water bottle on your abdomen also helps.'},
  {ailment:'Insomnia (exam stress)',remedy:'Chamomile tea + 4-7-8 breathing',ingredients:'Chamomile tea bag, hot water',notes:'Chamomile contains apigenin which binds GABA receptors — the same receptors as sleeping pills, but mildly. Drink 30 min before bed. Then: inhale 4 seconds, hold 7 seconds, exhale 8 seconds. Repeat 4 cycles. This activates the parasympathetic nervous system.'},
  {ailment:'Minor cuts / scrapes',remedy:'Saline clean + aloe vera',ingredients:'Salt water, aloe vera gel (from plant or pharmacy)',notes:'Clean with saline before anything else. Aloe vera reduces bacterial load and inflammation. Do NOT use Dettol on open wounds — it kills healing cells. If the cut needs stitches (gaping, deep, won\'t stop bleeding in 10 min), go to a clinic.'},
  {ailment:'Mouth ulcers',remedy:'Salt water rinse + honey',ingredients:'1/2 tsp salt, 1 cup warm water; raw honey',notes:'Salt water (antimicrobial) rinse 3× daily. Dab pure honey directly on the ulcer. Ulcers heal in 7–10 days. Caused by stress, biting your cheek, vitamin deficiency (B12, folate, iron). Persistent ulcers after 2 weeks = see a doctor.'},
  {ailment:'Sunburn',remedy:'Aloe vera + cold water',ingredients:'Aloe vera gel (chilled), cool water, paracetamol',notes:'Cool compress first — do NOT apply butter, oil, or toothpaste. Aloe reduces inflammation. Stay out of the sun. Paracetamol helps the pain. SA sun is intense — SPF50 is not optional for any skin tone.'},
  {ailment:'Period pain',remedy:'Heat + ibuprofen timing',ingredients:'Hot water bottle, ibuprofen 400mg',notes:'Take ibuprofen at the FIRST sign of pain — before it peaks. Heat relaxes uterine muscle contractions. Ginger tea also has evidence for reducing dysmenorrhea. If you need stronger pain relief or the pain is debilitating every month, ask your doctor about endometriosis or the pill.'},
]

const DRUG_SAFETY = [
  {drug:'Paracetamol (Panado)',dose:'500–1000mg, max 4×/day',warning:'NEVER take with alcohol — causes silent liver damage. Space doses at least 4–6 hours apart. It\'s in cold medicines too (Corenza, NightNurse) — check labels to avoid double dosing.'},
  {drug:'Ibuprofen (Nurofen/Brufen)',dose:'200–400mg, max 3×/day with food',warning:'Take WITH food to protect your stomach. Avoid if you have ulcers, kidney problems, or are dehydrated. Do NOT take if you have asthma unless your doctor said it\'s safe.'},
  {drug:'Antihistamines (Cetirizine/Loratadine)',dose:'10mg once daily',warning:'Non-drowsy: cetirizine or loratadine. Drowsy versions (Phenergan, Benadryl) — do not drive or study on them. Antihistamines do not help colds — they only help allergies.'},
  {drug:'Antacids (Gaviscon, Rennie)',dose:'As directed on pack',warning:'Safe for short-term use. Persistent heartburn (more than 2 weeks) needs a doctor visit — it could be H. pylori or GERD.'},
  {drug:'Generics vs branded meds',dose:'Same active ingredient',warning:'Generic = same medicine. Paracetamol is identical to Panado. Ciprofloxacin is identical to Cipro. By law they must have the same bioavailability. Generics cost 50–80% less at pharmacies. Always ask the pharmacist for the generic version.'},
]

const CLINICS: {institution:string;name:string;hours:string;free:boolean;services:string}[] = [
  {institution:'UCT',name:'Student Wellness Service',hours:'Mon–Fri 08:00–16:30',free:true,services:'GP, psych, physio, contraception, HIV testing'},
  {institution:'Wits',name:'Campus Health & Wellness',hours:'Mon–Fri 08:00–16:00',free:true,services:'GP, mental health, sexual health'},
  {institution:'UP',name:'Department of Student Health',hours:'Mon–Fri 07:30–16:00',free:true,services:'GP, nursing, TB screening, dental referrals'},
  {institution:'UJ',name:'Student Health & Wellness',hours:'Mon–Fri 08:00–15:30',free:true,services:'GP, psychology, social work'},
  {institution:'UKZN',name:'Student Health Service',hours:'Mon–Fri 08:00–16:00',free:true,services:'GP, sexual health, TB, mental health'},
  {institution:'SU',name:'Tygerberg/Stellenbosch clinic',hours:'Mon–Fri 08:00–16:30',free:true,services:'GP, reproductive health, HIV testing'},
  {institution:'NMU',name:'Student Health Centre',hours:'Mon–Fri 07:30–16:00',free:true,services:'GP, nursing, HIV testing'},
  {institution:'All',name:'Day Hospital (free — any SA resident)',hours:'Mon–Sun 07:00–19:00',free:true,services:'Emergency + general GP (bring ID)'},
  {institution:'All',name:'Government Hospital',hours:'24/7',free:true,services:'Emergency, all specialties (bring ID/clinic card)'},
]

interface RxEntry {id:number;name:string;dose:string;frequency:string;nextRefill:string;instructions:string}

function SymptomsTab() {
  const [selected,setSelected] = useState<number|null>(null)
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <div style={{padding:'10px 14px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:10,fontSize:'0.7rem',color:'var(--text-secondary)',lineHeight:1.6}}>
        ⚠️ This is a guide, not a diagnosis. For emergencies call 10177 (ambulance) or go to your nearest ER.
      </div>
      {SYMPTOMS.map((s,i)=>(
        <div key={i} style={{background:'var(--bg-surface)',border:`1px solid ${s.urgent?'rgba(239,68,68,0.25)':'var(--border-subtle)'}`,borderRadius:12,overflow:'hidden'}}>
          <button onClick={()=>setSelected(selected===i?null:i)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',padding:'12px 14px',background:'none',border:'none',cursor:'pointer',textAlign:'left',gap:10}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              {s.urgent&&<span style={{fontSize:'0.6rem',padding:'1px 6px',background:'rgba(239,68,68,0.12)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:100,color:'var(--danger)',fontFamily:'var(--font-mono)',fontWeight:700}}>URGENT</span>}
              <span style={{fontSize:'0.84rem',fontWeight:600,color:'var(--text-primary)'}}>{s.name}</span>
            </div>
            <span style={{fontSize:'0.6rem',color:'var(--text-muted)',transform:selected===i?'rotate(180deg)':'none',transition:'transform 0.2s'}}>▾</span>
          </button>
          {selected===i&&(
            <div style={{padding:'0 14px 14px',display:'flex',flexDirection:'column',gap:8}}>
              <div style={{fontSize:'0.72rem',color:'var(--text-tertiary)'}}>Possible causes: <span style={{color:'var(--text-secondary)'}}>{s.possible}</span></div>
              <div style={{padding:'10px 12px',background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.2)',borderRadius:8,fontSize:'0.75rem',color:'var(--text-secondary)',lineHeight:1.6}}>
                💚 {s.action}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function RemediesTab() {
  const [open,setOpen]=useState<number|null>(null)
  const [drugOpen,setDrugOpen]=useState<number|null>(null)
  const [section,setSection]=useState<'remedies'|'drugs'>('remedies')
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <div style={{display:'flex',gap:0,borderBottom:'1px solid var(--border-subtle)',marginBottom:4}}>
        {(['remedies','drugs'] as const).map(s=>(
          <button key={s} onClick={()=>setSection(s)} style={{flex:1,padding:'8px 0',background:'none',border:'none',borderBottom:section===s?'2px solid var(--teal)':'2px solid transparent',color:section===s?'var(--teal)':'var(--text-tertiary)',fontSize:'0.72rem',fontFamily:'var(--font-mono)',fontWeight:section===s?700:400,cursor:'pointer',marginBottom:-1}}>
            {s==='remedies'?'🍵 Home Remedies':'💊 Drug Safety'}
          </button>
        ))}
      </div>

      {section==='remedies'&&(
        <>
          <div style={{padding:'10px 14px',background:'var(--gold-dim)',border:'1px solid var(--gold-border)',borderRadius:10,fontSize:'0.7rem',color:'var(--text-secondary)',lineHeight:1.6}}>
            🍵 SA home remedies backed by science. These support recovery — they don't replace medication for serious conditions.
          </div>
          {REMEDIES.map((r,i)=>(
            <div key={i} style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderLeft:'3px solid var(--teal)',borderRadius:12,overflow:'hidden'}}>
              <button onClick={()=>setOpen(open===i?null:i)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',padding:'12px 14px',background:'none',border:'none',cursor:'pointer',textAlign:'left'}}>
                <div>
                  <div style={{fontSize:'0.65rem',color:'var(--text-muted)',marginBottom:2}}>{r.ailment}</div>
                  <div style={{fontSize:'0.84rem',fontWeight:600,color:'var(--text-primary)'}}>{r.remedy}</div>
                </div>
                <span style={{fontSize:'0.6rem',color:'var(--text-muted)',transform:open===i?'rotate(180deg)':'none',transition:'transform 0.2s'}}>▾</span>
              </button>
              {open===i&&(
                <div style={{padding:'0 14px 14px',display:'flex',flexDirection:'column',gap:8}}>
                  <div style={{fontSize:'0.72rem',color:'var(--text-secondary)'}}>📦 <strong>What you need:</strong> {r.ingredients}</div>
                  <div style={{fontSize:'0.72rem',color:'var(--text-secondary)',lineHeight:1.7}}>🔬 {r.notes}</div>
                  {r.warning&&<div style={{padding:'8px 10px',background:'rgba(239,68,68,0.07)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,fontSize:'0.7rem',color:'var(--danger)',lineHeight:1.6}}>⚠️ {r.warning}</div>}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {section==='drugs'&&(
        <>
          <div style={{padding:'10px 14px',background:'rgba(239,68,68,0.07)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:10,fontSize:'0.7rem',color:'var(--text-secondary)',lineHeight:1.6}}>
            💊 Know what you're taking. Generic meds are identical to branded — and 50–80% cheaper.
          </div>
          {DRUG_SAFETY.map((d,i)=>(
            <div key={i} style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderLeft:'3px solid var(--rose)',borderRadius:12,overflow:'hidden'}}>
              <button onClick={()=>setDrugOpen(drugOpen===i?null:i)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',padding:'12px 14px',background:'none',border:'none',cursor:'pointer',textAlign:'left'}}>
                <div>
                  <div style={{fontSize:'0.84rem',fontWeight:600,color:'var(--text-primary)'}}>{d.drug}</div>
                  <div style={{fontSize:'0.65rem',color:'var(--text-muted)',marginTop:2}}>Dose: {d.dose}</div>
                </div>
                <span style={{fontSize:'0.6rem',color:'var(--text-muted)',transform:drugOpen===i?'rotate(180deg)':'none',transition:'transform 0.2s'}}>▾</span>
              </button>
              {drugOpen===i&&(
                <div style={{padding:'0 14px 14px'}}>
                  <div style={{padding:'8px 10px',background:'rgba(239,68,68,0.07)',border:'1px solid rgba(239,68,68,0.18)',borderRadius:8,fontSize:'0.72rem',color:'var(--text-secondary)',lineHeight:1.7}}>⚠️ {d.warning}</div>
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  )
}

function ClinicsTab({university}:{university:string}) {
  const uniLower = university.toLowerCase()
  const relevant = CLINICS.filter(c=>c.institution==='All'||uniLower.includes(c.institution.toLowerCase()))
  const others   = CLINICS.filter(c=>c.institution!=='All'&&!uniLower.includes(c.institution.toLowerCase()))
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      {relevant.length>0&&(
        <div>
          <div style={{fontSize:'0.62rem',fontFamily:'var(--font-mono)',color:'var(--text-muted)',letterSpacing:'0.07em',marginBottom:8}}>YOUR CAMPUS</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {relevant.map((c,i)=>(
              <div key={i} style={{background:'var(--bg-surface)',border:'1px solid rgba(52,211,153,0.2)',borderRadius:12,padding:'12px 14px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
                  <div style={{fontSize:'0.84rem',fontWeight:600,color:'var(--text-primary)'}}>{c.name}</div>
                  {c.free&&<span style={{fontSize:'0.6rem',padding:'1px 7px',background:'rgba(52,211,153,0.1)',border:'1px solid rgba(52,211,153,0.25)',borderRadius:100,color:'var(--teal)',fontFamily:'var(--font-mono)',fontWeight:700}}>FREE</span>}
                </div>
                <div style={{fontSize:'0.68rem',color:'var(--text-tertiary)',marginBottom:4}}>🕐 {c.hours}</div>
                <div style={{fontSize:'0.7rem',color:'var(--text-secondary)'}}>{c.services}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div>
        <div style={{fontSize:'0.62rem',fontFamily:'var(--font-mono)',color:'var(--text-muted)',letterSpacing:'0.07em',marginBottom:8}}>OTHER INSTITUTIONS</div>
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          {others.slice(0,4).map((c,i)=>(
            <div key={i} style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:10,padding:'10px 12px'}}>
              <div style={{fontSize:'0.75rem',fontWeight:600,color:'var(--text-primary)'}}>{c.institution} — {c.name}</div>
              <div style={{fontSize:'0.65rem',color:'var(--text-tertiary)',marginTop:2}}>{c.hours}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:12,padding:'12px 14px'}}>
        <div style={{fontSize:'0.7rem',fontWeight:700,color:'var(--text-primary)',marginBottom:6}}>Free 24/7 health lines</div>
        {[{name:'Emergency Ambulance',num:'10177'},{name:'Netcare 911',num:'082 911'},{name:'ER24',num:'084 124'},{name:'Poison Centre',num:'0861 555 777'}].map(l=>(
          <a key={l.name} href={`tel:${l.num.replace(/\s/g,'')}`} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',textDecoration:'none'}}>
            <span style={{fontSize:'0.75rem',color:'var(--text-secondary)'}}>{l.name}</span>
            <span style={{fontSize:'0.75rem',fontFamily:'var(--font-mono)',fontWeight:700,color:'var(--teal)'}}>{l.num}</span>
          </a>
        ))}
      </div>
    </div>
  )
}

function PrescriptionsTab() {
  const [meds,setMeds] = useState<RxEntry[]>(()=>{
    if(typeof window==='undefined')return[]
    try{return JSON.parse(localStorage.getItem('varsityos-prescriptions')||'[]')}catch{return[]}
  })
  const [form,setForm] = useState({name:'',dose:'',frequency:'Once daily',nextRefill:'',instructions:''})
  const [adding,setAdding] = useState(false)
  const save=(updated:RxEntry[])=>{setMeds(updated);localStorage.setItem('varsityos-prescriptions',JSON.stringify(updated))}
  const add=()=>{if(!form.name)return;save([...meds,{id:Date.now(),...form}]);setForm({name:'',dose:'',frequency:'Once daily',nextRefill:'',instructions:''});setAdding(false)}
  const today=sastToday()
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      {meds.map(m=>(
        <div key={m.id} style={{background:'var(--bg-surface)',border:`1px solid ${m.nextRefill&&m.nextRefill<=today?'rgba(239,68,68,0.3)':'var(--border-subtle)'}`,borderRadius:12,padding:'12px 14px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
            <div style={{fontSize:'0.85rem',fontWeight:600,color:'var(--text-primary)'}}>{m.name}</div>
            <button onClick={()=>save(meds.filter(x=>x.id!==m.id))} style={{fontSize:'0.65rem',color:'var(--text-muted)',background:'none',border:'none',cursor:'pointer'}}>✕</button>
          </div>
          <div style={{fontSize:'0.7rem',color:'var(--text-secondary)',marginBottom:4}}>{m.dose} · {m.frequency}</div>
          {m.nextRefill&&<div style={{fontSize:'0.68rem',color:m.nextRefill<=today?'var(--danger)':'var(--text-tertiary)'}}>
            {m.nextRefill<=today?'⚠️ Refill overdue':'Next refill: '} {m.nextRefill}
          </div>}
          {m.instructions&&<div style={{fontSize:'0.68rem',color:'var(--text-muted)',marginTop:4}}>{m.instructions}</div>}
        </div>
      ))}
      {adding?(
        <div style={{background:'var(--bg-elevated)',border:'1px solid var(--border-default)',borderRadius:14,padding:'16px',display:'flex',flexDirection:'column',gap:10}}>
          {[{l:'Medication name *',k:'name',ph:'e.g. Fluoxetine 20mg'},{l:'Dose',k:'dose',ph:'e.g. 1 tablet'},{l:'Frequency',k:'frequency',ph:'Once daily'},{l:'Next refill date',k:'nextRefill',t:'date'},{l:'Special instructions',k:'instructions',ph:'e.g. Take with food'}].map(f=>(
            <div key={f.k}>
              <div style={{fontSize:'0.68rem',color:'var(--text-tertiary)',marginBottom:4}}>{f.l}</div>
              <input type={f.t||'text'} placeholder={f.ph||''} value={form[f.k as keyof typeof form]} onChange={e=>setForm(v=>({...v,[f.k]:e.target.value}))} style={{width:'100%',padding:'8px 12px',background:'var(--bg-base)',border:'1px solid var(--border-default)',borderRadius:8,color:'var(--text-primary)',fontSize:'0.82rem'}}/>
            </div>
          ))}
          <div style={{display:'flex',gap:8}}>
            <button onClick={add} style={{flex:1,padding:'9px 0',background:'rgba(52,211,153,0.1)',border:'1px solid rgba(52,211,153,0.25)',borderRadius:8,color:'var(--teal)',fontSize:'0.73rem',fontFamily:'var(--font-mono)',fontWeight:700,cursor:'pointer'}}>Save</button>
            <button onClick={()=>setAdding(false)} style={{padding:'9px 16px',background:'transparent',border:'1px solid var(--border-subtle)',borderRadius:8,color:'var(--text-tertiary)',fontSize:'0.73rem',fontFamily:'var(--font-mono)',cursor:'pointer'}}>Cancel</button>
          </div>
        </div>
      ):(
        <button onClick={()=>setAdding(true)} style={{padding:'11px 0',background:'rgba(52,211,153,0.06)',border:'1px solid rgba(52,211,153,0.2)',borderRadius:12,color:'var(--teal)',fontSize:'0.78rem',fontFamily:'var(--font-mono)',fontWeight:700,cursor:'pointer'}}>+ Add prescription</button>
      )}
    </div>
  )
}

function WomensHealthTab() {
  const [open,setOpen]=useState<number|null>(null)
  const sections=[
    {title:'Menstrual health',icon:'🩸',content:[
      {q:'Tracking your cycle',a:'A normal cycle is 21–35 days. Track via app (Clue, Flo) or calendar. Irregular periods, heavy bleeding, or severe pain are worth discussing with a doctor.'},
      {q:'Painful periods (dysmenorrhea)',a:'Ibuprofen 400mg taken at the first sign of pain works better than waiting. Heat pad on lower abdomen. If pain is debilitating every month, ask your doctor about endometriosis.'},
      {q:'Could it be endometriosis?',a:'Signs: severe cramps, pain during sex, fatigue, heavy bleeding, pain when going to the toilet. Affects 1 in 10 women. Often dismissed — push for an ultrasound referral.'},
      {q:'PCOS basics',a:'Polycystic ovary syndrome causes irregular periods, acne, hair growth changes. Affects 1 in 10 women. Diagnosed via blood test + ultrasound. Manageable with lifestyle + medication.'},
    ]},
    {title:'Sexual health',icon:'💙',content:[
      {q:'Free contraception at campus clinics',a:'Government campus clinics provide: the pill, Depo-Provera injection, condoms — all free. You do not need parental consent. You can get an IUD referral.'},
      {q:'HIV testing',a:'Free and confidential at all government clinics and campus health services. Results usually same-day. Knowing your status is power.'},
      {q:'PrEP — prevention before exposure',a:'PrEP (pre-exposure prophylaxis) is a daily pill that prevents HIV. Free at government clinics. Ask specifically for it — not all nurses proactively offer it.'},
      {q:'PEP — after possible exposure',a:'PEP (post-exposure prophylaxis) must be started within 72 hours of possible HIV exposure. Available free at emergency rooms. Do not wait.'},
      {q:'STI symptoms to watch for',a:'Unusual discharge, sores, burning when urinating, pelvic pain. Many STIs have no symptoms. Test every 6 months if sexually active. All treatable when caught early.'},
    ]},
    {title:'Mental + physical links',icon:'🧠',content:[
      {q:'Iron deficiency anaemia',a:'Very common in students who menstruate heavily. Symptoms: fatigue, cold hands, poor concentration, brittle nails. Get a blood test — iron supplements are cheap and effective.'},
      {q:'PMDD (severe PMS)',a:'Premenstrual dysphoric disorder causes severe mood changes in the week before your period. It is a recognised medical condition, not "just hormones." SSRIs can help.'},
    ]},
  ]
  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{padding:'10px 14px',background:'rgba(147,51,234,0.08)',border:'1px solid rgba(147,51,234,0.2)',borderRadius:10,fontSize:'0.72rem',color:'var(--text-secondary)',lineHeight:1.6}}>
        💜 Private and non-judgemental. Everything here is evidence-based and SA-specific.
      </div>
      {sections.map((sec,si)=>(
        <div key={si}>
          <div style={{fontSize:'0.65rem',fontFamily:'var(--font-mono)',color:'var(--text-muted)',letterSpacing:'0.07em',marginBottom:8}}>{sec.icon} {sec.title.toUpperCase()}</div>
          <div style={{display:'flex',flexDirection:'column',gap:7}}>
            {sec.content.map((item,ii)=>{
              const idx=si*10+ii
              return(
                <div key={ii} style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:10,overflow:'hidden'}}>
                  <button onClick={()=>setOpen(open===idx?null:idx)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',padding:'11px 14px',background:'none',border:'none',cursor:'pointer',textAlign:'left'}}>
                    <span style={{fontSize:'0.8rem',fontWeight:600,color:'var(--text-primary)'}}>{item.q}</span>
                    <span style={{fontSize:'0.6rem',color:'var(--text-muted)',transform:open===idx?'rotate(180deg)':'none',transition:'transform 0.2s',flexShrink:0,marginLeft:8}}>▾</span>
                  </button>
                  {open===idx&&<div style={{padding:'0 14px 12px',fontSize:'0.75rem',color:'var(--text-secondary)',lineHeight:1.65}}>{item.a}</div>}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

const SCIENCE_SECTIONS = [
  {
    title: 'How your immune system works',
    icon: '🛡️',
    color: 'var(--teal)',
    content: `Your immune system has two layers: **innate** (instant, non-specific — causes fever, inflammation, fatigue) and **adaptive** (targeted, takes 3–7 days to ramp up — makes antibodies specific to the pathogen).

**Why you feel awful when sick:**
Fatigue, loss of appetite, and fever are not caused by the virus — they are caused by your immune system mounting a response. Feeling exhausted is your body telling you to rest so it can redirect energy to fighting the infection.

**Fever: friend or foe?**
A fever (38–39°C) is deliberate. Your body raises temperature to slow viral replication — most viruses replicate poorly above 38°C. Only reduce a fever if it's above 39°C or causing severe discomfort. Don't routinely suppress low fevers.

**Sleep = immune superpower:**
During deep sleep, your body releases cytokines (immune signalling proteins) and consolidates immune memory. Sleeping less than 6 hours increases your infection risk by 4×. An all-nighter before an exam also reduces your immune response.

**Stress destroys immunity:**
Cortisol (stress hormone) suppresses immune function — this is why students get sick right after exams. Exam season immunity is not a coincidence. It's biology.`,
  },
  {
    title: 'SA disease context — what to know',
    icon: '🌍',
    color: 'var(--sky)',
    content: `**Tuberculosis (TB):**
SA has one of the highest TB rates globally. Cough lasting more than 2 weeks = get tested, even if you feel otherwise well. Campus clinics offer free TB testing. TB is curable — completely — if treated early. Stigma kills more people than TB does. Know your status.

**HIV:**
SA has the largest HIV-positive population in the world. One in 5 sexually active adults. Free testing at every government clinic and campus health centre. PrEP (prevention pill) is free. Knowing your status protects you and your partner.

**Meningitis:**
More common in student residences (close living, shared spaces). Symptoms: severe sudden headache, stiff neck, sensitivity to light, fever, rash (red/purple spots that don't fade when pressed). This is a medical emergency — go to ER immediately.

**COVID-19:**
Circulating variants continue to cause illness. If symptoms are mild, rest and hydrate. Wear a mask in crowded spaces if you're symptomatic. If you're immunocompromised or have chronic illness, consult a doctor early.

**Malaria:**
Not a risk in Gauteng, Cape Town, or KZN coast. Risk in Limpopo, Mpumalanga lowveld, and northern KZN. If you travel to these areas: use DEET mosquito repellent, sleep under a net, and seek prophylaxis (Malanil/Doxycycline) from a travel clinic before your trip.`,
  },
  {
    title: 'When to NOT self-treat',
    icon: '🚨',
    color: 'var(--danger)',
    content: `**Go to a clinic or ER for:**
• Chest pain or shortness of breath — any time, any age
• Cough lasting more than 2 weeks (possible TB)
• High fever (>39°C) not responding to paracetamol after 48h
• Severe headache with stiff neck (meningitis red flag)
• Rash that spreads rapidly or doesn't fade when pressed
• Severe abdominal pain that worsens over hours
• Cannot keep fluids down for more than 6 hours
• Confusion, slurred speech, or loss of balance
• Swelling, redness and heat in a limb (could be DVT or cellulitis)
• Signs of allergic reaction: throat tightening, face swelling

**Signs you're getting worse, not better:**
Most viral infections peak at day 2–3 and improve. If you are worsening after day 5, getting a secondary infection, or developing new symptoms — see a doctor. "Waiting it out" can let a bacterial complication develop.

**Mental health emergencies:**
Suicidal thoughts, self-harm, or inability to function are medical emergencies too. SADAG: 0800 567 567. Lifeline: 0861 322 322. Your campus mental health service will see you same-day for crisis appointments.`,
  },
  {
    title: 'Nutrition & immunity',
    icon: '🥗',
    color: 'var(--lime)',
    content: `**Vitamin C:**
Doesn't prevent colds, but reduces severity and duration by about 1 day. Found in: oranges, green peppers, guavas, broccoli. 1 orange = your daily requirement. Supplements work but food is better absorbed.

**Vitamin D:**
70% of South Africans are deficient despite our sunshine — because we stay indoors. Vitamin D deficiency increases respiratory infection risk. 15 min of sun on your arms between 10am–2pm = your daily dose. Pharmacies sell cheap Vitamin D3 supplements (R40–R80/month).

**Zinc:**
Critical for immune cell function. SA diet often low in zinc for students on tight budgets. Best sources: red meat (small portions count), beans, lentils, pumpkin seeds. Zinc deficiency = slow wound healing, frequent infections, taste/smell changes.

**Iron:**
Low iron = low energy + weakened immunity. Very common in students who menstruate. Eat iron-rich food (eggs, red meat, spinach, beans) with Vitamin C to enhance absorption. Avoid tea/coffee within 1 hour of iron-rich meals — tannins block absorption.

**Hydration:**
Your mucous membranes (nose, throat, lungs) are your first line of defence against infection. When dehydrated, they dry out and crack — letting pathogens in. 8 glasses of water daily is the minimum. Coffee and alcohol are diuretics — they dehydrate you.`,
  },
  {
    title: 'Dehydration — the hidden culprit',
    icon: '💧',
    color: 'var(--sky)',
    content: `Dehydration causes or worsens: headaches, fatigue, poor concentration, constipation, UTIs, kidney stones, and dizziness. Student life is full of dehydration triggers.

**Signs you're dehydrated:**
• Dark yellow urine (should be pale straw-coloured)
• Dry lips and mouth
• Headache that worsens through the day
• Afternoon energy crash
• Poor concentration during study sessions

**How much to drink:**
Minimum 2 litres per day for an adult. More if you're in hot weather, exercising, sick, or drinking alcohol. The "8 glasses" rule is 2 litres — the same target.

**Water hacks for students:**
• Fill a 2-litre bottle at the start of the day and finish it
• Water before every meal and before coffee
• Rooibos tea counts toward your fluid intake (caffeine-free)
• Add a squeeze of lemon or a few mint leaves if plain water is boring

**Alcohol and dehydration:**
Alcohol is a diuretic — it makes you urinate more water than you drank. For every standard drink: add a glass of water. This is why you wake up with a headache and dry mouth — classic dehydration.`,
  },
]

function MedicalScienceTab() {
  const [open,setOpen]=useState<number|null>(null)
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <div style={{padding:'10px 14px',background:'rgba(56,189,248,0.08)',border:'1px solid rgba(56,189,248,0.2)',borderRadius:10,fontSize:'0.7rem',color:'var(--text-secondary)',lineHeight:1.6}}>
        🔬 Evidence-based medical science tailored for SA students. Understanding your body is the first step to taking care of it.
      </div>
      {SCIENCE_SECTIONS.map((sec,i)=>(
        <div key={i} style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderLeft:`3px solid ${sec.color}`,borderRadius:12,overflow:'hidden'}}>
          <button onClick={()=>setOpen(open===i?null:i)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',padding:'12px 14px',background:'none',border:'none',cursor:'pointer',textAlign:'left',gap:10}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:18,flexShrink:0}}>{sec.icon}</span>
              <span style={{fontSize:'0.84rem',fontWeight:600,color:'var(--text-primary)'}}>{sec.title}</span>
            </div>
            <span style={{fontSize:'0.6rem',color:'var(--text-muted)',transform:open===i?'rotate(180deg)':'none',transition:'transform 0.2s',flexShrink:0}}>▾</span>
          </button>
          {open===i&&(
            <div style={{padding:'0 14px 14px'}}>
              {sec.content.split('\n').filter(l=>l.trim()).map((line,li)=>{
                const isBold=line.startsWith('**')&&line.endsWith('**')
                const isListItem=line.startsWith('•')
                if(isBold)return(
                  <div key={li} style={{fontSize:'0.75rem',fontWeight:700,color:'var(--text-primary)',marginTop:10,marginBottom:4}}>{line.slice(2,-2)}</div>
                )
                if(isListItem)return(
                  <div key={li} style={{display:'flex',gap:8,fontSize:'0.73rem',color:'var(--text-secondary)',lineHeight:1.65,marginBottom:3}}>
                    <span style={{color:sec.color,flexShrink:0}}>•</span>
                    <span dangerouslySetInnerHTML={{__html:line.slice(1).trim().replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')}}/>
                  </div>
                )
                const hasInlineBold=line.includes('**')
                return(
                  <div key={li} style={{fontSize:'0.73rem',color:'var(--text-secondary)',lineHeight:1.7,marginBottom:3}}
                    dangerouslySetInnerHTML={{__html:hasInlineBold?line.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>'):line}}/>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function WhenYouAreSick({university=''}:{university?:string}) {
  const [tab,setTab]=useState<Tab>('symptoms')
  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{position:'relative',overflow:'hidden',background:'var(--bg-surface)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:16,padding:'16px 18px'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,var(--danger),transparent)'}}/>
        <div style={{fontSize:'0.65rem',fontFamily:'var(--font-mono)',color:'var(--danger)',letterSpacing:'0.09em',marginBottom:4}}>HEALTH OS</div>
        <div style={{fontSize:'1rem',fontWeight:700,color:'var(--text-primary)'}}>When You&apos;re Sick</div>
        <div style={{fontSize:'0.73rem',color:'var(--text-secondary)',marginTop:3}}>Symptoms · Remedies · Drug safety · Clinic finder · Medical science · Women&apos;s health</div>
      </div>
      <div style={{display:'flex',gap:0,overflowX:'auto',borderBottom:'1px solid var(--border-subtle)'}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flexShrink:0,padding:'8px 12px',background:'none',border:'none',borderBottom:tab===t.id?'2px solid var(--danger)':'2px solid transparent',color:tab===t.id?'var(--danger)':'var(--text-tertiary)',fontSize:'0.68rem',fontFamily:'var(--font-mono)',fontWeight:tab===t.id?700:400,cursor:'pointer',marginBottom:-1,whiteSpace:'nowrap'}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      <div style={{animation:'fadeInUp 0.25s ease'}}>
        {tab==='symptoms'     &&<SymptomsTab/>}
        {tab==='remedies'     &&<RemediesTab/>}
        {tab==='clinics'      &&<ClinicsTab university={university}/>}
        {tab==='prescriptions'&&<PrescriptionsTab/>}
        {tab==='womens'       &&<WomensHealthTab/>}
        {tab==='science'      &&<MedicalScienceTab/>}
      </div>
    </div>
  )
}
