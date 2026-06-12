'use client'
// ─── Stokvel OS ───────────────────────────────────────────────
// Group savings circle: members, contributions, payouts, ledger
import { useState } from 'react'

interface Member{id:number;name:string;phone:string;active:boolean;payoutMonth:number}
interface Contribution{id:number;memberId:number;memberName:string;amount:number;date:string;paid:boolean;month:string}
interface Dispute{id:number;description:string;reportedBy:string;date:string;resolved:boolean}

interface StokvelState{
  name:string;contribution:number;members:Member[];contributions:Contribution[];disputes:Dispute[];createdAt:string
}

const EMPTY:StokvelState={name:'',contribution:0,members:[],contributions:[],disputes:[],createdAt:''}

function loadState():StokvelState{if(typeof window==='undefined')return EMPTY;try{return JSON.parse(localStorage.getItem('varsityos-stokvel')||'null')||EMPTY}catch{return EMPTY}}
function saveState(s:StokvelState){localStorage.setItem('varsityos-stokvel',JSON.stringify(s))}

type Tab='overview'|'members'|'ledger'|'payouts'|'disputes'|'learn'
const TABS:{id:Tab;label:string;icon:string}[]=[
  {id:'overview', label:'Overview',  icon:'📊'},
  {id:'members',  label:'Members',   icon:'👥'},
  {id:'ledger',   label:'Ledger',    icon:'📒'},
  {id:'payouts',  label:'Payouts',   icon:'💵'},
  {id:'disputes', label:'Disputes',  icon:'⚠️'},
  {id:'learn',    label:'Learn',     icon:'🎓'},
]

