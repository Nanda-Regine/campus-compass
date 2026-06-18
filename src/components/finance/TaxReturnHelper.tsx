'use client'
// ─── Tax Return Helper ────────────────────────────────────────
// SARS eFiling guide, IRP5 tracker, basic refund calculator
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store'

type Tab='calc'|'irp5'|'guide'|'deadlines'|'learn'
const TABS:{id:Tab;label:string;icon:string}[]=[
  {id:'calc',      label:'Refund Calc', icon:'🧮'},
  {id:'irp5',      label:'My IRP5s',    icon:'📄'},
  {id:'guide',     label:'How to File', icon:'📋'},
  {id:'deadlines', label:'Deadlines',   icon:'📅'},
  {id:'learn',     label:'Tax 101',     icon:'🎓'},
]

interface IRP5{id:number;employer:string;grossIncome:number;taxWithheld:number;year:string}

// DB row shape returned from Supabase
interface IRP5Row{
  id: string
  user_id: string
  employer: string
  gross_income: number
  tax_withheld: number
  tax_year: number
  deleted_at: string | null
  created_at: string
  updated_at: string
}

function rowToIRP5(row: IRP5Row): IRP5 {
  return {
    id: parseInt(row.id.replace(/-/g, '').slice(0, 8), 16), // stable numeric proxy from UUID
    employer: row.employer,
    grossIncome: Number(row.gross_income),
    taxWithheld: Number(row.tax_withheld),
    year: String(row.tax_year),
  }
}

// Internal representation keeps the UUID for DB operations
interface IRP5WithUUID extends IRP5 { uuid: string }

export default function TaxReturnHelper() {
  const [tab,setTab]=useState<Tab>('calc')
  const [irp5s,setIRP5s]=useState<IRP5WithUUID[]>([])

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{position:'relative',overflow:'hidden',background:'var(--bg-surface)',border:'1px solid rgba(var(--gold-rgb,212,175,55),0.3)',borderRadius:16,padding:'16px 18px'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,var(--gold),transparent)'}}/>
        <div style={{fontSize:'0.58rem',fontFamily:'var(--font-mono)',color:'var(--gold)',letterSpacing:'0.09em',marginBottom:4}}>TAX RETURN HELPER</div>
        <div style={{fontSize:'1rem',fontWeight:700,color:'var(--text-primary)'}}>Get your money back from SARS</div>
        <div style={{fontSize:'0.73rem',color:'var(--text-secondary)',marginTop:3}}>IRP5 tracker · Refund calculator · eFiling step-by-step guide</div>
      </div>

      <div style={{display:'flex',gap:0,overflowX:'auto',borderBottom:'1px solid var(--border-subtle)'}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flexShrink:0,padding:'8px 10px',background:'none',border:'none',borderBottom:tab===t.id?'2px solid var(--gold)':'2px solid transparent',color:tab===t.id?'var(--gold)':'var(--text-tertiary)',fontSize:'0.67rem',fontFamily:'var(--font-mono)',fontWeight:tab===t.id?700:400,cursor:'pointer',marginBottom:-1,whiteSpace:'nowrap'}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab==='calc'&&<RefundCalc irp5s={irp5s}/>}
      {tab==='irp5'&&<IRP5Tracker irp5s={irp5s} setIRP5s={setIRP5s}/>}
      {tab==='guide'&&<FilingGuide/>}
      {tab==='deadlines'&&<Deadlines/>}
      {tab==='learn'&&<TaxLearn/>}
    </div>
  )
}

