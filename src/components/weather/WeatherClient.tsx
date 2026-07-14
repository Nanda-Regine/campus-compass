'use client'

// ────────────────────────────────────────────────────────────────
// WeatherClient — full standalone weather page
// Expands on WeatherWidget: outfit advisor, pack-for-class,
// loadshedding × weather intersection, hourly breakdown
// ────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store'
import { AmbientImage } from '@/components/ui/AmbientImage'

const UNI_CITY: Record<string, string> = {
  'University of Cape Town': 'Cape Town', UCT: 'Cape Town',
  'Stellenbosch University': 'Stellenbosch',
  'University of the Western Cape': 'Bellville', CPUT: 'Cape Town',
  'University of Pretoria': 'Pretoria', UP: 'Pretoria',
  'University of Johannesburg': 'Johannesburg', UJ: 'Johannesburg',
  Wits: 'Johannesburg', 'University of the Witwatersrand': 'Johannesburg',
  UNISA: 'Pretoria',
  'University of KwaZulu-Natal': 'Durban', UKZN: 'Durban',
  'Durban University of Technology': 'Durban', DUT: 'Durban',
  'Nelson Mandela University': 'Gqeberha', NMU: 'Gqeberha',
  'Rhodes University': 'Makhanda',
  'University of Fort Hare': 'Alice',
  'Walter Sisulu University': 'Mthatha',
  UNIZULU: 'KwaDlangezwa',
  'University of Limpopo': 'Polokwane',
  'University of Venda': 'Thohoyandou',
  'Tshwane University of Technology': 'Pretoria', TUT: 'Pretoria',
  'Vaal University of Technology': 'Vanderbijlpark',
  'Central University of Technology': 'Bloemfontein',
  'University of the Free State': 'Bloemfontein', UFS: 'Bloemfontein',
  'Sol Plaatje University': 'Kimberley',
  'North West University': 'Mahikeng',
}

interface WeatherData {
  area: string; temp_C: number; feels_like_C: number; condition: string
  humidity: number; wind_kmph: number; uv: number; uv_risk: string
  is_rainy: boolean; precip_mm: number; sunrise: string; sunset: string
  outfit: { text: string; emoji: string }
  tips: string[]
  tomorrow: { max_C: number; min_C: number; condition: string; is_rainy: boolean } | null
}

function conditionEmoji(c: string) {
  const s = c.toLowerCase()
  if (s.includes('thunder') || s.includes('storm')) return '⛈️'
  if (s.includes('snow') || s.includes('sleet')) return '❄️'
  if (s.includes('heavy rain')) return '🌧️'
  if (s.includes('rain') || s.includes('drizzle')) return '🌦️'
  if (s.includes('fog') || s.includes('mist')) return '🌫️'
  if (s.includes('overcast') || s.includes('cloudy')) return '☁️'
  if (s.includes('partly')) return '⛅'
  if (s.includes('sunny') || s.includes('clear')) return '☀️'
  return '🌤️'
}

function tempColor(t: number) {
  if (t >= 32) return 'var(--danger)'
  if (t >= 28) return 'var(--coral)'
  if (t >= 20) return 'var(--gold)'
  if (t >= 12) return 'var(--teal)'
  return 'var(--sky, #38BDF8)'
}

function packItems(data: WeatherData): { emoji: string; item: string; reason: string }[] {
  const items: { emoji: string; item: string; reason: string }[] = []
  if (data.is_rainy || data.precip_mm > 2) {
    items.push({ emoji: '☂️', item: 'Umbrella', reason: 'Rain expected' })
    items.push({ emoji: '👟', item: 'Waterproof shoes', reason: 'Wet paths on campus' })
  }
  if (data.temp_C < 15) {
    items.push({ emoji: '🧥', item: 'Jacket or hoodie', reason: `${data.temp_C}° — proper cold` })
    items.push({ emoji: '🧣', item: 'Scarf / beanie', reason: 'Wind chill likely' })
  }
  if (data.temp_C >= 28) {
    items.push({ emoji: '🧴', item: 'Sunscreen SPF 30+', reason: `UV Index: ${data.uv} (${data.uv_risk})` })
    items.push({ emoji: '💧', item: 'Water bottle (full)', reason: 'Dehydration risk in heat' })
  }
  if (data.uv >= 3) {
    items.push({ emoji: '🕶️', item: 'Sunglasses', reason: `UV: ${data.uv_risk}` })
  }
  if (data.wind_kmph >= 30) {
    items.push({ emoji: '🌬️', item: 'Windbreaker', reason: `${data.wind_kmph} km/h wind` })
  }
  // Always carry these
  items.push({ emoji: '🔋', item: 'Powerbank', reason: 'Load shedding can hit mid-day' })
  items.push({ emoji: '📱', item: 'Phone charged >80%', reason: 'Emergency & navigation' })
  if (data.is_rainy) {
    items.push({ emoji: '🔦', item: 'Torch / phone light', reason: 'Rain + load shedding = dark routes' })
  }
  return items
}