export default function StokvelOS() {
  const [state,setState]=useState<StokvelState>(loadState)
  const [tab,setTab]=useState<Tab>(state.name?'overview':'overview')
  const [setupMode,setSetupMode]=useState(!state.name)
  const [setupForm,setSetupForm]=useState({name:'My Stokvel',contribution:'500'})

  const update=(s:StokvelState)=>{setState(s);saveState(s)}

  if(setupMode) return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{position:'relative',overflow:'hidden',background:'var(--bg-surface)',border:'1px solid rgba(52,211,153,0.25)',borderRadius:16,padding:'16px 18px'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,var(--teal),transparent)'}}/>
        <div style={{fontSize:'0.58rem',fontFamily:'var(--font-mono)',color:'var(--teal)',letterSpacing:'0.09em',marginBottom:4}}>STOKVEL OS</div>
        <div style={{fontSize:'1rem',fontWeight:700,color:'var(--text-primary)'}}>Set up your savings circle</div>
      </div>
      <div style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:14,padding:'16px',display:'flex',flexDirection:'column',gap:12}}>
        <div><div style={{fontSize:'0.7rem',color:'var(--text-tertiary)',marginBottom:4}}>Stokvel name</div><input value={setupForm.name} onChange={e=>setSetupForm(v=>({...v,name:e.target.value}))} style={{width:'100%',padding:'9px 12px',background:'var(--bg-base)',border:'1px solid var(--border-default)',borderRadius:8,color:'var(--text-primary)',fontSize:'0.82rem'}}/></div>
        <div><div style={{fontSize:'0.7rem',color:'var(--text-tertiary)',marginBottom:4}}>Monthly contribution per member (R)</div><input type="number" value={setupForm.contribution} onChange={e=>setSetupForm(v=>({...v,contribution:e.target.value}))} style={{width:'100%',padding:'9px 12px',background:'var(--bg-base)',border:'1px solid var(--border-default)',borderRadius:8,color:'var(--text-primary)',fontSize:'0.82rem',fontFamily:'var(--font-mono)'}}/></div>
        <button onClick={()=>{const s={...EMPTY,name:setupForm.name,contribution:parseFloat(setupForm.contribution)||500,createdAt:new Date().toISOString()};update(s);setSetupMode(false)}} style={{padding:'11px 0',background:'rgba(52,211,153,0.1)',border:'1px solid rgba(52,211,153,0.25)',borderRadius:10,color:'var(--teal)',fontSize:'0.78rem',fontFamily:'var(--font-mono)',fontWeight:700,cursor:'pointer'}}>Create stokvel →</button>
      </div>
    </div>
  )

  const totalFund=state.members.length*state.contribution
  const paidThisMonth=state.contributions.filter(c=>{const m=new Date().toISOString().slice(0,7);return c.month===m&&c.paid}).length
  const currentPayoutMember=state.members.find(m=>{const month=new Date().getMonth()+1;return m.payoutMonth===month})

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{position:'relative',overflow:'hidden',background:'var(--bg-surface)',border:'1px solid rgba(52,211,153,0.25)',borderRadius:16,padding:'16px 18px'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,var(--teal),transparent)'}}/>
        <div style={{fontSize:'0.58rem',fontFamily:'var(--font-mono)',color:'var(--teal)',letterSpacing:'0.09em',marginBottom:4}}>STOKVEL OS</div>
        <div style={{fontSize:'1rem',fontWeight:700,color:'var(--text-primary)'}}>{state.name}</div>
        <div style={{fontSize:'0.73rem',color:'var(--text-secondary)',marginTop:3}}>{state.members.length} members · R{state.contribution}/month each · R{totalFund.toLocaleString('en-ZA')} monthly pot</div>
      </div>

      <div style={{display:'flex',gap:0,overflowX:'auto',borderBottom:'1px solid var(--border-subtle)'}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flexShrink:0,padding:'8px 10px',background:'none',border:'none',borderBottom:tab===t.id?'2px solid var(--teal)':'2px solid transparent',color:tab===t.id?'var(--teal)':'var(--text-tertiary)',fontSize:'0.67rem',fontFamily:'var(--font-mono)',fontWeight:tab===t.id?700:400,cursor:'pointer',marginBottom:-1,whiteSpace:'nowrap'}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab==='overview'&&(
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {[{l:'Members',v:state.members.length,c:'var(--teal)'},{l:'Monthly pot',v:`R${totalFund.toLocaleString('en-ZA')}`,c:'var(--gold)'},{l:'Paid this month',v:`${paidThisMonth}/${state.members.length}`,c:paidThisMonth===state.members.length?'var(--teal)':'var(--coral)'},{l:'This month\'s payout',v:currentPayoutMember?.name||'TBC',c:'var(--nova)'}].map(s=>(
              <div key={s.l} style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:12,padding:'12px 14px'}}>
                <div style={{fontSize:'0.62rem',color:'var(--text-muted)',marginBottom:4}}>{s.l}</div>
                <div style={{fontSize:'0.95rem',fontWeight:700,color:s.c,fontFamily:'var(--font-mono)'}}>{s.v}</div>
              </div>
            ))}
          </div>
          {paidThisMonth<state.members.length&&state.members.length>0&&(
            <div style={{padding:'10px 14px',background:'rgba(232,112,64,0.08)',border:'1px solid rgba(232,112,64,0.2)',borderRadius:10,fontSize:'0.72rem',color:'var(--coral)'}}>
              ⚠️ {state.members.length-paidThisMonth} member{state.members.length-paidThisMonth!==1?'s':''} have not yet contributed this month.
            </div>
          )}
          <button onClick={()=>{update({...EMPTY,createdAt:state.createdAt});setSetupMode(true)}} style={{padding:'9px 0',background:'transparent',border:'1px solid var(--border-subtle)',borderRadius:8,color:'var(--text-muted)',fontSize:'0.68rem',fontFamily:'var(--font-mono)',cursor:'pointer'}}>Reset stokvel</button>
        </div>
      )}

      {tab==='members'&&<MembersTab state={state} update={update}/>}
      {tab==='ledger' &&<LedgerTab state={state} update={update}/>}
      {tab==='payouts'&&<PayoutsTab state={state} update={update}/>}
      {tab==='disputes'&&<DisputesTab state={state} update={update}/>}
      {tab==='learn'  &&<LearnTab/>}
    </div>
  )
}