function RefundCalc({irp5s}:{irp5s:IRP5WithUUID[]}) {
  const [manual,setManual]=useState({grossIncome:'',taxWithheld:''})
  const useIRP5=irp5s.length>0
  const gross=useIRP5?irp5s.reduce((a,b)=>a+b.grossIncome,0):parseFloat(manual.grossIncome)||0
  const withheld=useIRP5?irp5s.reduce((a,b)=>a+b.taxWithheld,0):parseFloat(manual.taxWithheld)||0

  // SA 2025/26 tax brackets
  function calcTax(income:number):number{
    if(income<=237100)    return income*0.18
    if(income<=370500)    return 42678+(income-237100)*0.26
    if(income<=512800)    return 77362+(income-370500)*0.31
    if(income<=673000)    return 121475+(income-512800)*0.36
    if(income<=857900)    return 179147+(income-673000)*0.39
    if(income<=1817000)   return 251258+(income-857900)*0.41
    return 644489+(income-1817000)*0.45
  }

  // Primary rebate 2025/26
  const REBATE_PRIMARY=17235
  const taxLiability=Math.max(0,calcTax(gross)-REBATE_PRIMARY)
  const refund=Math.max(0,withheld-taxLiability)
  const owes=Math.max(0,taxLiability-withheld)

  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      {!useIRP5&&(
        <div style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:12,padding:'14px',display:'flex',flexDirection:'column',gap:10}}>
          <div style={{fontSize:'0.7rem',color:'var(--text-muted)',marginBottom:4}}>Don't have your IRP5s yet? Enter manually:</div>
          <input type="number" inputMode="decimal" aria-label="Total gross income in rands" placeholder="Total gross income (R)" value={manual.grossIncome} onChange={e=>setManual(v=>({...v,grossIncome:e.target.value}))} style={{padding:'9px 12px',background:'var(--bg-base)',border:'1px solid var(--border-default)',borderRadius:8,color:'var(--text-primary)',fontSize:'0.82rem',fontFamily:'var(--font-mono)'}}/>
          <input type="number" inputMode="decimal" aria-label="Total PAYE tax withheld in rands" placeholder="Total PAYE withheld (R)" value={manual.taxWithheld} onChange={e=>setManual(v=>({...v,taxWithheld:e.target.value}))} style={{padding:'9px 12px',background:'var(--bg-base)',border:'1px solid var(--border-default)',borderRadius:8,color:'var(--text-primary)',fontSize:'0.82rem',fontFamily:'var(--font-mono)'}}/>
        </div>
      )}

      {useIRP5&&<div style={{padding:'8px 12px',background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.2)',borderRadius:8,fontSize:'0.7rem',color:'var(--teal)'}}>✓ Using {irp5s.length} IRP5{irp5s.length!==1?'s':''} from your tracker</div>}

      {gross>0&&(
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:12,padding:'14px',display:'flex',flexDirection:'column',gap:8}}>
            {[{l:'Gross income',v:`R${gross.toLocaleString('en-ZA')}`},{l:'Tax liability (estimated)',v:`R${taxLiability.toLocaleString('en-ZA',{maximumFractionDigits:0})}`},{l:'PAYE already paid',v:`R${withheld.toLocaleString('en-ZA')}`}].map(r=>(
              <div key={r.l} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border-subtle)'}}>
                <span style={{fontSize:'0.75rem',color:'var(--text-secondary)'}}>{r.l}</span>
                <span style={{fontSize:'0.8rem',fontFamily:'var(--font-mono)',fontWeight:600,color:'var(--text-primary)'}}>{r.v}</span>
              </div>
            ))}
          </div>

          <div style={{position:'relative',overflow:'hidden',background:refund>0?'rgba(52,211,153,0.06)':'rgba(232,112,64,0.06)',border:`1px solid ${refund>0?'rgba(52,211,153,0.25)':'rgba(232,112,64,0.25)'}`,borderRadius:14,padding:'16px 18px',textAlign:'center'}}>
            <div style={{fontSize:'0.65rem',fontFamily:'var(--font-mono)',color:refund>0?'var(--teal)':'var(--coral)',letterSpacing:'0.08em',marginBottom:4}}>{refund>0?'ESTIMATED REFUND':'ESTIMATED TAX OWED'}</div>
            <div style={{fontSize:'1.8rem',fontWeight:800,color:refund>0?'var(--teal)':'var(--coral)',fontFamily:'var(--font-mono)'}}>R{(refund||owes).toLocaleString('en-ZA',{maximumFractionDigits:0})}</div>
            <div style={{fontSize:'0.65rem',color:'var(--text-muted)',marginTop:6}}>Estimate only — actual refund depends on additional deductions, medical credits, and SARS assessment.</div>
          </div>

          {refund>0&&<div style={{padding:'10px 14px',background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:10,fontSize:'0.72rem',color:'var(--text-secondary)',lineHeight:1.6}}>
            💡 <strong>Deductions you might be missing:</strong> Retirement annuity contributions (up to 27.5% of income), medical aid credits if not employer-covered, travel logbook if you work and use your car.
          </div>}
        </div>
      )}

      {gross===0&&<div style={{textAlign:'center',padding:'24px',color:'var(--text-muted)',fontSize:'0.75rem'}}>Enter your income above or add IRP5s in the My IRP5s tab.</div>}

      <div style={{padding:'10px 14px',background:'rgba(245,158,11,0.06)',border:'1px solid rgba(245,158,11,0.15)',borderRadius:10,fontSize:'0.68rem',color:'var(--text-tertiary)',lineHeight:1.55}}>
        ⚠️ This is a simplified estimate using 2025/26 brackets and the primary rebate only. Use SARS eFiling or a tax practitioner for your actual return.
      </div>
    </div>
  )
}

