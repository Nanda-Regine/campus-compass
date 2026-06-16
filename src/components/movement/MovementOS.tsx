'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { Navigation, MapPin, Users, Lightbulb, Plus, Trash2, Star, Car, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { AmbientImage } from '@/components/ui/AmbientImage'

// Mapbox map loaded client-side only (accesses window/document)
const MapboxRoutesMap = dynamic(
  () => import('./MapboxRoutesMap').then(m => m.MapboxRoutesMap),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: 360, borderRadius: 16, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Loading map…</span>
      </div>
    ),
  }
)

// ─── Types ──────────────────────────────────────────────────────────────────

type TransportType = 'taxi' | 'bus' | 'walk' | 'uber' | 'lift_club' | 'campus_shuttle' | 'minibus'
type RecurringType = 'once' | 'daily' | 'weekdays'

interface SavedRoute {
  id: string
  label: string
  from_address: string
  to_address: string
  transport_type: TransportType
  estimated_minutes: number | null
  fare_rands: number | null
  is_default: boolean
}

interface LiftPost {
  id: string
  user_id: string
  university: string
  from_location: string
  to_location: string
  departure_time: string
  seats_available: number
  fare_rands: number | null
  recurring: RecurringType
  contact_whatsapp: string | null
  is_active: boolean
}

