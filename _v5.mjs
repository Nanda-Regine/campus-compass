import { chromium } from 'playwright'; import fs from 'fs'
const BASE='https://varsityos.co.za', EMAIL='nandaregine@gmail.com', PASSWORD='Nanda26##'
const OUT='C:/Users/LINDAM~1/AppData/Local/Temp/claude/C--Users-Linda-Mona-OneDrive-Documents-varsityos-campus-compass/b4d6050f-d38f-4b71-bba4-39f7d8089b23/scratchpad'
const b=await chromium.launch()
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,userAgent:'Mozilla/5.0 (Linux; Android 12; Tecno) Mobile'})
const p=await ctx.newPage(); p.setDefaultTimeout(60000); p.setDefaultNavigationTimeout(60000)
await p.goto(`${BASE}/auth/login`,{waitUntil:'domcontentloaded'})
await p.locator('input[type="email"]').fill(EMAIL); await p.locator('input[type="password"]').fill(PASSWORD)
await p.getByRole('button',{name:/^sign in$/i}).click()
for(let i=0;i<80 && p.url().includes('/auth/login');i++) await p.waitForTimeout(500)
await p.goto(`${BASE}/budget?tab=wallet`,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(6000)
try{ await p.getByRole('button',{name:/essential only/i}).click({timeout:3000}) }catch{}
await p.waitForTimeout(400)
await p.screenshot({path:OUT+'/wallet_v3.png'})
// sample the secondary texts we care about
const res=await p.evaluate(()=>{
  const q=['Manual income','Savings','pocket money · ','Set a target','New goal']
  const out=[]
  for(const el of document.querySelectorAll('span,p,div,h3,button')){
    const t=(el.childNodes.length===1&&el.childNodes[0].nodeType===3)?el.textContent.trim():''
    if(!t) continue
    for(const s of q){ if(t.toLowerCase().startsWith(s.toLowerCase())){ out.push({t:t.slice(0,24),color:getComputedStyle(el).color}); break } }
  }
  return out.slice(0,8)
})
console.log(JSON.stringify(res,null,1))
// side-by-side vs the previous (wallet_after = e18910e /55)
fs.writeFileSync(OUT+'/_c.html',`<body style="margin:0;background:#111;display:flex;gap:12px;padding:16px;font-family:sans-serif">
 <div><div style="color:#fbbf24;font-size:13px;text-align:center">PREV (e18910e · /55)</div><img src="file://${OUT}/wallet_after.png" style="width:360px;border:1px solid #333"></div>
 <div><div style="color:#4ade80;font-size:13px;text-align:center">NOW (a471200 · /78)</div><img src="file://${OUT}/wallet_v3.png" style="width:360px;border:1px solid #333"></div></body>`)
const pg=await b.newPage({viewport:{width:780,height:400}}); await pg.goto('file://'+OUT+'/_c.html'); await pg.waitForTimeout(500)
await pg.screenshot({path:OUT+'/wallet_final_sbs.png',fullPage:true})
await b.close()
