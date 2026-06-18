'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

export interface RoutePin {
  id: string
  label: string
  from_address: string
  to_address: string
  transport_type?: string
}

export interface LiftMarker {
  id: string
  from_location: string
  to_location: string
  departure_time: string
  seats_available: number
  fare_rands: number | null
  contact_whatsapp: string | null
}

interface Props {
  routes?: RoutePin[]
  liftPosts?: LiftMarker[]
  token: string
  height?: number
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

async function fetchRouteGeometry(
  from: [number, number],
  to: [number, number],
  token: string,
): Promise<{ type: 'LineString'; coordinates: [number, number][] } | null> {
  try {
    const coords = `${from[0]},${from[1]};${to[0]},${to[1]}`
    const res = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}` +
      `?geometries=geojson&overview=full&steps=false&access_token=${token}`
    )
    const d = await res.json() as {
      routes?: { geometry: { type: 'LineString'; coordinates: [number, number][] } }[]
    }
    return d.routes?.[0]?.geometry ?? null
  } catch { return null }
}

function pinEl(color: string): HTMLElement {
  const el = document.createElement('div')
  el.style.cssText = [
    `width:14px`, `height:14px`, `border-radius:50%`,
    `background:${color}`, `border:2.5px solid #fff`,
    `cursor:pointer`, `box-shadow:0 0 10px ${color}88`,
    `transition:transform 0.15s`, `flex-shrink:0`,
  ].join(';')
  el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.4)' })
  el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)' })
  return el
}

function popupHtml(title: string, rows: string[]): string {
  return `
    <div style="font-family:DM Sans,sans-serif;font-size:12px;color:#e2e8f0;line-height:1.6;min-width:160px">
      <strong style="font-size:13px;display:block;margin-bottom:4px;color:#f8fafc">${title}</strong>
      ${rows.map(r => `<div style="opacity:0.75;font-size:11px">${r}</div>`).join('')}
    </div>
  `
}

