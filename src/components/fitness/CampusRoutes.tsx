'use client'

import { useState, useEffect, useCallback } from 'react'
import type { WalkingRoute } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { dispatchXP } from '@/lib/xp-engine'

interface Props {
  userId: string
  university: string | null
}

type Tab = 'routes' | 'submit'

type SubmitForm = {
  route_name: string
  description: string
  distance_km: string
  duration_minutes: string
  start_point: string
  end_point: string
  safety_rating: number
  scenery_rating: number
}

const SEED_ROUTES: Omit<WalkingRoute, 'id' | 'contributor_id' | 'created_at'>[] = [
  {
    institution: 'University of Cape Town (UCT)',
    route_name: 'Upper Campus to Rhodes Memorial',
    description: 'Scenic hike above the city with sweeping bay views. Well-lit and popular.',
    distance_km: 2.5,
    duration_minutes: 35,
    safety_rating: 4,
    scenery_rating: 5,
    times_logged: 47,
    start_point: 'Leslie Social Science Building',
    end_point: 'Rhodes Memorial tearoom',
  },
  {
    institution: 'University of the Witwatersrand (Wits)',
    route_name: 'Jubilee Hall to Education Campus Loop',
    description: 'A pleasant loop around both campuses through tree-lined paths.',
    distance_km: 1.8,
    duration_minutes: 25,
    safety_rating: 4,
    scenery_rating: 3,
    times_logged: 89,
    start_point: 'Jubilee Hall res',
    end_point: 'Education Campus Parkade',
  },
  {
    institution: 'Stellenbosch University (SU)',
    route_name: 'Adam Tas Road Nature Walk',
    description: 'Follow the river path with mountain backdrop. Best in the morning.',
    distance_km: 3.2,
    duration_minutes: 45,
    safety_rating: 5,
    scenery_rating: 5,
    times_logged: 62,
    start_point: 'Victoria Street main gate',
    end_point: 'Coetzenburg sports fields',
  },
  {
    institution: 'Tshwane University of Technology (TUT)',
    route_name: 'Proes Street Campus Loop',
    description: 'Short loop connecting all buildings, good study break route.',
    distance_km: 1.5,
    duration_minutes: 20,
    safety_rating: 3,
    scenery_rating: 3,
    times_logged: 34,
    start_point: 'Building 6 main entrance',
    end_point: 'Library building',
  },
  {
    institution: 'University of KwaZulu-Natal (UKZN)',
    route_name: 'Howard College to Botanical Garden Walk',
    description: 'Through the beautiful campus grounds to the adjacent botanical garden.',
    distance_km: 2.0,
    duration_minutes: 28,
    safety_rating: 4,
    scenery_rating: 4,
    times_logged: 41,
    start_point: 'Memorial Tower Building',
    end_point: 'Botanical Garden gate',
  },
]

function StarRating({
  value,
  onChange,
  color = '#f59e0b',
}: {
  value: number
  onChange?: (v: number) => void
  color?: string
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onChange?.(n)}
          style={{
            background: 'none',
            border: 'none',
            cursor: onChange ? 'pointer' : 'default',
            fontSize: '16px',
            color: n <= value ? color : '#374151',
            padding: '2px',
          }}
          type="button"
        >
          ★
        </button>
      ))}
    </div>
  )
}

const LOGGED_ROUTES_KEY = 'logged_routes'
const LOG_DATE_PREFIX = 'logged_route_date_'

