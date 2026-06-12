'use client'
// ─── SA Job Board ─────────────────────────────────────────────
// Part-time, vacation work, grad programmes, learnerships
import { useState } from 'react'

type JobType='parttime'|'vacation'|'grad'|'learnership'|'remote'
type Sector='retail'|'tech'|'finance'|'government'|'ngo'|'education'|'hospitality'|'health'

interface JobListing{
  id:number;title:string;company:string;type:JobType;sector:Sector;location:string;pay:string;deadline:string|null;howToApply:string;url:string;remote:boolean;nsfasOk:boolean
}

const JOBS:JobListing[]=[
  // Part-time
  {id:1,title:'Student Cashier',company:'Checkers / Shoprite',type:'parttime',sector:'retail',location:'Nationwide',pay:'R25–30/hr',deadline:null,howToApply:'Walk in with CV + ID to any branch. Ask for the HR manager.',url:'',remote:false,nsfasOk:true},
  {id:2,title:'Waiter / Barista',company:'Various restaurants & coffee shops',type:'parttime',sector:'hospitality',location:'Nationwide',pay:'R20–35/hr + tips',deadline:null,howToApply:'Walk in during off-peak hours. Bring CV. Best areas: Sandton, Waterfront, Menlyn.',url:'',remote:false,nsfasOk:true},
  {id:3,title:'Tutor (University registered)',company:'Your university',type:'parttime',sector:'education',location:'On-campus',pay:'R100–180/hr',deadline:null,howToApply:'Apply via your department or academic support centre. Typically requires 65%+ in the module.',url:'',remote:false,nsfasOk:true},
  {id:4,title:'Call Centre Agent',company:'Teleperformance / Concentrix',type:'parttime',sector:'tech',location:'Johannesburg, Cape Town, Durban',pay:'R6,500–8,500/month',deadline:null,howToApply:'Apply at teleperformance.com/en-us/south-africa or pnet.co.za searching "call centre student"',url:'https://www.pnet.co.za',remote:false,nsfasOk:true},
  {id:5,title:'Content Creator / Social Media',company:'Small businesses (freelance)',type:'parttime',sector:'tech',location:'Remote',pay:'R500–3,000/project',deadline:null,howToApply:'Create a portfolio. Post on LinkedIn. Try fiverr.com for global clients.',url:'https://www.fiverr.com',remote:true,nsfasOk:true},
  {id:6,title:'Delivery Driver',company:'Mr D / Bolt Food / Checkers Sixty60',type:'parttime',sector:'retail',location:'Major cities',pay:'R80–150/delivery session',deadline:null,howToApply:'Apply in-app: Mr D app → Earn with us. Requires own smartphone + bicycle or scooter. NSFAS-compatible (no deduction).',url:'',remote:false,nsfasOk:true},
  // Vacation work
  {id:7,title:'Finance Vacation Work',company:'Deloitte / PwC / KPMG / EY',type:'vacation',sector:'finance',location:'Johannesburg, Cape Town',pay:'R9,000–14,000/month',deadline:'Applications open July–August',howToApply:'Apply via big4.com portals; requires 65%+ in Accounting/Finance; 2nd or 3rd year students.',url:'https://www.deloitte.com/za',remote:false,nsfasOk:false},
  {id:8,title:'Engineering Vacation Work',company:'ESKOM / Transnet / Murray & Roberts',type:'vacation',sector:'government',location:'Nationwide',pay:'R5,000–8,000/month',deadline:'Applications open May–July',howToApply:'Apply at eskom.co.za/careers or transnet.net/talent. Engineering, Electrical, Mechanical students.',url:'https://www.eskom.co.za',remote:false,nsfasOk:false},
  {id:9,title:'Tech Internship (December/June)',company:'Various SA startups',type:'vacation',sector:'tech',location:'Johannesburg, Cape Town (many remote)',pay:'R4,000–10,000/month',deadline:'Rolling basis',howToApply:'LinkedIn "vacation intern South Africa". Startup directories: ventureburn.com. Connect with CTOs directly.',url:'https://www.linkedin.com',remote:true,nsfasOk:true},
  // Graduate programmes
  {id:10,title:'Graduate Programme — Banking',company:'FNB / Absa / Nedbank / Standard Bank',type:'grad',sector:'finance',location:'Johannesburg, Cape Town',pay:'R20,000–30,000/month',deadline:'Applications open Feb–March',howToApply:'Apply directly on bank career portals 12 months before graduation. Competition is intense — apply early.',url:'https://www.fnb.co.za/careers',remote:false,nsfasOk:false},
  {id:11,title:'Graduate Programme — Consulting',company:'McKinsey / BCG / Bain (SA)',type:'grad',sector:'finance',location:'Johannesburg, Cape Town',pay:'R35,000–50,000/month',deadline:'Applications open April',howToApply:'Apply via company websites. Very selective. Practice case interviews on caseinterview.com.',url:'https://www.mckinsey.com/za',remote:false,nsfasOk:false},
  {id:12,title:'SABS / CSIR Graduate Placement',company:'CSIR / SABS',type:'grad',sector:'government',location:'Pretoria, nationwide',pay:'R18,000–25,000/month',deadline:'Applications open August',howToApply:'csir.co.za/careers. STEM-focused. Strong preference for previously disadvantaged candidates.',url:'https://www.csir.co.za',remote:false,nsfasOk:false},
  // Learnerships
  {id:13,title:'IT Learnership (NQF 5)',company:'Dimension Data / EOH / Bytes',type:'learnership',sector:'tech',location:'Nationwide',pay:'R3,500–5,000/month stipend',deadline:'Rolling applications',howToApply:'Apply at pnet.co.za or careers24.com searching "IT learnership". SETA-accredited programmes lead to NQF certificates.',url:'https://www.pnet.co.za',remote:false,nsfasOk:true},
  {id:14,title:'Finance Learnership (INSETA)',company:'Various banks and insurers',type:'learnership',sector:'finance',location:'Major cities',pay:'R3,000–5,500/month stipend',deadline:'Jan & July intake',howToApply:'inseta.org.za or contact your nearest bank branch. Requires Matric pass in Maths and English.',url:'https://www.inseta.org.za',remote:false,nsfasOk:true},
  // Remote freelance
  {id:15,title:'Freelance Transcription',company:'Scribie / GoTranscript',type:'remote',sector:'tech',location:'Remote (worldwide)',pay:'R30–60/audio hour',deadline:null,howToApply:'scribie.com/freelance → apply. GoTranscript → test and join. Good for students with quiet space.',url:'https://www.scribie.com',remote:true,nsfasOk:true},
  {id:16,title:'Online Tutoring (Superprof)',company:'Superprof SA',type:'remote',sector:'education',location:'Remote',pay:'R100–400/hr',deadline:null,howToApply:'superprof.co.za — create a free profile. Subjects: Maths, Science, Accounting. Get 5-star reviews early.',url:'https://www.superprof.co.za',remote:true,nsfasOk:true},
]