function MembersTab({state,update}:{state:StokvelState;update:(s:StokvelState)=>void}) {
  const [form,setForm]=useState({name:'',phone:''})
  const [adding,setAdding]=useState(false)
  const add=()=>{if(!form.name)return;const m:Member={id:Date.now(),name:form.name,phone:form.phone,active:true,payoutMonth:state.members.length+1};update({...state,members:[...state.members,m]});setForm({name:'',phone:''});setAdding(false)}
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      {state.members.map(m=>(
        <div key={m.id} style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:10,padding:'11px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontSize:'0.82rem',fontWeight:600,color:'var(--text-primary)'}}>{m.name}</div>
            <div style={{fontSize:'0.65rem',color:'var(--text-tertiary)',marginTop:2}}>{m.phone?m.phone+' · ':''} Payout: month {m.payoutMonth}</div>
          </div>
          <button onClick={()=>update({...state,members:state.members.filter(x=>x.id!==m.id)})} style={{fontSize:'0.65rem',color:'var(--text-muted)',background:'none',border:'none',cursor:'pointer'}}>✕</button>
        </div>
      ))}
      {adding?(
        <div style={{background:'var(--bg-elevated)',border:'1px solid var(--border-default)',borderRadius:12,padding:'14px',display:'flex',flexDirection:'column',gap:10}}>
          <input placeholder="Member name *" value={form.name} onChange={e=>setForm(v=>({...v,name:e.target.value}))} style={{padding:'8px 12px',background:'var(--bg-base)',border:'1px solid var(--border-default)',borderRadius:8,color:'var(--text-primary)',fontSize:'0.82rem'}}/>
          <input placeholder="Phone number (optional)" value={form.phone} onChange={e=>setForm(v=>({...v,phone:e.target.value}))} style={{padding:'8px 12px',background:'var(--bg-base)',border:'1px solid var(--border-default)',borderRadius:8,color:'var(--text-primary)',fontSize:'0.82rem'}}/>
          <div style={{display:'flex',gap:8}}>
            <button onClick={add} style={{flex:1,padding:'9px 0',background:'rgba(52,211,153,0.1)',border:'1px solid rgba(52,211,153,0.25)',borderRadius:8,color:'var(--teal)',fontSize:'0.73rem',fontFamily:'var(--font-mono)',fontWeight:700,cursor:'pointer'}}>Add</button>
            <button onClick={()=>setAdding(false)} style={{padding:'9px 14px',background:'transparent',border:'1px solid var(--border-subtle)',borderRadius:8,color:'var(--text-tertiary)',fontSize:'0.73rem',cursor:'pointer'}}>Cancel</button>
          </div>
        </div>
      ):(
        <button onClick={()=>setAdding(true)} style={{padding:'11px 0',background:'rgba(52,211,153,0.06)',border:'1px solid rgba(52,211,153,0.2)',borderRadius:10,color:'var(--teal)',fontSize:'0.78rem',fontFamily:'var(--font-mono)',fontWeight:700,cursor:'pointer'}}>+ Add member</button>
      )}
    </div>
  )
}

function LedgerTab({state,update}:{state:StokvelState;update:(s:StokvelState)=>void}) {
  const currentMonth=new Date().toISOString().slice(0,7)
  const thisMonth=state.contributions.filter(c=>c.month===currentMonth)
  const togglePaid=(id:number)=>{update({...state,contributions:state.contributions.map(c=>c.id===id?{...c,paid:!c.paid}:c)})}
  const addThisMonth=()=>{
    const existing=new Set(thisMonth.map(c=>c.memberId))
    const newEntries:Contribution[]=state.members.filter(m=>!existing.has(m.id)).map(m=>({id:Date.now()+m.id,memberId:m.id,memberName:m.name,amount:state.contribution,date:currentMonth+'-01',paid:false,month:currentMonth}))
    update({...state,contributions:[...state.contributions,...newEntries]})
  }
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontSize:'0.72rem',color:'var(--text-secondary)'}}>{new Date().toLocaleDateString('en-ZA',{month:'long',year:'numeric'})}</div>
        <button onClick={addThisMonth} style={{padding:'6px 12px',background:'var(--gold-dim)',border:'1px solid var(--gold-border)',borderRadius:8,color:'var(--gold)',fontSize:'0.65rem',fontFamily:'var(--font-mono)',fontWeight:700,cursor:'pointer'}}>Generate month</button>
      </div>
      {thisMonth.length===0&&<div style={{textAlign:'center',padding:'24px',color:'var(--text-muted)',fontSize:'0.75rem'}}>Click "Generate month" to create this month's contribution entries.</div>}
      {thisMonth.map(c=>(
        <button key={c.id} onClick={()=>togglePaid(c.id)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 14px',background:'var(--bg-surface)',border:`1px solid ${c.paid?'rgba(52,211,153,0.25)':'var(--border-subtle)'}`,borderRadius:10,cursor:'pointer',textAlign:'left'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:22,height:22,borderRadius:'50%',background:c.paid?'rgba(52,211,153,0.15)':'transparent',border:`2px solid ${c.paid?'var(--teal)':'var(--border-default)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.65rem',color:'var(--teal)',fontWeight:700}}>{c.paid?'✓':''}</div>
            <span style={{fontSize:'0.82rem',fontWeight:600,color:'var(--text-primary)'}}>{c.memberName}</span>
          </div>
          <span style={{fontSize:'0.8rem',fontFamily:'var(--font-mono)',fontWeight:700,color:c.paid?'var(--teal)':'var(--text-secondary)'}}>R{c.amount}</span>
        </button>
      ))}
    </div>
  )
}