export default function CampusRoutes({ userId, university }: Props) {
  const [tab, setTab] = useState<Tab>('routes')
  const [routes, setRoutes] = useState<WalkingRoute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loggedRoutes, setLoggedRoutes] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [loggingId, setLoggingId] = useState<string | null>(null)
  const [submitForm, setSubmitForm] = useState<SubmitForm>({
    route_name: '',
    description: '',
    distance_km: '',
    duration_minutes: '',
    start_point: '',
    end_point: '',
    safety_rating: 3,
    scenery_rating: 3,
  })

  const today = new Date().toISOString().split('T')[0]

  const loadLoggedRoutes = useCallback(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(LOGGED_ROUTES_KEY) ?? '[]') as string[]
      // Only show as logged if done today
      const todayLogged = stored.filter(id => {
        const dateKey = LOG_DATE_PREFIX + id
        return localStorage.getItem(dateKey) === today
      })
      setLoggedRoutes(todayLogged)
    } catch {
      setLoggedRoutes([])
    }
  }, [today])

  useEffect(() => {
    loadLoggedRoutes()
  }, [loadLoggedRoutes])

  useEffect(() => {
    const fetchRoutes = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = university ? `?institution=${encodeURIComponent(university)}` : ''
        const res = await fetch(`/api/fitness/routes${params}`)
        const json = (await res.json()) as { data: WalkingRoute[]; error?: string }
        if (!res.ok) throw new Error(json.error ?? 'Failed to fetch routes')

        const dbRoutes: WalkingRoute[] = json.data ?? []

        // Merge seeds for the user's institution
        const seedsForInstitution = SEED_ROUTES.filter(
          s => !university || s.institution === university
        )

        const existingNames = new Set(dbRoutes.map(r => r.route_name.toLowerCase()))
        const seedsToAdd: WalkingRoute[] = seedsForInstitution
          .filter(s => !existingNames.has(s.route_name.toLowerCase()))
          .map((s, i) => ({
            ...s,
            id: `seed_${i}`,
            contributor_id: 'seed',
            created_at: '',
          }))

        setRoutes([...dbRoutes, ...seedsToAdd])
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Failed to load routes'
        setError(errMsg)
        // Fall back to seeds
        const seedsForInstitution = SEED_ROUTES.filter(
          s => !university || s.institution === university
        )
        setRoutes(
          seedsForInstitution.map((s, i) => ({
            ...s,
            id: `seed_${i}`,
            contributor_id: 'seed',
            created_at: '',
          }))
        )
      } finally {
        setLoading(false)
      }
    }
    fetchRoutes()
  }, [university])

  const logRoute = async (route: WalkingRoute) => {
    if (loggedRoutes.includes(route.id)) return
    setLoggingId(route.id)
    try {
      const supabase = createClient()
      // Increment times_logged for real DB routes
      if (!route.id.startsWith('seed_')) {
        await supabase
          .from('walking_routes')
          .update({ times_logged: route.times_logged + 1 })
          .eq('id', route.id)
      }

      try {
        const stored = JSON.parse(localStorage.getItem(LOGGED_ROUTES_KEY) ?? '[]') as string[]
        if (!stored.includes(route.id)) stored.push(route.id)
        localStorage.setItem(LOGGED_ROUTES_KEY, JSON.stringify(stored))
        localStorage.setItem(LOG_DATE_PREFIX + route.id, today)
      } catch {
        /* silent */
      }

      setRoutes(prev =>
        prev.map(r => (r.id === route.id ? { ...r, times_logged: r.times_logged + 1 } : r))
      )
      setLoggedRoutes(prev => [...prev, route.id])
      dispatchXP('wellness_checkin', 'Campus walk logged')
    } catch {
      /* silent — optimistic update already shown */
    } finally {
      setLoggingId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const body = {
        ...submitForm,
        distance_km: parseFloat(submitForm.distance_km),
        duration_minutes: parseInt(submitForm.duration_minutes, 10),
        institution: university ?? 'Other',
        contributor_id: userId,
        times_logged: 1,
      }
      const res = await fetch('/api/fitness/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const json = (await res.json()) as { error: string }
        throw new Error(json.error ?? 'Submission failed')
      }
      setSubmitSuccess(true)
      setSubmitForm({
        route_name: '',
        description: '',
        distance_km: '',
        duration_minutes: '',
        start_point: '',
        end_point: '',
        safety_rating: 3,
        scenery_rating: 3,
      })
      dispatchXP('task_complete', 'Campus route submitted')
      setTimeout(() => { setSubmitSuccess(false); setTab('routes') }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: 'var(--text-secondary)',
    padding: '10px 12px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    color: 'var(--text-tertiary)',
    fontSize: '12px',
    marginBottom: '4px',
    display: 'block',
  }

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }} className="pb-8">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div>
          <h1 style={{ color: 'var(--text-secondary)', fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>
            Campus Routes
          </h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>
            Walking routes contributed by students at {university ?? 'your institution'}
          </p>
        </div>

        {/* Tabs */}
        <div
          className="flex"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            padding: '4px',
          }}
        >
          {(['routes', 'submit'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                background: tab === t ? 'rgba(74,222,128,0.15)' : 'none',
                border: 'none',
                color: tab === t ? '#4ade80' : 'var(--text-tertiary)',
                fontSize: '14px',
                fontWeight: tab === t ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {t === 'routes' ? '🗺️ Routes' : '+ Submit Route'}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '10px',
              padding: '10px 12px',
              color: '#f87171',
              fontSize: '13px',
            }}
          >
            {error}
          </div>
        )}

        {/* Routes Tab */}
        {tab === 'routes' && (
          <>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '16px',
                      height: '140px',
                      animation: 'pulse 2s infinite',
                    }}
                  />
                ))}
              </div>
            ) : routes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🗺️</div>
                <p style={{ fontSize: '14px' }}>No routes yet for your institution.</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Be the first to submit one!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {routes.map(route => {
                  const isLogged = loggedRoutes.includes(route.id)
                  return (
                    <div
                      key={route.id}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '16px',
                        padding: '16px',
                      }}
                    >
                      <div style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>
                        {route.route_name}
                      </div>
                      <p style={{ color: 'var(--text-tertiary)', fontSize: '12px', lineHeight: 1.5, marginBottom: '10px' }}>
                        {route.description}
                      </p>

                      <div className="flex gap-4 mb-2 flex-wrap">
                        <div>
                          <span style={{ color: '#4ade80', fontSize: '13px', fontWeight: 600 }}>
                            {route.distance_km} km
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}> · {route.duration_minutes} min</span>
                        </div>
                      </div>

                      <div className="flex gap-4 mb-2">
                        <div>
                          <span style={{ color: 'var(--text-tertiary)', fontSize: '11px', marginRight: '4px' }}>Safety</span>
                          <StarRating value={route.safety_rating} color="#4ade80" />
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-tertiary)', fontSize: '11px', marginRight: '4px' }}>Scenery</span>
                          <StarRating value={route.scenery_rating} color="#f59e0b" />
                        </div>
                      </div>

                      <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '12px' }}>
                        📍 {route.start_point} → {route.end_point}
                      </div>

                      <div className="flex items-center justify-between">
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                          Logged by {route.times_logged} students
                        </span>
                        <button
                          onClick={() => logRoute(route)}
                          disabled={isLogged || loggingId === route.id}
                          style={{
                            background: isLogged ? 'rgba(74,222,128,0.1)' : 'rgba(74,222,128,0.15)',
                            border: `1px solid ${isLogged ? 'rgba(74,222,128,0.3)' : 'rgba(74,222,128,0.4)'}`,
                            borderRadius: '8px',
                            color: isLogged ? '#4ade80' : '#4ade80',
                            padding: '8px 14px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: isLogged ? 'default' : 'pointer',
                            opacity: loggingId === route.id ? 0.6 : 1,
                          }}
                        >
                          {isLogged ? '✓ Logged today' : loggingId === route.id ? 'Logging...' : 'Log this Route'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Submit Tab */}
        {tab === 'submit' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {submitSuccess && (
              <div
                style={{
                  background: 'rgba(74,222,128,0.1)',
                  border: '1px solid rgba(74,222,128,0.25)',
                  borderRadius: '10px',
                  padding: '12px',
                  color: '#4ade80',
                  fontSize: '14px',
                  textAlign: 'center',
                  fontWeight: 600,
                }}
              >
                Route submitted! Thank you for contributing. 🎉
              </div>
            )}

            <div>
              <label style={labelStyle}>Route Name *</label>
              <input
                required
                value={submitForm.route_name}
                onChange={e => setSubmitForm(prev => ({ ...prev, route_name: e.target.value }))}
                placeholder="e.g. Library to Sports Field Loop"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Description *</label>
              <textarea
                required
                value={submitForm.description}
                onChange={e => setSubmitForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the route — landmarks, safety notes, best time of day..."
                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
              />
            </div>

            <div className="flex gap-3">
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Distance (km) *</label>
                <input
                  required
                  type="number"
                  inputMode="decimal"
                  min="0.1"
                  step="0.1"
                  value={submitForm.distance_km}
                  onChange={e => setSubmitForm(prev => ({ ...prev, distance_km: e.target.value }))}
                  placeholder="1.5"
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Duration (min) *</label>
                <input
                  required
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={submitForm.duration_minutes}
                  onChange={e => setSubmitForm(prev => ({ ...prev, duration_minutes: e.target.value }))}
                  placeholder="20"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Start Point *</label>
              <input
                required
                value={submitForm.start_point}
                onChange={e => setSubmitForm(prev => ({ ...prev, start_point: e.target.value }))}
                placeholder="e.g. Admin Building main entrance"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>End Point *</label>
              <input
                required
                value={submitForm.end_point}
                onChange={e => setSubmitForm(prev => ({ ...prev, end_point: e.target.value }))}
                placeholder="e.g. Student Centre"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Safety Rating</label>
              <StarRating
                value={submitForm.safety_rating}
                onChange={v => setSubmitForm(prev => ({ ...prev, safety_rating: v }))}
                color="#4ade80"
              />
            </div>

            <div>
              <label style={labelStyle}>Scenery Rating</label>
              <StarRating
                value={submitForm.scenery_rating}
                onChange={v => setSubmitForm(prev => ({ ...prev, scenery_rating: v }))}
                color="#f59e0b"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                background: submitting ? 'rgba(74,222,128,0.3)' : '#4ade80',
                border: 'none',
                borderRadius: '12px',
                color: '#0a0a0f',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Route'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
