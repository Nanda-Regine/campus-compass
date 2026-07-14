'use client'
// ─── Entrepreneurship OS ──────────────────────────────────────
// Tabs: Idea Validator · Side Hustle · SA Funding · BMC · Journal · Legal
import { useState } from 'react'

type Tab='validate'|'hustle'|'funding'|'bmc'|'journal'|'legal'
const TABS:{id:Tab;label:string;icon:string}[]=[
  {id:'validate',label:'Idea Validator',icon:'💡'},
  {id:'hustle',  label:'Side Hustle',   icon:'💰'},
  {id:'funding', label:'SA Funding',    icon:'🏦'},
  {id:'bmc',     label:'Business Model',icon:'📊'},
  {id:'journal', label:'Journal',       icon:'📓'},
  {id:'legal',   label:'SA Legal Path', icon:'⚖️'},
]

// ─── Idea Validator ───────────────────────────────────────────
const VALIDATOR_QUESTIONS=[
  {q:'What specific problem does this solve?',hint:'The more specific the problem, the bigger the opportunity.'},
  {q:'Who is your target customer? Describe one real person.',hint:'Not "everyone" — name a specific person, age, income, location.'},
  {q:'Are people currently paying to solve this problem (even badly)?',hint:'If yes, you have a market. If no, you need to validate demand.'},
  {q:'What is your unfair advantage? Why you over a big company?',hint:'Student access, local knowledge, language, connections, speed.'},
  {q:'What is the smallest version you could test in 7 days for R0?',hint:'MVP thinking. Talk to 10 people before building anything.'},
  {q:'How does money come in? (product, service, subscription, ads)',hint:'Be specific: R200/month × 100 customers = R20k MRR.'},
  {q:'What are the top 3 reasons this could fail?',hint:'Honest founders succeed. Identifying risks lets you mitigate them.'},
]

