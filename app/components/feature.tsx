import { SITE } from 'app/site'
import { weekStyle, type Post } from 'app/blog/utils'
import { CustomMDX } from './mdx'
import { Arrow, Colofon, PostCover } from './magazine'

type Props = { post: Post; prev?: Post; next?: Post }

// Eén blog als artikel in het tijdschrift.
// Bovenaan ligt de cover; als je scrolt, slaat die open en begint het artikel.
export function Feature({ post, prev, next }: Props) {
  let { week, title, readingMinutes } = post.metadata
  let firstName = SITE.author.split(' ')[0]

  return (
    <div id="pg" className="pg pg--feature" data-page="feature" data-slug={post.slug} style={weekStyle(week)}>
      <div className="prog" aria-hidden="true">
        <span />
      </div>

      <header className="tb">
        <a className="tb-home" href="/" data-home="">
          <Arrow dir="left" />
          <span>{SITE.name}</span>
        </a>
        <span className="tb-title" aria-hidden="true">
          {title}
        </span>
        <span className="tb-n">Week {week}</span>
      </header>

      <article className="ft">
        <section className="op" data-opener="">
          <div className="op-stage">
            <div className="op-book">
              {/* de eerste bladzijde, onder de cover */}
              <div className="op-page">
                <div className="opt">
                  <div className="opt-band">
                    <span className="opt-num" aria-hidden="true">
                      {week}
                    </span>
                    <h1 className="opt-h">{title}</h1>
                    <p className="opt-by">blog van {SITE.author}</p>
                  </div>
                  <div className="opt-rest">
                    {post.lead && (
                      <div className="opt-lead">
                        <CustomMDX source={post.lead} />
                      </div>
                    )}
                    {post.headings.length > 0 && (
                      <nav className="opt-toc" aria-label="In dit artikel">
                        <p>In dit artikel</p>
                        <ol>
                          {post.headings.map((h) => (
                            <li key={h.id}>
                              <a href={`#${h.id}`}>{h.text}</a>
                            </li>
                          ))}
                        </ol>
                      </nav>
                    )}
                  </div>
                </div>
              </div>

              {/* de cover: voorkant en binnenkant */}
              <div className="op-leaf" data-leaf="">
                <div className="op-front">
                  <PostCover post={post} />
                </div>
                <div className="op-back" aria-hidden="true">
                  <div className="opb">
                    <span className="opb-num">{week}</span>
                  </div>
                </div>
              </div>
            </div>
            <a className="op-hint" href="#lees" data-open="">
              <span>Scroll om te openen</span>
              <Arrow dir="down" />
            </a>
          </div>
        </section>

        <div className="ft-body" id="lees">
          <CustomMDX source={post.body} />
          <p className="ft-end">
            <span className="ft-sq" aria-hidden="true" />
            {firstName}
          </p>
        </div>
      </article>

      <nav className="more" aria-labelledby="more-h">
        <h2 id="more-h" className="sec-h">
          Volgende week
        </h2>
        <div className={next ? 'more-grid' : 'more-grid more-grid--solo'}>
          {next && (
            <a className="more-cover" href={`/blog/${next.slug}`} data-slug={next.slug} aria-label={next.metadata.title}>
              <PostCover post={next} />
            </a>
          )}
          <div className="more-text">
            {next ? (
              <>
                <p className="more-t">
                  <a href={`/blog/${next.slug}`} data-slug={next.slug}>
                    {next.metadata.title}
                  </a>
                </p>
                <p className="more-ex">{next.metadata.excerpt}</p>
              </>
            ) : (
              <>
                <p className="more-t">Week {week + 1} komt binnenkort</p>
              </>
            )}
            <div className="more-links">
              {prev && (
                <a className="more-link" href={`/blog/${prev.slug}`} data-slug={prev.slug}>
                  <Arrow dir="left" />
                  <span>{prev.metadata.title}</span>
                </a>
              )}
              <a className="more-link" href="/#nummers" data-home="">
                <span>Alle blogs</span>
              </a>
            </div>
          </div>
        </div>
      </nav>

      <Colofon />
    </div>
  )
}
