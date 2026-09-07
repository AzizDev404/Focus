import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { sniffImageMime } from './imageSniff.js'

describe('sniffImageMime', () => {
  it('detects jpeg / png / webp', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0])
    assert.equal(sniffImageMime(jpeg), 'image/jpeg')
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])
    assert.equal(sniffImageMime(png), 'image/png')
    const webp = Buffer.concat([
      Buffer.from('RIFF'),
      Buffer.alloc(4),
      Buffer.from('WEBP'),
    ])
    assert.equal(sniffImageMime(webp), 'image/webp')
  })

  it('rejects html disguised as an image', () => {
    const html = Buffer.from('<html><script>alert(1)</script></html>')
    assert.equal(sniffImageMime(html), null)
  })
})
