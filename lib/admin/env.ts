import 'server-only'

// Alle geheime instellingen komen uit omgevingsvariabelen (Vercel > Settings > Environment Variables,
// of lokaal uit .env.local). Ze komen nooit in de browser terecht.

export function adminConfig() {
  let passwordHash = process.env.ADMIN_PASSWORD_HASH || ''
  let totpSecret = (process.env.ADMIN_TOTP_SECRET || '').replace(/\s/g, '').toUpperCase()
  let sessionSecret = process.env.ADMIN_SESSION_SECRET || ''
  return {
    passwordHash,
    totpSecret,
    sessionSecret,
    // zonder alle drie (en een lange sessiesleutel) kan niemand inloggen
    ready: passwordHash.startsWith('scrypt:') && totpSecret.length >= 16 && sessionSecret.length >= 32,
  }
}

export function githubConfig() {
  let token = process.env.GITHUB_TOKEN || ''
  let repo = (process.env.GITHUB_REPO || '').trim()
  let branch = (process.env.GITHUB_BRANCH || 'main').trim()
  let api = (process.env.GITHUB_API_URL || 'https://api.github.com').replace(/\/+$/, '')
  return {
    token,
    repo,
    branch,
    api,
    ready: Boolean(token) && /^[\w.-]+\/[\w.-]+$/.test(repo) && /^[\w./-]+$/.test(branch),
  }
}
