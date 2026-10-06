// Stelt het beheer in: kies een wachtwoord en koppel je authenticator-app.
// Gebruik: pnpm admin-setup
//
// Het script maakt drie geheime waarden en zet ze in .env.local (voor lokaal gebruik).
// Dezelfde drie waarden zet je daarna in Vercel (Settings > Environment Variables).

import { randomBytes, scrypt } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import QRCode from 'qrcode'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32(bytes) {
  let bits = 0
  let value = 0
  let out = ''
  for (let byte of bytes) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31]
  return out
}

// Vraag iets zonder dat je typt op het scherm verschijnt
function askHidden(question) {
  return new Promise((resolve) => {
    let rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    let muted = false
    rl._writeToOutput = (text) => {
      if (!muted) rl.output.write(text)
    }
    rl.question(question, (answer) => {
      rl.output.write('\n')
      rl.close()
      resolve(answer)
    })
    muted = true
  })
}

async function choosePassword() {
  if (process.env.STAGEBLOG_ADMIN_PASSWORD) return process.env.STAGEBLOG_ADMIN_PASSWORD
  for (;;) {
    let first = await askHidden('Kies een wachtwoord (minstens 12 tekens): ')
    if (first.length < 12) {
      console.log('Te kort. Gebruik minstens 12 tekens, bijvoorbeeld een zin van een paar woorden.\n')
      continue
    }
    let second = await askHidden('Typ het wachtwoord nog eens: ')
    if (first !== second) {
      console.log('De twee wachtwoorden zijn niet hetzelfde. Probeer opnieuw.\n')
      continue
    }
    return first
  }
}

let password = await choosePassword()
if (password.length < 12) {
  console.error('Het wachtwoord moet minstens 12 tekens hebben.')
  process.exit(1)
}

let N = 32768
let r = 8
let p = 1
let salt = randomBytes(16)
let hash = await new Promise((resolve, reject) =>
  scrypt(password.normalize('NFKC'), salt, 64, { N, r, p, maxmem: 256 * 1024 * 1024 }, (err, key) =>
    err ? reject(err) : resolve(key)
  )
)

let values = {
  ADMIN_PASSWORD_HASH: ['scrypt', N, r, p, salt.toString('base64url'), hash.toString('base64url')].join(':'),
  ADMIN_TOTP_SECRET: base32(randomBytes(20)),
  ADMIN_SESSION_SECRET: randomBytes(32).toString('base64url'),
}

// .env.local bijwerken (andere regels blijven staan)
let file = '.env.local'
let lines = existsSync(file) ? readFileSync(file, 'utf8').split(/\r?\n/) : []
lines = lines.filter((line) => line && !Object.keys(values).some((key) => line.startsWith(key + '=')))
for (let [key, value] of Object.entries(values)) lines.push(`${key}=${value}`)
writeFileSync(file, lines.join('\n') + '\n')

let otpauth = `otpauth://totp/${encodeURIComponent('Stageblog:beheer')}?secret=${values.ADMIN_TOTP_SECRET}&issuer=Stageblog&algorithm=SHA1&digits=6&period=30`

console.log('\n1. Scan deze QR-code met je authenticator-app (Microsoft Authenticator, Google Authenticator, ...):\n')
console.log(await QRCode.toString(otpauth, { type: 'terminal', small: true }))
console.log('   Lukt scannen niet? Kies in je app "sleutel invoeren" en typ deze code:')
console.log('   ' + values.ADMIN_TOTP_SECRET.replace(/(.{4})/g, '$1 ').trim() + '\n')
console.log('2. Deze drie regels staan nu in .env.local. Zet ze ook in Vercel (Settings > Environment Variables):\n')
for (let [key, value] of Object.entries(values)) console.log(`${key}=${value}`)
console.log('\nBewaar deze waarden geheim. Verander je ze, dan moet je in Vercel opnieuw deployen.')
