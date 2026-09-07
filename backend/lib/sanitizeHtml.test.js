import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeChatHtml, isAllowedStickerSrc } from './sanitizeHtml.js'

describe('sanitizeChatHtml', () => {
  it('strips scripts and event handlers', () => {
    const out = sanitizeChatHtml('<p onclick="alert(1)">hi<script>x()</script></p>')
    assert.equal(out.includes('script'), false)
    assert.equal(out.includes('onclick'), false)
    assert.match(out, /<p>hi/)
  })

  it('rejects data and remote sticker urls', () => {
    const evil = '<img class="chat-sticker" data-sticker-id="1" src="data:image/svg+xml,<svg>" alt="" />'
    assert.equal(sanitizeChatHtml(evil), '')
    const remote = '<img class="chat-sticker" data-sticker-id="1" src="https://evil.example/x.png" alt="" />'
    assert.equal(sanitizeChatHtml(remote), '')
  })

  it('keeps same-origin shop stickers', () => {
    const html =
      '<p><img class="chat-sticker" data-sticker-id="12" src="/uploads/shop/item-12-1.webp" alt="" /></p>'
    const out = sanitizeChatHtml(html)
    assert.match(out, /chat-sticker/)
    assert.match(out, /\/uploads\/shop\/item-12-1\.webp/)
  })
})

describe('isAllowedStickerSrc', () => {
  it('blocks path traversal', () => {
    assert.equal(isAllowedStickerSrc('/uploads/shop/../secret'), false)
  })
})
