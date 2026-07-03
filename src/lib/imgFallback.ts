import type { SyntheticEvent } from 'react'

// Hide a broken/unreachable <img> (offline, or a 404'd Supabase-storage URL) so the
// browser's broken-image glyph never shows next to avatars/listings on prepaid/offline.
// Where an emoji/initials placeholder sits behind the image, this reveals it.
export function hideBrokenImg(e: SyntheticEvent<HTMLImageElement>): void {
  const el = e.currentTarget
  el.onerror = null
  el.style.display = 'none'
}
