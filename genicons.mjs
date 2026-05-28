import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'

const svg = readFileSync('app/icon.svg')
const sizes = [16, 32, 48]
const pngs = await Promise.all(
  sizes.map((s) => sharp(svg, { density: 384 }).resize(s, s).png().toBuffer())
)
const count = pngs.length
const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(count, 4)
const entries = Buffer.alloc(16 * count)
let offset = 6 + 16 * count
pngs.forEach((png, i) => {
  const s = sizes[i]
  const e = entries.subarray(i * 16, i * 16 + 16)
  e.writeUInt8(s, 0); e.writeUInt8(s, 1); e.writeUInt8(0, 2); e.writeUInt8(0, 3)
  e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6)
  e.writeUInt32LE(png.length, 8); e.writeUInt32LE(offset, 12)
  offset += png.length
})
writeFileSync('app/favicon.ico', Buffer.concat([header, entries, ...pngs]))

const mark = await sharp(svg, { density: 768 }).resize(140, 140).png().toBuffer()
await sharp({ create: { width: 180, height: 180, channels: 4, background: '#0B1020' } })
  .composite([{ input: mark, gravity: 'center' }])
  .png()
  .toFile('app/apple-icon.png')

console.log('wrote favicon.ico (' + sizes.join('/') + ') + apple-icon.png')
