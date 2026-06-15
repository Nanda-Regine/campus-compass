import { NextRequest, NextResponse } from 'next/server'

// ─── Open-Meteo + OpenAQ proxy ────────────────────────────────────────────────
// Zero API keys required. Open-Meteo is free/open. OpenAQ v2 is public.
// Cached 30 minutes to protect Nomvula's 2GB data plan.

export const runtime = 'nodejs'
// nodejs runtime doesn't honour s-maxage via CDN automatically — use Next.js ISR instead
export const revalidate = 1800

// ── WMO weather-code decoder ──────────────────────────────────────────────────
interface WMOInfo {
  label: string
  isRainy: boolean
  isThunder: boolean
  isSnow: boolean
  isFog: boolean
}

function wmoInfo(code: number): WMOInfo {
  if (code === 0)             return { label: 'Clear',              isRainy: false, isThunder: false, isSnow: false, isFog: false }
  if (code <= 2)              return { label: 'Mainly Clear',       isRainy: false, isThunder: false, isSnow: false, isFog: false }
  if (code === 3)             return { label: 'Overcast',           isRainy: false, isThunder: false, isSnow: false, isFog: false }
  if (code <= 44)             return { label: 'Cloudy',             isRainy: false, isThunder: false, isSnow: false, isFog: false }
  if (code <= 48)             return { label: 'Fog',                isRainy: false, isThunder: false, isSnow: false, isFog: true  }
  if (code <= 57)             return { label: 'Drizzle',            isRainy: true,  isThunder: false, isSnow: false, isFog: false }
  if (code === 61)            return { label: 'Light Rain',         isRainy: true,  isThunder: false, isSnow: false, isFog: false }
  if (code <= 65)             return { label: code === 63 ? 'Rain' : 'Heavy Rain', isRainy: true, isThunder: false, isSnow: false, isFog: false }
  if (code <= 67)             return { label: 'Freezing Rain',      isRainy: true,  isThunder: false, isSnow: false, isFog: false }
  if (code <= 77)             return { label: 'Snow',               isRainy: false, isThunder: false, isSnow: true,  isFog: false }
  if (code <= 82)             return { label: 'Rain Showers',       isRainy: true,  isThunder: false, isSnow: false, isFog: false }
  if (code <= 86)             return { label: 'Snow Showers',       isRainy: false, isThunder: false, isSnow: true,  isFog: false }
  if (code === 95)            return { label: 'Thunderstorm',       isRainy: true,  isThunder: true,  isSnow: false, isFog: false }
  return                             { label: 'Thunderstorm + Hail',isRainy: true,  isThunder: true,  isSnow: false, isFog: false }
}

// ── SA city fallback coordinates (geocoding API unreachable) ──────────────────
const SA_COORDS: Record<string, { lat: number; lon: number }> = {
  'cape town':        { lat: -33.9249, lon: 18.4241 },
  'johannesburg':     { lat: -26.2041, lon: 28.0473 },
  'durban':           { lat: -29.8587, lon: 31.0218 },
  'pretoria':         { lat: -25.7479, lon: 28.2293 },
  'bloemfontein':     { lat: -29.0852, lon: 26.1596 },
  'port elizabeth':   { lat: -33.9608, lon: 25.6022 },
  'east london':      { lat: -33.0153, lon: 27.9116 },
  'pietermaritzburg': { lat: -29.6006, lon: 30.3794 },
  'nelspruit':        { lat: -25.4713, lon: 30.9701 },
  'polokwane':        { lat: -23.9045, lon: 29.4688 },
  'stellenbosch':     { lat: -33.9321, lon: 18.8602 },
  'grahamstown':      { lat: -33.3042, lon: 26.5328 },
  'kimberley':        { lat: -28.7282, lon: 24.7499 },
  'george':           { lat: -33.9631, lon: 22.4617 },
  'rustenburg':       { lat: -25.6671, lon: 27.2426 },
  'witbank':          { lat: -25.8755, lon: 29.2412 },
}

function parseLocalTime(isoStr: string): string {
  const timePart = (isoStr.split('T')[1] ?? '00:00').slice(0, 5)
  const [h, m] = timePart.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hh   = h % 12 || 12
  return `${hh}:${String(m).padStart(2, '0')} ${ampm}`
}

