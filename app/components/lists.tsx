import { SITE } from 'app/site'
import { formatDate, slugify, weekStyle, type Post, type Tag } from 'app/blog/utils'

// De balk bovenaan de kiosk en de andere pagina's: wie ik ben en een link naar "Over mij".
export function TopBar({ home = false }: { home?: boolean }) {
  return (
    <p className="mh-bar">
      {home ? (
        <span>Almoustafa</span>
      ) : (
        <a className="mh-link" href="/">
          ← Alle blogs
        </a>
      )}
      <span className="mh-right">
        <span className="mh-place">
          {SITE.company}, {SITE.place}
        </span>
        <a className="mh-link" href="/over">
          Over mij
        </a>
      </span>
    </p>
  )
}

// Een rij tags. `active` is de tag van de pagina waar je op staat; "Alle" brengt je terug naar alle blogs.
export function TagRow({ tags, active, all = true }: { tags: Tag[]; active?: string; all?: boolean }) {
  if (!tags.length) return null
  return (
    <ul className="tags" aria-label="Onderwerpen">
      {all && (
        <li>
          <a className="tag" href="/#inhoud" aria-current={active ? undefined : 'page'}>
            Alle
          </a>
        </li>
      )}
      {tags.map((tag) => (
        <li key={tag.slug}>
          <a className="tag" href={`/tags/${tag.slug}`} aria-current={tag.slug === active ? 'page' : undefined}>
            {tag.name}
            {tag.count > 0 && <span className="tag-n">{tag.count}</span>}
          </a>
        </li>
      ))}
    </ul>
  )
}

// De tags van één blog (zonder aantallen).
export function PostTags({ post }: { post: Post }) {
  let tags = post.metadata.tags.map((name) => ({ name, slug: slugify(name), count: 0 }))
  return <TagRow tags={tags} all={false} />
}

// De inhoudstafel: een rij per blog, met nummer, datum, leestijd, tags, titel en een stukje tekst.
export function TocList({ posts }: { posts: Post[] }) {
  return (
    <ol className="toc-list">
      {posts.map((post) => (
        <li key={post.slug} style={weekStyle(post.metadata.week)}>
          <a className="toc-a" href={`/blog/${post.slug}`} data-slug={post.slug}>
            <span className="toc-n" aria-hidden="true">
              {post.metadata.week}
            </span>
            <span className="toc-main">
              <span className="toc-meta">
                {post.metadata.publishedAt && <span>{formatDate(post.metadata.publishedAt)}</span>}
                <span>{post.metadata.readingMinutes} min lezen</span>
                {post.metadata.tags.length > 0 && <span className="toc-tags">{post.metadata.tags.join(' · ')}</span>}
              </span>
              <span className="toc-title">{post.metadata.title}</span>
              <span className="toc-ex">{post.metadata.excerpt}</span>
            </span>
          </a>
        </li>
      ))}
    </ol>
  )
}
