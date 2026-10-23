import type { CSSProperties } from 'react'
import { SITE, mastParts } from 'app/site'
import { getBlogPosts, getTags } from 'app/blog/utils'
import { Arrow, Colofon, Letters, PostCover } from './magazine'
import { TagRow, TocList, TopBar } from './lists'

// De startpagina: de kiosk met alle nummers, week 1 eerst.
export function Kiosk() {
  let posts = getBlogPosts()
  let { small, big } = mastParts()

  return (
    <div id="pg" className="pg pg--kiosk" data-page="kiosk">
      <header className="mh" data-mh="">
        <TopBar home />
        <h1 className="mh-title">
          <span className="sr">{SITE.name}</span>
          {small && (
            <span className="mh-small" aria-hidden="true">
              {small}
            </span>
          )}
          <span className="mh-big" aria-hidden="true" data-elastic="">
            <Letters text={big} />
          </span>
        </h1>
      </header>

      <section className="intro" aria-label="Over deze blog">
        <p className="intro-t">
          {SITE.intro}
          <br />
          <a className="intro-more" href="/over">
          → Meer over mij 
          </a>
        </p>
      </section>

      <section className="rack" id="weken" aria-labelledby="rack-h">
        <div className="rack-head">
          <h2 id="rack-h" className="sec-h">
           Alle weken
          </h2>
          <div className="rack-btns">
            <button type="button" className="rack-btn" data-rack-prev="" aria-label="Vorig nummer">
              <Arrow dir="left" />
            </button>
            <button type="button" className="rack-btn" data-rack-next="" aria-label="Volgend nummer">
              <Arrow />
            </button>
          </div>
        </div>
        <ol className="rack-track" data-rack="" style={{ '--count': posts.length } as CSSProperties}>
          {posts.map((post) => (
            <li className="rack-item" key={post.slug}>
              <a
                className="rack-link"
                href={`/blog/${post.slug}`}
                data-slug={post.slug}
                aria-label={post.metadata.title}
              >
                <PostCover post={post} />
              </a>
            </li>
          ))}
        </ol>
        <p className="rack-hint" aria-hidden="true">
          Swipe om te bladeren, tik om te openen
        </p>
      </section>

      <section className="toc" id="inhoud" aria-labelledby="toc-h">
        <h2 id="toc-h" className="sec-h">
          Inhoud
        </h2>
        <TagRow tags={getTags(posts)} />
        <TocList posts={posts} />
      </section>

      <Colofon />
    </div>
  )
}
