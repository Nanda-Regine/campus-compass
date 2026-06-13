'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface RoutePin {
  id: string
  label: string
  from_address: string
  to_address: string
}

interface Props {
  routes: RoutePin[]
  token: string
}

async function geocodeZA(address: string, token: string): Promise<[number, number] | null> {
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json` +
      `?access_token=${token}&country=ZA&limit=1&types=address,place,poi`
    )
    const d = await res.json()
    const c = d.features?.[0]?.center
    return c ? [c[0], c[1]] : null
  } catch { return null }
}

export function MapboxRoutesMap({ routes, token }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || !token) return

    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [28.0473, -26.2041], // Johannesburg centre default
      zoom: 10,
      attributionControl: false,
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')

    const bounds = new mapboxgl.LngLatBounds()
    let pinCount = 0

    const addPins = async () => {
      // Geocode up to 8 routes (16 API calls max) to stay within free quota
      for (const route of routes.slice(0, 8)) {
        const [fromCoords, toCoords] = await Promise.all([
          geocodeZA(route.from_address, token),
          geocodeZA(route.to_address, token),
        ])

        if (fromCoords) {
          const el = document.createElement('div')
          el.style.cssText = 'width:12px;height:12px;border-radius:50%;background:#0d9488;border:2px solid #fff;cursor:pointer;box-shadow:0 0 8px rgba(13,148,136,0.6)'
          new mapboxgl.Marker({ element: el })
            .setLngLat(fromCoords)
            .setPopup(new mapboxgl.Popup({ offset: 12, className: 'mapbox-dark-popup' })
              .setHTML(`<div style="font-family:DM Sans;font-size:12px;color:#fff"><strong>${route.label}</strong><br/><span style="opacity:0.6">From: ${route.from_address}</span></div>`))
            .addTo(map)
          bounds.extend(fromCoords)
          pinCount++
        }

        if (toCoords) {
          const el = document.createElement('div')
          el.style.cssText = 'width:12px;height:12px;border-radius:50%;background:#f97316;border:2px solid #fff;cursor:pointer;box-shadow:0 0 8px rgba(249,115,22,0.6)'
          new mapboxgl.Marker({ element: el })
            .setLngLat(toCoords)
            .setPopup(new mapboxgl.Popup({ offset: 12 })
              .setHTML(`<div style="font-family:DM Sans;font-size:12px;color:#fff"><strong>${route.label}</strong><br/><span style="opacity:0.6">To: ${route.to_address}</span></div>`))
            .addTo(map)
          bounds.extend(toCoords)
          pinCount++
        }
      }

      if (pinCount > 0) {
        map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 1000 })
      }
    }

    map.on('load', addPins)

    return () => map.remove()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: 300, borderRadius: 16, overflow: 'hidden', background: '#0f1a18' }}
    />
  )
}
