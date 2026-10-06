import { redirect } from 'next/navigation'
import { adminConfig } from 'lib/admin/env'
import { readSession } from 'lib/admin/session'
import { LoginForm } from './login-form'

export default async function LoginPage() {
  if (await readSession()) redirect('/admin')
  let ready = adminConfig().ready

  return (
    <main className="adm-login">
      <h1 className="adm-h1">Beheer</h1>
      <p className="adm-muted">Log in met je wachtwoord en de code uit je authenticator-app.</p>
      {!ready && (
        <p className="adm-alert">Het beheer is nog niet ingesteld. Volg de stappen onder "Beheer" in de README.</p>
      )}
      <LoginForm />
    </main>
  )
}
