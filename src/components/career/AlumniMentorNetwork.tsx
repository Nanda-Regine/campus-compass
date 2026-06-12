'use client'
// ─── Alumni Mentor Network ────────────────────────────────────
// Connect students with alumni mentors by career field + institution
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface MentorProfile {
  id:string;user_id:string;display_name:string;institution:string;degree:string;grad_year:number|null;
  career_field:string;company:string|null;job_title:string|null;bio:string|null;
  available_for:string[];linkedin_url:string|null;response_rate:number;total_mentees:number
}

const TOPICS=['career_chat','cv_review','mock_interview','study_advice','industry_insight','other']
const TOPIC_LABELS:Record<string,string>={
  career_chat:'Career chat',cv_review:'CV review',mock_interview:'Mock interview',
  study_advice:'Study advice',industry_insight:'Industry insight',other:'Other'
}
const FIELDS=['Technology','Finance','Law','Medicine','Engineering','Education','Business','Creative','Government','NGO','Research']

type Tab='find'|'become'|'my_requests'

export default function AlumniMentorNetwork({userId,university}:{userId:string;university?:string}) {
  const [tab,setTab]=useState<Tab>('find')
  const [mentors,setMentors]=useState<MentorProfile[]>([])
  const [loading,setLoading]=useState(true)
  const [fieldFilter,setFieldFilter]=useState<string|null>(null)
  const [search,setSearch]=useState('')
  const supabase=createClient()

  useEffect(()=>{loadMentors()},[university])

  async function loadMentors(){
    setLoading(true)
    let q=supabase.from('mentor_profiles').select('*').eq('is_active',true).order('response_rate',{ascending:false}).limit(40)
    if(university) q=q.eq('institution',university)
    const {data}=await q
    setMentors((data as MentorProfile[])||[])
    setLoading(false)
  }

  const filtered=mentors.filter(m=>{
    if(fieldFilter&&m.career_field!==fieldFilter) return false
    if(search){const s=search.toLowerCase();return m.display_name.toLowerCase().includes(s)||m.career_field.toLowerCase().includes(s)||(m.company||'').toLowerCase().includes(s)||(m.job_title||'').toLowerCase().includes(s)}
    return true
  }).filter(m=>m.user_id!==userId)

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{position:'relative',overflow:'hidden',background:'var(--bg-surface)',border:'1px solid rgba(99,102,241,0.25)',borderRadius:16,padding:'16px 18px'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,var(--indigo,#6366F1),transparent)'}}/>
        <div style={{fontSize:'0.58rem',fontFamily:'var(--font-mono)',color:'var(--indigo,#6366F1)',letterSpacing:'0.09em',marginBottom:4}}>ALUMNI MENTOR NETWORK</div>
        <div style={{fontSize:'1rem',fontWeight:700,color:'var(--text-primary)'}}>Learn from those who walked this path</div>
        <div style={{fontSize:'0.73rem',color:'var(--text-secondary)',marginTop:3}}>{mentors.length} mentor{mentors.length!==1?'s':''} available · Free for all students</div>
      </div>

      <div style={{display:'flex',gap:0,borderBottom:'1px solid var(--border-subtle)'}}>
        {([['find','Find a Mentor'],['become','Become a Mentor'],['my_requests','My Requests']] as [Tab,string][]).map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:'9px 4px',background:'none',border:'none',borderBottom:tab===id?'2px solid var(--indigo,#6366F1)':'2px solid transparent',color:tab===id?'var(--indigo,#6366F1)':'var(--text-tertiary)',fontSize:'0.67rem',fontFamily:'var(--font-mono)',fontWeight:tab===id?700:400,cursor:'pointer',marginBottom:-1,whiteSpace:'nowrap'}}>
            {label}
          </button>
        ))}
      </div>

      {tab==='find'&&(
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <input placeholder="Search by name, company, field..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%',padding:'10px 14px',background:'var(--bg-surface)',border:'1px solid var(--border-default)',borderRadius:10,color:'var(--text-primary)',fontSize:'0.82rem'}}/>
          <div style={{display:'flex',gap:6,overflowX:'auto'}}>
            <button onClick={()=>setFieldFilter(null)} style={{flexShrink:0,padding:'5px 10px',background:fieldFilter===null?'rgba(99,102,241,0.12)':'var(--bg-surface)',border:`1px solid ${fieldFilter===null?'rgba(99,102,241,0.3)':'var(--border-subtle)'}`,borderRadius:100,color:fieldFilter===null?'var(--indigo,#6366F1)':'var(--text-secondary)',fontSize:'0.65rem',fontFamily:'var(--font-mono)',cursor:'pointer'}}>All fields</button>
            {FIELDS.map(f=>(
              <button key={f} onClick={()=>setFieldFilter(fieldFilter===f?null:f)} style={{flexShrink:0,padding:'5px 10px',background:fieldFilter===f?'rgba(99,102,241,0.12)':'var(--bg-surface)',border:`1px solid ${fieldFilter===f?'rgba(99,102,241,0.3)':'var(--border-subtle)'}`,borderRadius:100,color:fieldFilter===f?'var(--indigo,#6366F1)':'var(--text-secondary)',fontSize:'0.65rem',fontFamily:'var(--font-mono)',cursor:'pointer',whiteSpace:'nowrap'}}>{f}</button>
            ))}
          </div>
          {loading&&<div style={{textAlign:'center',padding:'24px',color:'var(--text-muted)',fontSize:'0.75rem'}}>Loading mentors...</div>}
          {!loading&&filtered.length===0&&<div style={{textAlign:'center',padding:'28px',color:'var(--text-muted)',fontSize:'0.75rem'}}>No mentors available yet. Be the first to become a mentor!</div>}
          {filtered.map(m=><MentorCard key={m.id} mentor={m} userId={userId}/>)}
        </div>
      )}
      {tab==='become'&&<BecomeMentor userId={userId} university={university} onDone={()=>{loadMentors();setTab('find')}}/>}
      {tab==='my_requests'&&<MyRequests userId={userId}/>}
    </div>
  )
}