function IdeaValidatorTab() {
  const [answers,setAnswers]=useState<string[]>(Array(VALIDATOR_QUESTIONS.length).fill(''))
  const [score,setScore]=useState<number|null>(null)
  const filled=answers.filter(a=>a.trim().length>20).length
  const calcScore=()=>{
    const s=Math.round((filled/VALIDATOR_QUESTIONS.length)*100)
    setScore(s)
  }
  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{padding:'10px 14px',background:'var(--gold-dim)',border:'1px solid var(--gold-border)',borderRadius:10,fontSize:'0.73rem',color:'var(--text-secondary)',lineHeight:1.6}}>
        💡 Answer all 7 questions honestly. No AI magic — just structured thinking. This is the hardest part of entrepreneurship.
      </div>
      {VALIDATOR_QUESTIONS.map((q,i)=>(
        <div key={i} style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:12,padding:'14px'}}>
          <div style={{fontSize:'0.62rem',fontFamily:'var(--font-mono)',color:'var(--gold)',marginBottom:6}}>QUESTION {i+1}</div>
          <div style={{fontSize:'0.84rem',fontWeight:600,color:'var(--text-primary)',marginBottom:4}}>{q.q}</div>
          <div style={{fontSize:'0.68rem',color:'var(--text-muted)',marginBottom:10,fontStyle:'italic'}}>{q.hint}</div>
          <textarea value={answers[i]} onChange={e=>{const a=[...answers];a[i]=e.target.value;setAnswers(a)}} placeholder="Your answer..." rows={3} style={{width:'100%',padding:'9px 12px',background:'var(--bg-base)',border:'1px solid var(--border-default)',borderRadius:8,color:'var(--text-primary)',fontSize:'0.8rem',resize:'none',fontFamily:'var(--font-body)',lineHeight:1.5}}/>
          {answers[i].trim().length>0&&answers[i].trim().length<20&&<div style={{fontSize:'0.63rem',color:'var(--coral)',marginTop:4}}>Add more detail (think harder)</div>}
        </div>
      ))}
      <button onClick={calcScore} style={{padding:'12px 0',background:'var(--gold-dim)',border:'1px solid var(--gold-border)',borderRadius:12,color:'var(--gold)',fontSize:'0.8rem',fontFamily:'var(--font-mono)',fontWeight:700,cursor:'pointer'}}>
        Calculate viability score →
      </button>
      {score!==null&&(
        <div style={{padding:'18px',background:'var(--bg-surface)',border:`1px solid ${score>=80?'rgba(52,211,153,0.3)':score>=50?'var(--gold-border)':'rgba(239,68,68,0.3)'}`,borderRadius:14,textAlign:'center'}}>
          <div style={{fontSize:'2.5rem',fontWeight:900,fontFamily:'var(--font-mono)',color:score>=80?'var(--teal)':score>=50?'var(--gold)':'var(--danger)'}}>{score}%</div>
          <div style={{fontSize:'0.8rem',fontWeight:600,color:'var(--text-primary)',marginTop:6}}>
            {score>=80?'Strong foundation — go talk to 10 potential customers this week.':score>=50?'Promising but incomplete — revisit the weak answers.':'Not ready yet — the thinking gaps will become business gaps.'}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Side Hustle Tracker ──────────────────────────────────────
interface HustleEntry{id:number;name:string;type:string;revenue:number;hours:number;date:string}
function SideHustleTab() {
  const [entries,setEntries]=useState<HustleEntry[]>(()=>{try{return JSON.parse(localStorage.getItem('varsityos-hustle')||'[]')}catch{return[]}})
  const [form,setForm]=useState({name:'',type:'Service',revenue:'',hours:'',date:new Date().toISOString().split('T')[0]})
  const [adding,setAdding]=useState(false)
  const save=(e:HustleEntry[])=>{setEntries(e);localStorage.setItem('varsityos-hustle',JSON.stringify(e))}
  const add=()=>{if(!form.name)return;save([...entries,{id:Date.now(),name:form.name,type:form.type,revenue:parseFloat(form.revenue)||0,hours:parseFloat(form.hours)||0,date:form.date}]);setAdding(false);setForm({name:'',type:'Service',revenue:'',hours:'',date:new Date().toISOString().split('T')[0]})}
  const totalRevenue=entries.reduce((s,e)=>s+e.revenue,0)
  const totalHours=entries.reduce((s,e)=>s+e.hours,0)
  const hourlyRate=totalHours>0?Math.round(totalRevenue/totalHours):0
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      {entries.length>0&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
          {[{l:'Total earned',v:`R${totalRevenue.toLocaleString('en-ZA')}`,c:'var(--teal)'},{l:'Hours invested',v:`${totalHours}h`,c:'var(--gold)'},{l:'Effective rate',v:`R${hourlyRate}/h`,c:'var(--nova)'}].map(s=>(
            <div key={s.l} style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:10,padding:'10px 12px',textAlign:'center'}}>
              <div style={{fontSize:'1rem',fontWeight:800,fontFamily:'var(--font-mono)',color:s.c}}>{s.v}</div>
              <div style={{fontSize:'0.64rem',color:'var(--text-muted)',marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>
      )}
      {entries.map(e=>(
        <div key={e.id} style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:10,padding:'11px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontSize:'0.82rem',fontWeight:600,color:'var(--text-primary)'}}>{e.name}</div>
            <div style={{fontSize:'0.65rem',color:'var(--text-tertiary)',marginTop:2}}>{e.type} · {e.date} · {e.hours}h</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:'0.9rem',fontWeight:700,fontFamily:'var(--font-mono)',color:'var(--teal)'}}>R{e.revenue.toLocaleString('en-ZA')}</span>
            <button onClick={()=>save(entries.filter(x=>x.id!==e.id))} style={{fontSize:'0.65rem',color:'var(--text-muted)',background:'none',border:'none',cursor:'pointer'}}>✕</button>
          </div>
        </div>
      ))}
      {adding?(
        <div style={{background:'var(--bg-elevated)',border:'1px solid var(--border-default)',borderRadius:12,padding:'14px',display:'flex',flexDirection:'column',gap:10}}>
          {[{l:'Activity',k:'name',ph:'e.g. Tutoring session, Graphic design job'},{l:'Type',k:'type',ph:'Service'},{l:'Revenue (R)',k:'revenue',ph:'500',t:'number'},{l:'Hours spent',k:'hours',ph:'2',t:'number'},{l:'Date',k:'date',t:'date'}].map(f=>(
            <div key={f.k}>
              <div style={{fontSize:'0.68rem',color:'var(--text-tertiary)',marginBottom:3}}>{f.l}</div>
              <input type={f.t||'text'} placeholder={f.ph||''} value={form[f.k as keyof typeof form]} onChange={e=>setForm(v=>({...v,[f.k]:e.target.value}))} style={{width:'100%',padding:'8px 12px',background:'var(--bg-base)',border:'1px solid var(--border-default)',borderRadius:7,color:'var(--text-primary)',fontSize:'0.82rem'}}/>
            </div>
          ))}
          <div style={{display:'flex',gap:8}}>
            <button onClick={add} style={{flex:1,padding:'9px 0',background:'var(--gold-dim)',border:'1px solid var(--gold-border)',borderRadius:8,color:'var(--gold)',fontSize:'0.73rem',fontFamily:'var(--font-mono)',fontWeight:700,cursor:'pointer'}}>Add entry</button>
            <button onClick={()=>setAdding(false)} style={{padding:'9px 14px',background:'transparent',border:'1px solid var(--border-subtle)',borderRadius:8,color:'var(--text-tertiary)',fontSize:'0.73rem',fontFamily:'var(--font-mono)',cursor:'pointer'}}>Cancel</button>
          </div>
        </div>
      ):(
        <button onClick={()=>setAdding(true)} style={{padding:'11px 0',background:'var(--gold-dim)',border:'1px solid var(--gold-border)',borderRadius:12,color:'var(--gold)',fontSize:'0.78rem',fontFamily:'var(--font-mono)',fontWeight:700,cursor:'pointer'}}>+ Log income/activity</button>
      )}
    </div>
  )
}

// ─── SA Funding Map ───────────────────────────────────────────
const SA_FUNDERS=[
  {name:'NYDA Grant',org:'National Youth Development Agency',amount:'Up to R200,000',type:'Grant',eligibility:'18–35, SA citizen, registered business or idea',url:'https://www.nyda.gov.za',color:'var(--teal)'},
  {name:'SEDA SMME Funding',org:'Small Enterprise Development Agency',amount:'Various loan schemes',type:'Loan + support',eligibility:'SA-registered SMME, any age',url:'https://www.seda.org.za',color:'var(--sky, #38BDF8)'},
  {name:'DTI Incentive',org:'Dept of Trade, Industry & Competition',amount:'Various',type:'Grant / incentive',eligibility:'Manufacturing, tech, services sectors',url:'https://www.thedtic.gov.za',color:'var(--gold)'},
  {name:'Branson Centre',org:'Branson Centre of Entrepreneurship',amount:'Equity-free support',type:'Incubator',eligibility:'Early-stage, social impact focus',url:'https://www.bransoncentre.co.za',color:'var(--nova)'},
  {name:'Grindstone Accelerator',org:'Knife Capital',amount:'R500k–R2m',type:'Equity investment',eligibility:'Post-revenue, growth stage',url:'https://knifecap.com',color:'var(--coral)'},
  {name:'Student Startup Fund',org:'Various universities (SRC)',amount:'R5k–R50k',type:'Seed grant',eligibility:'Registered students with business idea',url:'',color:'var(--indigo, #6366F1)'},
  {name:'Innovation Hub',org:'Gauteng (& other provinces)',amount:'Incubation + grants',type:'Incubator',eligibility:'Tech-focused businesses',url:'https://www.theinnovationhub.com',color:'var(--emerald, #34D399)'},
]

function FundingTab() {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <div style={{padding:'10px 14px',background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:10,fontSize:'0.72rem',color:'var(--text-secondary)',lineHeight:1.6}}>
        🇿🇦 SA has serious funding available for student entrepreneurs. The barrier is usually not money — it is knowing these exist and having a solid application.
      </div>
      {SA_FUNDERS.map((f,i)=>(
        <div key={i} style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderLeft:`3px solid ${f.color}`,borderRadius:12,padding:'13px 14px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
            <div>
              <div style={{fontSize:'0.85rem',fontWeight:700,color:'var(--text-primary)'}}>{f.name}</div>
              <div style={{fontSize:'0.65rem',color:'var(--text-muted)',marginTop:1}}>{f.org}</div>
            </div>
            <span style={{padding:'2px 8px',background:`${f.color}15`,border:`1px solid ${f.color}30`,borderRadius:100,fontSize:'0.65rem',fontFamily:'var(--font-mono)',fontWeight:700,color:f.color,flexShrink:0}}>{f.type}</span>
          </div>
          <div style={{fontSize:'0.7rem',color:'var(--text-secondary)',marginBottom:4}}>💵 {f.amount}</div>
          <div style={{fontSize:'0.68rem',color:'var(--text-tertiary)',marginBottom:8}}>✓ {f.eligibility}</div>
          {f.url&&<a href={f.url} target="_blank" rel="noopener noreferrer" style={{fontSize:'0.65rem',fontFamily:'var(--font-mono)',color:f.color,textDecoration:'none'}}>Apply / learn more →</a>}
        </div>
      ))}
    </div>
  )
}

