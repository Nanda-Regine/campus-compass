// Twitter/X share card — reuses the same premium, logo-branded OG image so the
// summary_large_image card matches what shows on every other platform.
//
// Only the default rendering component is re-exported. The route *segment config*
// (runtime/size/contentType/alt) MUST be declared statically in this file: Next.js
// static-analyses these fields and does NOT follow re-exports for them, so
// `export { runtime } from './opengraph-image'` silently drops back to the Node
// runtime. In Node, @vercel/og resolves its bundled font via fileURLToPath, which
// throws ERR_INVALID_URL on paths containing spaces (e.g. OneDrive) and 500s the
// card. Declaring `runtime = 'edge'` here keeps it on the edge build like the OG route.
export { default } from './opengraph-image'

export const runtime = 'edge'
export const alt = 'VarsityOS — The super-app for South African university students'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
