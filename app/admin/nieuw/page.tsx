import { requireAdmin } from 'lib/admin/session'
import { getStore } from 'lib/admin/store'
import { usedTags } from 'lib/admin/format'
import { PostForm } from '../post-form'

export default async function NewPostPage() {
  await requireAdmin()
  let next = 1
  let knownTags: string[] = []
  let store = getStore()
  if (store) {
    try {
      let posts = await store.list()
      next = (posts[posts.length - 1]?.week || 0) + 1
      knownTags = usedTags(posts)
    } catch {}
  }

  return (
    <main className="adm-main">
      <a className="adm-link" href="/admin">
        Terug naar het overzicht
      </a>
      <h1 className="adm-h1">Nieuwe week</h1>
      <PostForm knownTags={knownTags} initial={{ week: String(next), title: `Week ${next} bij Nexu`, date: '', tags: '', text: '' }} />
    </main>
  )
}
