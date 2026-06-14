'use client'
// ─── Credit Score Education ───────────────────────────────────
// What is a credit score, how to build one as a student, impact simulator
import { useState } from 'react'

interface Factor{name:string;weight:string;tip:string;icon:string}
const FACTORS:Factor[]=[
  {name:'Payment history',weight:'35%',tip:'Never miss a payment. Even one 30-day late payment can drop your score by 50–100 points and stays on your record for 5 years.',icon:'⏱️'},
  {name:'Amounts owed',weight:'30%',tip:'Keep credit utilisation below 30%. If your credit card limit is R5,000, keep your balance under R1,500 at statement time.',icon:'💳'},
  {name:'Length of history',weight:'15%',tip:'The older your accounts, the better. Keep your oldest account open even if you rarely use it.',icon:'📅'},
  {name:'New credit inquiries',weight:'10%',tip:'Each hard inquiry (when you apply for credit) can drop your score by 5–10 points. Only apply for credit when you need it.',icon:'🔍'},
  {name:'Credit mix',weight:'10%',tip:'A mix of credit types (card, store account, personal loan) is better than just one. A cell phone contract already counts as credit.',icon:'🗂️'},
]

const SCORE_BANDS=[
  {range:'781–850',label:'Excellent',color:'var(--teal)',benefit:'Best rates. Banks compete for your business. Home loan approval near-certain.'},
  {range:'721–780',label:'Very Good',color:'#34D399',benefit:'Access to most financial products. Small rate premium over Excellent.'},
  {range:'661–720',label:'Good',color:'var(--gold)',benefit:'Most products available. Moderate rates. Work toward the 721+ band.'},
  {range:'601–660',label:'Fair',color:'var(--coral)',benefit:'Limited product access. Higher interest rates. 6–12 months of on-time payments can move you up.'},
  {range:'300–600',label:'Poor / No score',color:'var(--danger,#EF4444)',benefit:'Likely declined for most credit. Focus on a secured card or retailer account to start building.'},
]

const STUDENT_STEPS=[
  {step:'1',title:'Start with a cell phone contract',body:'A R99–R200/month SIM-only contract with MTN, Vodacom, or Telkom is the easiest first credit account. Pay it every month, never miss, and it will build your record over 12+ months.'},
  {step:'2',title:'Get a store account — but use it carefully',body:'Accounts at Woolworths, Edgars, or Foschini are easier to get than bank credit cards. Use it once a month for small purchases and pay the full statement every month.'},
  {step:'3',title:'Get a student credit card',body:'Once you have 12+ months of payment history, apply for a FNB, Standard Bank, or Nedbank student card. Credit limit will be low (R500–R2,000) — treat it like a debit card, pay in full monthly.'},
  {step:'4',title:'Pay everything on time, every time',body:'Set debit orders. Never pay late. A single missed payment erases months of progress. If you know you\'re going to miss a payment, call the lender before the due date — they can often arrange a skip.'},
  {step:'5',title:'Check your credit report for free',body:'You\'re entitled to one free credit report per year from each bureau: Experian, TransUnion, and XDS. Use ClearScore (free, no credit card required) to check your score monthly.'},
]

interface ScenarioInput{onTimePayments:number;creditUtilisation:number;accountAge:number;inquiries:number}

function estimateScore(s:ScenarioInput):number{
  let score=300
  score+=Math.min(s.onTimePayments,24)*8      // 0–192 from payments
  score+=Math.max(0,(100-s.creditUtilisation)/100)*150  // 0–150 from utilisation
  score+=Math.min(s.accountAge,60)*1.5        // 0–90 from age
  score+=Math.max(0,10-s.inquiries)*5         // 0–50 from inquiries
  return Math.round(Math.min(850,Math.max(300,score)))
}

