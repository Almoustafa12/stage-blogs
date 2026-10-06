import { notFound } from 'next/navigation'
import { Feature } from 'app/components/feature'
import { getBlogPosts } from 'app/blog/utils'
import { baseUrl } from 'app/sitemap'
import { SITE } from 'app/site'

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return getBlogPosts().map((post) => ({ slug: post.slug }))
}

function ogImageFor(week: number, title: string) {
  return `${baseUrl}/og?week=${week}&title=${encodeURIComponent(title)}`
}

export async function generateMetadata({ params }: Props) {
  let { slug } = await params
  let post = getBlogPosts().find((post) => post.slug === slug)
  if (!post) {
    return
  }

  let { title, week, publishedAt: publishedTime, summary: description, image } = post.metadata
  let ogImage = image ? image : ogImageFor(week, title)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime,
      url: `${baseUrl}/blog/${post.slug}`,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function Page({ params }: Props) {
  let { slug } = await params
  let posts = getBlogPosts()
  let index = posts.findIndex((post) => post.slug === slug)
  if (index < 0) {
    notFound()
  }
  let post = posts[index]

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.metadata.title,
            datePublished: post.metadata.publishedAt,
            dateModified: post.metadata.publishedAt,
            description: post.metadata.summary,
            image: ogImageFor(post.metadata.week, post.metadata.title),
            url: `${baseUrl}/blog/${post.slug}`,
            author: { '@type': 'Person', name: SITE.author },
          }),
        }}
      />
      <Feature post={post} prev={posts[index - 1]} next={posts[index + 1]} />
    </>
  )
}
