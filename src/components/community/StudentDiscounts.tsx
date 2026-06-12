'use client'
// ─── Student Discounts Hub ────────────────────────────────────
import { useState } from 'react'

type Category='data'|'food'|'software'|'banking'|'transport'|'lifestyle'
const CATS:{id:Category;label:string;icon:string}[]=[
  {id:'data',     label:'Data Bundles', icon:'📡'},
  {id:'food',     label:'Food & Dining', icon:'🍔'},
  {id:'software', label:'Software',     icon:'💻'},
  {id:'banking',  label:'Banking',      icon:'🏦'},
  {id:'transport',label:'Transport',    icon:'🚌'},
  {id:'lifestyle',label:'Lifestyle',    icon:'🎧'},
]

const DISCOUNTS:{category:Category;brand:string;deal:string;how:string;saving:string;url:string;emoji:string}[]=[
  // Data
  {category:'data',brand:'Telkom',deal:'MyConnect Data 30-day bundle — cheaper than standard',how:'Sign up with student email at telkom.co.za/myConnect',saving:'Up to 30% off standard data rates',url:'https://www.telkom.co.za',emoji:'📡'},
  {category:'data',brand:'MTN',deal:'Campus SIM with bonus data',how:'Buy at campus MTN kiosk or bring student card to MTN store',saving:'Extra 1GB on activation',url:'https://www.mtn.co.za',emoji:'📱'},
  {category:'data',brand:'Vodacom',deal:'Student Data Bundle (1GB night + 500MB day)',how:'Vodacom app → Data → Student Bundles',saving:'50% cheaper than standard bundles',url:'https://www.vodacom.co.za',emoji:'🌐'},
  {category:'data',brand:'Rain',deal:'Unlimited night-time data from 00:00–05:00',how:'Get a Rain SIM — no student ID needed',saving:'Unlimited late-night study data',url:'https://www.rain.co.za',emoji:'🌧️'},
  // Food
  {category:'food',brand:'Steers',deal:'Students get 10% off with student card',how:'Show your student card at point of sale',saving:'~R15–30 per meal',url:'',emoji:'🍔'},
  {category:'food',brand:'Debonairs',deal:'Half-price pizza on Tuesdays',how:'Order online, no student card needed — Tuesday special',saving:'R60–80 off a large pizza',url:'https://www.debonairs.co.za',emoji:'🍕'},
  {category:'food',brand:'Checkers',deal:'Xtra Savings loyalty card cashback',how:'Sign up for free Xtra Savings card in-store or app',saving:'Up to 50% off selected items weekly',url:'https://www.checkers.co.za',emoji:'🛒'},
  {category:'food',brand:'Woolworths',deal:'WRewards — student-accessible',how:'Sign up via WRewards app, free membership',saving:'10% off weekly partner deals',url:'https://www.woolworths.co.za',emoji:'🌿'},
  // Software
  {category:'software',brand:'Microsoft 365',deal:'Free for students',how:'Go to office.com/getoffice365 — use your student email',saving:'R200/month = R2,400/year saved',url:'https://www.microsoft.com/education',emoji:'📝'},
  {category:'software',brand:'Adobe Creative Cloud',deal:'60% off for students',how:'Adobe.com/creativecloud/buy/students',saving:'~R300/month vs R760/month standard',url:'https://www.adobe.com/creativecloud/buy/students.html',emoji:'🎨'},
  {category:'software',brand:'GitHub',deal:'GitHub Pro + Copilot free',how:'GitHub Student Developer Pack at education.github.com',saving:'R200+/month in tools',url:'https://education.github.com',emoji:'⚙️'},
  {category:'software',brand:'Notion',deal:'Plus plan free for students',how:'Notion.so/education — use student email',saving:'R150/month saved',url:'https://www.notion.so/education',emoji:'📓'},
  {category:'software',brand:'Canva',deal:'Canva Pro free for students',how:'Canva.com/education — use student email',saving:'R180/month saved',url:'https://www.canva.com/education/',emoji:'🖌️'},
  {category:'software',brand:'JetBrains',deal:'All IDEs free for students',how:'Apply at jetbrains.com/community/education with student email',saving:'R500+/month',url:'https://www.jetbrains.com/community/education',emoji:'💻'},
  // Banking
  {category:'banking',brand:'Capitec',deal:'Free basic account + free app banking',how:'Open at any Capitec branch with student ID',saving:'R0 monthly fee',url:'https://www.capitecbank.co.za',emoji:'🏦'},
  {category:'banking',brand:'TymeBank',deal:'Free account, no minimum balance',how:'Sign up at TymeBank kiosk in Pick n Pay / Boxer',saving:'Zero fees',url:'https://www.tymebank.co.za',emoji:'💳'},
  {category:'banking',brand:'FNB',deal:'FNB Aspire — R0 monthly (if salary/allowance deposited)',how:'Apply at fnb.co.za/personal/bank-accounts',saving:'R100+/month vs standard accounts',url:'https://www.fnb.co.za',emoji:'💰'},
  {category:'banking',brand:'Discovery Bank',deal:'Discovery Student plan with cashback rewards',how:'Apply at discovery.co.za/bank — student ID required',saving:'Up to 50% cashback at Woolworths, Clicks',url:'https://www.discovery.co.za/bank',emoji:'🔵'},
  // Transport
  {category:'transport',brand:'Gautrain',deal:'Youth Fare (under 25)',how:'Register at gautraincard.co.za with ID — auto-applied',saving:'25% off standard fare',url:'https://www.gautraincard.co.za',emoji:'🚆'},
  {category:'transport',brand:'MyCiTi',deal:'Myconnect student card',how:'Sign up at myciti.org.za with student ID',saving:'~20% reduced fare',url:'https://www.myciti.org.za',emoji:'🚌'},
  {category:'transport',brand:'Uber',deal:'First 3 rides discount for new users',how:'Use referral from friend or university orientation welcome pack',saving:'~R120 off (first 3 rides)',url:'https://www.uber.com',emoji:'🚗'},
  // Lifestyle
  {category:'lifestyle',brand:'Spotify',deal:'Student plan — 50% off',how:'Spotify.com/za/student — verify with SheerID',saving:'R30/month',url:'https://www.spotify.com/za/student/',emoji:'🎵'},
  {category:'lifestyle',brand:'Netflix',deal:'Standard with ads — most affordable tier',how:'No student discount but split with 2 others = R50/person',saving:'70% off vs standard',url:'https://www.netflix.com',emoji:'📺'},
  {category:'lifestyle',brand:'ISIC Card',deal:'International Student Identity Card — 100s of global discounts',how:'Apply at isic.org — R150 for 1-year card',saving:'Dozens of local + global discounts',url:'https://www.isic.org',emoji:'🌍'},
  {category:'lifestyle',brand:'Clicks',deal:'ClubCard — free, earn points on health purchases',how:'Sign up free in-store or Clicks app',saving:'Points convert to vouchers',url:'https://www.clicks.co.za',emoji:'💊'},
]