// ─── Business Model Canvas ────────────────────────────────────
const BMC_BLOCKS=[
  {key:'partners',label:'Key Partners',placeholder:'Who helps you operate? Suppliers, allies?',color:'var(--sky, #38BDF8)'},
  {key:'activities',label:'Key Activities',placeholder:'What must you DO every day to deliver value?',color:'var(--indigo, #6366F1)'},
  {key:'resources',label:'Key Resources',placeholder:'What do you need? Skills, tools, space, cash?',color:'var(--nova)'},
  {key:'value',label:'Value Proposition',placeholder:'What problem do you solve, better than alternatives?',color:'var(--gold)'},
  {key:'relationships',label:'Customer Relationships',placeholder:'How do you acquire + retain customers?',color:'var(--teal)'},
  {key:'channels',label:'Channels',placeholder:'How do customers find and buy from you?',color:'var(--emerald, #34D399)'},
  {key:'segments',label:'Customer Segments',placeholder:'Who are your customers? Be specific.',color:'var(--coral)'},
  {key:'costs',label:'Cost Structure',placeholder:'What are your biggest costs?',color:'var(--danger)'},
  {key:'revenue',label:'Revenue Streams',placeholder:'How does money come in? How much per unit?',color:'var(--teal)'},
]

function BMCTab() {
  const [canvas,setCanvas]=useState<Record<string,string>>(()=>{try{return JSON.parse(localStorage.getItem('varsityos-bmc')||'{}')}catch{return{}}})
  const update=(k:string,v:string)=>{const n={...canvas,[k]:v};setCanvas(n);localStorage.setItem('varsityos-bmc',JSON.stringify(n))}
  const filled=BMC_BLOCKS.filter(b=>canvas[b.key]?.trim().length>0).length
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontSize:'0.72rem',color:'var(--text-secondary)'}}>Business Model Canvas</div>
        <div style={{fontSize:'0.7rem',fontFamily:'var(--font-mono)',color:'var(--gold)'}}>{filled}/{BMC_BLOCKS.length} blocks</div>
      </div>
      {BMC_BLOCKS.map(b=>(
        <div key={b.key} style={{background:'var(--bg-surface)',border:`1px solid ${canvas[b.key]?.trim()?`${b.color}30`:'var(--border-subtle)'}`,borderLeft:`3px solid ${b.color}`,borderRadius:11,padding:'12px 14px'}}>
          <div style={{fontSize:'0.62rem',fontFamily:'var(--font-mono)',color:b.color,marginBottom:6}}>{b.label.toUpperCase()}</div>
          <textarea value={canvas[b.key]||''} onChange={e=>update(b.key,e.target.value)} placeholder={b.placeholder} rows={2} style={{width:'100%',padding:'7px 10px',background:'var(--bg-base)',border:'1px solid var(--border-default)',borderRadius:7,color:'var(--text-primary)',fontSize:'0.78rem',resize:'none',fontFamily:'var(--font-body)',lineHeight:1.5}}/>
        </div>
      ))}
    </div>
  )
}

