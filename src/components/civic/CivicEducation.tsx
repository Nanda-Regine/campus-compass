'use client'
// ─── Civic Education ──────────────────────────────────────────
// Know your rights, vote, SASSA, DHET complaints, SRC toolkit
import { useState } from 'react'

type Tab='rights'|'vote'|'sassa'|'dhet'|'src'
const TABS:{id:Tab;label:string;icon:string}[]=[
  {id:'rights',label:'Your Rights',  icon:'⚖️'},
  {id:'vote',  label:'Vote',         icon:'🗳️'},
  {id:'sassa', label:'SASSA',        icon:'💚'},
  {id:'dhet',  label:'DHET Complaints',icon:'📢'},
  {id:'src',   label:'SRC Toolkit',  icon:'✊'},
]

const RIGHTS_SECTIONS=[
  {title:'When stopped by SAPS',icon:'👮',items:[
    'You have the right to know why you are being stopped.',
    'Ask for the officer\'s name and badge number — it is your right.',
    'You may not be searched without reasonable suspicion or a warrant.',
    'You have the right to remain silent. You do not have to answer questions.',
    'If arrested: you must be told the reason. You have the right to a lawyer immediately.',
    'You must appear before a court within 48 hours of arrest.',
    'You may not be tortured or treated inhumanely. Report any abuse to the IPID.',
  ]},
  {title:'Tenant rights (res & private)',icon:'🏠',items:[
    'Your landlord/res must give you a written lease agreement.',
    'A deposit may not exceed 2 months\' rent. It must be in an interest-bearing account.',
    'Your landlord may not enter without 24 hours\' notice (emergency excepted).',
    'No services may be cut off as pressure to pay — this is illegal.',
    'To dispute an eviction: contact the Rental Housing Tribunal (free of charge).',
    'Report all maintenance issues in writing (WhatsApp counts) to create a paper trail.',
  ]},
  {title:'Sexual harassment & assault',icon:'💜',items:[
    'Unwanted sexual touching, verbal harassment, or coercion is a crime in SA.',
    'You can report at any SAPS station — you do not need to know the offender\'s name.',
    'Forensic evidence: do not shower, change clothes, or clean the area.',
    'Sexual Assault Forensic Evidence (SAFE) kits are available at government hospitals, free.',
    'GBV Command Centre: 0800 428 428 (free, 24/7). Call or WhatsApp.',
    'A Protection Order can be granted even without a criminal case.',
  ]},
  {title:'Consumer rights (CPA)',icon:'🛒',items:[
    'You have 6 months to return a defective product for repair, replacement, or refund.',
    'A supplier cannot charge a cancellation fee if they breached the contract.',
    'Unsolicited goods sent to you do not need to be returned or paid for.',
    'Misleading advertising is illegal. Report to the Advertising Regulatory Board.',
    'Escalate unresolved complaints to the National Consumer Commission (NCC) at thencc.org.za.',
  ]},
  {title:'Labour law (for part-time workers)',icon:'💼',items:[
    'National Minimum Wage: R28.79/hour (2026). Below this is illegal.',
    'You are entitled to a payslip showing all deductions.',
    'UIF contributions: even part-time workers earn UIF benefits. Employer must deduct and pay.',
    'Notice period: 1 week (if employed < 6 months), 2 weeks (6m–1yr), 4 weeks (1yr+).',
    'You may not be fired without a fair reason and a fair procedure (hearing).',
    'CCMA handles unfair dismissal disputes — free of charge, no lawyer needed.',
  ]},
]

