import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { weekColor } from 'app/blog/utils'
import { SITE, mastParts } from 'app/site'

// Het beeld dat verschijnt als je een link deelt (WhatsApp, LinkedIn, ...).
// /og            -> de kiosk
// /og?week=2     -> de cover van nummer 2
export async function GET(request: Request) {
  let url = new URL(request.url)
  let week = parseInt(url.searchParams.get('week') || '0', 10) || 0
  let title = url.searchParams.get('title') || SITE.description
  let color = week ? weekColor(week) : { bg: '#E9ECE6', ink: '#0F2219' }
  let { small, big } = mastParts()

  let dir = join(process.cwd(), 'app', 'og')
  let [wide, condensed, semi, italic] = await Promise.all([
    readFile(join(dir, 'Anybody-WideBlack.woff')),
    readFile(join(dir, 'Anybody-CondensedBlack.woff')),
    readFile(join(dir, 'Anybody-SemiBold.woff')),
    readFile(join(dir, 'Anybody-TitleItalic.woff')),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          background: color.bg,
          color: color.ink,
          padding: '48px 64px',
          fontFamily: 'Semi',
        }}
      >
        <div style={{ display: 'flex', fontSize: 30, fontFamily: 'TitleItalic' }}>{small}</div>
        <div style={{ display: 'flex', fontFamily: 'Wide', fontSize: 142, lineHeight: 0.8, letterSpacing: -2 }}>
          {big}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: `3px solid ${color.ink}`,
            borderBottom: `3px solid ${color.ink}`,
            padding: '10px 0',
            marginTop: 18,
            fontSize: 24,
          }}
        >
          <span>{week ? `Nº ${String(week).padStart(2, '0')}` : 'Stageblog'}</span>
          <span>{week ? `Week ${week}` : `${SITE.company}, ${SITE.place}`}</span>
        </div>
        <div style={{ display: 'flex', flex: 1, alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              maxWidth: week ? 760 : 1000,
              paddingBottom: 6,
            }}
          >
            <div style={{ fontFamily: 'TitleItalic', fontSize: week ? 76 : 64, lineHeight: 0.95 }}>{title}</div>
            <div style={{ fontSize: 24, marginTop: 16 }}>{SITE.author}</div>
          </div>
          {week > 0 && (
            <div style={{ fontFamily: 'Condensed', fontSize: 420, lineHeight: 0.72, marginBottom: -18 }}>
              {String(week)}
            </div>
          )}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Wide', data: wide, style: 'normal', weight: 900 },
        { name: 'Condensed', data: condensed, style: 'normal', weight: 900 },
        { name: 'Semi', data: semi, style: 'normal', weight: 600 },
        { name: 'TitleItalic', data: italic, style: 'normal', weight: 800 },
      ],
    }
  )
}
