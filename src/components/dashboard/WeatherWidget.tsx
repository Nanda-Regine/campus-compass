'use client'

// ─── WeatherWidget ────────────────────────────────────────────
// Compact weather card for the dashboard.
// Shows: temp + condition, "what to wear", campus tips,
// tomorrow preview, and a load-shedding intersection alert.

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store'

// Map university name → city for default lookup
const UNI_CITY: Record<string, string> = {
  'University of Cape Town':            'Cape Town',
  'UCT':                                'Cape Town',
  'Stellenbosch University':            'Stellenbosch',
  'University of the Western Cape':     'Bellville',
  'CPUT':                               'Cape Town',
  'University of Pretoria':             'Pretoria',
  'UP':                                 'Pretoria',
  'University of Johannesburg':         'Johannesburg',
  'UJ':                                 'Johannesburg',
  'Wits':                               'Johannesburg',
  'University of the Witwatersrand':    'Johannesburg',
  'UNISA':                              'Pretoria',
  'University of KwaZulu-Natal':        'Durban',
  'UKZN':                               'Durban',
  'Durban University of Technology':    'Durban',
  'DUT':                                'Durban',
  'Nelson Mandela University':          'Gqeberha',
  'NMU':                                'Gqeberha',
  'Rhodes University':                  'Makhanda',
  'University of Fort Hare':            'Alice',
  'Walter Sisulu University':           'Mthatha',
  'UNIZULU':                            'KwaDlangezwa',
  'University of Limpopo':              'Polokwane',
  'University of Venda':                'Thohoyandou',
  'Tshwane University of Technology':   'Pretoria',
  'TUT':                                'Pretoria',
  'Vaal University of Technology':      'Vanderbijlpark',
  'Central University of Technology':   'Bloemfontein',
  'University of the Free State':       'Bloemfontein',
  'UFS':                                'Bloemfontein',
  'Sol Plaatje University':             'Kimberley',
  'North West University':              'Mahikeng',
}

interface WeatherData {
  area:         string
  temp_C:       number
  feels_like_C: number
  condition:    string
  humidity:     number
  wind_kmph:    number
  uv:           number
  uv_risk:      string
  is_rainy:     boolean
  precip_mm:    number
  sunrise:      string
  sunset:       string
  outfit: { text: string; emoji: string }
  tips:         string[]
  tomorrow: {
    max_C:     number
    min_C:     number
    condition: string
    is_rainy:  boolean
  } | null
}

// Minimal weather condition icon map (no external deps)
function conditionEmoji(condition: string): string {
  const c = condition.toLowerCase()
  if (c.includes('thunder') || c.includes('storm')) return '⛈️'
  if (c.includes('snow') || c.includes('sleet'))    return '❄️'
  if (c.includes('heavy rain'))                     return '🌧️'
  if (c.includes('rain') || c.includes('drizzle'))  return '🌦️'
  if (c.includes('fog') || c.includes('mist'))      return '🌫️'
  if (c.includes('overcast') || c.includes('cloudy')) return '☁️'
  if (c.includes('partly'))                         return '⛅'
  if (c.includes('sunny') || c.includes('clear'))   return '☀️'
  return '🌤️'
}

function getProactiveTip(data: WeatherData): { icon: string; text: string; accent: string } {
  const { temp_C, is_rainy, uv, wind_kmph, condition } = data
  const c = condition.toLowerCase()
  if (c.includes('thunder') || c.includes('storm'))
    return { icon: '⛈️', text: 'Storm alert — work from home if you can. Library or res study is safest.', accent: '#ef4444' }
  if (is_rainy && wind_kmph > 30)
    return { icon: '🌧️', text: 'Heavy rain + wind. Leave 10min early, pack your charger and a rain jacket.', accent: '#7090d0' }
  if (is_rainy)
    return { icon: '🌦️', text: 'Rain day — perfect for deep focus inside. Set a 90-min block and close your tabs.', accent: '#7090d0' }
  if (temp_C >= 34)
    return { icon: '🌡️', text: 'Extreme heat. Drink water every 30min — dehydration tanks your focus by 20%.', accent: '#ef4444' }
  if (temp_C >= 28)
    return { icon: '🔆', text: `${temp_C}° — hot. Find AC or shade, avoid peak sun 11am–3pm.`, accent: '#f59e0b' }
  if (uv >= 8)
    return { icon: '🕶️', text: `UV ${uv} (${data.uv_risk}) — apply sunscreen before your commute.`, accent: '#f59e0b' }
  if (temp_C >= 20 && !is_rainy)
    return { icon: '🌳', text: 'Great conditions — try studying outside for 30min. Sunlight boosts serotonin.', accent: '#4ecf9e' }
  if (temp_C < 10)
    return { icon: '🧥', text: 'Cold morning — warm up before your commute. Cold slows reaction time by 8%.', accent: '#38bdf8' }
  return { icon: '✅', text: 'Good conditions for campus. Aim for one focus block before lunch.', accent: '#4ecf9e' }
}

