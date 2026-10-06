import type { CSSProperties } from 'react'
import { SITE, mastParts } from 'app/site'
import { weekStyle, type Post } from 'app/blog/utils'

const vars = (v: Record<string, string | number>) => v as CSSProperties

export const YEAR = new Date().getFullYear()

// ---------- kleine bouwstenen ----------

export function Arrow({ dir = 'right' }: { dir?: 'right' | 'left' | 'down' }) {
  let rotate = { right: 0, down: 90, left: 180 }[dir]
  return (
    <svg className="arrow" viewBox="0 0 20 20" aria-hidden="true" style={{ transform: `rotate(${rotate}deg)` }}>
      <path d="M3 10h13M11 4.5 16.5 10 11 15.5" />
    </svg>
  )
}

// Elke letter apart, zodat de naam kan uitrekken. Schermlezers lezen het hele woord.
export function Letters({ text }: { text: string }) {
  return (
    <>
      {text.split('').map((ch, i) => (
        <span className="l" style={vars({ '--i': i })} key={i} aria-hidden="true">
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </>
  )
}

// De naam van de site, altijd even breed (de letters rekken mee).
export function Mast({ className }: { className: string }) {
  let { small, big } = mastParts()
  return (
    <span className={className}>
      {small && <span className="mast-small">{small}</span>}
      <span className="mast-big">{big}</span>
    </span>
  )
}

// ---------- de cover van een week: alleen "Week" en het nummer ----------

export function Cover({ week, slug }: { week: number; slug?: string }) {
  let n = String(week)
  return (
    <div className="cv" style={{ ...weekStyle(week), ...vars({ '--nd': Math.min(n.length, 3) }) }} data-cover={slug || ''}>
      <div className="cv-in" aria-label={`Week ${week}`}>
        <span className="cv-week" aria-hidden="true">
          Week
        </span>
        <span className="cv-num" aria-hidden="true">
          {n}
        </span>
      </div>
      <span className="cv-grain" aria-hidden="true" />
      <span className="cv-gloss" aria-hidden="true" />
      <span className="cv-spine" aria-hidden="true" />
    </div>
  )
}

export function PostCover({ post }: { post: Post }) {
  return <Cover week={post.metadata.week} slug={post.slug} />
}

// ---------- colofon onderaan elke pagina ----------

export function Colofon() {
  return (
    <footer className="colo">
      <p className="colo-mast" aria-hidden="true">
        <Mast className="colo-name" />
      </p>
      <dl className="colo-list">
        <div>
          <dt>Blogger</dt>
          <dd>{SITE.author}</dd>
        </div>
        <div>
          <dt>Stage</dt>
          <dd>
            {SITE.company}, {SITE.place}
          </dd>
        </div>
        <div>
          <dt>Opleiding</dt>
          <dd>{SITE.school}</dd>
        </div>
        <div>
          <dt>Verschijnt</dt>
          <dd>Elke week een nieuwe blog</dd>
        </div>
      </dl>
      <p className="colo-small">
        <span>© {YEAR}</span>
      </p>
    </footer>
  )
}
