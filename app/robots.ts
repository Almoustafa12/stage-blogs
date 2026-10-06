import { baseUrl } from 'app/sitemap'

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: '/admin',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