// ─── Lean Startup Journal ─────────────────────────────────────
interface JournalEntry{id:number;date:string;hypothesis:string;test:string;result:string;learn:string;next:string}
function JournalTab() {
  const [entries,setEntries]=useState<JournalEntry[]>(()=>{try{return JSON.parse(localStorage.getItem('varsityos-startup-journal')||'[]')}catch{return[]}})
  const [form,setForm]=useState({date:new Date().toISOString().split('T')[0],hypothesis:'',test:'',result:'',learn:'',next:''})
  const [adding,setAdding]=useState(false)
  const save=(e:JournalEntry[])=>{setEntries(e);localStorage.setItem('varsityos-startup-journal',JSON.stringify(e))}
  const add=()=>{if(!form.hypothesis)return;save([{id:Date.now(),...form},...entries]);setAdding(false);setForm({date:new Date().toISOString().split('T')[0],hypothesis:'',test:'',result:'',learn:'',next:''})}
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <div style={{padding:'10px 14px',background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:10,fontSize:'0.72rem',color:'var(--text-secondary)',lineHeight:1.6}}>
        📓 Build-Measure-Learn. Every great company started as a series of failed hypotheses, each one smarter than the last.
      </div>
      <button onClick={()=>setAdding(v=>!v)} style={{padding:'10px 0',background:'var(--gold-dim)',border:'1px solid var(--gold-border)',borderRadius:12,color:'var(--gold)',fontSize:'0.78rem',fontFamily:'var(--font-mono)',fontWeight:700,cursor:'pointer'}}>
        {adding?'Cancel':'+ New experiment'}
      </button>
      {adding&&(
        <div style={{background:'var(--bg-elevated)',border:'1px solid var(--border-default)',borderRadius:14,padding:'16px',display:'flex',flexDirection:'column',gap:10}}>
          {[{l:'Hypothesis (what you believe)',k:'hypothesis',ph:'e.g. Students will pay R150/month for a study planner'},{l:'Test (smallest experiment)',k:'test',ph:'e.g. Posted in 3 WhatsApp groups, asked if people would pay'},{l:'Result (what actually happened)',k:'result',ph:'e.g. 12/30 said yes, 3 asked to sign up now'},{l:'What you learned',k:'learn',ph:'e.g. Price point is right, but need mobile-first'},{l:'Next action',k:'next',ph:'e.g. Build a landing page + collect 10 emails'}].map(f=>(
            <div key={f.k}>
              <div style={{fontSize:'0.68rem',color:'var(--text-tertiary)',marginBottom:3}}>{f.l}</div>
              <textarea value={form[f.k as keyof typeof form]} onChange={e=>setForm(v=>({...v,[f.k]:e.target.value}))} placeholder={f.ph} rows={2} style={{width:'100%',padding:'8px 10px',background:'var(--bg-base)',border:'1px solid var(--border-default)',borderRadius:7,color:'var(--text-primary)',fontSize:'0.78rem',resize:'none',fontFamily:'var(--font-body)'}}/>
            </div>
          ))}
          <button onClick={add} style={{padding:'9px 0',background:'var(--gold-dim)',border:'1px solid var(--gold-border)',borderRadius:8,color:'var(--gold)',fontSize:'0.73rem',fontFamily:'var(--font-mono)',fontWeight:700,cursor:'pointer'}}>Save experiment</button>
        </div>
      )}
      {entries.map(e=>(
        <div key={e.id} style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:12,padding:'13px 14px'}}>
          <div style={{fontSize:'0.6rem',fontFamily:'var(--font-mono)',color:'var(--text-muted)',marginBottom:6}}>{e.date}</div>
          <div style={{fontSize:'0.82rem',fontWeight:600,color:'var(--text-primary)',marginBottom:8}}>💡 {e.hypothesis}</div>
          {[{l:'Test',v:e.test},{l:'Result',v:e.result},{l:'Learned',v:e.learn},{l:'Next',v:e.next}].filter(x=>x.v).map(x=>(
            <div key={x.l} style={{fontSize:'0.72rem',color:'var(--text-secondary)',marginBottom:4}}><span style={{color:'var(--text-muted)'}}>{x.l}: </span>{x.v}</div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── SA Legal Path ────────────────────────────────────────────
function LegalTab() {
  const [open,setOpen]=useState<number|null>(null)
  const steps=[
    {title:'Choose your business structure',icon:'🏗️',content:'For most students: start as a Sole Trader (no registration needed). When revenue exceeds R100k/year, register as a Private Company (Pty Ltd) via CIPC for R175.'},
    {title:'Register with CIPC',icon:'📋',content:'Go to bizportal.gov.za. Register a company name (R50) + company (R125). You need a South African ID, email, and bank account. Takes 3–5 business days.'},
    {title:'Open a business bank account',icon:'🏦',content:'Capitec Business (R0/month), FNB Easy Account, or Tymebank Business. Separate personal and business money from Day 1 — even if small.'},
    {title:'Register for tax (SARS)',icon:'🧾',content:'Register on SARS eFiling (efiling.sars.gov.za). You need a tax number. Provisional tax applies when you earn >R30,000/year from business.'},
    {title:'VAT threshold',icon:'📊',content:'Only register for VAT when your taxable turnover exceeds R1,000,000/year. Below this, VAT registration is voluntary and usually not worth the admin.'},
    {title:'Freelancer / contractor basics',icon:'💼',content:'Issue invoices with your name, address, bank details, and a unique invoice number. Keep all receipts for business expenses — they reduce your taxable income.'},
    {title:'Protect your idea',icon:'🔒',content:'Register a trademark at CIPC (R590 per class) for your brand name. Copyright on original creative work is automatic in SA. Patents require a professional and are expensive — focus on speed instead.'},
  ]
  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      <div style={{padding:'10px 14px',background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:10,fontSize:'0.72rem',color:'var(--text-secondary)',lineHeight:1.6}}>
        ⚖️ SA-specific legal path for student entrepreneurs. Not legal advice — consult a professional for complex situations.
      </div>
      {steps.map((s,i)=>(
        <div key={i} style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:11,overflow:'hidden'}}>
          <button onClick={()=>setOpen(open===i?null:i)} style={{display:'flex',alignItems:'center',gap:12,width:'100%',padding:'12px 14px',background:'none',border:'none',cursor:'pointer',textAlign:'left'}}>
            <div style={{width:28,height:28,borderRadius:'50%',background:'rgba(99,102,241,0.12)',border:'1px solid rgba(99,102,241,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.7rem',fontWeight:700,fontFamily:'var(--font-mono)',color:'var(--indigo, #6366F1)',flexShrink:0}}>{i+1}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:'0.8rem',fontWeight:600,color:'var(--text-primary)'}}>{s.icon} {s.title}</div>
            </div>
            <span style={{fontSize:'0.6rem',color:'var(--text-muted)',transform:open===i?'rotate(180deg)':'none',transition:'transform 0.2s'}}>▾</span>
          </button>
          {open===i&&<div style={{padding:'0 14px 14px 54px',fontSize:'0.75rem',color:'var(--text-secondary)',lineHeight:1.65}}>{s.content}</div>}
        </div>
      ))}
    </div>
  )
}