// ── Skeleton row ──────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:10,padding:'11px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        <div style={{width:140,height:12,borderRadius:6,background:'var(--border-subtle)'}}/>
        <div style={{width:200,height:10,borderRadius:6,background:'var(--border-subtle)',opacity:0.6}}/>
      </div>
      <div style={{width:32,height:12,borderRadius:6,background:'var(--border-subtle)',opacity:0.4}}/>
    </div>
  )
}

// ── IRP5 Tracker — Supabase-backed ────────────────────────────
function IRP5Tracker({
  irp5s,
  setIRP5s,
}: {
  irp5s: IRP5WithUUID[]
  setIRP5s: React.Dispatch<React.SetStateAction<IRP5WithUUID[]>>
}) {
  const userId = useAppStore(s => s.userId)
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editingUUID, setEditingUUID] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const emptyForm = {employer:'',grossIncome:'',taxWithheld:'',year:new Date().getFullYear().toString()}
  const [form, setForm] = useState(emptyForm)

  // ── Load on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!userId) { setLoading(false); return }
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from('tax_irp5s')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('tax_year', { ascending: false })
      if (cancelled) return
      if (error) {
        toast.error('Failed to load IRP5s')
      } else {
        const rows = (data as IRP5Row[]).map(row => ({
          ...rowToIRP5(row),
          uuid: row.id,
        }))
        setIRP5s(rows)
      }
      setLoading(false)
    })()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // ── Create ─────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!form.employer || !form.grossIncome) return
    if (!userId) { toast.error('Not signed in'); return }
    setSaving(true)
    const payload = {
      user_id: userId,
      employer: form.employer.trim(),
      gross_income: parseFloat(form.grossIncome) || 0,
      tax_withheld: parseFloat(form.taxWithheld) || 0,
      tax_year: parseInt(form.year, 10) || new Date().getFullYear(),
    }
    const { data, error } = await supabase
      .from('tax_irp5s')
      .insert(payload)
      .select()
      .single()
    setSaving(false)
    if (error) { toast.error('Could not save IRP5'); return }
    const row = data as IRP5Row
    setIRP5s(prev => [{ ...rowToIRP5(row), uuid: row.id }, ...prev].sort((a,b)=>parseInt(b.year)-parseInt(a.year)))
    setAdding(false)
    setForm(emptyForm)
    toast.success('IRP5 added')
  }

  // ── Begin edit — pre-fill form ─────────────────────────────
  const startEdit = (item: IRP5WithUUID) => {
    setEditingUUID(item.uuid)
    setAdding(true)
    setForm({
      employer: item.employer,
      grossIncome: String(item.grossIncome),
      taxWithheld: String(item.taxWithheld),
      year: item.year,
    })
  }

  // ── Update ─────────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!form.employer || !form.grossIncome || !editingUUID) return
    setSaving(true)
    const payload = {
      employer: form.employer.trim(),
      gross_income: parseFloat(form.grossIncome) || 0,
      tax_withheld: parseFloat(form.taxWithheld) || 0,
      tax_year: parseInt(form.year, 10) || new Date().getFullYear(),
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase
      .from('tax_irp5s')
      .update(payload)
      .eq('id', editingUUID)
      .select()
      .single()
    setSaving(false)
    if (error) { toast.error('Could not update IRP5'); return }
    const row = data as IRP5Row
    setIRP5s(prev =>
      prev
        .map(x => x.uuid === editingUUID ? { ...rowToIRP5(row), uuid: row.id } : x)
        .sort((a,b) => parseInt(b.year) - parseInt(a.year))
    )
    setAdding(false)
    setEditingUUID(null)
    setForm(emptyForm)
    toast.success('IRP5 updated')
  }

  // ── Soft delete ────────────────────────────────────────────
  const handleDelete = async (uuid: string) => {
    // Optimistic removal
    setIRP5s(prev => prev.filter(x => x.uuid !== uuid))
    const { error } = await supabase
      .from('tax_irp5s')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', uuid)
    if (error) {
      toast.error('Could not remove IRP5')
      // Re-fetch to restore
      if (userId) {
        const { data } = await supabase
          .from('tax_irp5s')
          .select('*')
          .eq('user_id', userId)
          .is('deleted_at', null)
          .order('tax_year', { ascending: false })
        if (data) setIRP5s((data as IRP5Row[]).map(r => ({ ...rowToIRP5(r), uuid: r.id })))
      }
    } else {
      toast.success('IRP5 removed')
    }
  }

  const cancelForm = () => {
    setAdding(false)
    setEditingUUID(null)
    setForm(emptyForm)
  }

  const years = [...new Set(irp5s.map(i => i.year))]

  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <div style={{fontSize:'0.7rem',color:'var(--text-secondary)',lineHeight:1.6}}>An IRP5 is issued by every employer you worked for. Part-time jobs, vacation work, and learnerships all generate IRP5s.</div>

      {loading ? (
        <>
          <SkeletonRow/>
          <SkeletonRow/>
        </>
      ) : (
        years.map(y=>(
          <div key={y}>
            <div style={{fontSize:'0.62rem',fontFamily:'var(--font-mono)',color:'var(--text-muted)',marginBottom:6}}>TAX YEAR {y}</div>
            {irp5s.filter(i=>i.year===y).map(i=>(
              <div key={i.uuid} style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:10,padding:'11px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                <div>
                  <div style={{fontSize:'0.82rem',fontWeight:600,color:'var(--text-primary)'}}>{i.employer}</div>
                  <div style={{fontSize:'0.65rem',color:'var(--text-tertiary)',marginTop:1}}>Gross: R{i.grossIncome.toLocaleString('en-ZA')} · PAYE: R{i.taxWithheld.toLocaleString('en-ZA')}</div>
                </div>
                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                  <button
                    onClick={()=>startEdit(i)}
                    title="Edit"
                    style={{fontSize:'0.75rem',color:'var(--text-muted)',background:'none',border:'none',cursor:'pointer',padding:'2px 4px'}}
                  >✏️</button>
                  <button
                    onClick={()=>handleDelete(i.uuid)}
                    title="Remove"
                    style={{fontSize:'0.65rem',color:'var(--text-muted)',background:'none',border:'none',cursor:'pointer',padding:'2px 4px'}}
                  >✕</button>
                </div>
              </div>
            ))}
          </div>
        ))
      )}

      {adding ? (
        <div style={{background:'var(--bg-elevated)',border:'1px solid var(--border-default)',borderRadius:12,padding:'14px',display:'flex',flexDirection:'column',gap:10}}>
          {editingUUID && (
            <div style={{fontSize:'0.62rem',fontFamily:'var(--font-mono)',color:'var(--gold)',letterSpacing:'0.06em',marginBottom:2}}>EDITING IRP5</div>
          )}
          <input placeholder="Employer name *" value={form.employer} onChange={e=>setForm(v=>({...v,employer:e.target.value}))} style={{padding:'8px 12px',background:'var(--bg-base)',border:'1px solid var(--border-default)',borderRadius:8,color:'var(--text-primary)',fontSize:'0.82rem'}}/>
          <input type="number" inputMode="decimal" aria-label="Gross income in rands" placeholder="Gross income (R) *" value={form.grossIncome} onChange={e=>setForm(v=>({...v,grossIncome:e.target.value}))} style={{padding:'8px 12px',background:'var(--bg-base)',border:'1px solid var(--border-default)',borderRadius:8,color:'var(--text-primary)',fontSize:'0.82rem',fontFamily:'var(--font-mono)'}}/>
          <input type="number" inputMode="decimal" aria-label="PAYE tax withheld in rands" placeholder="PAYE tax withheld (R)" value={form.taxWithheld} onChange={e=>setForm(v=>({...v,taxWithheld:e.target.value}))} style={{padding:'8px 12px',background:'var(--bg-base)',border:'1px solid var(--border-default)',borderRadius:8,color:'var(--text-primary)',fontSize:'0.82rem',fontFamily:'var(--font-mono)'}}/>
          <input type="number" inputMode="numeric" aria-label="Tax year" placeholder="Tax year (e.g. 2025)" value={form.year} onChange={e=>setForm(v=>({...v,year:e.target.value}))} style={{padding:'8px 12px',background:'var(--bg-base)',border:'1px solid var(--border-default)',borderRadius:8,color:'var(--text-primary)',fontSize:'0.82rem',fontFamily:'var(--font-mono)'}}/>
          <div style={{display:'flex',gap:8}}>
            <button
              onClick={editingUUID ? handleUpdate : handleAdd}
              disabled={saving}
              style={{flex:1,padding:'9px 0',background:'rgba(212,175,55,0.1)',border:'1px solid rgba(212,175,55,0.25)',borderRadius:8,color:'var(--gold)',fontSize:'0.73rem',fontFamily:'var(--font-mono)',fontWeight:700,cursor:saving?'not-allowed':'pointer',opacity:saving?0.6:1}}
            >
              {saving ? 'Saving…' : editingUUID ? 'Save Changes' : 'Add IRP5'}
            </button>
            <button onClick={cancelForm} style={{padding:'9px 14px',background:'transparent',border:'1px solid var(--border-subtle)',borderRadius:8,color:'var(--text-tertiary)',fontSize:'0.73rem',cursor:'pointer'}}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={()=>setAdding(true)} style={{padding:'11px 0',background:'rgba(212,175,55,0.06)',border:'1px solid rgba(212,175,55,0.2)',borderRadius:10,color:'var(--gold)',fontSize:'0.78rem',fontFamily:'var(--font-mono)',fontWeight:700,cursor:'pointer'}}>+ Add IRP5</button>
      )}
    </div>
  )
}

