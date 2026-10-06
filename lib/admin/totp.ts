import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

// De 6-cijferige code uit je authenticator-app (TOTP, RFC 6238).
// Een code is 30 seconden geldig; we aanvaarden ook de vorige en de volgende,
// voor als de klok van je gsm een beetje afwijkt.

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32Decode(text: string) {
  let bits = 0
  let value = 0
  let out: number[] = []
  for (let ch of text.replace(/=+$/, '')) {
    let index = ALPHABET.indexOf(ch)
    if (index < 0) throw new Error('ongeldige TOTP-sleutel')
    value = (value << 5) | index
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(out)
}

function codeFor(key: Buffer, counter: number) {
  let msg = Buffer.alloc(8)
  msg.writeBigUInt64BE(BigInt(counter))
  let h = createHmac('sha1', key).update(msg).digest()
  let offset = h[h.length - 1] & 0x0f
  let number =
    (((h[offset] & 0x7f) << 24) | (h[offset + 1] << 16) | (h[offset + 2] << 8) | h[offset + 3]) % 1_000_000
  return String(number).padStart(6, '0')
}

export function verifyTotp(code: string, secret: string, now = Date.now()) {
  let given = String(code || '').replace(/\s/g, '')
  if (!/^\d{6}$/.test(given) || !secret) return false
  let key: Buffer
  try {
    key = base32Decode(secret)
  } catch {
    return false
  }
  let counter = Math.floor(now / 1000 / 30)
  let ok = false
  for (let step of [-1, 0, 1]) {
    // altijd alle drie vergelijken, zodat de tijd niets verraadt
    if (timingSafeEqual(Buffer.from(codeFor(key, counter + step)), Buffer.from(given))) ok = true
  }
  return ok
}
