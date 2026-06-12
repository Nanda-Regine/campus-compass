import { NextRequest, NextResponse } from 'next/server'

// ─── wttr.in proxy ────────────────────────────────────────────
// Serves as a server-side CORS-safe proxy to wttr.in.
// Caches for 30 minutes to stay data-light for Nomvula's 2GB plan.

export const runtime = 'edge'

interface WttrCurrent {
  temp_C:          string
  FeelsLikeC:      string
  windspeedKmph:   string
  humidity:        string
  weatherCode:     string
  weatherDesc:     { value: string }[]
  weatherIconUrl:  { value: string }[]
  uvIndex:         string
  cloudcover:      string
  precipMM:        string
  visibility:      string
}

interface WttrHourly {
  time:          string
  tempC:         string
  FeelsLikeC:    string
  weatherDesc:   { value: string }[]
  precipMM:      string
  weatherCode:   string
}

interface WttrDay {
  date:          string
  maxtempC:      string
  mintempC:      string
  uvIndex:       string
  hourly:        WttrHourly[]
  astronomy:     { sunrise: string; sunset: string }[]
}

interface WttrResponse {
  current_condition: WttrCurrent[]
  weather:           WttrDay[]
  nearest_area:      { areaName: { value: string }[]; country: { value: string }[] }[]
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const city = (searchParams.get('city') ?? 'Cape Town').trim()

  const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'VarsityOS/1.0 (campus-compass)' },
      // Edge runtime handles cache via Next.js revalidate
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Weather service unavailable' }, { status: 502 })
    }

    const raw: WttrResponse = await res.json()
    const cur = raw.current_condition[0]
    const today = raw.weather[0]
    const tomorrow = raw.weather[1]
    const area = raw.nearest_area[0]?.areaName[0]?.value ?? city

    // Sunrise / sunset
    const sunrise = today.astronomy[0]?.sunrise ?? ''
    const sunset  = today.astronomy[0]?.sunset ?? ''

    // Today's rain probability — derived from max hourly precipMM
    const maxPrecip = Math.max(...today.hourly.map(h => parseFloat(h.precipMM ?? '0')))
    const isRainy   = maxPrecip > 1 || cur.precipMM !== '0'

    // UV risk
    const uv        = parseInt(cur.uvIndex ?? today.uvIndex ?? '0')
    const uvRisk    = uv >= 8 ? 'very high' : uv >= 6 ? 'high' : uv >= 3 ? 'moderate' : 'low'

    // "What to wear" logic
    const tempC       = parseInt(cur.temp_C)
    const desc        = cur.weatherDesc[0]?.value?.toLowerCase() ?? ''
    const isWind      = parseInt(cur.windspeedKmph) > 30
    const isSnow      = desc.includes('snow') || desc.includes('sleet')
    const isFog       = desc.includes('fog') || desc.includes('mist')
    const isThunder   = desc.includes('thunder') || desc.includes('storm')

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
    if (isRainy) tips.push('Carry an umbrella to avoid walking between lecture halls in the rain.')
    if (uv >= 6)  tips.push(`UV index is ${uv} — apply SPF 30+ before outdoor classes.`)
    if (isWind)   tips.push('Strong winds today — secure notes and documents.')
    if (isFog)    tips.push('Reduced visibility — allow extra travel time from res.')
    if (tempC > 30) tips.push('Stay hydrated during long lecture blocks — heat can reduce focus.')

    const payload = {
      area,
      temp_C:        parseInt(cur.temp_C),
      feels_like_C:  parseInt(cur.FeelsLikeC),
      condition:     cur.weatherDesc[0]?.value ?? 'Clear',
      humidity:      parseInt(cur.humidity),
      wind_kmph:     parseInt(cur.windspeedKmph),
      uv,
      uv_risk:       uvRisk,
      is_rainy:      isRainy,
      precip_mm:     maxPrecip,
      sunrise,
      sunset,
      outfit: { text: outfit, emoji: outfitEmoji },
      tips,
      tomorrow: tomorrow ? {
        max_C: parseInt(tomorrow.maxtempC),
        min_C: parseInt(tomorrow.mintempC),
        condition: tomorrow.hourly[4]?.weatherDesc[0]?.value ?? 'Unknown',
        is_rainy: Math.max(...tomorrow.hourly.map(h => parseFloat(h.precipMM ?? '0'))) > 1,
      } : null,
    }

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=600',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 500 })
  }
}
