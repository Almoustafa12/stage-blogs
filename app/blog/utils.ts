import fs from 'fs'
import path from 'path'
import type { CSSProperties } from 'react'

type Metadata = {
  title: string
  week: number
  publishedAt?: string
  summary: string
  excerpt: string
  readingMinutes: number
  image?: string
}

export type Post = {
  metadata: Metadata
  slug: string
  content: string
  // eerste alinea (komt groot onder de titel) en de rest van de tekst
  lead: string
  body: string
  // de tussenkopjes (## ...), voor "In dit artikel"
  headings: { id: string; text: string }[]
}

// Elke week (elk nummer) krijgt een eigen kleur. Na week 8 begint de reeks opnieuw.
// bg = cover, ink = tekst op de cover, light/dark = accentkleur op een lichte/donkere pagina.
const PALETTE = [
  { name: 'apotheekgroen', bg: '#0B5D3F', ink: '#EEF7F1', light: '#0B6B47', dark: '#72D3A3' },
  { name: 'kobalt', bg: '#1D3CA6', ink: '#EEF1FF', light: '#1D3CA6', dark: '#A3B4FF' },
  { name: 'oker', bg: '#C98A12', ink: '#1E1503', light: '#9A6408', dark: '#F0BC4F' },
  { name: 'kers', bg: '#9C1C3A', ink: '#FFF0F3', light: '#9C1C3A', dark: '#FF97AE' },
  { name: 'pruim', bg: '#5E2B6E', ink: '#F8EEFB', light: '#6E3381', dark: '#DCA8EC' },
  { name: 'munt', bg: '#B9D9C7', ink: '#0D3324', light: '#1F7A55', dark: '#A3DFC0' },
  { name: 'olijf', bg: '#4F5D16', ink: '#F3F6E4', light: '#55641A', dark: '#C6D47E' },
  { name: 'inkt', bg: '#23264F', ink: '#ECEEFF', light: '#2E3370', dark: '#AEB3F2' },
]

export function weekColor(week: number) {
  let index = (Math.max(week, 1) - 1) % PALETTE.length
  return PALETTE[index]
}

// CSS-variabelen voor alles wat de kleur van een week gebruikt.
export function weekStyle(week: number): CSSProperties {
  let c = weekColor(week)
  return {
    '--c': c.bg,
    '--c-ink': c.ink,
    '--c-light': c.light,
    '--c-dark': c.dark,
  } as CSSProperties
}

// 1 -> "01"
export function pad2(n: number) {
  return String(n).padStart(2, '0')
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' en ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// De bovenkant van een blog (tussen de twee ---) is optioneel.
// Zonder die bovenkant komt het weeknummer uit de bestandsnaam (week-3.mdx = week 3).
function parseFrontmatter(fileContent: string) {
  let frontmatterRegex = /^---\s*([\s\S]*?)\s*---/
  let match = frontmatterRegex.exec(fileContent)
  let metadata: Record<string, string> = {}
  if (!match) {
    return { metadata, content: fileContent.trim() }
  }
  let content = fileContent.replace(frontmatterRegex, '').trim()
  match[1]
    .trim()
    .split('\n')
    .forEach((line) => {
      let [key, ...valueArr] = line.split(': ')
      if (!key.trim()) return
      let value = valueArr.join(': ').trim()
      value = value.replace(/^['"](.*)['"]$/, '$1') // aanhalingstekens weg
      metadata[key.trim()] = value
    })
  return { metadata, content }
}

// Gewone tekst zonder opmaaktekens, per alinea.
function plainParagraphs(content: string) {
  return content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block && !/^([-*>#<]|\d+\.\s)/.test(block))
    .map((block) =>
      block
        // eerst opmaaktekens weg (**vet**, _schuin_), dan tekens die als gewone tekst bedoeld zijn terugzetten
        .replace(/(?<!\\)[*_`]/g, '')
        .replace(/\\([!-/:-@[-`{-~])|&#(\d+);/g, (_, ch, code) => ch ?? String.fromCharCode(Number(code)))
        .replace(/\s+/g, ' ')
        .trim()
    )
}

// Korte samenvatting uit de eerste alinea, voor zoekmachines en RSS.
function summaryFrom(content: string) {
  let text = plainParagraphs(content)[0] || ''
  return text.length > 160 ? text.slice(0, 157).replace(/\s+\S*$/, '') + '…' : text
}

// Wat langere inleiding voor de inhoudstafel: hele zinnen, tot ongeveer 100 tekens.
function excerptFrom(content: string) {
  let sentences = plainParagraphs(content).join(' ').match(/[^.!?]+[.!?]+/g) || []
  let excerpt = ''
  for (let sentence of sentences) {
    let next = (excerpt + ' ' + sentence.trim()).trim()
    if (excerpt && next.length > 220) break
    excerpt = next
    if (excerpt.length >= 100) break
  }
  return excerpt
}

function readingMinutesOf(content: string) {
  let words = content
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

// De eerste gewone alinea wordt de inleiding (groot onder de titel).
function splitLead(content: string) {
  let blocks = content.split(/\n\s*\n/)
  let first = (blocks[0] || '').trim()
  if (first && !/^([-*>#<|]|\d+\.\s)/.test(first)) {
    return { lead: first, body: blocks.slice(1).join('\n\n').trim() }
  }
  return { lead: '', body: content }
}

function headingsOf(content: string) {
  return Array.from(content.matchAll(/^##\s+(.+)$/gm)).map((m) => {
    let text = m[1].replace(/[*_`]/g, '').trim()
    return { id: slugify(text), text }
  })
}

function getMDXFiles(dir: string) {
  return fs.readdirSync(dir).filter((file) => path.extname(file) === '.mdx')
}

function readPost(dir: string, file: string): Post {
  let raw = fs.readFileSync(path.join(dir, file), 'utf-8')
  let { metadata, content } = parseFrontmatter(raw)
  let slug = path.basename(file, path.extname(file))
  let week = parseInt(metadata.week || (slug.match(/\d+/) || ['0'])[0], 10)
  return {
    slug,
    content,
    ...splitLead(content),
    headings: headingsOf(content),
    metadata: {
      title: metadata.title || `Week ${week} bij Nexu`,
      week,
      publishedAt: metadata.publishedAt || undefined,
      summary: metadata.summary || summaryFrom(content),
      excerpt: metadata.summary || excerptFrom(content),
      readingMinutes: readingMinutesOf(content),
      image: metadata.image || undefined,
    },
  }
}

// Alle blogs, in volgorde: week 1 eerst.
export function getBlogPosts(): Post[] {
  let dir = path.join(process.cwd(), 'app', 'blog', 'posts')
  return getMDXFiles(dir)
    .map((file) => readPost(dir, file))
    .sort((a, b) => a.metadata.week - b.metadata.week || a.slug.localeCompare(b.slug))
}

export function formatDate(date: string) {
  if (!date.includes('T')) {
    date = `${date}T00:00:00`
  }
  return new Date(date).toLocaleDateString('nl-BE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// "Week 2 · 9 oktober 2026 · 2 min lezen"
export function metaLine(post: Post, withWeek = true) {
  let parts = withWeek ? [`Week ${post.metadata.week}`] : []
  if (post.metadata.publishedAt) parts.push(formatDate(post.metadata.publishedAt))
  parts.push(`${post.metadata.readingMinutes} min lezen`)
  return parts.join(' · ')
}
