import 'server-only'
import { scrypt, timingSafeEqual } from 'node:crypto'

// Het wachtwoord zelf wordt nergens bewaard, alleen een scrypt-hash ervan:
// scrypt:N:r:p:zout:hash (zout en hash in base64url)
export async function verifyPassword(password: string, stored: string) {
  let parts = stored.split(':')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false
  let [, n, r, p, saltText, hashText] = parts
  let N = Number(n)
  let R = Number(r)
  let P = Number(p)
  let salt = Buffer.from(saltText, 'base64url')
  let expected = Buffer.from(hashText, 'base64url')
  if (!N || !R || !P || salt.length < 16 || expected.length < 32) return false
  if (!password || password.length > 1024) return false

  let derived = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password.normalize('NFKC'), salt, expected.length, { N, r: R, p: P, maxmem: 256 * 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(key)
    )
  })
  return timingSafeEqual(derived, expected)
}
