'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { serialize } from 'next-mdx-remote/serialize'
import { adminConfig } from 'lib/admin/env'
import { verifyPassword } from 'lib/admin/password'
import { verifyTotp } from 'lib/admin/totp'
import { createSession, endSession, requireAdmin } from 'lib/admin/session'
import { clearFailures, isBlocked, registerFailure } from 'lib/admin/ratelimit'
import { getStore, StoreError } from 'lib/admin/store'
import { isPostSlug, toMdx, validatePost } from 'lib/admin/format'

// Elke actie hier is van buitenaf aan te roepen, dus elke actie controleert zelf of je ingelogd bent.
// Next.js controleert ook dat het formulier van deze site zelf komt.

export type LoginState = { error?: string }
export type FormValues = { week: string; title: string; date: string; text: string }
export type SaveState = { error?: string; values?: FormValues }

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function clientKey() {
  let h = await headers()
  return (h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || 'onbekend').trim()
}

export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  let config = adminConfig()
  if (!config.ready) return { error: 'Het beheer is nog niet ingesteld. Volg de stappen onder "Beheer" in de README.' }

  let key = await clientKey()
  if (isBlocked(key)) return { error: 'Te veel mislukte pogingen. Probeer het over 15 minuten opnieuw.' }

  let password = String(formData.get('password') || '')
  let code = String(formData.get('code') || '')
  let passwordOk = await verifyPassword(password, config.passwordHash).catch(() => false)
  let codeOk = verifyTotp(code, config.totpSecret)

  if (!passwordOk || !codeOk) {
    registerFailure(key)
    await wait(700 + Math.random() * 500)
    return { error: 'Wachtwoord of code klopt niet.' }
  }

  clearFailures(key)
  await createSession()
  redirect('/admin')
}

export async function logout() {
  await endSession()
  redirect('/admin/login')
}

function valuesFrom(formData: FormData): FormValues {
  return {
    week: String(formData.get('week') ?? ''),
    title: String(formData.get('title') ?? ''),
    date: String(formData.get('date') ?? ''),
    text: String(formData.get('text') ?? ''),
  }
}

export async function savePost(_: SaveState, formData: FormData): Promise<SaveState> {
  await requireAdmin()
  let values = valuesFrom(formData)
  let store = getStore()
  if (!store) return { error: 'Opslaan kan nog niet: koppel eerst GitHub (README, onder "Beheer").', values }

  let checked = validatePost(values)
  if ('error' in checked) return { error: checked.error, values }
  let { post } = checked

  let slug = `week-${post.week}`
  let original = String(formData.get('slug') || '')
  let editing = isPostSlug(original)
  if (editing && original !== slug) {
    return { error: 'Het weeknummer van een bestaande week kan je niet veranderen.', values }
  }

  // Eerst controleren of de blog goed verwerkt kan worden, zodat de site nooit kapot gaat.
  let content = toMdx(post)
  try {
    await serialize(content, { parseFrontmatter: true })
  } catch {
    return { error: 'Deze tekst kan niet verwerkt worden. Haal speciale tekens weg en probeer opnieuw.', values }
  }

  try {
    if (editing) {
      await store.save(slug, content, String(formData.get('sha') || ''), `${post.title}: aangepast via beheer`)
    } else {
      if (await store.get(slug)) {
        return { error: `Week ${post.week} bestaat al. Bewerk die week of kies een ander nummer.`, values }
      }
      await store.save(slug, content, null, `${post.title}: toegevoegd via beheer`)
    }
  } catch (err) {
    return { error: err instanceof StoreError ? err.message : 'Opslaan is mislukt. Probeer het opnieuw.', values }
  }

  revalidatePath('/', 'layout')
  redirect(`/admin?opgeslagen=${slug}`)
}

export async function deletePost(formData: FormData) {
  await requireAdmin()
  let slug = String(formData.get('slug') || '')
  let sha = String(formData.get('sha') || '')
  let store = getStore()
  if (!store || !isPostSlug(slug)) redirect('/admin?fout=verwijderen')

  let failed = false
  try {
    await store.remove(slug, sha, `Week ${slug.replace('week-', '')}: verwijderd via beheer`)
  } catch {
    failed = true
  }
  if (failed) redirect('/admin?fout=verwijderen')

  revalidatePath('/', 'layout')
  redirect(`/admin?verwijderd=${slug}`)
}