function MentorCard({mentor:m,userId}:{mentor:MentorProfile;userId:string}) {
  const [open,setOpen]=useState(false)
  const [topic,setTopic]=useState('career_chat')
  const [message,setMessage]=useState('')
  const [sent,setSent]=useState(false)
  const supabase=createClient()

  const send=async()=>{
    await supabase.from('mentor_requests').upsert({mentor_id:m.id,mentee_id:userId,topic,message:message||null})
    setSent(true);setOpen(false)
  }

  return (
    <div style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:14,overflow:'hidden'}}>
      <button onClick={()=>setOpen(v=>!v)} style={{display:'flex',width:'100%',padding:'14px',background:'none',border:'none',cursor:'pointer',textAlign:'left',gap:12,alignItems:'flex-start'}}>
        <div style={{width:44,height:44,borderRadius:'50%',background:'rgba(99,102,241,0.15)',border:'1px solid rgba(99,102,241,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',flexShrink:0,fontWeight:700,color:'var(--indigo,#6366F1)'}}>
          {m.display_name[0]?.toUpperCase()}
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:'0.86rem',fontWeight:700,color:'var(--text-primary)'}}>{m.display_name}</div>
          <div style={{fontSize:'0.7rem',color:'var(--text-secondary)',marginTop:1}}>{[m.job_title,m.company].filter(Boolean).join(' @ ')}</div>
          <div style={{fontSize:'0.65rem',color:'var(--text-muted)',marginTop:2}}>{m.degree} · {m.institution}{m.grad_year?` · Class of ${m.grad_year}`:''}</div>
          <div style={{display:'flex',gap:5,marginTop:6,flexWrap:'wrap'}}>
            {m.available_for.slice(0,3).map(a=>(
              <span key={a} style={{fontSize:'0.58rem',padding:'2px 7px',background:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.15)',borderRadius:100,color:'var(--indigo,#6366F1)',fontFamily:'var(--font-mono)'}}>{TOPIC_LABELS[a]||a}</span>
            ))}
          </div>
        </div>
        <div style={{flexShrink:0,textAlign:'right'}}>
          <div style={{fontSize:'0.72rem',fontWeight:700,fontFamily:'var(--font-mono)',color:'var(--teal)'}}>{m.response_rate}%</div>
          <div style={{fontSize:'0.55rem',color:'var(--text-muted)'}}>response</div>
          <div style={{fontSize:'0.6rem',color:'var(--text-muted)',transform:open?'rotate(180deg)':'none',transition:'transform 0.2s',marginTop:6}}>▾</div>
        </div>
      </button>

      {open&&(
        <div style={{padding:'0 14px 14px',borderTop:'1px solid var(--border-subtle)',paddingTop:12}}>
          {m.bio&&<div style={{fontSize:'0.73rem',color:'var(--text-secondary)',lineHeight:1.6,marginBottom:10}}>{m.bio}</div>}
          {sent?(
            <div style={{padding:'10px 14px',background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.2)',borderRadius:8,fontSize:'0.73rem',color:'var(--teal)',fontWeight:600}}>✓ Request sent — {m.display_name} will see your message.</div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <select value={topic} onChange={e=>setTopic(e.target.value)} style={{padding:'8px 10px',background:'var(--bg-base)',border:'1px solid var(--border-default)',borderRadius:7,color:'var(--text-primary)',fontSize:'0.78rem'}}>
                {m.available_for.map(a=><option key={a} value={a}>{TOPIC_LABELS[a]||a}</option>)}
              </select>
              <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={3} placeholder="Introduce yourself and what you'd like to learn..." style={{width:'100%',padding:'8px 10px',background:'var(--bg-base)',border:'1px solid var(--border-default)',borderRadius:7,color:'var(--text-primary)',fontSize:'0.75rem',resize:'none'}}/>
              <button onClick={send} disabled={!message} style={{padding:'10px 0',background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.25)',borderRadius:9,color:'var(--indigo,#6366F1)',fontSize:'0.75rem',fontFamily:'var(--font-mono)',fontWeight:700,cursor:'pointer',opacity:message?1:0.5}}>Send request →</button>
              {m.linkedin_url&&<a href={m.linkedin_url} target="_blank" rel="noopener noreferrer" style={{fontSize:'0.65rem',fontFamily:'var(--font-mono)',color:'var(--teal)',textDecoration:'none',textAlign:'center'}}>View LinkedIn profile →</a>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BecomeMentor({userId,university,onDone}:{userId:string;university?:string;onDone:()=>void}) {
  const [form,setForm]=useState({display_name:'',institution:university||'',degree:'',grad_year:'',career_field:'Technology',company:'',job_title:'',bio:'',linkedin_url:'',available_for:[] as string[]})
  const [saving,setSaving]=useState(false)
  const supabase=createClient()

  const toggleTopic=(t:string)=>setForm(v=>({...v,available_for:v.available_for.includes(t)?v.available_for.filter(x=>x!==t):[...v.available_for,t]}))
  const f=(k:keyof typeof form,v:string)=>setForm(x=>({...x,[k]:v}))

  const submit=async()=>{
    if(!form.display_name||!form.degree||!form.institution) return
    setSaving(true)
    await supabase.from('mentor_profiles').upsert({user_id:userId,display_name:form.display_name,institution:form.institution,degree:form.degree,grad_year:parseInt(form.grad_year)||null,career_field:form.career_field,company:form.company||null,job_title:form.job_title||null,bio:form.bio||null,available_for:form.available_for,linkedin_url:form.linkedin_url||null})
    setSaving(false)
    onDone()
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <div style={{padding:'10px 14px',background:'rgba(99,102,241,0.06)',border:'1px solid rgba(99,102,241,0.15)',borderRadius:10,fontSize:'0.72rem',color:'var(--text-secondary)',lineHeight:1.6}}>
        As a mentor, you help current students navigate the same path you took. It takes as little as 30 minutes per month, and it builds your own leadership and communication skills.
      </div>
      {[{l:'Your name *',k:'display_name',p:'How students will see you'},{l:'Institution *',k:'institution',p:'UCT, Wits, UP...'},{l:'Degree *',k:'degree',p:'e.g. BSc Computer Science'},{l:'Graduation year',k:'grad_year',p:'2023'},{l:'Current company',k:'company',p:'Where you work now'},{l:'Job title',k:'job_title',p:'e.g. Junior Developer'},{l:'LinkedIn URL',k:'linkedin_url',p:'https://linkedin.com/in/...'}].map(({l,k,p})=>(
        <div key={k}><div style={{fontSize:'0.68rem',color:'var(--text-tertiary)',marginBottom:3}}>{l}</div>
        <input value={form[k as keyof typeof form] as string} onChange={e=>f(k as keyof typeof form,e.target.value)} placeholder={p} style={{width:'100%',padding:'9px 12px',background:'var(--bg-base)',border:'1px solid var(--border-default)',borderRadius:8,color:'var(--text-primary)',fontSize:'0.82rem'}}/></div>
      ))}
      <div><div style={{fontSize:'0.68rem',color:'var(--text-tertiary)',marginBottom:3}}>Career field</div>
      <select value={form.career_field} onChange={e=>f('career_field',e.target.value)} style={{width:'100%',padding:'9px 10px',background:'var(--bg-base)',border:'1px solid var(--border-default)',borderRadius:8,color:'var(--text-primary)',fontSize:'0.78rem'}}>
        {FIELDS.map(f=><option key={f} value={f}>{f}</option>)}
      </select></div>
      <div><div style={{fontSize:'0.68rem',color:'var(--text-tertiary)',marginBottom:6}}>I can help with</div>
      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
        {TOPICS.map(t=>(
          <button key={t} onClick={()=>toggleTopic(t)} style={{padding:'6px 10px',background:form.available_for.includes(t)?'rgba(99,102,241,0.12)':'var(--bg-surface)',border:`1px solid ${form.available_for.includes(t)?'rgba(99,102,241,0.3)':'var(--border-subtle)'}`,borderRadius:100,color:form.available_for.includes(t)?'var(--indigo,#6366F1)':'var(--text-secondary)',fontSize:'0.65rem',fontFamily:'var(--font-mono)',cursor:'pointer',fontWeight:form.available_for.includes(t)?700:400}}>
            {TOPIC_LABELS[t]}
          </button>
        ))}</div></div>
      <div><div style={{fontSize:'0.68rem',color:'var(--text-tertiary)',marginBottom:3}}>Short bio (max 500 chars)</div>
      <textarea value={form.bio} onChange={e=>f('bio',e.target.value)} rows={3} maxLength={500} placeholder="Tell students about your journey, what you learned, and what you can help with." style={{width:'100%',padding:'9px 10px',background:'var(--bg-base)',border:'1px solid var(--border-default)',borderRadius:8,color:'var(--text-primary)',fontSize:'0.75rem',resize:'none'}}/></div>
      <button onClick={submit} disabled={saving||!form.display_name||!form.degree} style={{padding:'12px 0',background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.25)',borderRadius:10,color:'var(--indigo,#6366F1)',fontSize:'0.78rem',fontFamily:'var(--font-mono)',fontWeight:700,cursor:'pointer',opacity:form.display_name&&form.degree?1:0.5}}>
        {saving?'Publishing...':'Become a mentor →'}
      </button>
    </div>
  )
}

function MyRequests({userId}:{userId:string}) {
  const [requests,setRequests]=useState<{id:string;topic:string;status:string;message:string|null;mentor_note:string|null;created_at:string;mentor_profiles:{display_name:string;career_field:string}}[]>([])
  const supabase=createClient()
  useEffect(()=>{
    supabase.from('mentor_requests').select('*,mentor_profiles(display_name,career_field)').eq('mentee_id',userId).order('created_at',{ascending:false})
      .then(({data})=>setRequests((data as typeof requests)||[]))
  },[userId])
  const statusColor:Record<string,string>={pending:'var(--gold)',accepted:'var(--teal)',declined:'var(--danger)',completed:'var(--teal)',cancelled:'var(--text-muted)'}
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      {requests.length===0&&<div style={{textAlign:'center',padding:'24px',color:'var(--text-muted)',fontSize:'0.75rem'}}>No requests yet. Find a mentor above.</div>}
      {requests.map(r=>(
        <div key={r.id} style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:12,padding:'12px 14px'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
            <div style={{fontSize:'0.82rem',fontWeight:600,color:'var(--text-primary)'}}>{r.mentor_profiles?.display_name}</div>
            <span style={{fontSize:'0.62rem',fontFamily:'var(--font-mono)',fontWeight:700,color:statusColor[r.status]||'var(--text-muted)',textTransform:'capitalize'}}>{r.status}</span>
          </div>
          <div style={{fontSize:'0.68rem',color:'var(--text-secondary)',marginBottom:r.mentor_note?8:0}}>{TOPIC_LABELS[r.topic]} · {r.mentor_profiles?.career_field}</div>
          {r.mentor_note&&<div style={{padding:'8px 10px',background:'rgba(99,102,241,0.06)',border:'1px solid rgba(99,102,241,0.15)',borderRadius:7,fontSize:'0.72rem',color:'var(--text-secondary)',lineHeight:1.55}}><strong style={{color:'var(--indigo,#6366F1)'}}>Mentor replied:</strong> {r.mentor_note}</div>}
        </div>
      ))}
    </div>
  )
}