type FilterType=JobType|'all'
type FilterSector=Sector|'all'

const TYPE_LABELS:{id:FilterType;label:string;emoji:string}[]=[
  {id:'all',label:'All',emoji:'🔍'},
  {id:'parttime',label:'Part-time',emoji:'⏰'},
  {id:'vacation',label:'Vacation',emoji:'☀️'},
  {id:'grad',label:'Grad Prog',emoji:'🎓'},
  {id:'learnership',label:'Learnership',emoji:'📚'},
  {id:'remote',label:'Remote',emoji:'💻'},
]

export default function SAJobBoard() {
  const [typeFilter,setTypeFilter]=useState<FilterType>('all')
  const [search,setSearch]=useState('')
  const [remote,setRemote]=useState(false)
  const [nsfasOnly,setNsfasOnly]=useState(false)
  const [expanded,setExpanded]=useState<number|null>(null)

  let results=JOBS
  if(typeFilter!=='all') results=results.filter(j=>j.type===typeFilter)
  if(remote) results=results.filter(j=>j.remote)
  if(nsfasOnly) results=results.filter(j=>j.nsfasOk)
  if(search) results=results.filter(j=>`${j.title} ${j.company}`.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{position:'relative',overflow:'hidden',background:'var(--bg-surface)',border:'1px solid rgba(99,102,241,0.25)',borderRadius:16,padding:'16px 18px'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,var(--indigo,#6366F1),transparent)'}}/>
        <div style={{fontSize:'0.58rem',fontFamily:'var(--font-mono)',color:'var(--indigo,#6366F1)',letterSpacing:'0.09em',marginBottom:4}}>SA JOB BOARD</div>
        <div style={{fontSize:'1rem',fontWeight:700,color:'var(--text-primary)'}}>Find work that fits student life</div>
        <div style={{fontSize:'0.73rem',color:'var(--text-secondary)',marginTop:3}}>Part-time · Vacation · Grad programmes · Learnerships</div>
      </div>

      <input type="text" placeholder="Search jobs..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%',padding:'10px 14px',background:'var(--bg-surface)',border:'1px solid var(--border-default)',borderRadius:10,color:'var(--text-primary)',fontSize:'0.82rem'}}/>

      <div style={{display:'flex',gap:6,overflowX:'auto'}}>
        {TYPE_LABELS.map(t=>(
          <button key={t.id} onClick={()=>setTypeFilter(t.id)} style={{flexShrink:0,padding:'6px 12px',background:typeFilter===t.id?'rgba(99,102,241,0.12)':'var(--bg-surface)',border:`1px solid ${typeFilter===t.id?'rgba(99,102,241,0.3)':'var(--border-subtle)'}`,borderRadius:100,color:typeFilter===t.id?'var(--indigo,#6366F1)':'var(--text-secondary)',fontSize:'0.68rem',fontFamily:'var(--font-mono)',fontWeight:typeFilter===t.id?700:400,cursor:'pointer',whiteSpace:'nowrap'}}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      <div style={{display:'flex',gap:8}}>
        {[{id:'remote',label:'Remote only',val:remote,set:()=>setRemote(v=>!v)},{id:'nsfas',label:'NSFAS-safe',val:nsfasOnly,set:()=>setNsfasOnly(v=>!v)}].map(f=>(
          <button key={f.id} onClick={f.set} style={{flex:1,padding:'8px 0',background:f.val?'rgba(52,211,153,0.1)':'var(--bg-surface)',border:`1px solid ${f.val?'rgba(52,211,153,0.3)':'var(--border-subtle)'}`,borderRadius:8,color:f.val?'var(--teal)':'var(--text-secondary)',fontSize:'0.7rem',fontFamily:'var(--font-mono)',fontWeight:f.val?700:400,cursor:'pointer'}}>
            {f.val?'✓':''} {f.label}
          </button>
        ))}
      </div>

      <div style={{fontSize:'0.62rem',color:'var(--text-muted)',fontFamily:'var(--font-mono)'}}>{results.length} listing{results.length!==1?'s':''} found</div>

      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {results.map(j=>(
          <div key={j.id} style={{background:'var(--bg-surface)',border:`1px solid ${expanded===j.id?'rgba(99,102,241,0.25)':'var(--border-subtle)'}`,borderRadius:12,overflow:'hidden'}}>
            <button onClick={()=>setExpanded(expanded===j.id?null:j.id)} style={{display:'flex',width:'100%',padding:'13px 14px',background:'none',border:'none',cursor:'pointer',textAlign:'left',gap:12,alignItems:'flex-start'}}>
              <div style={{flex:1}}>
                <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:4}}>
                  <span style={{fontSize:'0.6rem',padding:'2px 7px',background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:100,color:'var(--indigo,#6366F1)',fontFamily:'var(--font-mono)',fontWeight:700}}>{TYPE_LABELS.find(t=>t.id===j.type)?.label}</span>
                  {j.remote&&<span style={{fontSize:'0.6rem',padding:'2px 7px',background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.2)',borderRadius:100,color:'var(--teal)',fontFamily:'var(--font-mono)'}}>Remote</span>}
                  {j.nsfasOk&&<span style={{fontSize:'0.6rem',padding:'2px 7px',background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:100,color:'var(--gold)',fontFamily:'var(--font-mono)'}}>NSFAS-safe</span>}
                </div>
                <div style={{fontSize:'0.86rem',fontWeight:700,color:'var(--text-primary)'}}>{j.title}</div>
                <div style={{fontSize:'0.72rem',color:'var(--text-secondary)',marginTop:2}}>{j.company} · {j.location}</div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontSize:'0.75rem',fontFamily:'var(--font-mono)',fontWeight:700,color:'var(--teal)'}}>{j.pay}</div>
                <div style={{fontSize:'0.6rem',color:'var(--text-muted)',transform:expanded===j.id?'rotate(180deg)':'none',transition:'transform 0.2s',marginTop:4}}>▾</div>
              </div>
            </button>
            {expanded===j.id&&(
              <div style={{padding:'0 14px 14px',display:'flex',flexDirection:'column',gap:8}}>
                {j.deadline&&<div style={{fontSize:'0.7rem',color:'var(--coral)',fontFamily:'var(--font-mono)'}}>📅 Deadline: {j.deadline}</div>}
                <div style={{padding:'10px 12px',background:'rgba(99,102,241,0.06)',border:'1px solid rgba(99,102,241,0.15)',borderRadius:8}}>
                  <div style={{fontSize:'0.62rem',fontFamily:'var(--font-mono)',color:'var(--indigo,#6366F1)',marginBottom:4}}>HOW TO APPLY</div>
                  <div style={{fontSize:'0.75rem',color:'var(--text-secondary)',lineHeight:1.6}}>{j.howToApply}</div>
                </div>
                {j.url&&<a href={j.url} target="_blank" rel="noopener noreferrer" style={{fontSize:'0.68rem',fontFamily:'var(--font-mono)',color:'var(--teal)',textDecoration:'none'}}>Visit site →</a>}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{padding:'12px 14px',background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:12}}>
        <div style={{fontSize:'0.65rem',fontFamily:'var(--font-mono)',color:'var(--text-muted)',marginBottom:8}}>NSFAS INCOME RULE</div>
        <div style={{fontSize:'0.73rem',color:'var(--text-secondary)',lineHeight:1.6}}>
          NSFAS students may earn income without losing the bursary, but must remain a full-time registered student. If you earn more than R350,000/year you will no longer be "financially needy" for future applications. Part-time work earnings are not automatically reported to NSFAS — however, always be honest on your annual means test.
        </div>
      </div>
    </div>
  )
}
