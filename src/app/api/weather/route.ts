import { NextRequest, NextResponse } from 'next/server'

// ─── OpenWeatherMap proxy ──────────────────────────────────────
// Caches for 30 minutes — stays within OWM free-tier quota (1 000 calls/day)
// and keeps data costs low for Nomvula's 2GB plan.

export const runtime = 'nodejs'

interface OWMCurrent {
  coord:   { lat: number; lon: number }
  weather: { id: number; main: string; description: string }[]
  main:    { temp: number; feels_like: number; humidity: number }
  wind:    { speed: number }
  rain?:   { '1h'?: number }
  sys:     { sunrise: number; sunset: number }
  name:    string
}

interface OWMForecastItem {
  dt:     number
  main:   { temp: number; temp_max: number; temp_min: number }
  weather: { id: number; description: string }[]
  rain?:  { '3h'?: number }
}

interface OWMForecast {
  list: OWMForecastItem[]
}

interface OWMUvi { value: number }

function formatTime(unix: number): string {
  const d = new Date(unix * 1000)
  const h = d.getHours(), m = d.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hh = h % 12 || 12
  return `${hh}:${String(m).padStart(2, '0')} ${ampm}`
}

function owmIdToCondition(id: number): string {
  if (id >= 200 && id < 300) return 'Thunderstorm'
  if (id >= 300 && id < 400) return 'Drizzle'
  if (id >= 500 && id < 600) return 'Rain'
  if (id >= 600 && id < 700) return 'Snow'
  if (id === 741 || id === 701 || id === 711 || id === 721) return 'Fog'
  if (id >= 700 && id < 800) return 'Haze'
  if (id === 800) return 'Clear'
  if (id <= 802) return 'Partly Cloudy'
  return 'Cloudy'
}

export async function GET(req: NextRequest) {
  const key = process.env.OPENWEATHER_API_KEY
  if (!key) {
    return NextResponse.json({ error: 'OPENWEATHER_API_KEY not configured' }, { status: 500 })
  }

  const { searchParams } = new URL(req.url)
  const city = (searchParams.get('city') ?? 'Cape Town').trim()
  const base = 'https://api.openweathermap.org/data/2.5'

  try {
    // Fetch current weather + 5-day forecast in parallel
    const [curRes, fcRes] = await Promise.all([
      fetch(`${base}/weather?q=${encodeURIComponent(city)},ZA&units=metric&appid=${key}`),
      fetch(`${base}/forecast?q=${encodeURIComponent(city)},ZA&units=metric&cnt=16&appid=${key}`),
    ])

    if (!curRes.ok) {
      return NextResponse.json({ error: 'Weather service unavailable' }, { status: 502 })
    }

    const cur: OWMCurrent = await curRes.json()
    const fc: OWMForecast = fcRes.ok ? await fcRes.json() : { list: [] }

    // UV index requires lat/lon from the weather response
    const uvRes = await fetch(`${base}/uvi?lat=${cur.coord.lat}&lon=${cur.coord.lon}&appid=${key}`)
    const uvData: OWMUvi = uvRes.ok ? await uvRes.json() : { value: 0 }

    const uv      = Math.round(uvData.value)
    const uvRisk  = uv >= 8 ? 'very high' : uv >= 6 ? 'high' : uv >= 3 ? 'moderate' : 'low'
    const tempC   = Math.round(cur.main.temp)
    const windKmph = Math.round(cur.wind.speed * 3.6)
    const precipMm = cur.rain?.['1h'] ?? 0

    const weatherId = cur.weather[0]?.id ?? 800
    const isThunder = weatherId >= 200 && weatherId < 300
    const isSnow    = weatherId >= 600 && weatherId < 700
    const isFog     = weatherId >= 700 && weatherId < 800
    const isRainy   = (weatherId >= 300 && weatherId < 600) || precipMm > 0
    const isWind    = windKmph > 30

    // "What to wear" outfit logic
    let outfit: string
    let outfitEmoji: string
    if (isThunder) {
      outfit = 'Stay indoors if possible. Raincoat + closed shoes — lightning risk.'
      outfitEmoji = '⛈️'
    } else if (isSnow) {
      outfit = 'Warm layers, waterproof jacket, and boots.'
      outfitEmoji = '❄️'
    } else if (isRainy) {
      outfit = 'Rain jacket or umbrella. Quick-dry shoes — puddles likely.'
      outfitEmoji = '🌧️'
    } else if (tempC <= 8) {
      outfit = 'Heavy jacket, scarf, and layers. Cold morning commute.'
      outfitEmoji = '🧥'
    } else if (tempC <= 16) {
      outfit = 'Light jacket or hoodie. May warm up by noon.'
      outfitEmoji = '🧣'
    } else if (tempC <= 24) {
      outfit = isWind ? 'T-shirt + windbreaker — gusty today.' : 'T-shirt weather. Sunscreen if walking.'
      outfitEmoji = isWind ? '💨' : '👕'
    } else {
      outfit = uv >= 6 ? 'Shorts/dress + hat + sunscreen. UV is high.' : 'Hot day. Light clothing + stay hydrated.'
      outfitEmoji = uv >= 6 ? '🧴' : '☀️'
    }

    // Campus tips
    const tips: string[] = []
    if (isRainy)  tips.push('Carry an umbrella to avoid walking between lecture halls in the rain.')
    if (uv >= 6)  tips.push(`UV index is ${uv} — apply SPF 30+ before outdoor classes.`)
    if (isWind)   tips.push('Strong winds today — secure notes and documents.')
    if (isFog)    tips.push('Reduced visibility — allow extra travel time from res.')
    if (tempC > 30) tips.push('Stay hydrated during long lecture blocks — heat can reduce focus.')

    // Tomorrow: pull forecast items that fall on the next calendar day
    const todayDate = new Date().toISOString().slice(0, 10)
    const tomorrowItems = fc.list.filter(item =>
      new Date(item.dt * 1000).toISOString().slice(0, 10) > todayDate
    ).slice(0, 8)

    const tomorrowMax = tomorrowItems.length
      ? Math.round(Math.max(...tomorrowItems.map(i => i.main.temp_max))) : null
    const tomorrowMin = tomorrowItems.length
      ? Math.round(Math.min(...tomorrowItems.map(i => i.main.temp_min))) : null
    const tomorrowMidId = tomorrowItems[3]?.weather[0]?.id ?? 800
    const tomorrowRainy = tomorrowItems.some(i => {
      const id = i.weather[0]?.id ?? 800
      return (id >= 300 && id < 600) || (i.rain?.['3h'] ?? 0) > 0
    })

    const payload = {
      area:         cur.name || city,
      temp_C:       tempC,
      feels_like_C: Math.round(cur.main.feels_like),
      condition:    owmIdToCondition(weatherId),
      humidity:     cur.main.humidity,
      wind_kmph:    windKmph,
      uv,
      uv_risk:      uvRisk,
      is_rainy:     isRainy,
      precip_mm:    precipMm,
      sunrise:      formatTime(cur.sys.sunrise),
      sunset:       formatTime(cur.sys.sunset),
      outfit:       { text: outfit, emoji: outfitEmoji },
      tips,
      tomorrow: (tomorrowMax !== null && tomorrowMin !== null) ? {
        max_C:     tomorrowMax,
        min_C:     tomorrowMin,
        condition: owmIdToCondition(tomorrowMidId),
        is_rainy:  tomorrowRainy,
      } : null,
    }

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=600' },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 500 })
  }
}
