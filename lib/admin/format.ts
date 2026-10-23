// Zet de tekst uit het beheer om naar een blogbestand (MDX) en terug.
// In het beheer schrijf je gewone tekst:
// - een lege regel (of een nieuwe regel) is een nieuwe alinea
// - een regel die begint met "- " of "• " is een punt in een opsomming
// Tekens die in MDX iets betekenen ({ } < > * _ ...) worden onschadelijk gemaakt,
// zodat een blog de site nooit kan breken.

export type PostInput = { week: number; title: string; date: string; tags: string[]; text: string }

const PUNCT = /[\\`*_{}[\]<>#|~&!]/g

function escapeInline(text: string) {
  return text.replace(PUNCT, (ch) => '\\' + ch)
}

// Tekens die alleen aan het begin van een regel iets betekenen
function escapeLineStart(line: string) {
  if (/^(import|export)\b/i.test(line)) return `&#${line.charCodeAt(0)};` + line.slice(1)
  if (/^\d+[.)](\s|$)/.test(line)) return line.replace(/^(\d+)([.)])/, '$1\\$2')
  if (/^[-+=]/.test(line)) return '\\' + line
  return line
}

function unescapeText(text: string) {
  // in één keer, zodat "\&#105;" (letterlijk getypt) niet per ongeluk een letter wordt
  return text.replace(/\\([!-/:-@[-`{-~])|&#(\d+);/g, (_, ch, code) => ch ?? String.fromCharCode(Number(code)))
}

export function textToBody(text: string) {
  let lines = text.replace(/\r\n?/g, '\n').split('\n')
  let blocks: string[] = []
  let list: string[] = []
  let flush = () => {
    if (list.length) blocks.push(list.join('\n'))
    list = []
  }
  for (let raw of lines) {
    let line = raw.trim()
    if (!line) {
      flush()
      continue
    }
    let item = line.match(/^[-•*]\s+(.+)$/)
    if (item) {
      list.push('- ' + escapeInline(item[1].trim()))
      continue
    }
    flush()
    blocks.push(escapeLineStart(escapeInline(line)))
  }
  flush()
  return blocks.join('\n\n')
}

export function bodyToText(body: string) {
  return body
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      let lines = block.split('\n').map((l) => l.trim())
      if (lines.every((l) => /^-\s+/.test(l))) {
        return lines.map((l) => '- ' + unescapeText(l.replace(/^-\s+/, ''))).join('\n')
      }
      return unescapeText(lines.join(' '))
    })
    .join('\n\n')
}

function quote(value: string) {
  return `'${value.replace(/[\r\n]+/g, ' ')}'`
}

export function toMdx(post: PostInput) {
  let head = ['---', `title: ${quote(post.title)}`, `week: ${post.week}`]
  if (post.date) head.push(`publishedAt: ${quote(post.date)}`)
  if (post.tags.length) head.push(`tags: ${quote(post.tags.join(', '))}`)
  head.push('---', '')
  return head.join('\n') + '\n' + textToBody(post.text) + '\n'
}

export function fromMdx(raw: string) {
  let match = /^---\s*([\s\S]*?)\s*---\s*/.exec(raw)
  let meta: Record<string, string> = {}
  let body = raw
  if (match) {
    body = raw.slice(match[0].length)
    for (let line of match[1].split('\n')) {
      let [key, ...rest] = line.split(': ')
      if (!key.trim()) continue
      meta[key.trim()] = rest.join(': ').trim().replace(/^['"](.*)['"]$/, '$1')
    }
  }
  return {
    week: parseInt(meta.week || '0', 10) || 0,
    title: meta.title || '',
    date: meta.publishedAt || '',
    tags: meta.tags || '',
    text: bodyToText(body),
  }
}

// Controle van wat je invult in het beheer
export function validatePost(values: Record<string, unknown>): { post: PostInput } | { error: string } {
  let week = Number(String(values.week ?? '').trim())
  if (!Number.isInteger(week) || week < 1 || week > 99) return { error: 'Kies een weeknummer tussen 1 en 99.' }

  let title = String(values.title ?? '').replace(/[\r\n]+/g, ' ').trim() || `Week ${week} bij Nexu`
  if (title.length > 120) return { error: 'De titel is te lang (maximaal 120 tekens).' }

  let date = String(values.date ?? '').trim()
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date)))) {
    return { error: 'De datum klopt niet. Gebruik de datumkiezer of laat het veld leeg.' }
  }

  let tags = String(values.tags ?? '')
    .split(',')
    .map((tag) => tag.replace(/\s+/g, ' ').trim())
    .filter((tag, i, all) => tag && all.findIndex((t) => t.toLowerCase() === tag.toLowerCase()) === i)
  if (tags.length > 6) return { error: 'Kies hoogstens 6 tags.' }
  if (tags.some((tag) => tag.length > 30)) return { error: 'Een tag mag hoogstens 30 tekens lang zijn.' }
  if (tags.some((tag) => !/^[\p{L}\p{N}][\p{L}\p{N} &+.-]*$/u.test(tag))) {
    return { error: 'Een tag mag alleen letters, cijfers, spaties en - + & . bevatten.' }
  }

  let text = String(values.text ?? '').replace(/\r\n?/g, '\n').trim()
  if (!text) return { error: 'De tekst is leeg.' }
  if (text.length > 20000) return { error: 'De tekst is te lang (maximaal 20.000 tekens).' }

  return { post: { week, title, date, tags, text } }
}

// Alle tags die al gebruikt worden, als voorstel in het beheer
export function usedTags(posts: { tags: string }[]) {
  let seen = new Map<string, string>()
  for (let post of posts) {
    for (let tag of post.tags.split(',')) {
      let name = tag.trim()
      if (name && !seen.has(name.toLowerCase())) seen.set(name.toLowerCase(), name)
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b, 'nl'))
}

export function isPostSlug(slug: string) {
  return /^week-\d{1,2}$/.test(slug)
}
