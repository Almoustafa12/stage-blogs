# De Stagiair

Mijn stageblog: elke week een nieuwe blog, met een eigen cover (Week 1, Week 2, ...).

- Op de startpagina (de kiosk) staan alle nummers in een rek, week 1 eerst. Op een telefoon swipe je erdoor.
- Tik je op een cover, dan vliegt die naar het scherm. Scroll je, dan slaat de cover open en begint het artikel.
- Gemaakt met Next.js en MDX, gehost op Vercel. Alleen wie de GitHub-repo mag aanpassen, kan een week toevoegen.

## Een nieuwe week toevoegen

1. Open de map `app/blog/posts`.
2. Maak een nieuw bestand met als naam het weeknummer, bijvoorbeeld `week-3.mdx`.
3. Zet deze bovenkant erin en plak je tekst eronder:

```
---
title: 'Week 3 bij Nexu'
week: 3
---

Eerste alinea.

Tweede alinea.

- een opsomming begint met een streepje
- nog een punt
```

Laat een lege regel tussen twee alinea's. De eerste alinea komt onder de titel, de rest eronder.
De cover ("Week 3") en de kleur maakt de site zelf.
Een datum is niet nodig. Wil je er toch een, voeg dan `publishedAt: '2026-10-09'` toe in de bovenkant.

4. Sla op (commit). Vercel zet de nieuwe versie binnen een minuut online.

## Beheer: weken toevoegen, bewerken en verwijderen

Op `/admin` staat een beheerpagina. Alleen jij kan daar inloggen, met je wachtwoord én een code uit een authenticator-app op je gsm.
Wat je opslaat, wordt een commit in je GitHub-repo. Vercel bouwt de site dan vanzelf opnieuw: na ongeveer een minuut staat het online.

### 1. Wachtwoord en app instellen (eenmalig, op je laptop)

```
pnpm install
pnpm admin-setup
```

- Kies een wachtwoord van minstens 12 tekens.
- Scan de QR-code met een authenticator-app (Microsoft Authenticator of Google Authenticator).
- Het script zet drie geheime waarden in `.env.local`: `ADMIN_PASSWORD_HASH`, `ADMIN_TOTP_SECRET` en `ADMIN_SESSION_SECRET`.
  Dat bestand gaat nooit mee naar GitHub.

Lokaal testen: `pnpm dev` en open http://localhost:3000/admin. Lokaal schrijft het beheer rechtstreeks in `app/blog/posts`.

### 2. Een GitHub-token maken

GitHub > Settings > Developer settings > Personal access tokens > Fine-grained tokens > Generate new token:

- Repository access: Only select repositories, kies de repo van deze site
- Permissions > Repository permissions > Contents: Read and write
- Kies een vervaldatum, bijvoorbeeld het einde van je stage

### 3. Alles in Vercel zetten

Vercel > je project > Settings > Environment Variables. Voeg toe:

| Naam | Waarde |
| --- | --- |
| `ADMIN_PASSWORD_HASH` | uit `.env.local` |
| `ADMIN_TOTP_SECRET` | uit `.env.local` |
| `ADMIN_SESSION_SECRET` | uit `.env.local` |
| `GITHUB_TOKEN` | het token uit stap 2 |
| `GITHUB_REPO` | `jouw-gebruikersnaam/naam-van-de-repo` |
| `GITHUB_BRANCH` | `main` (of de naam van je branch) |

Klik daarna bij Deployments op Redeploy. Open dan `https://jouw-site.vercel.app/admin`.

### Beveiliging

- Inloggen vraagt je wachtwoord én de code uit je app. Alleen je wachtwoord kennen is niet genoeg.
- Het wachtwoord zelf staat nergens, alleen een scrypt-hash ervan.
- Na 5 foute pogingen blokkeert het inloggen 15 minuten.
- Je blijft 8 uur ingelogd. Iedereen uitloggen: verander `ADMIN_SESSION_SECRET` en redeploy.
- Het GitHub-token kan alleen deze ene repo aanpassen en komt nooit in de browser.
- Het beheer staat niet in zoekmachines en kan niet in een andere site ingebed worden.
- Tekst uit het beheer wordt altijd als gewone tekst opgeslagen: speciale tekens kunnen de site niet breken.

### Tekst schrijven in het beheer

Elke nieuwe regel wordt een alinea. Een regel die begint met `- ` wordt een punt in een opsomming.

## De naam veranderen

De naam van de site, je naam en de inleiding staan in `app/site.ts`.

## Adressen

- `/` de startpagina met alle weken
- `/blog/week-2` week 2 (handig om te delen; de link toont de cover)
- `/rss` de RSS-feed

## Lokaal bekijken

```bash
pnpm install
pnpm dev
```

Open daarna http://localhost:3000.

## Waar zit wat

- `app/site.ts`: naam, inleiding en gegevens van de site
- `app/components/kiosk.tsx`: de startpagina (naam, covers, inhoud)
- `app/components/feature.tsx`: een blog (cover die opengaat, tekst, volgende week)
- `app/components/magazine.tsx`: de cover en het colofon
- `app/components/mdx.tsx`: hoe de tekst van een blog wordt opgemaakt
- `public/mag.js`: alle beweging (naam die uitrekt, rek met covers, cover die opengaat)
- `app/global.css`: alle opmaak
- `app/blog/utils.ts`: de kleuren per week en het inlezen van de blogs
- `app/og/route.tsx`: het beeld dat je ziet als je een link deelt
- `app/fonts`: de lettertypes Anybody en Newsreader (vrije licentie, OFL)
- `app/admin`: het beheer (inloggen, overzicht, nieuwe week, bewerken)
- `lib/admin`: beveiliging van het beheer en opslaan naar GitHub
- `scripts/admin-setup.mjs`: wachtwoord en authenticator-app instellen
