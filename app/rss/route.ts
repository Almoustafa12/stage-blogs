import { baseUrl } from 'app/sitemap'
import { getBlogPosts } from 'app/blog/utils'
import { SITE } from 'app/site'

function escapeXml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export async function GET() {
  let allBlogs = await getBlogPosts()

  const itemsXml = allBlogs
    .slice()
    .reverse()
    .map(
      (post) =>
        `<item>
          <title>${escapeXml(post.metadata.title)}</title>
          <link>${baseUrl}/blog/${post.slug}</link>
          <description>${escapeXml(post.metadata.summary || '')}</description>${
            post.metadata.publishedAt
              ? `
          <pubDate>${new Date(post.metadata.publishedAt).toUTCString()}</pubDate>`
              : ''
          }
        </item>`
    )
    .join('\n')

  const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0">
    <channel>
        <title>${escapeXml(SITE.name)}</title>
        <link>${baseUrl}</link>
        <description>${escapeXml(SITE.description)}</description>
        ${itemsXml}
    </channel>
  </rss>`

  return new Response(rssFeed, {
    headers: {
      'Content-Type': 'text/xml',
    },
  })
}
