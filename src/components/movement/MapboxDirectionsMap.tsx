'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

export type MapProfile = 'driving' | 'walking'

interface Props {
  from: string
  to: string
  profile?: MapProfile
  token: string
  height?: number
}

interface RouteResult {
  geometry: { type: 'LineString'; coordinates: [number, number][] }
  duration: number
  distance: number
}

async function geocodeZA(address: string, token: string): Promise<[number, number] | null> {
  try {
    const q = /south africa/i.test(address) ? address : `${address}, South Africa`
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json` +
      `?access_token=${token}&country=ZA&limit=1&types=address,place,poi,district,region`
    )
    const d = await res.json() as { features?: { center: [number, number] }[] }
    const c = d.features?.[0]?.center
    return c ? [c[0], c[1]] : null
  } catch { return null }
}

async function fetchRoute(
  from: [number, number],
  to: [number, number],
  profile: MapProfile,
  token: string,
): Promise<RouteResult | null> {
  try {
    const coords = `${from[0]},${from[1]};${to[0]},${to[1]}`
    const res = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coords}` +
      `?geometries=geojson&overview=full&steps=false&access_token=${token}`
    )
    const d = await res.json() as { routes?: RouteResult[] }
    return d.routes?.[0] ?? null
  } catch { return null }
}

function pinEl(color: string): HTMLElement {
  const el = document.createElement('div')
  el.style.cssText = [
    'width:16px', 'height:16px', 'border-radius:50%',
    `background:${color}`, 'border:2.5px solid #fff',
    `box-shadow:0 0 12px ${color}99`, 'cursor:pointer', 'flex-shrink:0',
  ].join(';')
  return el
}

function fmtDuration(seconds: number) {
  const m = Math.round(seconds / 60)
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}min`
}

function fmtDistance(meters: number) {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`
}

const POPUP_STYLES = `
  .mapboxgl-popup-content {
    background: #1a2a38 !important;
    border: 1px solid rgba(255,255,255,0.12) !important;
    border-radius: 10px !important;
    padding: 10px 12px !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
  }
  .mapboxgl-popup-tip { border-top-color: #1a2a38 !important; }
  .mapboxgl-popup-close-button { color: rgba(255,255,255,0.58) !important; font-size: 16px !important; }
  .mapboxgl-ctrl-group { background: #1a2a38 !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 8px !important; }
  .mapboxgl-ctrl-group button { background: transparent !important; color: rgba(255,255,255,0.7) !important; }
  .mapboxgl-ctrl-group button:hover { background: rgba(255,255,255,0.1) !important; }
  .mapboxgl-ctrl-zoom-in .mapboxgl-ctrl-icon,
  .mapboxgl-ctrl-zoom-out .mapboxgl-ctrl-icon { filter: invert(1) opacity(0.7) !important; }
`

