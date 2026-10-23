import { notFound } from 'next/navigation'
import { getTags, postsWithTag } from 'app/blog/utils'
import { Colofon } from 'app/components/magazine'
import { TagRow, TocList, TopBar } from 'app/components/lists'

type Props = { params: Promise<{ tag: string }> }

export function generateStaticParams() {
  return getTags().map((tag) => ({ tag: tag.slug }))
}

export async function generateMetadata({ params }: Props) {
  let { tag: slug } = await params
  let tag = getTags().find((t) => t.slug === slug)
  if (!tag) return
  return {
    title: tag.name,
    description: `Alle blogs over ${tag.name.toLowerCase()} tijdens mijn stage.`,
    alternates: { canonical: `/tags/${tag.slug}` },
  }
}

// Alle blogs met één tag, bv. /tags/code
export default async function TagPage({ params }: Props) {
  let { tag: slug } = await params
  let tags = getTags()
  let tag = tags.find((t) => t.slug === slug)
  if (!tag) notFound()
  let posts = postsWithTag(slug)

  return (
    <div id="pg" className="pg pg--list" data-page="list">
      <header className="mh">
        <TopBar />
      </header>
      <section className="toc list" aria-labelledby="list-h">
        <p className="list-kicker">Onderwerp</p>
        <h1 id="list-h" className="list-h">
          {tag.name}
        </h1>
        <p className="list-sub">{posts.length === 1 ? '1 blog' : `${posts.length} blogs`}</p>
        <TagRow tags={tags} active={slug} />
        <TocList posts={posts} />
      </section>
      <Colofon />
    </div>
  )
}
