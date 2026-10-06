'use client'

import { useActionState, useState } from 'react'
import { savePost, type FormValues, type SaveState } from './actions'

// Voorbeeld zoals het op de site komt: alinea's en opsommingen.
function Preview({ title, text }: { title: string; text: string }) {
  let blocks: { kind: 'p' | 'ul'; lines: string[] }[] = []
  for (let raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    let line = raw.trim()
    if (!line) {
      blocks.push({ kind: 'p', lines: [] })
      continue
    }
    let item = line.match(/^[-•*]\s+(.+)$/)
    let last = blocks[blocks.length - 1]
    if (item) {
      if (last && last.kind === 'ul') last.lines.push(item[1])
      else blocks.push({ kind: 'ul', lines: [item[1]] })
    } else {
      blocks.push({ kind: 'p', lines: [line] })
    }
  }
  return (
    <div className="adm-preview">
      <p className="adm-preview-label">Voorbeeld</p>
      <h3 className="adm-preview-title">{title}</h3>
      {blocks
        .filter((b) => b.lines.length)
        .map((b, i) =>
          b.kind === 'ul' ? (
            <ul key={i}>
              {b.lines.map((l, j) => (
                <li key={j}>{l}</li>
              ))}
            </ul>
          ) : (
            <p key={i}>{b.lines[0]}</p>
          )
        )}
    </div>
  )
}

type Props = { initial: FormValues; slug?: string; sha?: string }

export function PostForm({ initial, slug, sha }: Props) {
  let [state, action, pending] = useActionState<SaveState, FormData>(savePost, {})
  let editing = Boolean(slug)
  let [week, setWeek] = useState(initial.week)
  let [title, setTitle] = useState(initial.title)
  let [titleTouched, setTitleTouched] = useState(editing)
  let [date, setDate] = useState(initial.date)
  let [text, setText] = useState(initial.text)

  return (
    <form action={action} className="adm-form adm-editor">
      {slug && <input type="hidden" name="slug" value={slug} />}
      {sha && <input type="hidden" name="sha" value={sha} />}

      <div className="adm-grid">
        <label className="adm-field" htmlFor="week">
          <span>Week</span>
          <input
            id="week"
            name="week"
            type="number"
            min={1}
            max={99}
            required
            readOnly={editing}
            value={week}
            onChange={(e) => {
              setWeek(e.target.value)
              if (!titleTouched) setTitle(`Week ${e.target.value} bij Nexu`)
            }}
          />
        </label>
        <label className="adm-field" htmlFor="date">
          <span>Datum (mag leeg)</span>
          <input id="date" name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>

      <label className="adm-field" htmlFor="title">
        <span>Titel</span>
        <input
          id="title"
          name="title"
          maxLength={120}
          required
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setTitleTouched(true)
          }}
        />
      </label>

      <label className="adm-field" htmlFor="text">
        <span>Tekst</span>
        <textarea id="text" name="text" rows={16} maxLength={20000} required value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <p className="adm-help">Elke nieuwe regel wordt een nieuwe alinea. Begin een regel met - voor een opsomming.</p>

      {state.error && (
        <p className="adm-alert" role="alert">
          {state.error}
        </p>
      )}

      <div className="adm-actions">
        <button className="adm-btn" disabled={pending}>
          {pending ? 'Bezig met opslaan…' : 'Opslaan'}
        </button>
        <a className="adm-btn adm-btn--ghost" href="/admin">
          Annuleren
        </a>
      </div>

      <Preview title={title} text={text} />
    </form>
  )
}
