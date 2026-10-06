'use client'

import { useActionState } from 'react'
import { login, type LoginState } from '../actions'

export function LoginForm() {
  let [state, action, pending] = useActionState<LoginState, FormData>(login, {})

  return (
    <form action={action} className="adm-form">
      <label className="adm-field" htmlFor="password">
        <span>Wachtwoord</span>
        <input id="password" name="password" type="password" autoComplete="current-password" maxLength={1024} required />
      </label>
      <label className="adm-field" htmlFor="code">
        <span>Code uit je app</span>
        <input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          placeholder="123456"
          required
        />
      </label>
      {state.error && (
        <p className="adm-alert" role="alert">
          {state.error}
        </p>
      )}
      <button className="adm-btn" disabled={pending}>
        {pending ? 'Bezig…' : 'Inloggen'}
      </button>
    </form>
  )
}
