'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AmbientImage } from '@/components/ui/AmbientImage'

type Lang = 'en' | 'zu' | 'xh' | 'af' | 'st' | 'tn' | 'nso' | 'ts' | 'ss' | 've' | 'nr'

const LANG_LABELS: Record<Lang, string> = {
  en: 'English', zu: 'isiZulu', xh: 'isiXhosa', af: 'Afrikaans', st: 'Sesotho', tn: 'Setswana',
  nso: 'Sepedi', ts: 'Xitsonga', ss: 'siSwati', ve: 'Tshivenda', nr: 'isiNdebele',
}

interface TourStep { emoji: string; section: string; title: string; body: string; features: string[] }
interface LangPack { chooseLang: string; continueBtn: string; next: string; back: string; skip: string; done: string; steps: TourStep[] }

const CONTENT: Record<Lang, LangPack> = {
  en: {
    chooseLang: 'Choose your language', continueBtn: 'Continue in English',
    next: 'Next →', back: '← Back', skip: 'Skip tour', done: 'Enter VarsityOS →',
    steps: [
      { emoji: '📚', section: 'ACADEMIC', title: 'Study — Your Academic Brain',
        body: 'Everything for your studies in one room. Timetable, Pomodoro timers, Grades, Flashcards (spaced repetition), Exam Readiness, Attendance, and AI-matched Study Pods.',
        features: ['14 study tools in one tab', 'AI-matched study partners', 'Exam countdown & readiness score'] },
      { emoji: '💰', section: 'MONEY', title: 'Budget & Stokvel — Your Financial OS',
        body: 'Track every rand of your NSFAS allowance. Set categories, log expenses, see your burn rate. Join a Stokvel to save collectively with classmates — community banking at its best.',
        features: ['NSFAS allowance tracking', 'Stokvel community savings', 'Bursary & scholarship finder'] },
      { emoji: '🏡', section: 'LIFE', title: 'Life OS — Body, Safety & Wellbeing',
        body: 'Log meals with SA nutritional data, track sleep debt, build fitness habits, calm your nervous system in Regulate. Share your live location with friends for walk-home safety.',
        features: ['Meal & nutrition logging', 'Sleep & fitness tracking', 'Walk-home safety alerts'] },
      { emoji: '🚀', section: 'CAREER', title: 'Career & Growth — Your Future Path',
        body: 'Browse SA job listings, track your shifts in Work, build your business in Launch Pad. The Skills Academy teaches in-demand digital skills through bite-sized courses.',
        features: ['SA job board & applications', 'Hustle & business tracker', 'Digital Skills Academy'] },
      { emoji: '🤝', section: 'COMMUNITY', title: 'Community — Your People',
        body: 'The Social feed shows what\'s happening across campus. Find textbooks in Marketplace, get peer tutoring, share notes, report lost items, and stay updated via Broadcasts.',
        features: ['Campus social feed & events', 'Peer tutoring & notes sharing', 'Marketplace & Lost+Found'] },
      { emoji: '✨', section: 'NOVA AI', title: 'Nova — Your Personal AI',
        body: 'Nova knows your modules, finances, schedule, and wellbeing. Ask her anything — she gives advice in your context, not generic internet answers. She speaks your language.',
        features: ['Context-aware SA advice', 'Answers about your own data', 'Voice mode available'] },
    ],
  },
  zu: {
    chooseLang: 'Khetha ulimi lwakho', continueBtn: 'Qhubeka nge-isiZulu',
    next: 'Okulandelayo →', back: '← Emuva', skip: 'Yeqa uhambo', done: 'Ngena ku-VarsityOS →',
    steps: [
      { emoji: '📚', section: 'IZIFUNDO', title: 'Isifundo — Ubuchopho Bakho',
        body: 'Konke kwizifundo zakho endaweni eyodwa. Isikhathi, Pomodoro, Amanqaku, Ama-Flashcard, Ukulungiselela Izivivinyo, Ukuvaleleka, ne-Study Pods nge-AI.',
        features: ['Amathuluzi angu-14 ezifundweni', 'Iziqhwaga zokufunda ze-AI', 'Ikhawunta yezivivinyo'] },
      { emoji: '💰', section: 'IMALI', title: 'Isabelomali & Stokvel',
        body: 'Landelela i-rand ngayinye ye-NSFAS. Hlela izindleko, qakula izikhwama, bona izinga lenkokhelo. Joyina i-Stokvel ukonga nabane.',
        features: ['Ukuphatha i-NSFAS', 'Ukonga kwe-Stokvel', 'Umtholampilo we-Bursary'] },
      { emoji: '🏡', section: 'UKUPHILA', title: 'I-OS Yokuphila — Impilo Yakho',
        body: 'Bhala ukudla ngedatha yezokudla yase-SA, landela ukuntula kobuthongo, yenza imikhuba yokuzivocavoca, futhi unakekele isimo sakho se-nervous system.',
        features: ['Ukubhala ukudla nokudla', 'Ukulandela ukulala', 'Izexwayiso zokuphepha'] },
      { emoji: '🚀', section: 'UMSEBENZI', title: 'Imisebenzi & Ukukhula',
        body: 'Phequlula izithupha zemisebenzi yase-SA, qophela izigi zakho, sakhe ibhizinisi lakho. I-Skills Academy ifundisa amakhono edijithali adingekayo.',
        features: ['Ukubheka imisebenzi yase-SA', 'Ukulandela ibhizinisi', 'I-Digital Skills Academy'] },
      { emoji: '🤝', section: 'UMPHAKATHI', title: 'Umphakathi — Abantu Bakho',
        body: 'Ukulandelela kwe-Social kukubonisa okuenzeka e-campus. Thola futhi uthengise izincwadi, fumana umfundisi wabalinganayo, wabelane ngamanothi akho.',
        features: ['Izindaba ze-campus', 'Ukufundiswa nokuabelana', 'Ukuthenga ne-Lost+Found'] },
      { emoji: '✨', section: 'I-NOVA AI', title: 'I-Nova — I-AI Yakho',
        body: 'I-Nova iyazi izihloko zakho, izimali, uhlelo lwezikhathi, nempilo. Buza noma yini — izonikeza izeluleko ngomongo wakho, hhayi izimpendulo zomthi wekasi.',
        features: ['Izeluleko ezinawo umongo', 'Izimpendulo mayelana nedatha yakho', 'Ikhuluma izilimi zase-SA'] },
    ],
  },
  xh: {
    chooseLang: 'Khetha ulwimi lwakho', continueBtn: 'Qhubeka nge-isiXhosa',
    next: 'Okulandelayo →', back: '← Emva', skip: 'Yeyula uhambo', done: 'Ngena ku-VarsityOS →',
    steps: [
      { emoji: '📚', section: 'ISIFUNDO', title: 'Isifundo — Ubuchopho Bakho',
        body: 'Yonke into yezifundo zakho kwigumbi elinye. Igatya lokuFunda, Pomodoro, Amanqaku, Ikarti, UkuLungisa Iviwe, UkuMana, ne-Study Pods.',
        features: ['Izixhobo eziyi-14 zokufunda', 'Abalingane bokufunda be-AI', 'Ukubala iviwe'] },
      { emoji: '💰', section: 'IMALI', title: 'Isabelomali & Stokvel',
        body: 'Landela rand nganye ye-NSFAS yakho. Beka iindidi, bhala iindleko, ubone izinga lokuphuma. Joyina i-Stokvel ukonga kunye nabalingane bakho.',
        features: ['Ukulawula i-NSFAS', 'Ukonga kwe-Stokvel', 'Umfunzi we-Bursary'] },
      { emoji: '🏡', section: 'UBOMI', title: 'I-OS yoBomi — Impilo Yakho',
        body: 'Bhala ukutya ngeedatha zokutya zase-SA, landela ikho-la boroko, yakhela imikhwa yokuzilolonga, futhi zikhulule kwigumbi le-Regulate.',
        features: ['Ukubhala ukutya', 'Ukuqaphela boroko', 'Iingxaki zokhuseleko'] },
      { emoji: '🚀', section: 'UMSEBENZI', title: 'Umsebenzi & Ukukhula',
        body: 'Khangela imisebenzi yase-SA, beka amashifti akho, futhi wakhe ishishini lakho kwi-Launch Pad. I-Skills Academy ifundisa izakhono zedijithali.',
        features: ['Ukukhangela imisebenzi', 'Ukuphatha ishishini', 'I-Digital Skills Academy'] },
      { emoji: '🤝', section: 'ULUNTU', title: 'Uluntu — Abantu Bakho',
        body: 'I-Social feed ikubonisa okwenzekayo ekhampasini. Fumana uthengise izincwadi kwi-Marketplace, fumana umfundisi wabalinganayo, wabelane ngeenkcukacha zakho.',
        features: ['I-feed yobomi ekhampasini', 'Ukufundisana nokuarolelana', 'Ukuthenga ne-Lost+Found'] },
      { emoji: '✨', section: 'I-NOVA AI', title: 'I-Nova — I-AI Yakho',
        body: 'I-Nova iyazi izifundo zakho, imali, ipolisi lixesha, nempilo. Buza nantoni na — iza kunika ingcebiso ngomxholo wakho.',
        features: ['Ingcebiso enomxholo', 'Iimpendulo ngeedatha zakho', 'Ithetha iilwimi zase-SA'] },
    ],
  },
  af: {
    chooseLang: 'Kies jou taal', continueBtn: 'Gaan voort in Afrikaans',
    next: 'Volgende →', back: '← Terug', skip: 'Slaan toer oor', done: 'Gaan na VarsityOS →',
    steps: [
      { emoji: '📚', section: 'AKADEMIE', title: 'Studies — Jou Akademiese Brein',
        body: 'Alles vir jou studies in een kamer. Rooster, Pomodoro, Punte, Flitskaarte, Eksamengereedheid, Bywoning, en AI-gepaarde Studiegroepies.',
        features: ['14 studiegereedskap in een oortjie', 'AI-gepaarde studievennote', 'Eksamentelling en gereedheid'] },
      { emoji: '💰', section: 'GELD', title: 'Begroting & Stokvel',
        body: 'Volg elke rand van jou NSFAS-toelae op. Stel kategorieë, teken uitgawes aan, sien jou brandtempo. Sluit aan by \'n Stokvel om saam met klasmaats te spaar.',
        features: ['NSFAS-begroting opsporing', 'Stokvel-spaarkring', 'Beurs- en befondsingssoeker'] },
      { emoji: '🏡', section: 'LEWE', title: 'Lewe OS — Liggaam, Veiligheid & Welstand',
        body: 'Teken maaltye aan met SA-voedingsdata, volg slaapstekort, bou fiksheidsgewoontes, kalmeer jou senustelsel in Regulate. Deel jou ligging vir loop-huis-veiligheid.',
        features: ['Maaltyd en voeding', 'Slaap en fiksheidopsporing', 'Loop-huis-veiligheidsalarms'] },
      { emoji: '🚀', section: 'LOOPBAAN', title: 'Loopbaan & Groei',
        body: 'Blaai deur SA-werkaanbiedinge, volg jou skofte in Werk, bou jou besigheid in Lanseerder. Die Vaardigheidsakademie leer digitale vaardighede.',
        features: ['SA werkbord en aansoeke', 'Besigheidsopsporing', 'Digitale Vaardigheidsakademie'] },
      { emoji: '🤝', section: 'GEMEENSKAP', title: 'Gemeenskap — Jou Mense',
        body: 'Die Sosiale-voer toon wat oor kampus gebeur. Vind en verkoop handboeke, kry eweknie-onderrig, deel notas, en bly op hoogte via Uitsendings.',
        features: ['Kampus-sosiale voer', 'Eweknie-onderrig en notas-deel', 'Markplek en Verloor+Gevind'] },
      { emoji: '✨', section: 'NOVA KI', title: 'Nova — Jou Persoonlike KI',
        body: 'Nova ken jou modules, finansies, skedule en welstand. Vra haar enigiets — sy gee advies in jou konteks, nie generiese internet-antwoorde nie.',
        features: ['Konteks-bewuste advies', 'Antwoorde oor jou data', 'Praat SA-tale'] },
    ],
  },
  st: {
    chooseLang: 'Khetha puo ea hau', continueBtn: 'Tswela pele ka Sesotho',
    next: 'E latelang →', back: '← Morao', skip: 'Tlola leeto', done: 'Kena ho VarsityOS →',
    steps: [
      { emoji: '📚', section: 'THUTO', title: 'Thuto — Bongo ba Hau',
        body: 'Tsohle bakeng sa dithuto tsa hau kamoreng e le nngwe. Nako ea Thuto, Pomodoro, Manno, Dikarete, Boipokello ba Litlhahlobo le Study Pods.',
        features: ['Lisebelisoa tse 14 thutong', 'Metsoalle ea thuto ea AI', 'Lipalo tsa litlhahlobo'] },
      { emoji: '💰', section: 'CHELETE', title: 'Tekanyetso & Stokvel',
        body: 'Latela rand e nngwe le e nngwe ea NSFAS ea hau. Beha likarolo, ngola litsebi, bona sekhahla. Kenela Stokvel ho boloka le baithuti ba hau.',
        features: ['Ho laola NSFAS', 'Poloko ea Stokvel', 'Batlisiso ea Bursary'] },
      { emoji: '🏡', section: 'BOPHELO', title: 'I-OS ea Bophelo — Mmele le Polokeho',
        body: 'Ngola dijo ka data ea phepo ea SA, latela kadimo ea boroko, aha mikhwa ea boitlhaho, khutsa moriri oa hau kamoreng ea Regulate.',
        features: ['Ho ngola dijo le phepo', 'Latela boroko le boitlhaho', 'Marang-rang a polokeho'] },
      { emoji: '🚀', section: 'MOSEBETSI', title: 'Mosebetsi & Khoebo',
        body: 'Batla metsotso ea mosebetsi ea SA, ngola masete a hau, haha khoebo ea hau ho Launch Pad. Skills Academy e ruta bokgoni ba dijithale.',
        features: ['Sebaka sa mosebetsi ea SA', 'Ho laola khoebo', 'Skills Academy ea Dijithale'] },
      { emoji: '🤝', section: 'SECHABA', title: 'Sechaba — Batho Ba Hau',
        body: 'Tshebediso ea Social e u bontša se etsahalang campuseng. Fumana le rekisa dibuka, fumana moqeqi, arolelana manotse a hau.',
        features: ['Tshebediso ea setjhaba sa campus', 'Ho thuswa le ho arolelana', 'Marketplace le Ho lahlehelwa'] },
      { emoji: '✨', section: 'NOVA AI', title: 'Nova — AI ea Hau ya Botho',
        body: 'Nova e tseba libaka tsa hau, lichelete, nako, le bophelo ba hau. Botsa sengwe le sengwe — e tla fana ka keletso nng mokotleng oa hau.',
        features: ['Keletso e nang le maano', 'Diphetolo mabapi le data ea hau', 'E bua lipuo tsa SA'] },
    ],
  },
  tn: {
    chooseLang: 'Tlhopha puo ya gago', continueBtn: 'Tswelela ka Setswana',
    next: 'E e latelang →', back: '← Morago', skip: 'Tlola leeto', done: 'Tsena mo VarsityOS →',
    steps: [
      { emoji: '📚', section: 'THUTO', title: 'Thuto — Mogopolo wa Gago',
        body: 'Tsotlhe tsa dithuto tsa gago mo kaemong e le nngwe. Nako ya Thuto, Pomodoro, Manno, Dikarete, Boitekanelo jwa Ditshekatsheko le Study Pods.',
        features: ['Dithuso tse 14 mo thutong', 'Bagaetsho ba thuto ba AI', 'Dipalo tsa ditshekatsheko'] },
      { emoji: '💰', section: 'MADI', title: 'Tekanyetso & Stokvel',
        body: 'Leba rand nngwe le nngwe ya NSFAS ya gago. Baya dikgaolo, kwala ditšhenyo, bona seelo sa tiro. Tsena mo Stokvel go boloka mmogo le baakaademi ba gago.',
        features: ['Go laola NSFAS', 'Go boloka ka Stokvel', 'Batlhodi ya Bursary'] },
      { emoji: '🏡', section: 'BOTSHELO', title: 'I-OS ya Botshelo — Mmele le Polokeho',
        body: 'Kwala dijo ka data ya phepo ya SA, leba kadimo ya boroko, aga metlhale ya boitlhao, le go tlola manokonoko ya gago mo kaemong ya Regulate.',
        features: ['Go kwala dijo le phepo', 'Go leba boroko le boitlhao', 'Dikgakololo tsa polokeho'] },
      { emoji: '🚀', section: 'TIRO', title: 'Tiro & Kgolo',
        body: 'Batlha ditiro tsa SA, kwala dishifte tsa gago, le go aga kgwebo ya gago mo Launch Pad. Skills Academy e ruta bokgoni jwa dijithale.',
        features: ['Bataura tiro ya SA', 'Go laola kgwebo', 'Skills Academy ya Dijithale'] },
      { emoji: '🤝', section: 'SETŠHABA', title: 'Setšhaba — Batho Ba Gago',
        body: 'Social feed e bontsha se se diragalang khaemphase. Bona le rekisa dibuka, fumana morutwi, arolelana dinotse tsa gago.',
        features: ['Tiro ya setlhopha sa khaemphase', 'Go rutiwa le go arolelana', 'Marketplace le Go latlhegelwa'] },
      { emoji: '✨', section: 'NOVA AI', title: 'Nova — AI ya Gago ya Botho',
        body: 'Nova e itse dikgaolo tsa gago, madi, nako le boitekanelo. Botsa sengwe le sengwe — e tla naya kgakololo mo gongwe go ya ga gago.',
        features: ['Kgakololo e nang le sefa', 'Dikarabo ka data ya gago', 'E bua dipuo tsa SA'] },
    ],
  },
  nso: {
    chooseLang: 'Khetha puo ya gago', continueBtn: 'Tšwela pele ka Sepedi',
    next: 'E e latelago →', back: '← Morago', skip: 'Retela leeto', done: 'Tsena ho VarsityOS →',
    steps: [
      { emoji: '📚', section: 'THUTO', title: 'Thuto — Mahlale a Gago',
        body: 'Tsohle bakeng sa dithuto tsa gago kamoreng e le nngwe. Nako ya Thuto, Pomodoro, Manno, Dikarete, Boitekanelo jwa Ditshekatsheko le Study Pods tsa AI.',
        features: ['Dithuso tse 14 thutong', 'Bagaetsho ba thuto ba AI', 'Dipalo tsa ditshekatsheko'] },
      { emoji: '💰', section: 'MADI', title: 'Bajete & Stokvel',
        body: 'Bona rand nngwe le nngwe ya NSFAS ya gago. Baya dikgaolo, kwala ditšhenyo, bona seelo. Tsena mo Stokvel go boloka mmogo le baakaademi ba gago.',
        features: ['Go laola NSFAS', 'Go boloka ka Stokvel', 'Hwetša Bursary'] },
      { emoji: '🏡', section: 'BOPHELO', title: 'I-OS ya Bophelo — Mmele le Polokeho',
        body: 'Kwala dijo ka data ya phepo ya SA, leba boroko, aga metlhale ya boitlhao, le go khutša mo kaemong ya Regulate.',
        features: ['Go kwala dijo le phepo', 'Go leba boroko le boitlhao', 'Dikgakololo tša polokeho'] },
      { emoji: '🚀', section: 'MODIRO', title: 'Modiro & Kgolo',
        body: 'Hwetša ditiro tša SA, kwala dishifte tša gago, le go aga kgwebo ya gago mo Launch Pad. Skills Academy e ruta bokgoni bja dijithale.',
        features: ['Bataura tiro ya SA', 'Go laola kgwebo', 'Skills Academy ya Dijithale'] },
      { emoji: '🤝', section: 'SETŠHABA', title: 'Setšhaba — Batho Ba Gago',
        body: 'Social feed e bontsha se se diragalang khaemphase. Hwetša le rekiša dibuka, hwetša morutiši, arolelana dinotse tša gago.',
        features: ['Tiro ya setlhopha sa khaemphase', 'Go rutiwa le go arolelana', 'Marketplace le Go latlhegelwa'] },
      { emoji: '✨', section: 'NOVA AI', title: 'Nova — AI ya Gago ya Botho',
        body: 'Nova e itse dikgaolo tša gago, madi, nako le boitekanelo. Botšiša sengwe le sengwe — e tla naya kgakololo mo gongwe go ya ga gago.',
        features: ['Kgakololo e nang le sefa', 'Dikarabo ka data ya gago', 'E bua dipuo tša SA'] },
    ],
  },
  ts: {
    chooseLang: 'Hlawula ririmi ra wena', continueBtn: 'Tshika hi Xitsonga',
    next: 'Leswi landzelaka →', back: '← Endzhaku', skip: 'Tlula rhandzu', done: 'Nghena eka VarsityOS →',
    steps: [
      { emoji: '📚', section: 'DYONDZO', title: 'Dyondzo — Vutivi bya Wena',
        body: 'Hinkwaswo swa dyondzo ya wena endzawini yi le nngwe. Nkarhi wa Dyondzo, Pomodoro, Manano, Tikarete, Ku Lunghisa Swivutiso na Study Pods.',
        features: ['Switirhisiwa swa 14 swa dyondzo', 'Vanghana va dyondzo va AI', 'Nkarhi wa swivutiso'] },
      { emoji: '💰', section: 'MALI', title: 'Bajete & Stokvel',
        body: 'Landza rand wun\'wana na wun\'wana wa NSFAS ya wena. Baya tindzhawu, tsala swi-expense, vona nghenelo. Nghena eka Stokvel ku hlayisa na vaakaademi va wena.',
        features: ['Ku lawula NSFAS', 'Ku hlayisa ka Stokvel', 'Kuma Bursary'] },
      { emoji: '🏡', section: 'VUTOMI', title: 'I-OS ya Vutomi — Miri na Ku Hlayiseka',
        body: 'Tsala swakudya hi data ya miri ya SA, landza ku kandziyela ko lala, aka mivulavulo ya miri, na ku tsakama eka Regulate.',
        features: ['Ku tsala swakudya na miri', 'Ku landza ku lala', 'Swi-alert swa ku hlayiseka'] },
      { emoji: '🚀', section: 'NTIRHO', title: 'Ntirho & Ku Hula',
        body: 'Lavela mintirho ya SA, tsala tishifite ta wena, aka xitirho xa wena eka Launch Pad. Skills Academy yi dyondzisa bokgoni bja dijithale.',
        features: ['Ku lavela mintirho ya SA', 'Ku lawula xitirho', 'Skills Academy ya Dijithale'] },
      { emoji: '🤝', section: 'NTLAWA', title: 'Ntlawa — Vanhu Va Wena',
        body: 'Social feed yi kombisa leswi endlekaka eka khampasi. Kuma na xavisa tincwadi, kuma mufundzisi, avelana na manotisi ya wena.',
        features: ['Ku endzela ka khampasi', 'Dyondzo na ku avelana', 'Marketplace na Ku lahleka'] },
      { emoji: '✨', section: 'NOVA AI', title: 'Nova — AI ya Wena ya Ntiyiso',
        body: 'Nova yi tiva switungo swa wena, mali, nkarhi na vutomi. Vutisa swin\'wana — yi ta ku nyika maendlelo eka ndhawu ya wena.',
        features: ['Maendlelo lawa nga na ndhawu', 'Swihlamulo hi data ya wena', 'Yi vula tirimu ta SA'] },
    ],
  },
  ss: {
    chooseLang: 'Khetsa lulwimi lwakho', continueBtn: 'Chubeka nge-siSwati',
    next: 'Lokulandzela →', back: '← Emuva', skip: 'Dyondza', done: 'Ngena ku-VarsityOS →',
    steps: [
      { emoji: '📚', section: 'KUFUNDZA', title: 'Kufundza — Ingcondvo Yakho',
        body: 'Konkhe lokwekufundza kwakho endaweni yinye. Nkhundla, Pomodoro, Emamanqemu, Tikhadi, Kulungiselela Liviwe, Kukhona, ne-Study Pods.',
        features: ['Tithuluzi letini-14 tekufundza', 'Bangani bekufundza ba AI', 'Countdown yeliviwe'] },
      { emoji: '💰', section: 'IMALI', title: 'Isabelo & Stokvel',
        body: 'Landza rand ngayinye ye-NSFAS yakho. Beka tindlela, bhala tiindleko, bona inkhundla yokukhipha. Joyina Stokvel kugcina nababangani.',
        features: ['Kuphatha NSFAS', 'Kugcina ka Stokvel', 'Kufuna Bursary'] },
      { emoji: '🏡', section: 'IMPILO', title: 'I-OS Yempilo — Umtimba ne-Khuseleko',
        body: 'Bhala kudla ngedatha yekudla ye-SA, landza sikweleti sokulala, yakha imikhuba yokuzivocavoca, futsi uziphumzise ku-Regulate.',
        features: ['Kubhala kudla', 'Kulandza ukulala', 'Tizexwayiso tekukhuseleka'] },
      { emoji: '🚀', section: 'UMSEBENZI', title: 'Umsebenzi & Kukhula',
        body: 'Funa imisebenti ye-SA, bhala tishifti takho, futsi yakhe ibhizinisi lakho ku-Launch Pad. Skills Academy ifundzisa titfuba tekudigithal.',
        features: ['Kufuna imisebenti ye-SA', 'Kuphatha ibhizinisi', 'Digital Skills Academy'] },
      { emoji: '🤝', section: 'INHLANGANO', title: 'Inhlangano — Bantfu Bakho',
        body: 'Social feed ibonisa lokwentekako ekhampasini. Khetha uthengise tincwadi, funa umfundzisi, yabelana ngemanothisa akho.',
        features: ['Indlela yenhlalo yekhampasi', 'Kufundzisana nekwabelana', 'Marketplace ne-Lahlekiwe'] },
      { emoji: '✨', section: 'NOVA AI', title: 'Nova — AI Yakho yaBukhoma',
        body: 'Nova iyati tilwimi takho, imali, nkhundla, nempilo. Buza noma yini — itakunika iseluleko ngesimengo sakho.',
        features: ['Iseluleko lesinasimengo', 'Tiphendvulo ngedatha yakho', 'Ikhuluma tilwimi ta SA'] },
    ],
  },
  ve: {
    chooseLang: 'Nanga luambo lwau', continueBtn: 'Bvisela phanḓa nga Tshivenda',
    next: 'Zwine zwa tevhela →', back: '← Tshikoloma', skip: 'Fhufhula musafaro', done: 'Dzhena ho VarsityOS →',
    steps: [
      { emoji: '📚', section: 'NDIDIMELO', title: 'Ndidimelo — Vhudifari vha Nne',
        body: 'Zwothe zwa ndidimelo yau dzingomeni li le ḽithihi. Nakhoni, Pomodoro, Manno, Dikarete, U Ḓilugisela Lwiselo na Study Pods dza AI.',
        features: ['Zwishumiswa zwa 14 zwa ndidimelo', 'Mahwahwa a ndidimelo a AI', 'Nakhoni ya lwiselo'] },
      { emoji: '💰', section: 'MALI', title: 'Bajete & Stokvel',
        body: 'Lavhelesa rand iṅwe na iṅwe ya NSFAS yau. Vhea zwigwada, ṅwala zwishumiselo, vhona seelo. Dzhena Stokvel u boloka na vhafunzi vhau.',
        features: ['U lawula NSFAS', 'U boloka ka Stokvel', 'U wana Bursary'] },
      { emoji: '🏡', section: 'VHUTSHILO', title: 'I-OS ya Vhutshilo — Muvhili na U Sirela',
        body: 'Ṅwala zwakudya nga datha ya muvhili ya SA, lavhelesa u kandelela ga u lala, vhaka mivulavulo ya muvhili, na u fhosa mudangulo wau ho Regulate.',
        features: ['U ṅwala zwakudya', 'U lavhelesa u lala', 'Phosho dza u sirela'] },
      { emoji: '🚀', section: 'MUSHUMO', title: 'Mushumo & U Ḓikulisa',
        body: 'Lavhelesa mishumo ya SA, ṅwala dzishifiti dzau, vhaka vhushaka vhau ho Launch Pad. Skills Academy i ruta bokgoni bwa dijithale.',
        features: ['U lavhelesa mishumo ya SA', 'U lawula vhushaka', 'Skills Academy ya Dijithale'] },
      { emoji: '🤝', section: 'VHATHU', title: 'Vhathu — Vha Nne',
        body: 'Social feed i sumbedza zwi itiwaho kha khampuse. Wana na ṱengisa mabhuku, wana muṱuṱuwedzi, alelana na manotisi au.',
        features: ['Nḓowelo ya vhathu kha khampuse', 'Ndidimelo na u alelana', 'Marketplace na Zwo Fhiwa'] },
      { emoji: '✨', section: 'NOVA AI', title: 'Nova — AI yau ya Vhuthu',
        body: 'Nova i ḓivha zwifunwo zwau, mali, nakhoni na vhutshilo. Vhudzisa zwithu zwothe — i ḓo nea ndele kha nḓowelo yau.',
        features: ['Ndele ine ya ḓivha nḓowelo', 'Mafhindulo nga datha yau', 'I amba luambo lwa SA'] },
    ],
  },
  nr: {
    chooseLang: 'Khetha ilimi lakho', continueBtn: 'Qhubeka nge-isiNdebele',
    next: 'Okulandelayo →', back: '← Emuva', skip: 'Yeqela uhambo', done: 'Ngena ku-VarsityOS →',
    steps: [
      { emoji: '📚', section: 'ISIFUNDO', title: 'Isifundo — Ingqondo Yakho',
        body: 'Konke kwezifundo zakho endaweni eyodwa. Isikhathi, Pomodoro, Amanqaku, Amakaditjhi, Ukulungiselela Iviwe, Ukuvaleleka ne-Study Pods.',
        features: ['Amathuluzi angu-14 ezifundweni', 'Iziqhwaga zokufunda ze-AI', 'Ikhawunta yeviwe'] },
      { emoji: '💰', section: 'IMALI', title: 'Isabelo & Stokvel',
        body: 'Landela i-rand ngayinye ye-NSFAS yakho. Hlela izindleko, qakula izikhwama, bona izinga lenkokhelo. Joyina i-Stokvel ukonga nabanye.',
        features: ['Ukuphatha i-NSFAS', 'Ukonga kwe-Stokvel', 'Umtholampilo we-Bursary'] },
      { emoji: '🏡', section: 'UKUPHILA', title: 'I-OS yokuPhila — Umzimba noKuphepha',
        body: 'Bhala ukudla ngedatha yezokudla yase-SA, landela ukuntula kobuthongo, yenza imikhuba yokuzivocavoca, futhi unakekele isimo sakho.',
        features: ['Ukubhala ukudla', 'Ukulandela ukulala', 'Izexwayiso zokuphepha'] },
      { emoji: '🚀', section: 'UMSEBENZI', title: 'Umsebenzi & Ukukhula',
        body: 'Phequlula izithupha zemisebenzi yase-SA, qophela izigi zakho, sakhe ibhizinisi lakho. I-Skills Academy ifundisa amakhono edijithali.',
        features: ['Ukubheka imisebenzi yase-SA', 'Ukulandela ibhizinisi', 'Digital Skills Academy'] },
      { emoji: '🤝', section: 'UMPHAKATHI', title: 'Umphakathi — Abantu Bakho',
        body: 'I-Social feed ikubonisa okuenzeka e-campus. Thola uthengise izincwadi, fumana umfundisi, wabelana ngamanothi akho.',
        features: ['I-feed yabantfu bekhampasi', 'Ukufundisana nokwabelana', 'Ukuthenga ne-Lost+Found'] },
      { emoji: '✨', section: 'I-NOVA AI', title: 'Nova — I-AI Yakho yaBukhoma',
        body: 'I-Nova iyazi izifundo zakho, izimali, uhlelo lwezikhathi, nempilo. Buza noma yini — izonipha izeluleko ngomongo wakho.',
        features: ['Izeluleko ezinawo umongo', 'Izimpendulo mayelana nedatha', 'Ikhuluma izilimi zase-SA'] },
    ],
  },
}

