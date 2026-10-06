import 'server-only'
import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { githubConfig } from './env'
import { fromMdx, isPostSlug } from './format'

// Waar de blogs bewaard worden:
// - online (Vercel): in je GitHub-repo. Elke wijziging is een commit; Vercel bouwt de site dan
//   vanzelf opnieuw en na ongeveer een minuut staat het online.
// - lokaal (pnpm dev) zonder GitHub-instellingen: rechtstreeks in app/blog/posts.

const DIR = 'app/blog/posts'

export type StoredPost = {
  slug: string
  week: number
  title: string
  date: string
  text: string
  sha: string
}

export type Store = {
  kind: 'github' | 'lokaal'
  label: string
  list(): Promise<StoredPost[]>
  get(slug: string): Promise<StoredPost | null>
  save(slug: string, content: string, sha: string | null, message: string): Promise<void>
  remove(slug: string, sha: string, message: string): Promise<void>
}

export class StoreError extends Error {}

function toPost(slug: string, raw: string, sha: string): StoredPost {
  let data = fromMdx(raw)
  let week = data.week || parseInt(slug.replace(/\D/g, ''), 10)
  return { slug, sha, week, title: data.title || `Week ${week} bij Nexu`, date: data.date, text: data.text }
}

function sortPosts(posts: StoredPost[]) {
  return posts.sort((a, b) => a.week - b.week)
}

// ---------- GitHub ----------

function githubStore(): Store {
  let { token, repo, branch, api } = githubConfig()

  async function call(url: string, init: RequestInit = {}) {
    let res: Response
    try {
      res = await fetch(`${api}/repos/${repo}${url}`, {
        ...init,
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'stageblog-beheer',
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        },
      })
    } catch {
      throw new StoreError('GitHub is niet bereikbaar. Probeer het zo meteen opnieuw.')
    }
    if (res.status === 401 || res.status === 403) {
      throw new StoreError('GitHub weigert de toegang. Controleer GITHUB_TOKEN (rechten: Contents, read and write).')
    }
    return res
  }

  async function readFile(slug: string) {
    let res = await call(`/contents/${DIR}/${slug}.mdx?ref=${encodeURIComponent(branch)}`)
    if (res.status === 404) return null
    if (!res.ok) throw new StoreError(`GitHub gaf een fout (${res.status}) bij het lezen van ${slug}.`)
    let file = await res.json()
    return toPost(slug, Buffer.from(file.content || '', 'base64').toString('utf8'), file.sha)
  }

  return {
    kind: 'github',
    label: `GitHub: ${repo} (${branch})`,

    async list() {
      let res = await call(`/contents/${DIR}?ref=${encodeURIComponent(branch)}`)
      if (res.status === 404) throw new StoreError('De map met blogs is niet gevonden. Controleer GITHUB_REPO en GITHUB_BRANCH.')
      if (!res.ok) throw new StoreError(`GitHub gaf een fout (${res.status}) bij het ophalen van de blogs.`)
      let files: { name: string; type: string }[] = await res.json()
      let slugs = files
        .filter((f) => f.type === 'file' && /^week-\d{1,2}\.mdx$/.test(f.name))
        .map((f) => f.name.replace(/\.mdx$/, ''))
      let posts = await Promise.all(slugs.map(readFile))
      return sortPosts(posts.filter((p): p is StoredPost => Boolean(p)))
    },

    get: readFile,

    async save(slug, content, sha, message) {
      let res = await call(`/contents/${DIR}/${slug}.mdx`, {
        method: 'PUT',
        body: JSON.stringify({
          message,
          branch,
          content: Buffer.from(content, 'utf8').toString('base64'),
          ...(sha ? { sha } : {}),
        }),
      })
      if (res.status === 409 || res.status === 422) {
        throw new StoreError('Deze week is intussen ergens anders aangepast. Ga terug en open hem opnieuw.')
      }
      if (!res.ok) throw new StoreError(`GitHub gaf een fout (${res.status}) bij het opslaan.`)
    },

    async remove(slug, sha, message) {
      let res = await call(`/contents/${DIR}/${slug}.mdx`, {
        method: 'DELETE',
        body: JSON.stringify({ message, branch, sha }),
      })
      if (res.status === 404) return
      if (res.status === 409 || res.status === 422) {
        throw new StoreError('Deze week is intussen ergens anders aangepast. Laad de pagina opnieuw.')
      }
      if (!res.ok) throw new StoreError(`GitHub gaf een fout (${res.status}) bij het verwijderen.`)
    },
  }
}

// ---------- lokaal (alleen tijdens pnpm dev) ----------

function localStore(): Store {
  let dir = path.join(process.cwd(), DIR)
  let hash = (text: string) => createHash('sha1').update(text).digest('hex')
  let file = (slug: string) => path.join(dir, `${slug}.mdx`)

  async function readFile(slug: string) {
    if (!isPostSlug(slug)) return null
    try {
      let raw = await fs.readFile(file(slug), 'utf8')
      return toPost(slug, raw, hash(raw))
    } catch {
      return null
    }
  }

  return {
    kind: 'lokaal',
    label: 'Lokaal: app/blog/posts',

    async list() {
      let names = await fs.readdir(dir)
      let slugs = names.filter((n) => /^week-\d{1,2}\.mdx$/.test(n)).map((n) => n.replace(/\.mdx$/, ''))
      let posts = await Promise.all(slugs.map(readFile))
      return sortPosts(posts.filter((p): p is StoredPost => Boolean(p)))
    },

    get: readFile,

    async save(slug, content, sha) {
      let current = await readFile(slug)
      if (sha === null && current) throw new StoreError('Deze week bestaat al.')
      if (sha !== null && current && current.sha !== sha) {
        throw new StoreError('Deze week is intussen ergens anders aangepast. Ga terug en open hem opnieuw.')
      }
      await fs.writeFile(file(slug), content, 'utf8')
    },

    async remove(slug, sha) {
      let current = await readFile(slug)
      if (!current) return
      if (current.sha !== sha) throw new StoreError('Deze week is intussen ergens anders aangepast. Laad de pagina opnieuw.')
      await fs.unlink(file(slug))
    },
  }
}

export function getStore(): Store | null {
  if (githubConfig().ready) return githubStore()
  if (process.env.NODE_ENV !== 'production') return localStore()
  return null
}
