// ============================================================
// Shared Mapbox helpers for VarsityOS map features.
//
// Client-side utilities that talk to the Mapbox REST API with the
// public token. Centralised here so every map feature (Movement,
// Safety, Social presence, Marketplace) shares one geocoder, one
// cache, and one set of styles instead of re-implementing them.
//
// Data-cost note: geocoding results are cached in localStorage so a
// student on prepaid data only pays for each place lookup once.
// ============================================================

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''
export const MAP_STYLE_DARK = 'mapbox://styles/mapbox/dark-v11'

export type LngLat = [number, number]

// Sensible defaults — most SA campuses sit within ~500 km of Joburg.
export const JOBURG: LngLat = [28.0473, -26.2041]

// ── Geocoding cache (memory + localStorage) ──────────────────
const GEOCODE_CACHE_KEY = 'vos_geocode_cache_v1'
const mem = new Map<string, LngLat | null>()

function normKey(address: string): string {
  return address.trim().toLowerCase().replace(/\s+/g, ' ')
}

function loadDisk(): Record<string, LngLat | null> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(GEOCODE_CACHE_KEY) ?? '{}') } catch { return {} }
}

function persist(key: string, value: LngLat | null) {
  if (typeof window === 'undefined') return
  try {
    const disk = loadDisk()
    disk[key] = value
    // Cap the cache so it never balloons on shared/low-storage devices.
    const keys = Object.keys(disk)
    if (keys.length > 300) delete disk[keys[0]]
    localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(disk))
  } catch { /* storage full / disabled — non-critical */ }
}

/**
 * Forward-geocode a free-text SA place to [lng, lat]. Returns null if
 * nothing matched. Results (including misses) are cached so repeated
 * lookups cost no data. If the text already contains embedded
 * coordinates like "(-26.19,28.03)", those are used directly.
 */
export async function geocodeZA(address: string, token: string = MAPBOX_TOKEN): Promise<LngLat | null> {
  if (!address || !token) return null

  const embedded = extractCoords(address)
  if (embedded) return embedded

  const key = normKey(address)
  if (mem.has(key)) return mem.get(key) ?? null
  const disk = loadDisk()
  if (key in disk) { mem.set(key, disk[key]); return disk[key] }

  try {
    const q = /south africa/i.test(address) ? address : `${address}, South Africa`
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json` +
      `?access_token=${token}&country=ZA&limit=1&types=address,place,poi,district,region,locality,neighborhood`
    )
    const d = await res.json() as { features?: { center: LngLat }[] }
    const c = d.features?.[0]?.center ?? null
    const result: LngLat | null = c ? [c[0], c[1]] : null
    mem.set(key, result)
    persist(key, result)
    return result
  } catch {
    return null
  }
}

/**
 * Pull trailing embedded coordinates out of a string, e.g.
 * "Main gate (-26.1907, 28.0305)" → [28.0305, -26.1907].
 * VarsityOS's incident-report API appends "(lat,lng)" to
 * location_description, so this recovers real GPS for free.
 */
export function extractCoords(text: string): LngLat | null {
  const m = text.match(/\(?\s*(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})\s*\)?/)
  if (!m) return null
  const a = parseFloat(m[1]); const b = parseFloat(m[2])
  if (!isFinite(a) || !isFinite(b)) return null
  // SA latitudes are roughly -22..-35, longitudes +16..+33. The report
  // API writes "(lat,lng)"; detect order and normalise to [lng, lat].
  if (a < 0 && a > -40 && b > 0 && b < 40) return [b, a]      // (lat, lng)
  if (b < 0 && b > -40 && a > 0 && a < 40) return [a, b]      // (lng, lat)
  return null
}

export type RouteProfile = 'driving' | 'walking' | 'cycling'

export interface RouteResult {
  geometry: { type: 'LineString'; coordinates: LngLat[] }
  duration: number  // seconds
  distance: number  // metres
}

/** Fetch a road/path route between two points. Null on failure. */
export async function fetchRoute(
  from: LngLat, to: LngLat, profile: RouteProfile = 'driving', token: string = MAPBOX_TOKEN,
): Promise<RouteResult | null> {
  if (!token) return null
  try {
    const coords = `${from[0]},${from[1]};${to[0]},${to[1]}`
    const res = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coords}` +
      `?geometries=geojson&overview=full&steps=false&access_token=${token}`
    )
    const d = await res.json() as { routes?: RouteResult[] }
    return d.routes?.[0] ?? null
  } catch {
    return null
  }
}

