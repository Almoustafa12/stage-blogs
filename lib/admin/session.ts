import 'server-only'
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { adminConfig } from './env'

// Na het inloggen krijg je een ondertekend koekje (HMAC-SHA256).
// - HttpOnly: JavaScript in de browser kan er niet aan
// - Secure + __Host-: alleen over https en alleen voor dit domein
// - SameSite=Strict: andere sites kunnen het niet meesturen
// - 8 uur geldig; wil je iedereen uitloggen, verander dan ADMIN_SESSION_SECRET

const MAX_AGE = 8 * 60 * 60
const PROD = process.env.NODE_ENV === 'production'
const COOKIE = PROD ? '__Host-beheer' : 'beheer'

function sign(data: string, secret: string) {
  return createHmac('sha256', secret).update(data).digest('base64url')
}

function cookieOptions(maxAge: number) {
  return { httpOnly: true, secure: PROD, sameSite: 'strict' as const, path: '/', maxAge }
}

export async function createSession() {
  let { sessionSecret } = adminConfig()
  let payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + MAX_AGE, n: randomBytes(12).toString('base64url') })
  ).toString('base64url')
  let jar = await cookies()
  jar.set(COOKIE, `${payload}.${sign(payload, sessionSecret)}`, cookieOptions(MAX_AGE))
}

export async function endSession() {
  let jar = await cookies()
  jar.set(COOKIE, '', cookieOptions(0))
}

export async function readSession() {
  let { sessionSecret, ready } = adminConfig()
  if (!ready) return null
  let raw = (await cookies()).get(COOKIE)?.value
  if (!raw) return null
  let [payload, sig] = raw.split('.')
  if (!payload || !sig) return null
  let expected = Buffer.from(sign(payload, sessionSecret))
  let given = Buffer.from(sig)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
  try {
    let data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (typeof data.exp !== 'number' || data.exp < Date.now() / 1000) return null
    return data as { exp: number }
  } catch {
    return null
  }
}

// Gebruik dit bovenaan elke beheerpagina en elke actie.
export async function requireAdmin() {
  let session = await readSession()
  if (!session) redirect('/admin/login')
  return session
}