function RightsTab() {
  const [open,setOpen]=useState<number|null>(null)
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      {RIGHTS_SECTIONS.map((sec,i)=>(
        <div key={i} style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:12,overflow:'hidden'}}>
          <button onClick={()=>setOpen(open===i?null:i)} style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'13px 14px',background:'none',border:'none',cursor:'pointer',textAlign:'left'}}>
            <span style={{fontSize:'1.1rem'}}>{sec.icon}</span>
            <span style={{flex:1,fontSize:'0.84rem',fontWeight:600,color:'var(--text-primary)'}}>{sec.title}</span>
            <span style={{fontSize:'0.6rem',color:'var(--text-muted)',transform:open===i?'rotate(180deg)':'none',transition:'transform 0.2s'}}>▾</span>
          </button>
          {open===i&&(
            <div style={{padding:'0 14px 14px',display:'flex',flexDirection:'column',gap:7}}>
              {sec.items.map((item,j)=>(
                <div key={j} style={{display:'flex',gap:8,fontSize:'0.75rem',color:'var(--text-secondary)',lineHeight:1.6}}>
                  <span style={{color:'var(--teal)',flexShrink:0}}>→</span>{item}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function VoteTab() {
  const [open,setOpen]=useState<number|null>(null)
  const steps=[
    {q:'Who can vote?',a:'Any South African citizen aged 18+. Permanent residents cannot vote in national/provincial elections but can vote in municipal elections.'},
    {q:'How do I register to vote?',a:'Online at registertovote.elections.org.za using your SA ID number. Or visit any IEC registration station during a registration weekend (announced by IEC). Bring your green barcoded ID or smart ID card.'},
    {q:'How do I check if I\'m registered?',a:'SMS your ID number to 32810 (standard SMS rates). Or check online at registertovote.elections.org.za.'},
    {q:'Can I vote while at university?',a:'Yes. You can register at your campus address and vote at a voting station near your university. This is especially useful if your hometown is far.'},
    {q:'What is the difference between national, provincial, and local elections?',a:'National: elect Parliament → determines the President. Provincial: elect provincial legislature → determines the Premier. Local/Municipal: elect your ward councillor and PR councillors → determines services in your area. Municipal elections most directly affect your daily life.'},
    {q:'How do I find my ward councillor?',a:'Go to elections.org.za/content/Voters/Who-is-my-ward-councillor-/ and enter your address. Your councillor is responsible for local roads, water, electricity, refuse — hold them accountable.'},
    {q:'What if I can\'t vote on election day?',a:'You can apply for a special vote if you are disabled, sick, or away from your registered station. Apply at the IEC office at least 6 days before election day.'},
  ]
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <div style={{padding:'10px 14px',background:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:10,fontSize:'0.73rem',color:'var(--text-secondary)',lineHeight:1.6}}>
        🗳️ South Africa paid too high a price for the vote to not use it. Your generation has more political power than any before it.
      </div>
      {steps.map((s,i)=>(
        <div key={i} style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:11,overflow:'hidden'}}>
          <button onClick={()=>setOpen(open===i?null:i)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',padding:'12px 14px',background:'none',border:'none',cursor:'pointer',textAlign:'left',gap:10}}>
            <span style={{fontSize:'0.82rem',fontWeight:600,color:'var(--text-primary)'}}>{s.q}</span>
            <span style={{fontSize:'0.6rem',color:'var(--text-muted)',flexShrink:0,transform:open===i?'rotate(180deg)':'none',transition:'transform 0.2s'}}>▾</span>
          </button>
          {open===i&&<div style={{padding:'0 14px 12px',fontSize:'0.75rem',color:'var(--text-secondary)',lineHeight:1.65}}>{s.a}</div>}
        </div>
      ))}
      <a href="https://www.elections.org.za" target="_blank" rel="noopener noreferrer" style={{display:'block',textAlign:'center',padding:'11px 0',background:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:10,color:'var(--indigo, #6366F1)',fontSize:'0.73rem',fontFamily:'var(--font-mono)',fontWeight:700,textDecoration:'none'}}>
        IEC Voter Portal →
      </a>
    </div>
  )
}

function SassaTab() {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <div style={{padding:'10px 14px',background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.2)',borderRadius:10,fontSize:'0.73rem',color:'var(--text-secondary)',lineHeight:1.6}}>
        💚 SASSA provides social grants to qualifying South Africans. Many students qualify — or have family members who do.
      </div>
      {[
        {grant:'Child Support Grant',amount:'R560/month',who:'Primary caregiver of a child under 18. Means-tested.',docs:'ID of caregiver + child birth certificate + proof of income'},
        {grant:'Older Persons Grant',amount:'R2,200/month',who:'SA citizens/residents aged 60+. Means-tested.',docs:'ID + proof of income + proof of residence'},
        {grant:'Disability Grant',amount:'R2,200/month',who:'Persons with disability preventing work. Medical assessment required.',docs:'ID + doctor\'s assessment + proof of income'},
        {grant:'Foster Child Grant',amount:'R1,180/month',who:'Foster parent with a court order.',docs:'ID + court order + birth certificate'},
        {grant:'Social Relief of Distress',amount:'Variable',who:'Short-term hardship. Not means-tested as strictly.',docs:'ID + proof of hardship'},
      ].map((g,i)=>(
        <div key={i} style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:12,padding:'13px 14px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
            <div style={{fontSize:'0.84rem',fontWeight:700,color:'var(--text-primary)'}}>{g.grant}</div>
            <span style={{fontSize:'0.72rem',fontFamily:'var(--font-mono)',fontWeight:700,color:'var(--teal)'}}>{g.amount}</span>
          </div>
          <div style={{fontSize:'0.72rem',color:'var(--text-secondary)',marginBottom:4}}>{g.who}</div>
          <div style={{fontSize:'0.68rem',color:'var(--text-muted)'}}>📋 {g.docs}</div>
        </div>
      ))}
      <div style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:12,padding:'13px 14px'}}>
        <div style={{fontSize:'0.75rem',fontWeight:700,color:'var(--text-primary)',marginBottom:8}}>How to apply</div>
        {['Visit your nearest SASSA office with all required documents.','Check sassa.gov.za for the full documents list per grant type.','SASSA will assess and respond within 90 days.','If denied, you have 90 days to appeal.','SASSA Helpline: 0800 601 011 (toll-free)'].map((s,i)=>(
          <div key={i} style={{display:'flex',gap:8,fontSize:'0.73rem',color:'var(--text-secondary)',lineHeight:1.6,marginBottom:4}}>
            <span style={{color:'var(--teal)',flexShrink:0}}>{i+1}.</span>{s}
          </div>
        ))}
      </div>
    </div>
  )
}

function DhetTab() {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <div style={{padding:'10px 14px',background:'var(--gold-dim)',border:'1px solid var(--gold-border)',borderRadius:10,fontSize:'0.73rem',color:'var(--text-secondary)',lineHeight:1.6}}>
        📢 The DHET oversees all public universities, colleges, and TVET institutions. If your institution fails you, escalate here.
      </div>
      {[
        {issue:'NSFAS not paying',escalate:'Contact your SFAO first. If unresolved in 15 business days → DHET complaints portal at dhet.gov.za/complaints. Reference your NSFAS application number.'},
        {issue:'University won\'t register due to historical debt',escalate:'This violates the DHET directive. Write to your institution\'s DVC: Student Affairs AND CC the DHET. Template available at SAUS (South African Union of Students).'},
        {issue:'Unfair academic exclusion',escalate:'File an internal appeal first (usually 5-day window). If rejected unfairly → contact your institution\'s Ombud OR the DHET.'},
        {issue:'Sexual harassment by staff',escalate:'Report to your institution\'s Transformation Office AND the DHET\'s GBV desk. Your identity will be protected.'},
        {issue:'Lack of accommodation / student housing',escalate:'Contact your SRC to document the crisis collectively. DHET Accommodation Policy obligates institutions — reference it in your complaint.'},
      ].map((e,i)=>(
        <div key={i} style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderLeft:'3px solid var(--gold)',borderRadius:11,padding:'12px 14px'}}>
          <div style={{fontSize:'0.82rem',fontWeight:600,color:'var(--text-primary)',marginBottom:6}}>{e.issue}</div>
          <div style={{fontSize:'0.73rem',color:'var(--text-secondary)',lineHeight:1.6}}>{e.escalate}</div>
        </div>
      ))}
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        <a href="https://www.dhet.gov.za" target="_blank" rel="noopener noreferrer" style={{display:'block',padding:'10px 14px',background:'var(--gold-dim)',border:'1px solid var(--gold-border)',borderRadius:10,color:'var(--gold)',fontSize:'0.73rem',fontFamily:'var(--font-mono)',textDecoration:'none',fontWeight:700}}>DHET Website →</a>
        <a href="mailto:callcentre@dhet.gov.za" style={{display:'block',padding:'10px 14px',background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:10,color:'var(--text-secondary)',fontSize:'0.73rem',fontFamily:'var(--font-mono)',textDecoration:'none'}}>callcentre@dhet.gov.za</a>
      </div>
    </div>
  )
}