type Tab='what'|'bands'|'build'|'sa_rights'|'simulator'
export default function CreditScoreEducation() {
  const [tab,setTab]=useState<Tab>('what')
  const [scenario,setScenario]=useState<ScenarioInput>({onTimePayments:0,creditUtilisation:80,accountAge:0,inquiries:2})

  const score=estimateScore(scenario)
  const band=SCORE_BANDS.find(b=>{const[min,max]=b.range.split('–').map(Number);return score>=min&&score<=max})||SCORE_BANDS[SCORE_BANDS.length-1]

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{position:'relative',overflow:'hidden',background:'var(--bg-surface)',border:'1px solid rgba(250,204,21,0.25)',borderRadius:16,padding:'16px 18px'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,var(--gold),transparent)'}}/>
        <div style={{fontSize:'0.58rem',fontFamily:'var(--font-mono)',color:'var(--gold)',letterSpacing:'0.09em',marginBottom:4}}>CREDIT SCORE EDUCATION</div>
        <div style={{fontSize:'1rem',fontWeight:700,color:'var(--text-primary)'}}>Build credit before you need it</div>
        <div style={{fontSize:'0.73rem',color:'var(--text-secondary)',marginTop:3}}>Your score determines your rent, car, home loan, and even job offers</div>
      </div>

      <div style={{display:'flex',gap:0,overflowX:'auto',borderBottom:'1px solid var(--border-subtle)'}}>
        {([['what','What is it','📊'],['bands','Score bands','🎯'],['build','How to build','🏗️'],['sa_rights','SA Rights','🛡️'],['simulator','Simulator','🔢']] as [Tab,string,string][]).map(([id,l,e])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flexShrink:0,padding:'8px 10px',background:'none',border:'none',borderBottom:tab===id?'2px solid var(--gold)':'2px solid transparent',color:tab===id?'var(--gold)':'var(--text-tertiary)',fontSize:'0.65rem',fontFamily:'var(--font-mono)',fontWeight:tab===id?700:400,cursor:'pointer',marginBottom:-1,whiteSpace:'nowrap'}}>
            {e} {l}
          </button>
        ))}
      </div>

      {tab==='what'&&(
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div style={{padding:'12px 14px',background:'rgba(250,204,21,0.05)',border:'1px solid rgba(250,204,21,0.15)',borderRadius:10,fontSize:'0.75rem',color:'var(--text-secondary)',lineHeight:1.7}}>
            A <strong style={{color:'var(--text-primary)'}}>credit score</strong> (300–850) is a number that tells lenders how likely you are to repay debt. In South Africa, it&apos;s also used by landlords to approve leases, employers for financial roles, and banks to set your interest rate. <strong style={{color:'var(--text-primary)'}}>The higher, the better.</strong>
          </div>
          <div style={{fontSize:'0.72rem',fontWeight:700,color:'var(--text-tertiary)',fontFamily:'var(--font-mono)',letterSpacing:'0.06em',marginTop:4}}>5 FACTORS THAT BUILD YOUR SCORE</div>
          {FACTORS.map(f=>(
            <div key={f.name} style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:11,padding:'11px 14px',display:'flex',gap:12}}>
              <span style={{fontSize:'1.2rem',flexShrink:0,marginTop:1}}>{f.icon}</span>
              <div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                  <div style={{fontSize:'0.8rem',fontWeight:600,color:'var(--text-primary)'}}>{f.name}</div>
                  <div style={{fontSize:'0.7rem',fontWeight:700,fontFamily:'var(--font-mono)',color:'var(--gold)'}}>{f.weight}</div>
                </div>
                <div style={{fontSize:'0.7rem',color:'var(--text-secondary)',lineHeight:1.6}}>{f.tip}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==='bands'&&(
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <div style={{fontSize:'0.72rem',color:'var(--text-secondary)',lineHeight:1.6}}>South African credit scores run from 300 (no credit history) to 850 (perfect). Here is what each band means for your life.</div>
          {SCORE_BANDS.map((b,i)=>(
            <div key={i} style={{background:'var(--bg-surface)',border:`1px solid ${b.color}30`,borderLeft:`3px solid ${b.color}`,borderRadius:11,padding:'11px 14px'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <div style={{fontSize:'0.86rem',fontWeight:700,color:b.color}}>{b.label}</div>
                <div style={{fontSize:'0.72rem',fontFamily:'var(--font-mono)',color:'var(--text-tertiary)'}}>{b.range}</div>
              </div>
              <div style={{fontSize:'0.72rem',color:'var(--text-secondary)',lineHeight:1.6}}>{b.benefit}</div>
            </div>
          ))}
        </div>
      )}

      {tab==='build'&&(
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div style={{fontSize:'0.72rem',color:'var(--text-secondary)',lineHeight:1.6}}>Most students have no credit history — which means no score. Here is how to build from zero, cheaply, while studying.</div>
          {STUDENT_STEPS.map(s=>(
            <div key={s.step} style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:12,padding:'12px 14px',display:'flex',gap:12}}>
              <div style={{width:26,height:26,borderRadius:'50%',background:'rgba(250,204,21,0.12)',border:'1px solid rgba(250,204,21,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.75rem',fontWeight:800,fontFamily:'var(--font-mono)',color:'var(--gold)',flexShrink:0}}>{s.step}</div>
              <div>
                <div style={{fontSize:'0.82rem',fontWeight:600,color:'var(--text-primary)',marginBottom:4}}>{s.title}</div>
                <div style={{fontSize:'0.72rem',color:'var(--text-secondary)',lineHeight:1.65}}>{s.body}</div>
              </div>
            </div>
          ))}
          <div style={{padding:'10px 14px',background:'rgba(52,211,153,0.06)',border:'1px solid rgba(52,211,153,0.15)',borderRadius:9,fontSize:'0.7rem',color:'var(--teal)',lineHeight:1.6}}>
            💡 ClearScore SA (clearscore.com/za) gives you a free monthly score — no credit card required. Check it every month to track your progress.
          </div>
        </div>
      )}

      {tab==='sa_rights'&&(
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div style={{padding:'10px 14px',background:'rgba(99,102,241,0.06)',border:'1px solid rgba(99,102,241,0.15)',borderRadius:10,fontSize:'0.72rem',color:'var(--text-secondary)',lineHeight:1.6}}>
            South Africa has strong consumer credit rights under the <strong style={{color:'var(--text-primary)'}}>National Credit Act (NCA)</strong>. Most students don&apos;t know these protections exist.
          </div>

          <div style={{fontSize:'0.68rem',fontFamily:'var(--font-mono)',color:'var(--text-tertiary)',letterSpacing:'0.07em',textTransform:'uppercase',marginTop:4}}>The 3 credit bureaus in SA</div>
          {[
            {name:'Experian SA',detail:'One of the largest. Used by most major banks and landlords. Free annual report at experian.co.za.',link:'https://www.experian.co.za'},
            {name:'TransUnion SA',detail:'Heavily used in retail and vehicle finance decisions. Free annual report at transunion.co.za.',link:'https://www.transunion.co.za'},
            {name:'XDS (Xpert Decision Systems)',detail:'Smaller bureau, common in telecom and retail credit. Part of the same NCA dispute rights.',link:'https://www.xds.co.za'},
          ].map(b=>(
            <div key={b.name} style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:11,padding:'11px 14px'}}>
              <div style={{fontSize:'0.8rem',fontWeight:700,color:'var(--gold)',marginBottom:3}}>{b.name}</div>
              <div style={{fontSize:'0.7rem',color:'var(--text-secondary)',lineHeight:1.55}}>{b.detail}</div>
            </div>
          ))}

          <div style={{fontSize:'0.68rem',fontFamily:'var(--font-mono)',color:'var(--text-tertiary)',letterSpacing:'0.07em',textTransform:'uppercase',marginTop:4}}>Your rights under the NCA</div>
          {[
            {right:'Free annual credit report',detail:'Every South African is entitled to one free credit report per year from each bureau. You have 3 bureaus = 3 free reports. Space them across the year (Jan, May, Sep) to monitor your score quarterly for free.'},
            {right:'Right to dispute errors',detail:'If you find incorrect information on your report (wrong amount, wrong account, wrong status), you can dispute it. The bureau has 20 business days to investigate and respond. If they can\'t verify the information, it must be removed.'},
            {right:'Prescribed debt',detail:'Debt that is more than 3 years old (for unsecured debt) and where no payment or court action has occurred may be "prescribed" — meaning the creditor loses the right to collect it. This does not apply to home loans, maintenance orders, or recent student loans.'},
            {right:'Debt counselling protection',detail:'If you are over-indebted (debt repayments exceed income), you have the right to apply for debt counselling under Section 86 of the NCA. A registered debt counsellor (NCR-registered) restructures your payments. No creditor can take legal action while you are in counselling.'},
          ].map(r=>(
            <div key={r.right} style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderLeft:'3px solid var(--teal)',borderRadius:11,padding:'11px 14px'}}>
              <div style={{fontSize:'0.78rem',fontWeight:600,color:'var(--text-primary)',marginBottom:4}}>{r.right}</div>
              <div style={{fontSize:'0.7rem',color:'var(--text-secondary)',lineHeight:1.6}}>{r.detail}</div>
            </div>
          ))}

          <div style={{fontSize:'0.68rem',fontFamily:'var(--font-mono)',color:'var(--text-tertiary)',letterSpacing:'0.07em',textTransform:'uppercase',marginTop:4}}>NSFAS &amp; student loan defaults</div>
          {[
            {q:'Does NSFAS default hit my credit score?',a:'NSFAS is a bursary-grant system for qualifying students — if you qualify under the means test, your NSFAS debt is converted to a bursary and does not hit credit bureaus. However, if NSFAS deems you ineligible after funding (e.g., income fraud discovered), you may owe the full amount, and failure to repay can be referred to a debt collector which does hit your record.'},
            {q:'What about private student loans?',a:'Private student loans (e.g., FUNDI, Standard Bank Student Loan, Nedbank Education Loan) behave like any other credit. Missed payments are reported to bureaus and affect your score the same as a credit card default. Set debit orders — never miss these payments.'},
            {q:'How do I rebuild credit after a default?',a:'1. Negotiate a settlement with the lender — get it in writing. 2. Once paid, request a "paid-up letter" and give it to the bureau to update your record. 3. Open a new secured account (prepaid credit card or small store account). 4. Pay perfectly for 12 months. 5. A default stays on your record for 5 years, but a pattern of good payments after it significantly improves your score.'},
          ].map(r=>(
            <div key={r.q} style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderLeft:'3px solid var(--coral)',borderRadius:11,padding:'11px 14px'}}>
              <div style={{fontSize:'0.76rem',fontWeight:600,color:'var(--text-primary)',marginBottom:4}}>{r.q}</div>
              <div style={{fontSize:'0.7rem',color:'var(--text-secondary)',lineHeight:1.6}}>{r.a}</div>
            </div>
          ))}

          <div style={{padding:'10px 14px',background:'rgba(78,207,158,0.06)',border:'1px solid rgba(78,207,158,0.12)',borderRadius:9}}>
            <div style={{fontSize:'0.7rem',fontWeight:700,color:'var(--teal)',marginBottom:3}}>Need debt help?</div>
            <div style={{fontSize:'0.67rem',color:'var(--text-tertiary)',lineHeight:1.55}}>NCR (National Credit Regulator) helpline: <strong style={{color:'var(--text-primary)'}}>0860 627 627</strong> · DebtBusters: 0861 663 328 · Both offer free consultations before committing to debt review.</div>
          </div>
        </div>
      )}

      {tab==='simulator'&&(
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{textAlign:'center',padding:'16px',background:'var(--bg-surface)',border:`2px solid ${band.color}30`,borderRadius:14}}>
            <div style={{fontSize:'2.5rem',fontWeight:900,fontFamily:'var(--font-mono)',color:band.color,lineHeight:1}}>{score}</div>
            <div style={{fontSize:'0.82rem',fontWeight:700,color:band.color,marginTop:3}}>{band.label}</div>
            <div style={{fontSize:'0.68rem',color:'var(--text-muted)',marginTop:4}}>{band.range}</div>
          </div>
          <div style={{padding:'9px 12px',background:`${band.color}0f`,border:`1px solid ${band.color}25`,borderRadius:9,fontSize:'0.7rem',color:'var(--text-secondary)',lineHeight:1.6}}>{band.benefit}</div>

          {[
            {label:'On-time payments made (months)',key:'onTimePayments',min:0,max:36,step:1,unit:'months'},
            {label:'Credit utilisation %',key:'creditUtilisation',min:0,max:100,step:5,unit:'%'},
            {label:'Oldest account age (months)',key:'accountAge',min:0,max:120,step:6,unit:'months'},
            {label:'New credit applications this year',key:'inquiries',min:0,max:10,step:1,unit:''},
          ].map(({label,key,min,max,step,unit})=>(
            <div key={key}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <div style={{fontSize:'0.68rem',color:'var(--text-tertiary)'}}>{label}</div>
                <div style={{fontSize:'0.72rem',fontFamily:'var(--font-mono)',color:'var(--text-primary)',fontWeight:600}}>{scenario[key as keyof ScenarioInput]}{unit}</div>
              </div>
              <input type="range" min={min} max={max} step={step} value={scenario[key as keyof ScenarioInput]}
                onChange={e=>setScenario(v=>({...v,[key]:parseInt(e.target.value)}))}
                style={{width:'100%',accentColor:'var(--gold)'}}/>
            </div>
          ))}

          <div style={{fontSize:'0.65rem',color:'var(--text-muted)',lineHeight:1.6,marginTop:4}}>
            This is an educational estimator — not your actual score. Check ClearScore for your real score.
          </div>
        </div>
      )}
    </div>
  )
}
