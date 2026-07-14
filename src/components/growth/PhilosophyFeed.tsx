'use client'
// ─── Philosophy Feed ──────────────────────────────────────────
// Daily applied philosophy matched to student's current state.
// Jim Rohn · Marcus Aurelius · Nelson Mandela · Steve Biko · Ubuntu
import { useState, useEffect } from 'react'
import { useStudentState } from '@/store/studentState'

interface Quote {
  text:   string
  author: string
  source: string
  domain: 'mind'|'money'|'resilience'|'community'|'growth'|'courage'|'ubuntu'
  color:  string
  application: string // how it applies right now
}

const QUOTE_BANK: Quote[] = [
  {text:"Discipline is the bridge between goals and accomplishment.",author:"Jim Rohn",source:"",domain:"mind",color:"var(--gold)",application:"You have tasks overdue. Discipline isn't motivation — it's the daily decision to do the work anyway."},
  {text:"Don't wish it were easier; wish you were better.",author:"Jim Rohn",source:"",domain:"growth",color:"var(--indigo, #6366F1)",application:"The exam is hard because it's worth something. The discomfort is the curriculum."},
  {text:"You are the average of the five people you spend the most time with.",author:"Jim Rohn",source:"",domain:"community",color:"var(--nova)",application:"Your study group shapes your outcome more than any single study session."},
  {text:"The reading of all good books is like a conversation with the finest minds of past centuries.",author:"René Descartes",source:"",domain:"mind",color:"var(--sky, #38BDF8)",application:"30 minutes of reading before sleep compounds into a completely different mind over 4 years."},
  {text:"You have power over your mind — not outside events. Realize this, and you will find strength.",author:"Marcus Aurelius",source:"Meditations",domain:"resilience",color:"var(--teal)",application:"Load shedding, taxi strikes, difficult lecturers — these are outside events. Your response is not."},
  {text:"The impediment to action advances action. What stands in the way becomes the way.",author:"Marcus Aurelius",source:"Meditations",domain:"resilience",color:"var(--coral)",application:"The module you're most afraid of is the one you most need to face today."},
  {text:"Waste no more time arguing what a good man should be. Be one.",author:"Marcus Aurelius",source:"Meditations",domain:"growth",color:"var(--teal)",application:"Less time thinking about studying. More time studying."},
  {text:"Education is the most powerful weapon which you can use to change the world.",author:"Nelson Mandela",source:"",domain:"mind",color:"var(--gold)",application:"Every note you write, every concept you grasp, is an act of resistance against the limitations placed on you."},
  {text:"It always seems impossible until it's done.",author:"Nelson Mandela",source:"",domain:"resilience",color:"var(--teal)",application:"Your degree seemed impossible in first year. Your exam feels impossible now. Neither is."},
  {text:"The greatest glory in living lies not in never falling, but in rising every time we fall.",author:"Nelson Mandela",source:"Long Walk to Freedom",domain:"resilience",color:"var(--coral)",application:"A failed module is not the end. It is data. It is a detour, not a destination."},
  {text:"Black man, you are on your own.",author:"Steve Biko",source:"I Write What I Like",domain:"courage",color:"var(--danger)",application:"No one is coming to save you. Your determination is the only resource that cannot be taken."},
  {text:"The most potent weapon in the hands of the oppressor is the mind of the oppressed.",author:"Steve Biko",source:"I Write What I Like",domain:"courage",color:"var(--nova)",application:"Believing you cannot succeed because of where you came from is the only thing that can stop you."},
  {text:"Umuntu ngumuntu ngabantu — A person is a person through other persons.",author:"Ubuntu Philosophy",source:"Zulu/Nguni proverb",domain:"ubuntu",color:"var(--emerald, #34D399)",application:"Your success is not just for you. It is for everyone who sacrificed for you to be here."},
  {text:"If you want to go fast, go alone. If you want to go far, go together.",author:"African Proverb",source:"",domain:"ubuntu",color:"var(--emerald, #34D399)",application:"Your study group, your mentors, your campus community — lean into them."},
  {text:"He who asks questions cannot avoid the answers.",author:"Cameroon Proverb",source:"",domain:"mind",color:"var(--gold)",application:"Ask your lecturer. Ask your tutor. Ask the person who scored top of the class. Curiosity is a superpower."},
  {text:"An investment in knowledge pays the best interest.",author:"Benjamin Franklin",source:"",domain:"money",color:"var(--teal)",application:"Your NSFAS or loan is not a burden — it is seed capital for the highest-ROI asset you will ever own."},
  {text:"The secret of getting ahead is getting started.",author:"Mark Twain",source:"",domain:"mind",color:"var(--sky, #38BDF8)",application:"You don't need to feel ready. You need to open the textbook and read page 1."},
  {text:"Either you run the day or the day runs you.",author:"Jim Rohn",source:"",domain:"mind",color:"var(--gold)",application:"Plan your tomorrow tonight. The 10 minutes before sleep that shape the next 16 hours."},
  {text:"Formal education will make you a living; self-education will make you a fortune.",author:"Jim Rohn",source:"",domain:"growth",color:"var(--indigo, #6366F1)",application:"Your degree is the floor, not the ceiling. What you teach yourself between now and graduation is the real asset."},
  {text:"Take care of your body. It's the only place you have to live.",author:"Jim Rohn",source:"",domain:"mind",color:"var(--rose, #FB7185)",application:"Sleep, food, and movement are not luxuries. They are the infrastructure of academic performance."},
]