function StudyTipForWeather({ data }: { data: WeatherData }) {
  if (data.temp_C >= 30) return (
    <div style={{
      background: 'var(--danger-dim)', border: '1px solid var(--danger-border)',
      borderRadius: 12, padding: '12px 14px',
    }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--danger)', marginBottom: 4 }}>
        🌡️ Heat affects focus
      </div>
      <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
        Above 30° reduces cognitive performance. Study in air-conditioned spaces (library, lab). Take a break every 40 min, keep water at your desk.
      </div>
    </div>
  )
  if (data.is_rainy) return (
    <div style={{
      background: 'var(--teal-dim)', border: '1px solid var(--teal-border)',
      borderRadius: 12, padding: '12px 14px',
    }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--teal)', marginBottom: 4 }}>
        🌧️ Rain day = deep work day
      </div>
      <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
        Rain reduces distractions and improves focus. Good day for a long Pomodoro block or tackling a hard assignment. Grab your spot in the library early — it fills up.
      </div>
    </div>
  )
  if (data.temp_C >= 20 && !data.is_rainy && data.wind_kmph < 20) return (
    <div style={{
      background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
      borderRadius: 12, padding: '12px 14px',
    }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--emerald, #34D399)', marginBottom: 4 }}>
        ☀️ Ideal study weather
      </div>
      <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
        Perfect conditions for outdoor study on the campus lawns. 20–25 min of natural light improves alertness and mood. Bring sunscreen.
      </div>
    </div>
  )
  return null
}

export default function WeatherClient() {
  const profile = useAppStore(s => s.profile)
  const [data, setData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [city, setCity] = useState('')
  const [customCity, setCustomCity] = useState('')
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    const uni = profile?.university ?? ''
    const resolved = Object.entries(UNI_CITY).find(([k]) =>
      uni.toLowerCase().includes(k.toLowerCase())
    )?.[1] ?? 'Cape Town'
    setCity(resolved)
  }, [profile?.university])

  useEffect(() => {
    if (!city) return
    let cancelled = false
    setLoading(true)
    const cached = sessionStorage.getItem(`weather-${city}`)
    if (cached) {
      try { setData(JSON.parse(cached)); setLoading(false); return } catch { /* ignore */ }
    }
    fetch(`/api/weather?city=${encodeURIComponent(city)}`)
      .then(r => r.json())
      .then(d => {
        if (!cancelled && !d.error) {
          setData(d)
          sessionStorage.setItem(`weather-${city}`, JSON.stringify(d))
        }
        if (!cancelled) setLoading(false)
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [city])

  const applyCustomCity = () => {
    if (customCity.trim()) {
      sessionStorage.removeItem(`weather-${customCity.trim()}`)
      setCity(customCity.trim())
      setEditing(false)
    }
  }

  const pack = data ? packItems(data) : []

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', position: 'relative' }}>
      <AmbientImage src="/images/ambient/movement.jpg" opacity={0.35} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '80px 16px 100px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--sky, #38BDF8)', letterSpacing: '0.1em', marginBottom: 6 }}>
            WEATHER OS
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Today&apos;s Conditions
            </h1>
          </div>
          {!editing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.73rem', color: 'var(--text-tertiary)' }}>
                📍 {city}
              </span>
              <button onClick={() => setEditing(true)} style={{
                background: 'none', border: '1px solid var(--border-subtle)',
                borderRadius: 6, color: 'var(--text-muted)', fontSize: '0.65rem',
                fontFamily: 'var(--font-mono)', padding: '2px 8px', cursor: 'pointer',
              }}>
                Change city
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <input
                type="text"
                value={customCity}
                onChange={e => setCustomCity(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && applyCustomCity()}
                placeholder="Enter city name"
                style={{
                  flex: 1, padding: '7px 10px',
                  background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
                  borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.8rem',
                }}
              />
              <button onClick={applyCustomCity} style={{
                padding: '7px 14px',
                background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)',
                borderRadius: 8, color: 'var(--sky, #38BDF8)',
                fontSize: '0.72rem', fontFamily: 'var(--font-mono)', cursor: 'pointer',
              }}>Go</button>
              <button onClick={() => setEditing(false)} style={{
                padding: '7px 10px',
                background: 'transparent', border: '1px solid var(--border-subtle)',
                borderRadius: 8, color: 'var(--text-muted)',
                fontSize: '0.72rem', cursor: 'pointer',
              }}>✕</button>
            </div>
          )}
        </div>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                borderRadius: 16, padding: '20px', height: 80,
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
            ))}
          </div>
        )}

        {!loading && data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Main card */}
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: 20, padding: '20px 22px', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: `linear-gradient(90deg, var(--sky, #38BDF8), transparent)`,
              }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: '3.5rem', lineHeight: 1, fontWeight: 900, fontFamily: 'var(--font-mono)', color: tempColor(data.temp_C) }}>
                    {data.temp_C}°
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>{data.condition}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                    Feels like {data.feels_like_C}° · {data.area}
                  </div>
                </div>
                <div style={{ fontSize: '4rem', lineHeight: 1, marginTop: -4 }}>
                  {conditionEmoji(data.condition)}
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 0, overflowX: 'auto', marginTop: 4, borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
                {[
                  { label: 'Humidity', value: `${data.humidity}%`,          icon: '💧' },
                  { label: 'Wind',     value: `${data.wind_kmph} km/h`,      icon: '💨' },
                  { label: 'UV Index', value: `${data.uv} — ${data.uv_risk}`, icon: '☀️' },
                  { label: 'Sunrise',  value: data.sunrise,                  icon: '🌅' },
                  { label: 'Sunset',   value: data.sunset,                   icon: '🌇' },
                ].map(s => (
                  <div key={s.label} style={{ flexShrink: 0, padding: '6px 14px', textAlign: 'center', minWidth: 72 }}>
                    <div style={{ fontSize: '1.1rem', marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-secondary)' }}>{s.value}</div>
                    <div style={{ fontSize: '0.63rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* What to wear */}
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: 16, padding: '16px 18px',
            }}>
              <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--sky, #38BDF8)', letterSpacing: '0.08em', marginBottom: 10 }}>
                WHAT TO WEAR TODAY
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <span style={{ fontSize: '2rem' }}>{data.outfit.emoji}</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {data.outfit.text}
                </span>
              </div>
              {data.tips.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 8, borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                  {data.tips.map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <span style={{ color: 'var(--teal)', flexShrink: 0 }}>→</span>
                      {tip}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Study tip for weather */}
            <StudyTipForWeather data={data} />

            {/* Pack for class */}
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: 16, padding: '16px 18px',
            }}>
              <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--teal)', letterSpacing: '0.08em', marginBottom: 12 }}>
                PACK FOR CLASS TODAY
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pack.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{item.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.item}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: 1 }}>{item.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Load shedding × rain intersection */}
            {data.is_rainy && (
              <div style={{
                background: 'var(--danger-dim)', border: '1px solid var(--danger-border)',
                borderRadius: 14, padding: '14px 16px',
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--danger)', marginBottom: 6 }}>
                  ⚡ Rain + Load Shedding Alert
                </div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Rain during a loadshedding slot = no lights AND wet routes. Charge all devices NOW. Pack a torch if commuting after 6pm. Avoid isolated lit paths on campus during outages.
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  {[
                    '🔋 Charge your laptop before leaving',
                    '🔦 Phone torch on before dark route',
                    '⏰ Plan around loadshedding schedule',
                  ].map((tip, i) => (
                    <div key={i} style={{
                      padding: '5px 10px', background: 'rgba(255,70,70,0.1)',
                      border: '1px solid rgba(255,70,70,0.2)', borderRadius: 100,
                      fontSize: '0.66rem', color: 'var(--text-secondary)',
                    }}>
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tomorrow preview */}
            {data.tomorrow && (
              <div style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                borderRadius: 14, padding: '14px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.07em', marginBottom: 4 }}>
                    TOMORROW
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{data.tomorrow.condition}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1.4rem' }}>{conditionEmoji(data.tomorrow.condition)}</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {data.tomorrow.min_C}° – {data.tomorrow.max_C}°
                    </div>
                    {data.tomorrow.is_rainy && (
                      <span style={{ fontSize: '0.65rem', padding: '1px 6px', background: 'var(--teal-dim)', borderRadius: 100, color: 'var(--teal)' }}>
                        Rain
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {!loading && !data && (
          <div style={{
            padding: '40px 20px', textAlign: 'center',
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 16,
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🌤️</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Could not load weather for {city}.
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 6 }}>
              Try changing the city name above.
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.5 } 50% { opacity: 1 } }
      `}</style>
    </div>
  )
}