export default function EntrepreneurOS() {
  const [tab,setTab]=useState<Tab>('validate')
  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{position:'relative',overflow:'hidden',background:'var(--bg-surface)',border:'1px solid rgba(245,158,11,0.25)',borderRadius:16,padding:'16px 18px'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,var(--gold),transparent)'}}/>
        <div style={{fontSize:'0.65rem',fontFamily:'var(--font-mono)',color:'var(--gold)',letterSpacing:'0.09em',marginBottom:4}}>ENTREPRENEURSHIP OS</div>
        <div style={{fontSize:'1rem',fontWeight:700,color:'var(--text-primary)'}}>Build while you study</div>
        <div style={{fontSize:'0.73rem',color:'var(--text-secondary)',marginTop:3}}>Idea validation · Side hustle tracker · SA funding · Business model · Legal path</div>
      </div>
      <div style={{display:'flex',gap:0,background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:14,overflow:'hidden'}}>
        {/* Side nav rail */}
        <div style={{width:54,flexShrink:0,display:'flex',flexDirection:'column',borderRight:'1px solid var(--border-subtle)',background:'var(--bg-base)'}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              display:'flex',flexDirection:'column',alignItems:'center',gap:3,
              padding:'10px 4px',background:'none',border:'none',
              borderLeft:tab===t.id?'2px solid var(--gold)':'2px solid transparent',
              color:tab===t.id?'var(--gold)':'var(--text-muted)',
              fontSize:'0.6rem',fontFamily:'var(--font-mono)',cursor:'pointer',
              width:'100%',transition:'color 0.15s',
            }}>
              <span style={{fontSize:'1rem'}}>{t.icon}</span>
              <span style={{lineHeight:1.2,textAlign:'center'}}>{t.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
        {/* Content area */}
        <div style={{flex:1,minWidth:0,padding:'14px 16px',overflowY:'auto'}}>
          {tab==='validate'&&<IdeaValidatorTab/>}
          {tab==='hustle'  &&<SideHustleTab/>}
          {tab==='funding' &&<FundingTab/>}
          {tab==='bmc'     &&<BMCTab/>}
          {tab==='journal' &&<JournalTab/>}
          {tab==='legal'   &&<LegalTab/>}
        </div>
      </div>
    </div>
  )
}