export default function StudentDiscounts() {
  const [cat,setCat]=useState<Category|null>(null)
  const filtered = cat ? DISCOUNTS.filter(d=>d.category===cat) : DISCOUNTS
  const [search,setSearch]=useState('')
  const results = search ? filtered.filter(d=>d.brand.toLowerCase().includes(search.toLowerCase())||d.deal.toLowerCase().includes(search.toLowerCase())) : filtered
  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{position:'relative',overflow:'hidden',background:'var(--bg-surface)',border:'1px solid rgba(52,211,153,0.25)',borderRadius:16,padding:'16px 18px'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,var(--teal),transparent)'}}/>
        <div style={{fontSize:'0.58rem',fontFamily:'var(--font-mono)',color:'var(--teal)',letterSpacing:'0.09em',marginBottom:4}}>STUDENT DISCOUNTS</div>
        <div style={{fontSize:'1rem',fontWeight:700,color:'var(--text-primary)'}}>Save on everything that matters</div>
        <div style={{fontSize:'0.73rem',color:'var(--text-secondary)',marginTop:3}}>Data · Software · Banking · Food · Transport · Lifestyle</div>
      </div>
      <input type="text" placeholder="Search discounts..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%',padding:'10px 14px',background:'var(--bg-surface)',border:'1px solid var(--border-default)',borderRadius:10,color:'var(--text-primary)',fontSize:'0.82rem'}}/>
      <div style={{display:'flex',gap:6,overflowX:'auto'}}>
        <button onClick={()=>setCat(null)} style={{flexShrink:0,padding:'6px 12px',background:cat===null?'rgba(52,211,153,0.1)':'var(--bg-surface)',border:`1px solid ${cat===null?'rgba(52,211,153,0.3)':'var(--border-subtle)'}`,borderRadius:100,color:cat===null?'var(--teal)':'var(--text-secondary)',fontSize:'0.68rem',fontFamily:'var(--font-mono)',cursor:'pointer'}}>All</button>
        {CATS.map(c=>(
          <button key={c.id} onClick={()=>setCat(c.id)} style={{flexShrink:0,padding:'6px 12px',background:cat===c.id?'rgba(52,211,153,0.1)':'var(--bg-surface)',border:`1px solid ${cat===c.id?'rgba(52,211,153,0.3)':'var(--border-subtle)'}`,borderRadius:100,color:cat===c.id?'var(--teal)':'var(--text-secondary)',fontSize:'0.68rem',fontFamily:'var(--font-mono)',cursor:'pointer',whiteSpace:'nowrap'}}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {results.map((d,i)=>(
          <div key={i} style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:12,padding:'13px 14px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:'1.1rem'}}>{d.emoji}</span>
                <div>
                  <div style={{fontSize:'0.84rem',fontWeight:700,color:'var(--text-primary)'}}>{d.brand}</div>
                  <div style={{fontSize:'0.68rem',color:'var(--text-secondary)',marginTop:1}}>{d.deal}</div>
                </div>
              </div>
              <span style={{fontSize:'0.62rem',padding:'2px 8px',background:'rgba(52,211,153,0.1)',border:'1px solid rgba(52,211,153,0.25)',borderRadius:100,color:'var(--teal)',fontFamily:'var(--font-mono)',fontWeight:700,flexShrink:0,marginLeft:8}}>{d.saving}</span>
            </div>
            <div style={{fontSize:'0.7rem',color:'var(--text-tertiary)',marginBottom:d.url?8:0}}>📌 {d.how}</div>
            {d.url&&<a href={d.url} target="_blank" rel="noopener noreferrer" style={{fontSize:'0.65rem',fontFamily:'var(--font-mono)',color:'var(--teal)',textDecoration:'none'}}>Claim discount →</a>}
          </div>
        ))}
      </div>
    </div>
  )
}
