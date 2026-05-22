/**
 * Generates PWA icons from public/favicon.jpg
 * Run: node scripts/generate-icons.mjs
 */
import sharp from 'sharp'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
const src = join(publicDir, 'favicon.jpg')

// Standard PWA icon — any size
async function makeIcon(size, dest) {
  await sharp(src)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .png()
    .toFile(join(publicDir, dest))
  console.log(`✓ ${dest}`)
}

// Maskable icon: logo centred in 80% safe zone on teal background (#0d9488)
// The outer 10% each side can be cropped by the OS — keep the logo inside the safe zone.
async function makeMaskable(size, dest) {
  const safeSize = Math.round(size * 0.8)   // 80% safe zone
  const pad      = Math.round(size * 0.1)   // 10% padding each side

  const logo = await sharp(src)
    .resize(safeSize, safeSize, { fit: 'contain', background: { r: 13, g: 148, b: 136, alpha: 1 } })
    .png()
    .toBuffer()

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 13, g: 148, b: 136, alpha: 1 },  // teal #0d9488
    },
  })
    .composite([{ input: logo, top: pad, left: pad }])
    .png()
    .toFile(join(publicDir, dest))
  console.log(`✓ ${dest}`)
}

console.log('Generating PWA icons from public/favicon.jpg …\n')

await makeIcon(192, 'icon-192.png')
await makeIcon(512, 'icon-512.png')
await makeMaskable(512, 'icon-maskable-512.png')
// Also create apple-touch-icon at 180×180
await makeIcon(180, 'apple-touch-icon.png')

console.log('\nAll icons generated.')