function SrcTab() {
  const [open,setOpen]=useState<number|null>(null)
  const items=[
    {q:'What is the SRC?',a:'The Student Representative Council is the elected student government at your institution. They represent student interests to management, run welfare services, and can access institutional funds.'},
    {q:'How do I run for SRC?',a:'1. Check your institution\'s SRC constitution (available at the Dean of Students office). 2. Nominations usually open at the start of Semester 2. 3. You need a clean academic record (usually 60% pass rate). 4. Submit nomination form + manifesto. 5. Campaign period: 2 weeks. 6. Elections: online or in person, all registered students vote.'},
    {q:'What power does the SRC actually have?',a:'The SRC sits on all major institutional committees including Council, Senate, Finance Committee, and Student Disciplinary Committee. They have veto power on matters directly affecting students. A strong SRC blocked fee increases and secured housing at many institutions.'},
    {q:'How to raise a collective issue',a:'1. Document the issue with evidence (photos, statements, numbers). 2. Gather signatures from affected students. 3. Submit formally to SRC with a proposed solution, not just a complaint. 4. Request a response deadline. 5. Escalate to Dean of Students if SRC is unresponsive. 6. Last resort: peaceful, legal protest (notify SAPS 48h in advance per Gatherings Act).'},
    {q:'Fees Must Fall context',a:'The 2015–2016 student movement won fee freezes and forced national conversations about free higher education. NSFAS expansion and the missing middle funding are direct results. Student power, properly organised, changes policy.'},
  ]
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      {items.map((s,i)=>(
        <div key={i} style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:11,overflow:'hidden'}}>
          <button onClick={()=>setOpen(open===i?null:i)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',padding:'12px 14px',background:'none',border:'none',cursor:'pointer',textAlign:'left',gap:10}}>
            <span style={{fontSize:'0.82rem',fontWeight:600,color:'var(--text-primary)'}}>{s.q}</span>
            <span style={{fontSize:'0.6rem',color:'var(--text-muted)',flexShrink:0,transform:open===i?'rotate(180deg)':'none',transition:'transform 0.2s'}}>▾</span>
          </button>
          {open===i&&<div style={{padding:'0 14px 12px',fontSize:'0.75rem',color:'var(--text-secondary)',lineHeight:1.65}}>{s.a}</div>}
        </div>
      ))}
    </div>
  )
}