function tempColor(t: number): string {
  if (t >= 32) return 'var(--danger)'
  if (t >= 28) return 'var(--coral)'
  if (t >= 20) return 'var(--gold)'
  if (t >= 12) return 'var(--teal)'
  return 'var(--sky, #38BDF8)'
}

export default function WeatherWidget() {
  const profile   = useAppStore(s => s.profile)
  const [data, setData]       = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [city, setCity]       = useState('')

  useEffect(() => {
    // Resolve city from university or default to Cape Town
    const uni = profile?.university ?? ''
    const resolved = Object.entries(UNI_CITY).find(([k]) =>
      uni.toLowerCase().includes(k.toLowerCase())
    )?.[1] ?? 'Cape Town'
    setCity(resolved)
  }, [profile?.university])

  useEffect(() => {
    if (!city) return
    let cancelled = false
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
        setLoading(false)
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [city])

  if (loading) {
    return (
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 16, padding: '16px 18px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ fontSize: '1.6rem' }}>🌤️</div>
        <div style={{ flex: 1 }}>
          <div style={{ height: 14, width: 100, background: 'var(--border-subtle)', borderRadius: 6, marginBottom: 6 }} />
          <div style={{ height: 10, width: 140, background: 'var(--border-subtle)', borderRadius: 6 }} />
        </div>
      </div>
    )
  }

  if (!data) return null

  const emoji = conditionEmoji(data.condition)
  const color = tempColor(data.temp_C)
  const tip   = getProactiveTip(data)

  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
      borderRadius: 16,
    }}>
      {/* Main row */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          width: '100%', padding: '14px 16px',
          background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{ fontSize: '2rem', lineHeight: 1 }}>{emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{
              fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)',
              color,
            }}>{data.temp_C}°</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{data.condition}</span>
            {data.tomorrow && (
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginLeft: 4 }}>
                · tmrw {conditionEmoji(data.tomorrow.condition)} {data.tomorrow.min_C}–{data.tomorrow.max_C}°
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {data.area} · feels {data.feels_like_C}° · {data.outfit.emoji} {data.outfit.text}
          </div>
          {/* Proactive tip — always visible */}
          <div style={{
            marginTop: 6, fontSize: '0.67rem', lineHeight: 1.4,
            color: tip.accent, display: 'flex', gap: 4, alignItems: 'flex-start',
          }}>
            <span style={{ flexShrink: 0 }}>{tip.icon}</span>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>{tip.text}</span>
          </div>
        </div>
        <div style={{
          fontSize: '0.6rem', color: 'var(--text-muted)', flexShrink: 0,
          transform: expanded ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.2s ease', alignSelf: 'flex-start', marginTop: 4,
        }}>▾</div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '14px 16px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
            {[
              { label: 'Humidity', value: `${data.humidity}%`,     icon: '💧' },
              { label: 'Wind',     value: `${data.wind_kmph} km/h`, icon: '💨' },
              { label: 'UV',       value: `${data.uv} (${data.uv_risk})`, icon: '☀️' },
              { label: 'Sunrise',  value: data.sunrise,             icon: '🌅' },
              { label: 'Sunset',   value: data.sunset,              icon: '🌇' },
            ].map(s => (
              <div key={s.label} style={{ flexShrink: 0, padding: '8px 12px', textAlign: 'center', minWidth: 72 }}>
                <div style={{ fontSize: '1rem', marginBottom: 3 }}>{s.icon}</div>
                <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '0.56rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Campus tips */}
          {data.tips.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {data.tips.map((tip, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                  fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.5,
                }}>
                  <span style={{ color: 'var(--teal)', flexShrink: 0, marginTop: 1 }}>→</span>
                  {tip}
                </div>
              ))}
            </div>
          )}

          {/* Tomorrow preview */}
          {data.tomorrow && (
            <div style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
              borderRadius: 10, padding: '10px 14px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Tomorrow</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.85rem' }}>{conditionEmoji(data.tomorrow.condition)}</span>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {data.tomorrow.min_C}° – {data.tomorrow.max_C}°
                </span>
                {data.tomorrow.is_rainy && (
                  <span style={{ fontSize: '0.6rem', padding: '1px 6px', background: 'var(--teal-dim)', borderRadius: 100, color: 'var(--teal)' }}>
                    Rain
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Load shedding + rain intersection */}
          {data.is_rainy && (
            <div style={{
              background: 'var(--danger-dim)', border: '1px solid var(--danger-border)',
              borderRadius: 10, padding: '10px 14px',
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--danger)', marginBottom: 3 }}>
                ⚡ Rain + Load Shedding Warning
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Rain during a loadshedding slot means no lights AND wet routes. Charge devices now, pack a torch if commuting after dark.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