function FilingGuide() {
  const [open,setOpen]=useState<number|null>(0)
  const steps=[
    {num:1,title:'Register on SARS eFiling',detail:'Go to efiling.sars.gov.za → Register → Individual. You need your ID number, cell number, and email. If under 18 you may need a guardian. Keep your login details safe — you use them every year.'},
    {num:2,title:'Activate your tax number',detail:'If you don\'t have a tax number, register at any SARS branch or online. A tax number is required before you can file. Working students get a tax number automatically when their employer registers them.'},
    {num:3,title:'Wait for your IRP5(s)',detail:'Employers must submit IRP5s to SARS by the end of May. These auto-populate on your eFiling return under "IRP5 Certificates". Check under "Import" if they don\'t show. Chase employers if missing.'},
    {num:4,title:'Complete your ITR12',detail:'eFiling auto-populates from IRP5 data. Review each section: Personal details, Income, Deductions (RA, medical), Local Interest (bank interest earned). Don\'t claim what you can\'t prove.'},
    {num:5,title:'Submit and wait',detail:'Click Submit. SARS has 21 business days to assess. You\'ll receive an IT34 notice of assessment. Check it — it shows either a refund amount or additional tax owed.'},
    {num:6,title:'Track your refund',detail:'Log into eFiling → "My Compliance Profile" or check your bank for a SARS deposit. If no refund after 21 days, raise a query via eFiling or call 0800 00 7277.'},
  ]
  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {steps.map((s,i)=>(
        <div key={i} style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:11,overflow:'hidden'}}>
          <button onClick={()=>setOpen(open===i?null:i)} style={{display:'flex',alignItems:'center',gap:12,width:'100%',padding:'12px 14px',background:'none',border:'none',cursor:'pointer',textAlign:'left'}}>
            <div style={{width:24,height:24,borderRadius:'50%',background:'rgba(212,175,55,0.15)',border:'1px solid rgba(212,175,55,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.68rem',fontWeight:700,color:'var(--gold)',flexShrink:0}}>{s.num}</div>
            <span style={{fontSize:'0.82rem',fontWeight:600,color:'var(--text-primary)',flex:1}}>{s.title}</span>
            <span style={{fontSize:'0.6rem',color:'var(--text-muted)',flexShrink:0,transform:open===i?'rotate(180deg)':'none',transition:'transform 0.2s'}}>▾</span>
          </button>
          {open===i&&<div style={{padding:'0 14px 12px 50px',fontSize:'0.75rem',color:'var(--text-secondary)',lineHeight:1.65}}>{s.detail}</div>}
        </div>
      ))}
    </div>
  )
}

