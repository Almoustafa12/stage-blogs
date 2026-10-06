import 'server-only'

// Na 5 foute pogingen in 15 minuten blokkeert het inloggen voor dat IP-adres.
// Dit geheugen leeft per server; de code uit je app maakt raden sowieso onbegonnen werk.

const WINDOW = 15 * 60 * 1000
const MAX_FAILURES = 5
const failures = new Map<string, { count: number; first: number }>()

function current(key: string) {
  let entry = failures.get(key)
  if (entry && Date.now() - entry.first > WINDOW) {
    failures.delete(key)
    return undefined
  }
  return entry
}

export function isBlocked(key: string) {
  return (current(key)?.count || 0) >= MAX_FAILURES
}

export function registerFailure(key: string) {
  let entry = current(key)
  if (entry) entry.count++
  else failures.set(key, { count: 1, first: Date.now() })
  // oude pogingen opruimen zodat het geheugen niet blijft groeien
  if (failures.size > 5000) Array.from(failures.keys()).forEach(current)
}

export function clearFailures(key: string) {
  failures.delete(key)
}