const BOOK_SUMMARIES=[
  {title:'Atomic Habits',author:'James Clear',emoji:'⚙️',color:'var(--gold)',summary:'You do not rise to the level of your goals. You fall to the level of your systems. 1% better every day = 37× improvement in a year. Identity-based habits: "I am a student who studies every day" beats "I need to study more."',keyLesson:'Make good habits obvious, attractive, easy, satisfying. Make bad habits invisible, unattractive, hard, unsatisfying.'},
  {title:'Rich Dad Poor Dad',author:'Robert Kiyosaki',emoji:'💰',color:'var(--teal)',summary:'The rich acquire assets (things that put money in your pocket). The poor acquire liabilities (things that take money out). Your education is an asset. Your skills are assets. Your phone data plan is a liability.',keyLesson:'Learn financial literacy before you have money, not after. Start with the basics: income, expenses, assets, liabilities.'},
  {title:'Man\'s Search for Meaning',author:'Viktor Frankl',emoji:'🕯️',color:'var(--nova)',summary:'Written in a concentration camp. Frankl discovered that those who survived found meaning in their suffering. The last of human freedoms is the choice of one\'s attitude in any given circumstances.',keyLesson:'Your "why" — why you are at university — must be strong enough to survive the hard days. Write it down.'},
  {title:'Think and Grow Rich',author:'Napoleon Hill',emoji:'🧠',color:'var(--indigo, #6366F1)',summary:'A 1937 study of 500+ successful people. The common thread: a definite chief aim, faith in its achievement, specialised knowledge, and a mastermind group (your 5 people).',keyLesson:'Write your goal on paper. Read it twice a day. This sounds simple and it works.'},
  {title:'The Lean Startup',author:'Eric Ries',emoji:'🚀',color:'var(--coral)',summary:'Build-Measure-Learn. Ship the smallest possible version. Get real feedback. Kill bad ideas fast. The biggest waste is building something nobody wants.',keyLesson:'Validated learning > plan-following. Test your assumptions before you spend money.'},
  {title:'Long Walk to Freedom',author:'Nelson Mandela',emoji:'✊',color:'var(--gold)',summary:'27 years in prison. Never lost hope. The most powerful demonstration in history that circumstance does not determine destiny. Character is built in the hard years, not the easy ones.',keyLesson:'Your current difficulty — however real — is smaller than what Mandela overcame. This is not diminishing; it is permission.'},
]

