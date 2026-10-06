import { notFound } from 'next/navigation'
import { requireAdmin } from 'lib/admin/session'
import { getStore, StoreError, type StoredPost } from 'lib/admin/store'
import { isPostSlug } from 'lib/admin/format'
import { PostForm } from '../../post-form'

type Props = { params: Promise<{ slug: string }> }

export default async function EditPostPage({ params }: Props) {
  await requireAdmin()
  let { slug } = await params
  let store = getStore()
  if (!store || !isPostSlug(slug)) notFound()

  let error = ''
  let post: StoredPost | null = null
  try {
    post = await store.get(slug)
  } catch (err) {
    error = err instanceof StoreError ? err.message : 'Deze week kon niet geladen worden.'
  }
  if (!post && !error) notFound()

  return (
    <main className="adm-main">
      <a className="adm-link" href="/admin">
        Terug naar het overzicht
      </a>
      <h1 className="adm-h1">{post ? post.title : 'Bewerken'}</h1>
      {error && <p className="adm-alert">{error}</p>}
      {post && (
        <PostForm
          slug={slug}
          sha={post.sha}
          initial={{ week: String(post.week), title: post.title, date: post.date, text: post.text }}
        />
      )}
    </main>
  )
}