function Deadlines() {
  const deadlines=[
    {date:'31 May',item:'Employers submit IRP5s to SARS',done:false},
    {date:'01 Jul',item:'eFiling season opens for salaried individuals',done:false},
    {date:'21 Oct',item:'eFiling deadline — non-provisional taxpayers',done:false},
    {date:'20 Jan (next year)',item:'Provisional taxpayers (second payment)',done:false},
    {date:'Ongoing',item:'Penalties for late filing: R250/month up to 35 months',done:false},
  ]
  const thresholds=[
    {income:'≤ R500,000',action:'No filing required IF single employer, no deductions. Still recommended to get refund.'},
    {income:'> R500,000',action:'Must file regardless of number of employers.'},
    {income:'Any amount',action:'Must file if you have multiple employers, investment income, rental income, or business income.'},
  ]
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <div style={{fontSize:'0.62rem',fontFamily:'var(--font-mono)',color:'var(--text-muted)',letterSpacing:'0.06em'}}>2025/26 KEY DATES</div>
      {deadlines.map((d,i)=>(
        <div key={i} style={{display:'flex',gap:12,padding:'10px 14px',background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:10,alignItems:'flex-start'}}>
          <div style={{minWidth:60,fontSize:'0.65rem',fontFamily:'var(--font-mono)',fontWeight:700,color:'var(--gold)',flexShrink:0}}>{d.date}</div>
          <div style={{fontSize:'0.75rem',color:'var(--text-secondary)',lineHeight:1.5}}>{d.item}</div>
        </div>
      ))}
      <div style={{fontSize:'0.62rem',fontFamily:'var(--font-mono)',color:'var(--text-muted)',letterSpacing:'0.06em',marginTop:4}}>DO YOU NEED TO FILE?</div>
      {thresholds.map((t,i)=>(
        <div key={i} style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:10,padding:'10px 14px'}}>
          <div style={{fontSize:'0.72rem',fontWeight:700,color:'var(--gold)',fontFamily:'var(--font-mono)',marginBottom:3}}>{t.income}</div>
          <div style={{fontSize:'0.73rem',color:'var(--text-secondary)',lineHeight:1.5}}>{t.action}</div>
        </div>
      ))}
    </div>
  )
}