export function MapboxDirectionsMap({ from, to, profile = 'driving', token, height = 360 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'geocode-error' | 'route-error'>('loading')
  const [routeInfo, setRouteInfo] = useState<{ duration: number; distance: number } | null>(null)

  useEffect(() => {
    if (!containerRef.current || !token || !from || !to) return
    let destroyed = false
    setStatus('loading')
    setRouteInfo(null)

    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [28.0473, -26.2041],
      zoom: 9,
      attributionControl: false,
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')

    map.on('load', async () => {
      if (destroyed) return

      const [fromCoords, toCoords] = await Promise.all([
        geocodeZA(from, token),
        geocodeZA(to, token),
      ])

      if (destroyed) return

      if (!fromCoords || !toCoords) {
        setStatus('geocode-error')
        return
      }

      // From pin (teal)
      new mapboxgl.Marker({ element: pinEl('#0d9488') })
        .setLngLat(fromCoords)
        .setPopup(
          new mapboxgl.Popup({ offset: 16, closeButton: false }).setHTML(
            `<div style="font-family:DM Sans,sans-serif;font-size:12px;color:#e2e8f0">
              <strong style="color:#f8fafc">📍 From</strong>
              <div style="opacity:0.7;font-size:11px;margin-top:2px">${from}</div>
            </div>`
          )
        )
        .addTo(map)

      // To pin (orange)
      new mapboxgl.Marker({ element: pinEl('#f97316') })
        .setLngLat(toCoords)
        .setPopup(
          new mapboxgl.Popup({ offset: 16, closeButton: false }).setHTML(
            `<div style="font-family:DM Sans,sans-serif;font-size:12px;color:#e2e8f0">
              <strong style="color:#f8fafc">🏁 To</strong>
              <div style="opacity:0.7;font-size:11px;margin-top:2px">${to}</div>
            </div>`
          )
        )
        .addTo(map)

      // Fetch actual road route
      const route = await fetchRoute(fromCoords, toCoords, profile, token)
      if (destroyed) return

      const bounds = new mapboxgl.LngLatBounds().extend(fromCoords).extend(toCoords)

      if (route) {
        setRouteInfo({ duration: route.duration, distance: route.distance })
        route.geometry.coordinates.forEach(c => bounds.extend(c))

        map.addSource('mbdir-route', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: route.geometry },
        })
        // Outer glow/outline
        map.addLayer({
          id: 'mbdir-outline',
          type: 'line',
          source: 'mbdir-route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#0a4a3c', 'line-width': 7, 'line-opacity': 0.85 },
        })
        // Route line
        map.addLayer({
          id: 'mbdir-line',
          type: 'line',
          source: 'mbdir-route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#0d9488', 'line-width': 4, 'line-opacity': 0.95 },
        })
      } else {
        // Fallback dashed straight line when Directions API unavailable
        setStatus('route-error')
        map.addSource('mbdir-route', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [fromCoords, toCoords] } },
        })
        map.addLayer({
          id: 'mbdir-line',
          type: 'line',
          source: 'mbdir-route',
          paint: { 'line-color': '#0d9488', 'line-width': 2, 'line-opacity': 0.5, 'line-dasharray': [3, 3] },
        })
      }

      map.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 1000 })
      if (route) setStatus('ready')
    })

    return () => {
      destroyed = true
      map.remove()
    }
  // Re-run only when the actual query changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, profile, token])

  return (
    <div style={{ position: 'relative' }}>
      <style>{POPUP_STYLES}</style>

      {status === 'loading' && (
        <div style={{
          position: 'absolute', inset: 0, background: '#0a1510',
          borderRadius: 16, display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 2,
        }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
            Finding route…
          </span>
        </div>
      )}

      {status === 'geocode-error' && (
        <div style={{
          height, borderRadius: 16,
          background: 'rgba(255,255,255,0.07)',
          border: '1px dashed rgba(255,255,255,0.1)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 28 }}>🗺️</span>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'center', maxWidth: 240, lineHeight: 1.6 }}>
            Couldn't locate one or both addresses. Try adding a suburb, city, or campus name.
          </p>
        </div>
      )}

      <div
        ref={containerRef}
        style={{
          width: '100%', height, borderRadius: 16,
          overflow: 'hidden', background: '#0a1510',
          display: status === 'geocode-error' ? 'none' : 'block',
        }}
      />

      {/* Duration + distance badge */}
      {routeInfo && status === 'ready' && (
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: 'rgba(10,21,16,0.92)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(13,148,136,0.4)', borderRadius: 8,
          padding: '5px 10px', display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#0d9488', fontWeight: 600 }}>
            🕒 {fmtDuration(routeInfo.duration)}
          </span>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>
            {fmtDistance(routeInfo.distance)}
          </span>
        </div>
      )}

      {/* Route fallback notice */}
      {status === 'route-error' && (
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: 'rgba(10,21,16,0.92)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
          padding: '5px 10px',
        }}>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
            Showing straight line (routing unavailable)
          </span>
        </div>
      )}

      {/* Legend */}
      {status !== 'geocode-error' && status !== 'loading' && (
        <div style={{
          position: 'absolute', bottom: 36, left: 8,
          background: 'rgba(10,21,16,0.88)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
          padding: '5px 10px', display: 'flex', gap: 12,
        }}>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#0d9488' }}>⬤ From</span>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#f97316' }}>⬤ To</span>
        </div>
      )}
    </div>
  )
}
