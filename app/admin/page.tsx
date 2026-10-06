import { requireAdmin } from 'lib/admin/session'
import { getStore, StoreError, type StoredPost } from 'lib/admin/store'
import { isPostSlug } from 'lib/admin/format'
import { logout } from './actions'
import { DeleteButton } from './delete-button'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

function weekLabel(slug: string) {
  return `Week ${slug.replace('week-', '')}`
}

export default async function AdminHome({ searchParams }: Props) {
  await requireAdmin()
  let params = await searchParams
  let store = getStore()
  let posts: StoredPost[] = []
  let loadError = ''
  if (store) {
    try {
      posts = await store.list()
    } catch (err) {
      loadError = err instanceof StoreError ? err.message : 'De weken konden niet geladen worden.'
    }
  }

  let saved = typeof params.opgeslagen === 'string' && isPostSlug(params.opgeslagen) ? params.opgeslagen : ''
  let deleted = typeof params.verwijderd === 'string' && isPostSlug(params.verwijderd) ? params.verwijderd : ''
  let online = store?.kind === 'github'
  let later = online ? ' De site is binnen ongeveer een minuut bijgewerkt.' : ''

  return (
    <main className="adm-main">
      <header className="adm-top">
        <h1 className="adm-h1">Beheer</h1>
        <nav className="adm-top-links">
          <a className="adm-link" href="/">
            Naar de site
          </a>
          <form action={logout}>
            <button className="adm-link">Uitloggen</button>
          </form>
        </nav>
      </header>

      {saved && <p className="adm-ok">{weekLabel(saved)} is opgeslagen.{later}</p>}
      {deleted && <p className="adm-ok">{weekLabel(deleted)} is verwijderd.{later}</p>}
      {params.fout === 'verwijderen' && (
        <p className="adm-alert">Verwijderen is mislukt. Laad de pagina opnieuw en probeer het nog eens.</p>
      )}
      {!store && (
        <p className="adm-alert">Opslaan kan nog niet: koppel eerst GitHub. Zie "Beheer" in de README.</p>
      )}
      {loadError && <p className="adm-alert">{loadError}</p>}

      <div className="adm-bar">
        <h2 className="adm-h2">Weken</h2>
        {store && (
          <a className="adm-btn" href="/admin/nieuw">
            Nieuwe week
          </a>
        )}
      </div>

      {store && !loadError && posts.length === 0 ? (
        <p className="adm-muted">Er zijn nog geen weken. Voeg je eerste week toe.</p>
      ) : (
        <ul className="adm-list">
          {posts.map((post) => (
            <li key={post.slug} className="adm-row">
              <span className="adm-row-n" aria-hidden="true">
                {post.week}
              </span>
              <span className="adm-row-main">
                <b>{post.title}</b>
                <small>{post.date || 'Geen datum'}</small>
              </span>
              <span className="adm-row-actions">
                <a className="adm-btn adm-btn--ghost" href={`/admin/bewerk/${post.slug}`}>
                  Bewerken
                </a>
                <DeleteButton slug={post.slug} sha={post.sha} title={post.title} />
              </span>
            </li>
          ))}
        </ul>
      )}

      {store && <p className="adm-note">Opslaan gaat naar {store.label}.</p>}
    </main>
  )
}