const ACCENT = '#A855F7'
const TEAL   = '#00CFA0'

export default function TourWizard({ defaultLang }: { defaultLang: string }) {
  const router = useRouter()

  const validLang = (Object.keys(CONTENT) as Lang[]).includes(defaultLang as Lang) ? defaultLang as Lang : 'en'
  const [lang, setLang]     = useState<Lang>(validLang)
  const [step, setStep]     = useState(-1)  // -1 = language selection
  const [saving, setSaving] = useState(false)

  const t = CONTENT[lang]
  const totalSteps = t.steps.length

  const finish = useCallback(async (chosenLang: Lang) => {
    setSaving(true)
    try {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (user) {
        await sb.from('profiles').update({ preferred_language: chosenLang }).eq('id', user.id)
      }
    } finally {
      router.push('/dashboard')
    }
  }, [router])

  // ── Language screen ──────────────────────────────────────────────────────────
  if (step === -1) {
    return (
      <div style={{
        width: '100%', maxWidth: 440, margin: '0 auto', padding: '32px 24px',
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(148,111,255,0.18)',
        borderRadius: 20, boxShadow: '0 0 60px rgba(168,85,247,0.12)',
        position: 'relative', overflowX: 'hidden',
      }}>
        <AmbientImage zone="onboarding" opacity={0.32} blurPx={2} saturation={1.4} />
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🌍</div>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: 'rgba(168,85,247,0.7)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>
            Step 1
          </div>
          <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 22, color: '#fff', margin: 0 }}>
            Khetha ulimi / Choose Language
          </h1>
          <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>
            Pick the language for your VarsityOS training tour
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {(Object.entries(LANG_LABELS) as [Lang, string][]).map(([code, name]) => (
            <button key={code} onClick={() => setLang(code)} style={{
              padding: '14px 12px', borderRadius: 12, textAlign: 'center',
              background: lang === code ? `rgba(168,85,247,0.18)` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${lang === code ? 'rgba(168,85,247,0.45)' : 'rgba(255,255,255,0.08)'}`,
              color: lang === code ? ACCENT : 'rgba(255,255,255,0.55)',
              fontFamily: 'DM Sans,sans-serif', fontSize: 14, fontWeight: lang === code ? 700 : 400,
              cursor: 'pointer', transition: 'all 140ms ease',
            }}>{name}</button>
          ))}
        </div>

        <button onClick={() => setStep(0)} style={{
          width: '100%', padding: '14px', borderRadius: 12, fontWeight: 700, fontSize: 14,
          background: `linear-gradient(135deg, ${ACCENT}, ${TEAL})`,
          border: 'none', color: '#fff', cursor: 'pointer',
          fontFamily: 'DM Sans,sans-serif',
        }}>
          {CONTENT[lang].continueBtn}
        </button>
      </div>
    )
  }

  // ── Tour step ────────────────────────────────────────────────────────────────
  const current = t.steps[step]
  const progress = ((step + 1) / totalSteps) * 100

  return (
    <div style={{ width: '100%', maxWidth: 480, margin: '0 auto', padding: '0 16px', position: 'relative', overflowX: 'hidden' }}>
      <AmbientImage zone="onboarding" opacity={0.32} blurPx={2} saturation={1.4} />
      {/* Progress bar */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 28, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${ACCENT}, ${TEAL})`, transition: 'width 400ms ease', borderRadius: 2 }} />
      </div>

      {/* Card */}
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(148,111,255,0.18)',
        borderRadius: 20, padding: '28px 24px', boxShadow: '0 0 60px rgba(168,85,247,0.10)',
        marginBottom: 20,
      }}>
        {/* Section label */}
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(168,85,247,0.7)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 8 }}>
          {current.section} · {step + 1} / {totalSteps}
        </div>

        {/* Icon */}
        <div style={{ fontSize: 48, marginBottom: 14 }}>{current.emoji}</div>

        {/* Title */}
        <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 20, color: '#fff', margin: '0 0 10px' }}>
          {current.title}
        </h2>

        {/* Body */}
        <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, margin: '0 0 18px' }}>
          {current.body}
        </p>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {current.features.map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: TEAL, flexShrink: 0 }} />
              <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <button onClick={() => step > 0 ? setStep(s => s - 1) : setStep(-1)} style={{
          padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif',
        }}>{t.back}</button>

        <button onClick={() => router.push('/dashboard')} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)',
          fontSize: 11, fontFamily: '"JetBrains Mono",monospace', cursor: 'pointer', letterSpacing: '0.05em',
        }}>{t.skip}</button>

        {step < totalSteps - 1 ? (
          <button onClick={() => setStep(s => s + 1)} style={{
            padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            background: `linear-gradient(135deg, rgba(168,85,247,0.22), rgba(0,207,160,0.15))`,
            border: '1px solid rgba(168,85,247,0.35)', color: ACCENT,
            cursor: 'pointer', fontFamily: 'DM Sans,sans-serif',
          }}>{t.next}</button>
        ) : (
          <button onClick={() => finish(lang)} disabled={saving} style={{
            padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            background: `linear-gradient(135deg, ${ACCENT}, ${TEAL})`,
            border: 'none', color: '#fff', cursor: saving ? 'wait' : 'pointer',
            opacity: saving ? 0.7 : 1, fontFamily: 'DM Sans,sans-serif',
          }}>{saving ? '...' : t.done}</button>
        )}
      </div>
    </div>
  )
}