interface Props {
  initialRoutes: SavedRoute[]
  userId: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const GM_KEY      = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

const TRANSPORT_ICONS: Record<TransportType, string> = {
  taxi: '🚕', bus: '🚌', walk: '🚶', uber: '🚗',
  lift_club: '🤝', campus_shuttle: '🚐', minibus: '🚌',
}

const TRANSPORT_LABELS: Record<TransportType, string> = {
  taxi: 'Minibus Taxi', bus: 'Bus (MyCiTi/BRT)', walk: 'Walk',
  uber: 'Uber / Bolt', lift_club: 'Lift Club', campus_shuttle: 'Campus Shuttle', minibus: 'Long-distance',
}

const SA_FARE_RANGES: Record<TransportType, string> = {
  taxi: 'R7–R25 typical', bus: 'R8–R30 (day pass)', walk: 'Free',
  uber: 'R40–R200+', lift_club: 'Split with driver', campus_shuttle: 'Free or R5', minibus: 'R150–R400',
}

// Google Maps Embed API mode parameter
function gmMode(t: TransportType): string {
  if (t === 'walk') return 'walking'
  if (t === 'bus' || t === 'campus_shuttle') return 'transit'
  return 'driving'
}

// Build Google Maps Embed URL (directions mode)
function gmEmbedUrl(from: string, to: string, mode: TransportType): string {
  const base = 'https://www.google.com/maps/embed/v1/directions'
  const params = new URLSearchParams({
    key: GM_KEY ?? '',
    origin: from + ', South Africa',
    destination: to + ', South Africa',
    mode: gmMode(mode),
    avoid: 'tolls',
  })
  return `${base}?${params.toString()}`
}

const TRANSPORT_TIPS = [
  { icon: '🚕', title: 'Minibus Taxi Tips', body: 'Negotiate fares for unusual routes. Knock on the roof to signal your stop. Keep exact change — R5 / R10 coins are ideal.' },
  { icon: '📱', title: 'Uber Safety', body: 'Share your trip with a friend. Check the licence plate before getting in. Sit behind the driver, not the passenger seat.' },
  { icon: '🤝', title: 'Lift Club Etiquette', body: "Be on time — drivers won't wait. Chip in for petrol (R20–R50/trip is standard). Keep the car clean and don't smoke." },
  { icon: '🔒', title: 'Campus Shuttle', body: 'Most SA universities run free or low-cost shuttles between residences and main campus. Check your student portal for the schedule.' },
  { icon: '⚡', title: 'Load Shedding & Transport', body: 'Traffic lights go dark during load shedding. Budget extra travel time (15–30 min) for peak-stage shedding commutes.' },
  { icon: '🌧️', title: 'Rainy Day', body: 'Taxis fill up fast in rain. Leave 20 min earlier. Google Maps often underestimates Cape Town and Joburg rain-day commutes.' },
]

const TABS = [
  { key: 'get-there',  label: 'Get There',      icon: Navigation },
  { key: 'my-routes',  label: 'My Routes',      icon: MapPin },
  { key: 'lift-club',  label: 'Lift Club',      icon: Users },
  { key: 'tips',       label: 'Transport Tips', icon: Lightbulb },
] as const
type TabKey = typeof TABS[number]['key']

// ─── Component ───────────────────────────────────────────────────────────────

export default function MovementOS({ initialRoutes, userId }: Props) {
  const supabase = createClient()
  const [tab, setTab] = useState<TabKey>('get-there')
  const [routes, setRoutes] = useState<SavedRoute[]>(initialRoutes)
  const [liftPosts, setLiftPosts] = useState<LiftPost[]>([])
  const [liftLoaded, setLiftLoaded] = useState(false)
  const [liftMapView, setLiftMapView] = useState(false)

  // Add route form state
  const [addingRoute, setAddingRoute] = useState(false)
  const [routeForm, setRouteForm] = useState({
    label: '', from_address: '', to_address: '',
    transport_type: 'taxi' as TransportType,
    estimated_minutes: '', fare_rands: '',
  })
  const [savingRoute, setSavingRoute] = useState(false)

  // Lift post form
  const [addingLift, setAddingLift] = useState(false)
  const [liftForm, setLiftForm] = useState({
    from_location: '', to_location: '', departure_time: '',
    seats_available: '1', fare_rands: '', recurring: 'once' as RecurringType,
    contact_whatsapp: '',
  })
  const [savingLift, setSavingLift] = useState(false)

  // Quick route finder — separate "committed" query so iframe only updates on button press
  const [fromAddr, setFromAddr] = useState('')
  const [toAddr, setToAddr]     = useState('')
  const [transport, setTransport] = useState<TransportType>('taxi')
  const [dirQuery, setDirQuery]  = useState<{ from: string; to: string; mode: TransportType } | null>(null)

  const searchDirections = () => {
    if (!fromAddr.trim() || !toAddr.trim()) {
      toast.error('Enter a from and to location')
      return
    }
    setDirQuery({ from: fromAddr.trim(), to: toAddr.trim(), mode: transport })
  }

  const loadLiftPosts = async () => {
    if (liftLoaded) return
    const { data } = await supabase
      .from('lift_club_posts')
      .select('*')
      .eq('is_active', true)
      .order('departure_time', { ascending: true })
      .limit(40)
    setLiftPosts(data ?? [])
    setLiftLoaded(true)
  }

  const saveRoute = async () => {
    if (!routeForm.label || !routeForm.from_address || !routeForm.to_address) {
      toast.error('Fill in label, from, and to fields')
      return
    }
    setSavingRoute(true)
    const { data, error } = await supabase.from('saved_routes').insert({
      user_id: userId,
      label: routeForm.label,
      from_address: routeForm.from_address,
      to_address: routeForm.to_address,
      transport_type: routeForm.transport_type,
      estimated_minutes: routeForm.estimated_minutes ? parseInt(routeForm.estimated_minutes) : null,
      fare_rands: routeForm.fare_rands ? parseFloat(routeForm.fare_rands) : null,
    }).select().single()
    if (error) { toast.error('Failed to save route'); setSavingRoute(false); return }
    setRoutes(prev => [data, ...prev])
    setRouteForm({ label: '', from_address: '', to_address: '', transport_type: 'taxi', estimated_minutes: '', fare_rands: '' })
    setAddingRoute(false)
    toast.success('Route saved!')
    setSavingRoute(false)
  }

  const deleteRoute = async (id: string) => {
    await supabase.from('saved_routes').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    setRoutes(prev => prev.filter(r => r.id !== id))
  }

  const setDefault = async (id: string) => {
    await supabase.from('saved_routes').update({ is_default: false }).eq('user_id', userId)
    await supabase.from('saved_routes').update({ is_default: true }).eq('id', id)
    setRoutes(prev => prev.map(r => ({ ...r, is_default: r.id === id })))
    toast.success('Default route updated')
  }

  const postLift = async () => {
    if (!liftForm.from_location || !liftForm.to_location || !liftForm.departure_time) {
      toast.error('Fill in from, to, and departure time')
      return
    }
    setSavingLift(true)
    const { data: prof } = await supabase.from('profiles').select('university').eq('id', userId).single()
    const { data, error } = await supabase.from('lift_club_posts').insert({
      user_id: userId,
      university: prof?.university ?? '',
      from_location: liftForm.from_location,
      to_location: liftForm.to_location,
      departure_time: liftForm.departure_time,
      seats_available: parseInt(liftForm.seats_available) || 1,
      fare_rands: liftForm.fare_rands ? parseFloat(liftForm.fare_rands) : null,
      recurring: liftForm.recurring,
      contact_whatsapp: liftForm.contact_whatsapp || null,
    }).select().single()
    if (error) { toast.error('Failed to post lift'); setSavingLift(false); return }
    setLiftPosts(prev => [data, ...prev])
    setLiftForm({ from_location: '', to_location: '', departure_time: '', seats_available: '1', fare_rands: '', recurring: 'once', contact_whatsapp: '' })
    setAddingLift(false)
    toast.success('Lift posted!')
    setSavingLift(false)
  }

  const deactivateLift = async (id: string) => {
    await supabase.from('lift_club_posts').update({ is_active: false }).eq('id', id)
    setLiftPosts(prev => prev.filter(p => p.id !== id))
  }

  const formField = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-teal-600/60 transition-all font-body'
  const lbl       = 'font-mono text-[0.6rem] tracking-[0.12em] uppercase text-white/40 mb-1 block'
  const chip      = (active: boolean) => `px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${active ? 'bg-teal-600/20 border-teal-500/50 text-teal-400' : 'bg-white/4 border-white/8 text-white/50 hover:text-white hover:bg-white/8'}`

  return (
    <>
      {/* Full-page ambient art — fixed so it persists as user scrolls */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <AmbientImage zone="movement" opacity={0.28} blurPx={20} saturation={1.1}
          overlayColor="rgba(5,4,12,0.0)" />
      </div>
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg-base)', position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-6" style={{ background: 'linear-gradient(135deg, #0f4c75 0%, #0d3a5e 100%)' }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
            <Navigation size={20} className="text-sky-300" />
          </div>
          <div>
            <h1 className="font-display font-black text-xl text-white">Movement OS</h1>
            <p className="font-mono text-[0.6rem] text-sky-300/60 uppercase tracking-widest">Get around campus &amp; the city</p>
          </div>
        </div>
      </div>

      {/* Main layout: vertical tab rail + content */}
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 57px)' }}>
        {/* Vertical tab rail */}
        <div style={{ width: 60, flexShrink: 0, position: 'sticky', top: 57, height: 'calc(100vh - 57px)', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.07)', background: 'var(--bg-base)', zIndex: 10, overflowY: 'auto', scrollbarWidth: 'none' }}>
          {TABS.map(({ key, label: tLabel, icon: Icon }) => {
            const active = tab === key
            return (
              <button
                key={key}
                onClick={() => { setTab(key); if (key === 'lift-club') loadLiftPosts() }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  padding: '10px 4px',
                  background: active ? 'rgba(14,165,233,0.12)' : 'transparent',
                  border: 'none',
                  borderLeft: active ? '2px solid #38bdf8' : '2px solid transparent',
                  cursor: 'pointer', width: '100%',
                }}
              >
                <Icon size={18} style={{ opacity: active ? 1 : 0.45, color: active ? '#38bdf8' : 'rgba(255,255,255,0.45)' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.42rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: active ? '#38bdf8' : 'rgba(255,255,255,0.35)', lineHeight: 1.2, textAlign: 'center' }}>
                  {tLabel.slice(0, 5).toUpperCase()}
                </span>
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }} className="px-4 pt-3 space-y-4">

        {/* ── Get There — Google Maps Embed ─────────────────── */}
        {tab === 'get-there' && (
          <div className="space-y-4">
            <div className="card-base p-4 space-y-3">
              <p className="font-mono text-[0.6rem] text-white/40 uppercase tracking-wider">Route Planner</p>

              <div>
                <label className={lbl}>From</label>
                <input
                  className={formField}
                  placeholder="e.g. Res A, Main Campus Gate, Rondebosch…"
                  value={fromAddr}
                  onChange={e => setFromAddr(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchDirections()}
                />
              </div>
              <div>
                <label className={lbl}>To</label>
                <input
                  className={formField}
                  placeholder="e.g. Library, Pick n Pay Claremont…"
                  value={toAddr}
                  onChange={e => setToAddr(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchDirections()}
                />
              </div>

              <div>
                <label className={lbl}>Transport mode</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(Object.keys(TRANSPORT_ICONS) as TransportType[]).map(t => (
                    <button key={t} type="button" onClick={() => setTransport(t)} className={chip(transport === t)}>
                      {TRANSPORT_ICONS[t]} {TRANSPORT_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={searchDirections}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-mono text-sm transition-all"
                style={{ background: 'rgba(14,165,233,0.18)', border: '1px solid rgba(14,165,233,0.35)', color: '#38bdf8' }}
              >
                <Search size={14} />
                Get Directions
              </button>
            </div>

            {/* Google Maps Embed — shows after user searches */}
            {dirQuery && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="font-mono text-[0.58rem] text-white/30 uppercase tracking-wider">
                    {TRANSPORT_ICONS[dirQuery.mode]} {TRANSPORT_LABELS[dirQuery.mode]} · {SA_FARE_RANGES[dirQuery.mode]}
                  </span>
                  <a
                    href={`https://www.google.com/maps/dir/${encodeURIComponent(dirQuery.from + ', South Africa')}/${encodeURIComponent(dirQuery.to + ', South Africa')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[0.62rem] text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    Open full screen →
                  </a>
                </div>

                {GM_KEY ? (
                  <iframe
                    key={`${dirQuery.from}|${dirQuery.to}|${dirQuery.mode}`}
                    src={gmEmbedUrl(dirQuery.from, dirQuery.to, dirQuery.mode)}
                    width="100%"
                    height="360"
                    style={{ border: 0, borderRadius: 16, display: 'block' }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Google Maps directions"
                  />
                ) : (
                  <div
                    className="rounded-2xl flex flex-col items-center justify-center gap-3 py-10"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.1)' }}
                  >
                    <MapPin size={28} className="text-white/20" />
                    <p className="font-mono text-[0.65rem] text-white/30 text-center max-w-[200px] leading-relaxed">
                      Add <code className="text-sky-400">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your .env.local to enable the embedded map
                    </p>
                    <a
                      href={`https://www.google.com/maps/dir/${encodeURIComponent(dirQuery.from + ', South Africa')}/${encodeURIComponent(dirQuery.to + ', South Africa')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-sky-400 hover:text-sky-300 transition-colors underline"
                    >
                      Open in Google Maps instead
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Default route quick view */}
            {routes.find(r => r.is_default) && (() => {
              const def = routes.find(r => r.is_default)!
              return (
                <div className="card-base p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[0.58rem] text-amber-400 uppercase tracking-wider">⭐ Your Default Route</span>
                    <button
                      onClick={() => { setFromAddr(def.from_address); setToAddr(def.to_address); setTransport(def.transport_type); setDirQuery({ from: def.from_address, to: def.to_address, mode: def.transport_type }) }}
                      className="font-mono text-[0.6rem] text-sky-400 hover:text-sky-300 transition-colors"
                    >
                      Show on map →
                    </button>
                  </div>
                  <div className="font-display font-bold text-white">{def.label}</div>
                  <div className="font-mono text-[0.65rem] text-white/40 mt-1">
                    {def.from_address} → {def.to_address}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="font-mono text-xs text-white/50">{TRANSPORT_ICONS[def.transport_type]} {TRANSPORT_LABELS[def.transport_type]}</span>
                    {def.fare_rands && <span className="font-mono text-xs text-teal-400">R{def.fare_rands}</span>}
                    {def.estimated_minutes && <span className="font-mono text-xs text-white/40">{def.estimated_minutes} min</span>}
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* ── My Routes — Mapbox pins map ───────────────────── */}
        {tab === 'my-routes' && (
          <div className="space-y-3">
            {/* Mapbox interactive map */}
            {routes.length > 0 && (
              <div>
                <p className="font-mono text-[0.58rem] text-white/25 uppercase tracking-wider mb-2 px-1">
                  📍 Tap markers for details · Teal = departure · Orange = destination
                </p>
                {MAPBOX_TOKEN ? (
                  <MapboxRoutesMap routes={routes} token={MAPBOX_TOKEN} height={380} />
                ) : (
                  <div
                    className="rounded-2xl flex flex-col items-center justify-center gap-2 py-8"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.1)' }}
                  >
                    <MapPin size={24} className="text-white/20" />
                    <p className="font-mono text-[0.62rem] text-white/25 text-center max-w-[200px] leading-relaxed">
                      Add <code className="text-sky-400">NEXT_PUBLIC_MAPBOX_TOKEN</code> to enable the route map
                    </p>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setAddingRoute(v => !v)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-mono text-sm border border-dashed border-teal-600/30 text-teal-400 hover:bg-teal-600/8 transition-all"
            >
              <Plus size={15} />
              Save a new route
            </button>

            {addingRoute && (
              <div className="card-base p-4 space-y-3">
                <div className="font-mono text-[0.6rem] text-teal-400 uppercase tracking-wider">New Route</div>
                <div>
                  <label className={lbl}>Route label</label>
                  <input className={formField} placeholder="e.g. Home to Campus" value={routeForm.label} onChange={e => setRouteForm(p => ({ ...p, label: e.target.value }))} />
                </div>
                <div>
                  <label className={lbl}>From</label>
                  <input className={formField} placeholder="Starting point" value={routeForm.from_address} onChange={e => setRouteForm(p => ({ ...p, from_address: e.target.value }))} />
                </div>
                <div>
                  <label className={lbl}>To</label>
                  <input className={formField} placeholder="Destination" value={routeForm.to_address} onChange={e => setRouteForm(p => ({ ...p, to_address: e.target.value }))} />
                </div>
                <div>
                  <label className={lbl}>Transport</label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(TRANSPORT_ICONS) as TransportType[]).map(t => (
                      <button key={t} type="button" onClick={() => setRouteForm(p => ({ ...p, transport_type: t }))} className={chip(routeForm.transport_type === t)}>
                        {TRANSPORT_ICONS[t]} {TRANSPORT_LABELS[t]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className={lbl}>Est. minutes</label>
                    <input type="number" className={formField} placeholder="e.g. 20" value={routeForm.estimated_minutes} onChange={e => setRouteForm(p => ({ ...p, estimated_minutes: e.target.value }))} />
                  </div>
                  <div className="flex-1">
                    <label className={lbl}>Fare (R)</label>
                    <input type="number" className={formField} placeholder="e.g. 12" value={routeForm.fare_rands} onChange={e => setRouteForm(p => ({ ...p, fare_rands: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setAddingRoute(false)} className="flex-1 py-2.5 rounded-xl font-mono text-sm border border-white/10 text-white/40 hover:text-white transition-all">Cancel</button>
                  <button onClick={saveRoute} disabled={savingRoute} className="flex-1 py-2.5 rounded-xl font-mono text-sm bg-teal-600/20 border border-teal-600/40 text-teal-400 hover:bg-teal-600/30 transition-all disabled:opacity-40">
                    {savingRoute ? 'Saving…' : 'Save Route'}
                  </button>
                </div>
              </div>
            )}

            {routes.length === 0 && !addingRoute && (
              <div className="text-center py-10">
                <MapPin size={32} className="text-white/15 mx-auto mb-3" />
                <p className="font-mono text-xs text-white/30">No saved routes yet</p>
              </div>
            )}

            {routes.map(r => (
              <div key={r.id} className="card-base p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-white text-sm">{r.label}</span>
                      {r.is_default && <span className="font-mono text-[0.52rem] bg-amber-500/15 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full">DEFAULT</span>}
                    </div>
                    <div className="font-mono text-[0.62rem] text-white/40 mt-0.5 truncate">
                      {r.from_address} → {r.to_address}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="font-mono text-xs text-white/50">{TRANSPORT_ICONS[r.transport_type]} {TRANSPORT_LABELS[r.transport_type]}</span>
                      {r.fare_rands !== null && <span className="font-mono text-xs text-teal-400">R{r.fare_rands}</span>}
                      {r.estimated_minutes && <span className="font-mono text-xs text-white/30">{r.estimated_minutes}min</span>}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {!r.is_default && (
                      <button onClick={() => setDefault(r.id)} className="p-1.5 rounded-lg bg-amber-500/8 text-amber-500/60 hover:text-amber-400 transition-colors" title="Set as default">
                        <Star size={13} />
                      </button>
                    )}
                    <button onClick={() => deleteRoute(r.id)} className="p-1.5 rounded-lg bg-red-500/8 text-red-500/40 hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Lift Club ─────────────────────────────────────── */}
        {tab === 'lift-club' && (
          <div className="space-y-3">
            <div className="card-base p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="font-mono text-[0.6rem] text-white/35 leading-relaxed flex-1">
                  Find or offer a lift with fellow students. Always meet in a public place and share your trip with someone you trust.
                </p>
                {MAPBOX_TOKEN && liftLoaded && liftPosts.length > 0 && (
                  <button
                    onClick={() => setLiftMapView(v => !v)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[0.6rem] transition-all"
                    style={{ background: liftMapView ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${liftMapView ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.1)'}`, color: liftMapView ? '#38bdf8' : 'rgba(255,255,255,0.45)' }}
                  >
                    🗺 {liftMapView ? 'Hide map' : 'Show map'}
                  </button>
                )}
              </div>
            </div>

            {/* Lift club map — shows all active lift posts as 🚗 pins */}
            {liftMapView && MAPBOX_TOKEN && (
              <div>
                <p className="font-mono text-[0.58rem] text-white/25 uppercase tracking-wider mb-2 px-1">
                  🚗 = pickup point · tap for details & WhatsApp link
                </p>
                <MapboxRoutesMap liftPosts={liftPosts} token={MAPBOX_TOKEN} height={380} />
              </div>
            )}

            <button
              onClick={() => setAddingLift(v => !v)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-mono text-sm border border-dashed border-sky-600/30 text-sky-400 hover:bg-sky-600/8 transition-all"
            >
              <Plus size={15} />
              Offer a lift
            </button>

            {addingLift && (
              <div className="card-base p-4 space-y-3">
                <div className="font-mono text-[0.6rem] text-sky-400 uppercase tracking-wider">Post a Lift</div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className={lbl}>From</label>
                    <input className={formField} placeholder="e.g. Rondebosch" value={liftForm.from_location} onChange={e => setLiftForm(p => ({ ...p, from_location: e.target.value }))} />
                  </div>
                  <div className="flex-1">
                    <label className={lbl}>To</label>
                    <input className={formField} placeholder="e.g. Main Campus" value={liftForm.to_location} onChange={e => setLiftForm(p => ({ ...p, to_location: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Departure time</label>
                  <input type="datetime-local" className={formField} value={liftForm.departure_time} onChange={e => setLiftForm(p => ({ ...p, departure_time: e.target.value }))} />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className={lbl}>Seats available</label>
                    <input type="number" min={1} max={8} className={formField} placeholder="1" value={liftForm.seats_available} onChange={e => setLiftForm(p => ({ ...p, seats_available: e.target.value }))} />
                  </div>
                  <div className="flex-1">
                    <label className={lbl}>Fare share (R)</label>
                    <input type="number" className={formField} placeholder="e.g. 30" value={liftForm.fare_rands} onChange={e => setLiftForm(p => ({ ...p, fare_rands: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Recurring</label>
                  <div className="flex gap-2">
                    {(['once', 'daily', 'weekdays'] as RecurringType[]).map(r => (
                      <button key={r} type="button" onClick={() => setLiftForm(p => ({ ...p, recurring: r }))} className={chip(liftForm.recurring === r)}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={lbl}>WhatsApp contact (optional)</label>
                  <input className={formField} placeholder="+27 82 000 0000" value={liftForm.contact_whatsapp} onChange={e => setLiftForm(p => ({ ...p, contact_whatsapp: e.target.value }))} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setAddingLift(false)} className="flex-1 py-2.5 rounded-xl font-mono text-sm border border-white/10 text-white/40 hover:text-white transition-all">Cancel</button>
                  <button onClick={postLift} disabled={savingLift} className="flex-1 py-2.5 rounded-xl font-mono text-sm bg-sky-600/20 border border-sky-600/40 text-sky-400 hover:bg-sky-600/30 transition-all disabled:opacity-40">
                    {savingLift ? 'Posting…' : 'Post Lift'}
                  </button>
                </div>
              </div>
            )}

            {liftPosts.length === 0 && liftLoaded && !addingLift && (
              <div className="text-center py-10">
                <Car size={32} className="text-white/15 mx-auto mb-3" />
                <p className="font-mono text-xs text-white/30">No lift offers at your university yet</p>
                <p className="font-mono text-[0.62rem] text-white/20 mt-1">Be the first to offer a lift!</p>
              </div>
            )}

            {liftPosts.map(p => (
              <div key={p.id} className="card-base p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-display font-bold text-white text-sm">
                      {p.from_location} → {p.to_location}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      <span className="font-mono text-[0.62rem] text-white/50">
                        🗓 {new Date(p.departure_time).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })} {new Date(p.departure_time).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="font-mono text-[0.62rem] text-sky-400">
                        {p.seats_available} seat{p.seats_available !== 1 ? 's' : ''}
                      </span>
                      {p.fare_rands && <span className="font-mono text-[0.62rem] text-teal-400">R{p.fare_rands}/person</span>}
                      <span className="font-mono text-[0.58rem] text-white/25 capitalize">{p.recurring}</span>
                    </div>
                    {p.contact_whatsapp && (
                      <a
                        href={`https://wa.me/${p.contact_whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 font-mono text-[0.62rem] text-green-400 hover:text-green-300 transition-colors"
                      >
                        💬 WhatsApp driver
                      </a>
                    )}
                  </div>
                  {p.user_id === userId && (
                    <button onClick={() => deactivateLift(p.id)} className="p-1.5 rounded-lg bg-red-500/8 text-red-500/40 hover:text-red-400 transition-colors shrink-0">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Transport Tips ─────────────────────────────────── */}
        {tab === 'tips' && (
          <div className="space-y-3">
            {TRANSPORT_TIPS.map(tip => (
              <div key={tip.title} className="card-base p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{tip.icon}</span>
                  <div>
                    <div className="font-display font-bold text-white text-sm mb-1">{tip.title}</div>
                    <p className="font-mono text-[0.65rem] text-white/50 leading-relaxed">{tip.body}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="card-base p-4">
              <div className="font-mono text-[0.6rem] text-white/35 uppercase tracking-wider mb-3">SA Fare Guide</div>
              <div className="space-y-2">
                {(Object.keys(TRANSPORT_ICONS) as TransportType[]).map(t => (
                  <div key={t} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{TRANSPORT_ICONS[t]}</span>
                      <span className="font-body text-sm text-white/60">{TRANSPORT_LABELS[t]}</span>
                    </div>
                    <span className="font-mono text-[0.62rem] text-teal-400">{SA_FARE_RANGES[t]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
      </div>
    </div>
    </>
  )
}