function TaxLearn() {
  const [open,setOpen]=useState<number|null>(null)
  const items=[
    {q:'What is PAYE?',a:'Pay As You Earn. Your employer deducts income tax from each payslip and pays it to SARS on your behalf. At year end, your actual tax liability is calculated. If too much was withheld → refund. If too little → you owe.'},
    {q:'What is a tax threshold?',a:'2025/26: If you earn less than R95,750/year (under age 65), you don\'t pay income tax at all. PAYE should not be deducted. If your part-time employer deducted PAYE anyway, you\'re entitled to a full refund.'},
    {q:'What can students deduct?',a:'Retirement annuity (RA) contributions — up to 27.5% of income, max R350,000/year. Medical aid contributions not paid by an employer. 20% of home office expenses if you work from home more than 50% of the time.'},
    {q:'What is a provisional taxpayer?',a:'If you earn income beyond a salary (freelance, tutoring, selling, rentals), SARS considers you a provisional taxpayer. You pay tax estimates in August and February, then file a final return by 31 January.'},
    {q:'What happens if I don\'t file?',a:'SARS can issue an estimated assessment and charge you penalties. After 35 months of non-filing, penalties can reach R8,750. Non-compliance also blocks you from getting a tax clearance certificate — needed for many jobs and tenders.'},
  ]
  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
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