export interface Poi {
  id: string
  name: string
  address: string
  center: LngLat
}

/**
 * Find nearby places of a given kind (e.g. "police station", "hospital",
 * "pharmacy") using Mapbox forward geocoding with proximity. Used for the
 * safety "nearest safe point" overlay — no bespoke dataset required.
 */
export async function searchNearby(
  query: string, near: LngLat, token: string = MAPBOX_TOKEN, limit = 4,
): Promise<Poi[]> {
  if (!token) return []
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
      `?access_token=${token}&country=ZA&proximity=${near[0]},${near[1]}&limit=${limit}&types=poi`
    )
    const d = await res.json() as {
      features?: { id: string; text: string; place_name: string; center: LngLat }[]
    }
    return (d.features ?? []).map(f => ({
      id: f.id,
      name: f.text,
      address: f.place_name,
      center: [f.center[0], f.center[1]] as LngLat,
    }))
  } catch {
    return []
  }
}

/**
 * Build a Mapbox Static Images API URL — a single flat PNG instead of the
 * interactive GL map. Used in Data Saver mode so the map costs ~1 tile of
 * data, not a live tile stream. Overlays optional pin markers.
 */
export function staticMapUrl(opts: {
  token?: string
  width?: number
  height?: number
  center?: LngLat
  zoom?: number
  pins?: { lngLat: LngLat; color?: string }[]
}): string {
  const token = opts.token ?? MAPBOX_TOKEN
  const width = Math.min(opts.width ?? 600, 1280)
  const height = Math.min(opts.height ?? 380, 1280)
  const overlays = (opts.pins ?? [])
    .slice(0, 12)
    .map(p => `pin-s+${(p.color ?? '38bdf8').replace('#', '')}(${p.lngLat[0].toFixed(5)},${p.lngLat[1].toFixed(5)})`)
    .join(',')
  const center = opts.center ?? JOBURG
  const position = overlays ? 'auto' : `${center[0]},${center[1]},${opts.zoom ?? 11}`
  const path = overlays ? `${overlays}/${position}` : position
  return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${path}/${width}x${height}@2x?access_token=${token}&attribution=false&logo=false`
}

// Haversine distance in metres — for "X m away" labels without a round-trip.
export function distanceMeters(a: LngLat, b: LngLat): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b[1] - a[1])
  const dLng = toRad(b[0] - a[0])
  const lat1 = toRad(a[1]); const lat2 = toRad(b[1])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function fmtDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`
}

export function fmtDuration(seconds: number): string {
  const m = Math.round(seconds / 60)
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}min`
}

// ── Shared dark-theme styling for popups + controls ──────────
// Injected once per map via a <style> tag so every VarsityOS map looks
// identical (matches the design system's dark-only rule).
export const MAP_DARK_CSS = `
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
  .mapboxgl-ctrl-zoom-out .mapboxgl-ctrl-icon,
  .mapboxgl-ctrl-geolocate .mapboxgl-ctrl-icon { filter: invert(1) opacity(0.7) !important; }
  @keyframes vosPulseLoc {
    0%   { box-shadow: 0 0 0 0 rgba(56,189,248,0.6) }
    70%  { box-shadow: 0 0 0 12px rgba(56,189,248,0) }
    100% { box-shadow: 0 0 0 0 rgba(56,189,248,0) }
  }
`

/** Build the standard dark popup body used across all VarsityOS maps. */
export function popupHtml(title: string, rows: (string | null | undefined)[]): string {
  return `
    <div style="font-family:DM Sans,sans-serif;font-size:12px;color:#e2e8f0;line-height:1.6;min-width:150px">
      <strong style="font-size:13px;display:block;margin-bottom:4px;color:#f8fafc">${title}</strong>
      ${rows.filter(Boolean).map(r => `<div style="opacity:0.78;font-size:11px">${r}</div>`).join('')}
    </div>
  `
}
