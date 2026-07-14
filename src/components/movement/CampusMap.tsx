'use client'

// ============================================================
// CampusMap — the one reusable Mapbox surface for VarsityOS.
//
// Every map feature renders through this: Movement routes, the Safety
// incident heatmap, "who's around" presence, marketplace pins, SafeWalk.
// Callers pass declarative props (pins / heat / route / safePoints) and
// CampusMap handles geocoding, fitting bounds, live location, the dark
// theme, the Data Saver static fallback, and the load-shedding banner.
//
// Data-cost aware: in Data Saver mode it shows a static PNG (one request)
// with a "Load live map" tap-through instead of streaming vector tiles.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import {
  MAP_STYLE_DARK, MAP_DARK_CSS, popupHtml, geocodeZA, fetchRoute, searchNearby,
  staticMapUrl, distanceMeters, fmtDistance, JOBURG,
  type LngLat, type RouteProfile,
} from '@/lib/mapbox'
import { getDataSaverEnabled, onDataSaverChange } from '@/lib/dataSaver'

export interface MapPinInput {
  id: string
  /** Provide either coordinates directly, or an address to geocode. */
  lngLat?: LngLat
  address?: string
  emoji?: string        // rendered as the marker (falls back to a coloured dot)
  color?: string        // dot colour when no emoji
  title: string
  rows?: (string | null | undefined)[]   // popup detail lines
}

export type SafePointKind = 'police' | 'hospital' | 'pharmacy'

const SAFE_POINT_META: Record<SafePointKind, { query: string; emoji: string; color: string; label: string }> = {
  police:   { query: 'police station', emoji: '🚓', color: '#3b82f6', label: 'Police' },
  hospital: { query: 'hospital',       emoji: '🏥', color: '#ef4444', label: 'Hospital' },
  pharmacy: { query: 'pharmacy',       emoji: '💊', color: '#22c55e', label: 'Pharmacy' },
}

interface Props {
  token: string
  height?: number
  pins?: MapPinInput[]
  /** Weighted heat layer points (e.g. safety incidents). */
  heatPoints?: { lngLat?: LngLat; address?: string; weight?: number }[]
  /** Draw a route between two places (coords or text). */
  route?: { from: LngLat | string; to: LngLat | string; profile?: RouteProfile }
  showUserLocation?: boolean
  /** Overlay nearest police/hospital/pharmacy around the user's location. */
  safePoints?: SafePointKind[]
  center?: LngLat
  zoom?: number
  fitToData?: boolean
  /** Show a banner when load shedding is active (stage > 0). */
  loadSheddingBanner?: boolean
  emptyLabel?: string
}

function dotEl(color: string): HTMLElement {
  const el = document.createElement('div')
  el.style.cssText = [
    'width:14px', 'height:14px', 'border-radius:50%',
    `background:${color}`, 'border:2.5px solid #fff',
    'cursor:pointer', `box-shadow:0 0 10px ${color}88`,
    'transition:transform 0.15s', 'flex-shrink:0',
  ].join(';')
  el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.4)' })
  el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)' })
  return el
}

function emojiEl(emoji: string): HTMLElement {
  const el = document.createElement('div')
  el.textContent = emoji
  el.style.cssText = 'font-size:20px;cursor:pointer;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.6));user-select:none;line-height:1'
  el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.25)'; el.style.transition = '0.15s' })
  el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)' })
  return el
}

async function resolve(input: LngLat | string, token: string): Promise<LngLat | null> {
  return Array.isArray(input) ? input : geocodeZA(input, token)
}