export function MapboxRoutesMap({ routes = [], liftPosts = [], token, height = 360 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!containerRef.current || !token) return
    let destroyed = false

    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [28.0473, -26.2041], // Joburg default — most SA campuses are within 500 km
      zoom: 9,
      attributionControl: false,
    })

    // Controls
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')

    // Live location — triggers automatically; button in top-right to re-center
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true, timeout: 8000 },
      trackUserLocation: false,
      showUserHeading: false,
      showAccuracyCircle: false,
    })
    map.addControl(geolocate, 'top-right')

    const bounds = new mapboxgl.LngLatBounds()
    let pinCount = 0

    const addPins = async () => {
      if (destroyed) return

      // ── User live location ──────────────────────────────────
      navigator.geolocation?.getCurrentPosition(
        pos => {
          if (destroyed) return
          const { longitude, latitude } = pos.coords
          const pulse = document.createElement('div')
          pulse.style.cssText = [
            'width:16px', 'height:16px', 'border-radius:50%',
            'background:#38bdf8', 'border:3px solid #fff',
            'box-shadow:0 0 0 0 rgba(56,189,248,0.6)',
            'animation:pulseLoc 2s infinite',
          ].join(';')
          new mapboxgl.Marker({ element: pulse })
            .setLngLat([longitude, latitude])
            .setPopup(new mapboxgl.Popup({ offset: 14, closeButton: false })
              .setHTML(popupHtml('📍 You are here', [])))
            .addTo(map)
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      )

      // ── Route from / to pins + dashed line ─────────────────
      for (const route of routes.slice(0, 8)) {
        const [fromC, toC] = await Promise.all([
          geocodeZA(route.from_address, token),
          geocodeZA(route.to_address, token),
        ])
        if (destroyed) return

        if (fromC) {
          new mapboxgl.Marker({ element: pinEl('#0d9488') })
            .setLngLat(fromC)
            .setPopup(new mapboxgl.Popup({ offset: 14 })
              .setHTML(popupHtml(route.label, [`📍 From: ${route.from_address}`])))
            .addTo(map)
          bounds.extend(fromC)
          pinCount++
        }

        if (toC) {
          new mapboxgl.Marker({ element: pinEl('#f97316') })
            .setLngLat(toC)
            .setPopup(new mapboxgl.Popup({ offset: 14 })
              .setHTML(popupHtml(route.label, [`🏁 To: ${route.to_address}`])))
            .addTo(map)
          bounds.extend(toC)
          pinCount++
        }

        // Road route via Directions API (falls back to dashed line if unavailable)
        if (fromC && toC) {
          const srcId = `rl-${route.id}`
          if (!map.getSource(srcId)) {
            const geom = await fetchRouteGeometry(fromC, toC, token)
            if (destroyed) return
            if (geom) {
              geom.coordinates.forEach(c => bounds.extend(c))
            }
            map.addSource(srcId, {
              type: 'geojson',
              data: {
                type: 'Feature', properties: {},
                geometry: geom ?? { type: 'LineString', coordinates: [fromC, toC] },
              },
            })
            map.addLayer({
              id: `${srcId}-outline`,
              type: 'line',
              source: srcId,
              layout: { 'line-cap': 'round', 'line-join': 'round' },
              paint: { 'line-color': '#0a4a3c', 'line-width': 6, 'line-opacity': 0.75 },
            })
            map.addLayer({
              id: srcId,
              type: 'line',
              source: srcId,
              layout: { 'line-cap': 'round', 'line-join': 'round' },
              paint: {
                'line-color': '#0d9488',
                'line-width': geom ? 3.5 : 2,
                'line-opacity': geom ? 0.85 : 0.45,
                ...(!geom ? { 'line-dasharray': [3, 3] } : {}),
              },
            })
          }
        }
      }

      // ── Lift club posts ─────────────────────────────────────
      for (const lift of liftPosts.slice(0, 24)) {
        const coords = await geocodeZA(`${lift.from_location}, South Africa`, token)
        if (destroyed || !coords) continue

        const el = document.createElement('div')
        el.textContent = '🚗'
        el.style.cssText = 'font-size:20px;cursor:pointer;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.6));user-select:none;line-height:1'
        el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.25)'; el.style.transition = '0.15s' })
        el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)' })

        const depTime = new Date(lift.departure_time).toLocaleString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        const waLink = lift.contact_whatsapp
          ? `<a href="https://wa.me/${lift.contact_whatsapp.replace(/\D/g, '')}" target="_blank" style="color:#4ade80">💬 WhatsApp driver</a>`
          : ''
        const fareStr = lift.fare_rands != null ? `R${lift.fare_rands}/person` : 'Free / negotiate'

        new mapboxgl.Marker({ element: el })
          .setLngLat(coords)
          .setPopup(new mapboxgl.Popup({ offset: 16, maxWidth: '230px' })
            .setHTML(popupHtml(
              `${lift.from_location} → ${lift.to_location}`,
              [
                `🗓 ${depTime}`,
                `💺 ${lift.seats_available} seat${lift.seats_available !== 1 ? 's' : ''} · ${fareStr}`,
                waLink,
              ].filter(Boolean),
            )))
          .addTo(map)

        bounds.extend(coords)
        pinCount++
      }

      // Fit to all pins once done
      if (pinCount > 0 && !bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 70, maxZoom: 13, duration: 1200 })
      }
    }

    map.on('load', () => {
      if (!destroyed) {
        setLoading(false)
        void addPins()
      }
    })

    return () => {
      destroyed = true
      map.remove()
    }
  // Re-run if token or item counts change (new route/lift saved during session)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, routes.length, liftPosts.length])

  return (
    <div style={{ position: 'relative' }}>
      {/* Inject pulse keyframes once */}
      <style>{`
        @keyframes pulseLoc {
          0%   { box-shadow: 0 0 0 0 rgba(56,189,248,0.6) }
          70%  { box-shadow: 0 0 0 12px rgba(56,189,248,0) }
          100% { box-shadow: 0 0 0 0 rgba(56,189,248,0) }
        }
        .mapboxgl-popup-content {
          background: #1a2a38 !important;
          border: 1px solid rgba(255,255,255,0.12) !important;
          border-radius: 10px !important;
          padding: 10px 12px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
        }
        .mapboxgl-popup-tip { border-top-color: #1a2a38 !important; }
        .mapboxgl-popup-close-button { color: rgba(255,255,255,0.4) !important; font-size: 16px !important; }
        .mapboxgl-ctrl-group { background: #1a2a38 !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 8px !important; }
        .mapboxgl-ctrl-group button { background: transparent !important; color: rgba(255,255,255,0.7) !important; }
        .mapboxgl-ctrl-group button:hover { background: rgba(255,255,255,0.1) !important; }
        .mapboxgl-ctrl-zoom-in .mapboxgl-ctrl-icon, .mapboxgl-ctrl-zoom-out .mapboxgl-ctrl-icon, .mapboxgl-ctrl-geolocate .mapboxgl-ctrl-icon { filter: invert(1) opacity(0.7) !important; }
      `}</style>

      {loading && (
        <div style={{
          position: 'absolute', inset: 0, background: '#0a1510',
          borderRadius: 16, display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 2,
        }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
            Initialising map…
          </span>
        </div>
      )}

      <div ref={containerRef} style={{ width: '100%', height, borderRadius: 16, overflow: 'hidden', background: '#0a1510' }} />

      {/* Legend */}
      {!loading && (routes.length > 0 || liftPosts.length > 0) && (
        <div style={{
          position: 'absolute', bottom: 36, left: 8,
          background: 'rgba(10,21,16,0.88)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
          padding: '6px 10px', display: 'flex', gap: 12, flexWrap: 'wrap',
        }}>
          {routes.length > 0 && <>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#0d9488' }}>⬤ From</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#f97316' }}>⬤ To</span>
          </>}
          {liftPosts.length > 0 &&
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>🚗 Lift offer</span>
          }
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#38bdf8' }}>⬤ You</span>
        </div>
      )}
    </div>
  )
}