function PayoutsTab({state,update}:{state:StokvelState;update:(s:StokvelState)=>void}) {
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const sorted=[...state.members].sort((a,b)=>a.payoutMonth-b.payoutMonth)
  const potAmount=state.members.length*state.contribution
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <div style={{padding:'10px 14px',background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:10,fontSize:'0.72rem',color:'var(--text-secondary)',lineHeight:1.6}}>
        Each member receives the full pot (R{potAmount.toLocaleString('en-ZA')}) once per cycle. Drag or reassign months below.
      </div>
      {sorted.map(m=>(
        <div key={m.id} style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:10,padding:'11px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontSize:'0.82rem',fontWeight:600,color:'var(--text-primary)'}}>{m.name}</div>
            <div style={{fontSize:'0.65rem',color:'var(--text-tertiary)',marginTop:1}}>Month {m.payoutMonth} — {months[(m.payoutMonth-1)%12]}</div>
          </div>
          <div style={{display:'flex',gap:6}}>
            <button onClick={()=>{const updated=state.members.map(x=>x.id===m.id?{...x,payoutMonth:Math.max(1,x.payoutMonth-1)}:x);update({...state,members:updated})}} style={{width:24,height:24,background:'var(--bg-elevated)',border:'1px solid var(--border-subtle)',borderRadius:6,color:'var(--text-secondary)',fontSize:'0.75rem',cursor:'pointer'}}>−</button>
            <span style={{width:28,textAlign:'center',fontSize:'0.7rem',fontFamily:'var(--font-mono)',color:'var(--gold)',fontWeight:700,lineHeight:'24px'}}>{m.payoutMonth}</span>
            <button onClick={()=>{const updated=state.members.map(x=>x.id===m.id?{...x,payoutMonth:x.payoutMonth+1}:x);update({...state,members:updated})}} style={{width:24,height:24,background:'var(--bg-elevated)',border:'1px solid var(--border-subtle)',borderRadius:6,color:'var(--text-secondary)',fontSize:'0.75rem',cursor:'pointer'}}>+</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function DisputesTab({state,update}:{state:StokvelState;update:(s:StokvelState)=>void}) {
  const [form,setForm]=useState({description:'',reportedBy:''})
  const [adding,setAdding]=useState(false)
  const add=()=>{if(!form.description)return;const d:Dispute={id:Date.now(),description:form.description,reportedBy:form.reportedBy,date:new Date().toISOString().split('T')[0],resolved:false};update({...state,disputes:[d,...state.disputes]});setAdding(false);setForm({description:'',reportedBy:''})}
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <button onClick={()=>setAdding(v=>!v)} style={{padding:'10px 0',background:'rgba(232,112,64,0.08)',border:'1px solid rgba(232,112,64,0.2)',borderRadius:10,color:'var(--coral)',fontSize:'0.75rem',fontFamily:'var(--font-mono)',fontWeight:700,cursor:'pointer'}}>{adding?'Cancel':'+ Log dispute'}</button>
      {adding&&(
        <div style={{background:'var(--bg-elevated)',border:'1px solid var(--border-default)',borderRadius:12,padding:'14px',display:'flex',flexDirection:'column',gap:10}}>
          <textarea placeholder="Describe the dispute..." value={form.description} onChange={e=>setForm(v=>({...v,description:e.target.value}))} rows={3} style={{width:'100%',padding:'8px 10px',background:'var(--bg-base)',border:'1px solid var(--border-default)',borderRadius:7,color:'var(--text-primary)',fontSize:'0.78rem',resize:'none'}}/>
          <input placeholder="Reported by" value={form.reportedBy} onChange={e=>setForm(v=>({...v,reportedBy:e.target.value}))} style={{padding:'8px 12px',background:'var(--bg-base)',border:'1px solid var(--border-default)',borderRadius:8,color:'var(--text-primary)',fontSize:'0.82rem'}}/>
          <button onClick={add} style={{padding:'9px 0',background:'rgba(232,112,64,0.1)',border:'1px solid rgba(232,112,64,0.25)',borderRadius:8,color:'var(--coral)',fontSize:'0.73rem',fontFamily:'var(--font-mono)',fontWeight:700,cursor:'pointer'}}>Log dispute</button>
        </div>
      )}
      {state.disputes.length===0&&<div style={{textAlign:'center',padding:'20px',color:'var(--text-muted)',fontSize:'0.75rem'}}>No disputes logged — great sign!</div>}
      {state.disputes.map(d=>(
        <div key={d.id} style={{background:'var(--bg-surface)',border:`1px solid ${d.resolved?'var(--border-subtle)':'rgba(232,112,64,0.2)'}`,borderRadius:10,padding:'12px 14px'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
            <span style={{fontSize:'0.65rem',color:'var(--text-muted)'}}>{d.date}{d.reportedBy?` · ${d.reportedBy}`:''}</span>
            <button onClick={()=>update({...state,disputes:state.disputes.map(x=>x.id===d.id?{...x,resolved:!x.resolved}:x)})} style={{fontSize:'0.62rem',padding:'2px 8px',background:d.resolved?'rgba(52,211,153,0.1)':'transparent',border:`1px solid ${d.resolved?'rgba(52,211,153,0.25)':'var(--border-subtle)'}`,borderRadius:100,color:d.resolved?'var(--teal)':'var(--text-muted)',cursor:'pointer',fontFamily:'var(--font-mono)',fontWeight:700}}>
              {d.resolved?'✓ Resolved':'Mark resolved'}
            </button>
          </div>
          <div style={{fontSize:'0.78rem',color:'var(--text-secondary)',lineHeight:1.5}}>{d.description}</div>
        </div>
      ))}
    </div>
  )
}

function LearnTab() {
  const [open,setOpen]=useState<number|null>(null)
  const items=[
    {q:'What is a stokvel?',a:'A stokvel is a rotating savings club where members contribute a fixed amount monthly and one member receives the full pot each cycle. It is a uniquely African financial innovation, practiced for centuries before modern banking.'},
    {q:'Stokvel vs savings account: which is better?',a:'A stokvel builds commitment and community. A savings account earns interest. Ideally: use a stokvel for large irregular purchases (groceries, tuition, events), and a savings account for emergency fund. They serve different psychological purposes.'},
    {q:'How to protect the group from defaults',a:'1. Start small — only invite people you trust. 2. Have a written constitution signed by all. 3. Set a clear consequence for missing a payment (loan, reduced payout, or removal). 4. Use this ledger to keep transparent records. 5. Never combine stokvel money with personal money.'},
    {q:'Tax implications (SA)',a:'Stokvel contributions are not taxable income because they are your own money rotating back. However, if the stokvel invests and earns interest > R23,800/year (individuals), that interest is taxable. A stokvel with a bank account may need to register for income tax if earnings exceed thresholds.'},
    {q:'How to grow the stokvel pot',a:'Some stokvels invest the monthly pot in a notice account, money market fund, or JSE unit trust before paying out. This earns interest while the money waits. Example: R10,000 pot in a 5% annual notice account earns R42 in a month — buy grocery vouchers for the payout member.'},
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