export default function CampusMap({
  token, height = 380, pins = [], heatPoints = [], route,
  showUserLocation = true, safePoints, center, zoom = 11,
  fitToData = true, loadSheddingBanner = false, emptyLabel,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready'>('loading')
  const [dataSaver, setDataSaver] = useState(false)
  const [forceLive, setForceLive] = useState(false)
  const [lsStage, setLsStage] = useState<number | null>(null)
  const userLoc = useRef<LngLat | null>(null)

  // Track Data Saver preference (static-image mode when on).
  useEffect(() => {
    setDataSaver(getDataSaverEnabled())
    return onDataSaverChange(setDataSaver)
  }, [])

  // Pull current load-shedding stage for the banner (best-effort).
  useEffect(() => {
    if (!loadSheddingBanner) return
    let alive = true
    fetch('/api/load-shedding')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (alive && d?.status) setLsStage(d.status.stage ?? 0) })
      .catch(() => {})
    return () => { alive = false }
  }, [loadSheddingBanner])

  const useStatic = dataSaver && !forceLive
  // Keys that should re-init the interactive map when data changes.
  const pinKey = pins.map(p => p.id).join('|')
  const heatKey = heatPoints.length
  const routeKey = route ? `${JSON.stringify(route.from)}-${JSON.stringify(route.to)}-${route.profile}` : ''
  const safeKey = (safePoints ?? []).join(',')

  useEffect(() => {
    if (useStatic) return               // static image path handles rendering
    if (!containerRef.current || !token) return
    let destroyed = false
    setStatus('loading')

    mapboxgl.accessToken = token
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE_DARK,
      center: center ?? JOBURG,
      zoom,
      attributionControl: false,
    })
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')
    if (showUserLocation) {
      map.addControl(new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true, timeout: 8000 },
        trackUserLocation: false,
      }), 'top-right')
    }

    const bounds = new mapboxgl.LngLatBounds()
    let hasData = false
    const extend = (c: LngLat) => { bounds.extend(c); hasData = true }

    const build = async () => {
      // ── User live location ────────────────────────────────
      if (showUserLocation && 'geolocation' in navigator) {
        await new Promise<void>(res => {
          navigator.geolocation.getCurrentPosition(
            pos => {
              if (destroyed) return res()
              const here: LngLat = [pos.coords.longitude, pos.coords.latitude]
              userLoc.current = here
              const pulse = document.createElement('div')
              pulse.style.cssText = [
                'width:16px', 'height:16px', 'border-radius:50%',
                'background:#38bdf8', 'border:3px solid #fff',
                'animation:vosPulseLoc 2s infinite',
              ].join(';')
              new mapboxgl.Marker({ element: pulse }).setLngLat(here)
                .setPopup(new mapboxgl.Popup({ offset: 14, closeButton: false }).setHTML(popupHtml('📍 You are here', [])))
                .addTo(map)
              extend(here)
              res()
            },
            () => res(),
            { enableHighAccuracy: true, timeout: 8000 },
          )
        })
      }

      // ── Generic pins (coords or geocoded) ─────────────────
      for (const p of pins.slice(0, 60)) {
        const c = p.lngLat ?? (p.address ? await geocodeZA(p.address, token) : null)
        if (destroyed) return
        if (!c) continue
        const el = p.emoji ? emojiEl(p.emoji) : dotEl(p.color ?? '#38bdf8')
        new mapboxgl.Marker({ element: el }).setLngLat(c)
          .setPopup(new mapboxgl.Popup({ offset: 16, maxWidth: '240px' }).setHTML(popupHtml(p.title, p.rows ?? [])))
          .addTo(map)
        extend(c)
      }

      // ── Heat layer ────────────────────────────────────────
      if (heatPoints.length) {
        const feats: GeoJSON.Feature[] = []
        for (const h of heatPoints.slice(0, 120)) {
          const c = h.lngLat ?? (h.address ? await geocodeZA(h.address, token) : null)
          if (destroyed) return
          if (!c) continue
          feats.push({ type: 'Feature', properties: { weight: h.weight ?? 1 }, geometry: { type: 'Point', coordinates: c } })
          extend(c)
        }
        if (!destroyed && feats.length && !map.getSource('vos-heat')) {
          map.addSource('vos-heat', { type: 'geojson', data: { type: 'FeatureCollection', features: feats } })
          map.addLayer({
            id: 'vos-heat-layer', type: 'heatmap', source: 'vos-heat',
            paint: {
              'heatmap-weight': ['get', 'weight'],
              'heatmap-intensity': 1.1,
              'heatmap-radius': 34,
              'heatmap-opacity': 0.75,
              'heatmap-color': [
                'interpolate', ['linear'], ['heatmap-density'],
                0, 'rgba(16,185,129,0)',
                0.3, 'rgba(250,204,21,0.55)',
                0.6, 'rgba(249,115,22,0.75)',
                1, 'rgba(239,68,68,0.9)',
              ],
            },
          })
        }
      }

      // ── Route ─────────────────────────────────────────────
      if (route) {
        const [from, to] = await Promise.all([resolve(route.from, token), resolve(route.to, token)])
        if (destroyed) return
        if (from && to) {
          extend(from); extend(to)
          new mapboxgl.Marker({ element: dotEl('#0d9488') }).setLngLat(from)
            .setPopup(new mapboxgl.Popup({ offset: 14, closeButton: false }).setHTML(popupHtml('📍 Start', []))).addTo(map)
          new mapboxgl.Marker({ element: dotEl('#f97316') }).setLngLat(to)
            .setPopup(new mapboxgl.Popup({ offset: 14, closeButton: false }).setHTML(popupHtml('🏁 Destination', []))).addTo(map)
          const r = await fetchRoute(from, to, route.profile ?? 'walking', token)
          if (destroyed) return
          const geom = r?.geometry ?? { type: 'LineString' as const, coordinates: [from, to] }
          geom.coordinates.forEach(extend)
          map.addSource('vos-route', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: geom } })
          map.addLayer({
            id: 'vos-route-outline', type: 'line', source: 'vos-route',
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: { 'line-color': '#0a4a3c', 'line-width': 7, 'line-opacity': 0.85 },
          })
          map.addLayer({
            id: 'vos-route-line', type: 'line', source: 'vos-route',
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
              'line-color': '#0d9488', 'line-width': r ? 4 : 2, 'line-opacity': r ? 0.95 : 0.5,
              ...(!r ? { 'line-dasharray': [3, 3] } : {}),
            },
          })
        }
      }

      // ── Nearest "safe points" around the user ─────────────
      if (safePoints?.length && userLoc.current) {
        for (const kind of safePoints) {
          const meta = SAFE_POINT_META[kind]
          const found = await searchNearby(meta.query, userLoc.current, token, 3)
          if (destroyed) return
          for (const poi of found) {
            const away = userLoc.current ? fmtDistance(distanceMeters(userLoc.current, poi.center)) : ''
            new mapboxgl.Marker({ element: emojiEl(meta.emoji) }).setLngLat(poi.center)
              .setPopup(new mapboxgl.Popup({ offset: 16, maxWidth: '230px' }).setHTML(
                popupHtml(`${meta.emoji} ${poi.name}`, [meta.label, away && `${away} away`, poi.address]),
              )).addTo(map)
            extend(poi.center)
          }
        }
      }

      if (!destroyed && fitToData && hasData && !bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 70, maxZoom: route ? 15 : 14, duration: 1000 })
      }
      if (!destroyed) setStatus('ready')
    }

    map.on('load', () => { if (!destroyed) void build() })

    return () => { destroyed = true; map.remove() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, useStatic, pinKey, heatKey, routeKey, safeKey])

  // ── Static (Data Saver) fallback ────────────────────────────
  if (useStatic) {
    const staticPins = pins.filter(p => p.lngLat).map(p => ({ lngLat: p.lngLat as LngLat, color: p.color }))
    return (
      <div style={{ position: 'relative' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={staticMapUrl({ token, width: 600, height, center, zoom, pins: staticPins })}
          alt="Campus map (data saver)"
          style={{ width: '100%', height, objectFit: 'cover', borderRadius: 16, background: '#0a1510', display: 'block' }}
        />
        <button
          onClick={() => setForceLive(true)}
          style={{
            position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(10,21,16,0.92)', border: '1px solid rgba(56,189,248,0.4)',
            color: '#38bdf8', borderRadius: 100, padding: '7px 16px',
            fontFamily: 'JetBrains Mono, monospace', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          🗺 Load live map (uses data)
        </button>
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: 'rgba(10,21,16,0.9)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8, padding: '4px 9px', fontFamily: 'JetBrains Mono', fontSize: 10, color: '#fff',
        }}>
          📉 Data Saver — static map
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <style>{MAP_DARK_CSS}</style>

      {status === 'loading' && (
        <div style={{
          position: 'absolute', inset: 0, background: '#0a1510', borderRadius: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
        }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#fff' }}>Loading map…</span>
        </div>
      )}

      {loadSheddingBanner && lsStage != null && lsStage > 0 && (
        <div style={{
          position: 'absolute', top: 10, left: 10, right: 10, zIndex: 3,
          background: 'rgba(120,53,15,0.92)', border: '1px solid rgba(251,146,60,0.5)',
          borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 13 }}>⚡</span>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10.5, color: '#fed7aa', lineHeight: 1.4 }}>
            Load shedding Stage {lsStage} — traffic lights may be out. Add 15–30 min &amp; keep to lit, busy roads.
          </span>
        </div>
      )}

      <div ref={containerRef} style={{ width: '100%', height, borderRadius: 16, overflow: 'hidden', background: '#0a1510' }} />

      {status === 'ready' && !pins.length && !heatPoints.length && !route && emptyLabel && (
        <div style={{
          position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(10,21,16,0.88)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8, padding: '5px 12px', fontFamily: 'JetBrains Mono', fontSize: 10, color: '#fff', whiteSpace: 'nowrap',
        }}>
          {emptyLabel}
        </div>
      )}
    </div>
  )
}