function DailyInsightCard({quote,riskLevel}:{quote:Quote;riskLevel:string}) {
  return (
    <div style={{position:'relative',overflow:'hidden',background:'var(--bg-surface)',border:`1px solid ${quote.color}25`,borderRadius:16,padding:'18px'}}>
      <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${quote.color},transparent)`}}/>
      <div style={{fontSize:'0.65rem',fontFamily:'var(--font-mono)',color:quote.color,letterSpacing:'0.09em',marginBottom:10}}>TODAY&apos;S INSIGHT</div>
      <div style={{fontSize:'1.05rem',fontWeight:700,color:'var(--text-primary)',lineHeight:1.55,marginBottom:8,fontStyle:'italic'}}>
        &ldquo;{quote.text}&rdquo;
      </div>
      <div style={{fontSize:'0.7rem',color:'var(--text-muted)',marginBottom:12}}>— {quote.author}{quote.source?`, ${quote.source}`:''}</div>
      <div style={{padding:'10px 12px',background:`${quote.color}10`,border:`1px solid ${quote.color}20`,borderRadius:10,fontSize:'0.73rem',color:'var(--text-secondary)',lineHeight:1.6}}>
        <span style={{color:quote.color,fontWeight:700}}>Applied to you: </span>{quote.application}
      </div>
      {riskLevel==='warning'||riskLevel==='critical'?<div style={{marginTop:8,fontSize:'0.68rem',color:'var(--text-muted)',fontStyle:'italic'}}>Your academic pressure is high right now. This quote was chosen for that reason.</div>:null}
    </div>
  )
}

export default function PhilosophyFeed() {
  const wellness   = useStudentState(s=>s.wellness)
  const academic   = useStudentState(s=>s.academic)
  const [quoteIdx,setQuoteIdx] = useState(0)
  const [bookOpen,setBookOpen] = useState<number|null>(null)
  const [domain,setDomain]     = useState<string|null>(null)

  useEffect(()=>{
    const riskLevel = academic.riskLevel
    const burnout   = wellness.burnoutScore
    let pool = QUOTE_BANK
    if(riskLevel==='critical'||riskLevel==='warning') pool=QUOTE_BANK.filter(q=>q.domain==='resilience'||q.domain==='mind')
    else if(burnout>60) pool=QUOTE_BANK.filter(q=>q.domain==='resilience')
    else if(domain) pool=QUOTE_BANK.filter(q=>q.domain===domain)
    const dayOfYear = Math.floor(Date.now()/86400000)
    setQuoteIdx(dayOfYear % pool.length)
  },[academic.riskLevel,wellness.burnoutScore,domain])

  const filteredQuotes = domain ? QUOTE_BANK.filter(q=>q.domain===domain) : QUOTE_BANK
  const todayQuote = filteredQuotes[quoteIdx % filteredQuotes.length]

  const DOMAINS=[
    {id:null,label:'All',emoji:'✨'},{id:'mind',label:'Mind',emoji:'🧠'},{id:'resilience',label:'Resilience',emoji:'💪'},
    {id:'money',label:'Money',emoji:'💰'},{id:'ubuntu',label:'Ubuntu',emoji:'🤝'},{id:'growth',label:'Growth',emoji:'🌱'},
    {id:'courage',label:'Courage',emoji:'✊'},
  ]

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{position:'relative',overflow:'hidden',background:'var(--bg-surface)',border:'1px solid rgba(99,102,241,0.25)',borderRadius:16,padding:'16px 18px'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,var(--indigo, #6366F1),transparent)'}}/>
        <div style={{fontSize:'0.65rem',fontFamily:'var(--font-mono)',color:'var(--indigo, #6366F1)',letterSpacing:'0.09em',marginBottom:4}}>PHILOSOPHY FEED</div>
        <div style={{fontSize:'1rem',fontWeight:700,color:'var(--text-primary)'}}>Applied wisdom for your actual life</div>
      </div>

      {/* Domain filter */}
      <div style={{display:'flex',gap:6,overflowX:'auto'}}>
        {DOMAINS.map(d=>(
          <button key={String(d.id)} onClick={()=>setDomain(d.id)} style={{flexShrink:0,padding:'6px 12px',background:domain===d.id?'rgba(99,102,241,0.12)':'var(--bg-surface)',border:`1px solid ${domain===d.id?'rgba(99,102,241,0.3)':'var(--border-subtle)'}`,borderRadius:100,color:domain===d.id?'var(--indigo, #6366F1)':'var(--text-secondary)',fontSize:'0.68rem',fontFamily:'var(--font-mono)',fontWeight:domain===d.id?700:400,cursor:'pointer',whiteSpace:'nowrap'}}>
            {d.emoji} {d.label}
          </button>
        ))}
      </div>

      {/* Today's insight */}
      <DailyInsightCard quote={todayQuote} riskLevel={academic.riskLevel}/>

      {/* Quote shuffle */}
      <button onClick={()=>setQuoteIdx(i=>(i+1)%filteredQuotes.length)} style={{padding:'10px 0',background:'transparent',border:'1px solid var(--border-subtle)',borderRadius:10,color:'var(--text-tertiary)',fontSize:'0.72rem',fontFamily:'var(--font-mono)',cursor:'pointer'}}>
        Next quote →
      </button>

      {/* Book summaries */}
      <div>
        <div style={{fontSize:'0.62rem',fontFamily:'var(--font-mono)',color:'var(--text-muted)',letterSpacing:'0.07em',marginBottom:10}}>5-MINUTE BOOK SUMMARIES</div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {BOOK_SUMMARIES.map((b,i)=>(
            <div key={i} style={{background:'var(--bg-surface)',border:`1px solid ${bookOpen===i?`${b.color}30`:'var(--border-subtle)'}`,borderLeft:`3px solid ${b.color}`,borderRadius:12,overflow:'hidden'}}>
              <button onClick={()=>setBookOpen(bookOpen===i?null:i)} style={{display:'flex',alignItems:'center',gap:12,width:'100%',padding:'12px 14px',background:'none',border:'none',cursor:'pointer',textAlign:'left'}}>
                <span style={{fontSize:'1.4rem',flexShrink:0}}>{b.emoji}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:'0.84rem',fontWeight:700,color:'var(--text-primary)'}}>{b.title}</div>
                  <div style={{fontSize:'0.65rem',color:'var(--text-muted)',marginTop:1}}>{b.author}</div>
                </div>
                <span style={{fontSize:'0.6rem',color:'var(--text-muted)',transform:bookOpen===i?'rotate(180deg)':'none',transition:'transform 0.2s'}}>▾</span>
              </button>
              {bookOpen===i&&(
                <div style={{padding:'0 14px 14px',display:'flex',flexDirection:'column',gap:8}}>
                  <div style={{fontSize:'0.75rem',color:'var(--text-secondary)',lineHeight:1.65}}>{b.summary}</div>
                  <div style={{padding:'10px 12px',background:`${b.color}10`,border:`1px solid ${b.color}20`,borderRadius:8}}>
                    <div style={{fontSize:'0.62rem',fontFamily:'var(--font-mono)',color:b.color,marginBottom:4}}>KEY LESSON</div>
                    <div style={{fontSize:'0.75rem',color:'var(--text-secondary)',lineHeight:1.6}}>{b.keyLesson}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