// ── PM2.5 → AQI category ──────────────────────────────────────────────────────
function pm25ToAqi(pm25: number): { category: string; color: string; advice: string } {
  if (pm25 <= 12)   return { category: 'Good',                           color: '#4ecf9e', advice: 'Air quality is clean. Safe for outdoor study sessions.' }
  if (pm25 <= 35.4) return { category: 'Moderate',                      color: '#f59e0b', advice: 'Acceptable air quality. Sensitive individuals should limit prolonged outdoor time.' }
  if (pm25 <= 55.4) return { category: 'Unhealthy for Sensitive Groups', color: '#f97316', advice: 'Keep outdoor time short. Use campus indoor spaces.' }
  if (pm25 <= 150)  return { category: 'Unhealthy',                     color: '#ef4444', advice: 'Reduce outdoor exercise. Wear a mask if walking across campus.' }
  return                   { category: 'Very Unhealthy',                 color: '#9333ea', advice: 'Stay indoors. Wear N95 mask if you must go out.' }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const city = (searchParams.get('city') ?? 'Cape Town').trim().slice(0, 100)

  try {
    // ── Step 1: Geocode city → lat/lon (Open-Meteo, free) ────────────────────
    let lat: number, lon: number, resolvedName: string

    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
      { signal: AbortSignal.timeout(4_000) }
    ).catch(() => null)

    if (geoRes?.ok) {
      const geoData = await geoRes.json() as { results?: { latitude: number; longitude: number; name: string }[] }
      const r = geoData.results?.[0]
      if (r) {
        lat = r.latitude; lon = r.longitude; resolvedName = r.name
      } else {
        const key = city.toLowerCase()
        const fb = SA_COORDS[key] ?? SA_COORDS['cape town']
        lat = fb.lat; lon = fb.lon; resolvedName = city
      }
    } else {
      const key = city.toLowerCase()
      const fb = SA_COORDS[key] ?? SA_COORDS['cape town']
      lat = fb.lat; lon = fb.lon; resolvedName = city
    }

    // ── Step 2: Fetch weather + air quality in parallel ───────────────────────
    const weatherUrl =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,weather_code,uv_index,is_day` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max,sunrise,sunset` +
      `&timezone=Africa%2FJohannesburg&forecast_days=2`

    const aqUrl =
      `https://api.openaq.org/v2/latest` +
      `?coordinates=${lat},${lon}&radius=50000&limit=5&parameter=pm25&order_by=distance`

    const [wxRes, aqRes] = await Promise.all([
      fetch(weatherUrl, { signal: AbortSignal.timeout(5_000) }),
      fetch(aqUrl, { signal: AbortSignal.timeout(4_000) }).catch(() => null),
    ])

    if (!wxRes.ok) {
      return NextResponse.json({ error: 'Weather service unavailable' }, { status: 502 })
    }

    const wx = await wxRes.json() as {
      current: {
        temperature_2m: number
        apparent_temperature: number
        relative_humidity_2m: number
        wind_speed_10m: number
        precipitation: number
        weather_code: number
        uv_index: number | null
        is_day: 0 | 1
      }
      daily: {
        weather_code:      number[]
        temperature_2m_max: number[]
        temperature_2m_min: number[]
        precipitation_sum:  number[]
        uv_index_max:       number[]
        sunrise:            string[]
        sunset:             string[]
      }
    }

    const cur     = wx.current
    const daily   = wx.daily
    const wmo     = wmoInfo(cur.weather_code)

    const tempC      = Math.round(cur.temperature_2m)
    const feelsC     = Math.round(cur.apparent_temperature)
    const windKmph   = Math.round(cur.wind_speed_10m)
    const precipMm   = Math.round(cur.precipitation * 10) / 10
    const uv         = Math.round(cur.uv_index ?? daily.uv_index_max[0] ?? 0)
    const uvRisk     = uv >= 8 ? 'very high' : uv >= 6 ? 'high' : uv >= 3 ? 'moderate' : 'low'
    const isWind     = windKmph > 30

    // ── Outfit advice ──────────────────────────────────────────────────────────
    let outfit: string, outfitEmoji: string
    if (wmo.isThunder) {
      outfit = 'Stay indoors if possible. Raincoat + closed shoes — lightning risk.'
      outfitEmoji = '⛈️'
    } else if (wmo.isSnow) {
      outfit = 'Warm layers, waterproof jacket, and boots.'
      outfitEmoji = '❄️'
    } else if (wmo.isRainy) {
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

    // ── Campus tips ────────────────────────────────────────────────────────────
    const tips: string[] = []
    if (wmo.isRainy)  tips.push('Carry an umbrella to avoid walking between lecture halls in the rain.')
    if (uv >= 6)      tips.push(`UV index is ${uv} — apply SPF 30+ before outdoor classes.`)
    if (isWind)       tips.push('Strong winds today — secure notes and documents.')
    if (wmo.isFog)    tips.push('Reduced visibility — allow extra travel time from res.')
    if (tempC > 30)   tips.push('Stay hydrated during long lecture blocks — heat can reduce focus.')

    // ── Tomorrow from daily[1] ─────────────────────────────────────────────────
    const tomorrowWmo = wmoInfo(daily.weather_code[1] ?? 0)
    const tomorrow = daily.temperature_2m_max[1] != null ? {
      max_C:     Math.round(daily.temperature_2m_max[1]),
      min_C:     Math.round(daily.temperature_2m_min[1]),
      condition: tomorrowWmo.label,
      is_rainy:  tomorrowWmo.isRainy,
    } : null

    // ── Air quality (OpenAQ v2, best-effort) ───────────────────────────────────
    let air_quality: { pm25: number; category: string; color: string; advice: string; station: string } | null = null
    if (aqRes?.ok) {
      try {
        const aqData = await aqRes.json() as {
          results?: { location: string; measurements: { parameter: string; value: number }[] }[]
        }
        for (const r of aqData.results ?? []) {
          const m = r.measurements.find(m => m.parameter === 'pm25')
          if (m && m.value >= 0) {
            const aqi = pm25ToAqi(m.value)
            air_quality = {
              pm25:     Math.round(m.value * 10) / 10,
              category: aqi.category,
              color:    aqi.color,
              advice:   aqi.advice,
              station:  r.location,
            }
            break
          }
        }
      } catch {
        // graceful degradation — air quality is optional
      }
    }

    const payload = {
      area:         resolvedName,
      temp_C:       tempC,
      feels_like_C: feelsC,
      condition:    wmo.label,
      humidity:     cur.relative_humidity_2m,
      wind_kmph:    windKmph,
      uv,
      uv_risk:      uvRisk,
      is_rainy:     wmo.isRainy,
      precip_mm:    precipMm,
      sunrise:      parseLocalTime(daily.sunrise[0] ?? ''),
      sunset:       parseLocalTime(daily.sunset[0] ?? ''),
      outfit:       { text: outfit, emoji: outfitEmoji },
      tips,
      tomorrow,
      air_quality,
    }

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=600' },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 500 })
  }
}
