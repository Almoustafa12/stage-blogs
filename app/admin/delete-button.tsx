'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { deletePost } from './actions'

function ConfirmButton() {
  let { pending } = useFormStatus()
  return (
    <button className="adm-btn adm-btn--danger" disabled={pending}>
      {pending ? 'Bezig…' : 'Ja, verwijderen'}
    </button>
  )
}

export function DeleteButton({ slug, sha, title }: { slug: string; sha: string; title: string }) {
  let [asking, setAsking] = useState(false)

  if (!asking) {
    return (
      <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setAsking(true)}>
        Verwijderen
      </button>
    )
  }

  return (
    <form action={deletePost} className="adm-confirm">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="sha" value={sha} />
      <span>{title} verwijderen?</span>
      <ConfirmButton />
      <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setAsking(false)}>
        Nee
      </button>
    </form>
  )
}