export default function CivicEducation() {
  const [tab,setTab]=useState<Tab>('rights')
  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{position:'relative',overflow:'hidden',background:'var(--bg-surface)',border:'1px solid rgba(99,102,241,0.25)',borderRadius:16,padding:'16px 18px'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,var(--indigo, #6366F1),transparent)'}}/>
        <div style={{fontSize:'0.58rem',fontFamily:'var(--font-mono)',color:'var(--indigo, #6366F1)',letterSpacing:'0.09em',marginBottom:4}}>CIVIC EDUCATION</div>
        <div style={{fontSize:'1rem',fontWeight:700,color:'var(--text-primary)'}}>Know your rights. Use your power.</div>
      </div>
      <div style={{display:'flex',gap:0,overflowX:'auto',borderBottom:'1px solid var(--border-subtle)'}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flexShrink:0,padding:'8px 12px',background:'none',border:'none',borderBottom:tab===t.id?'2px solid var(--indigo, #6366F1)':'2px solid transparent',color:tab===t.id?'var(--indigo, #6366F1)':'var(--text-tertiary)',fontSize:'0.68rem',fontFamily:'var(--font-mono)',fontWeight:tab===t.id?700:400,cursor:'pointer',marginBottom:-1,whiteSpace:'nowrap'}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      <div>
        {tab==='rights'&&<RightsTab/>}
        {tab==='vote'  &&<VoteTab/>}
        {tab==='sassa' &&<SassaTab/>}
        {tab==='dhet'  &&<DhetTab/>}
        {tab==='src'   &&<SrcTab/>}
      </div>
    </div>
  )
}
