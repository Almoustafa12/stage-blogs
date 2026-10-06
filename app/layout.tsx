import './global.css'
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { baseUrl } from './sitemap'
import { SITE } from './site'

// Lettertypes zitten in app/fonts, zodat de site ook zonder internet bouwt.
// Anybody: namen, covers, koppen en labels (kan smal en breed). Newsreader: de lopende tekst.
const anybody = localFont({
  src: [
    { path: './fonts/Anybody.woff2', weight: '100 900', style: 'normal' },
    { path: './fonts/Anybody-Italic.woff2', weight: '100 900', style: 'italic' },
  ],
  variable: '--font-display',
  display: 'swap',
  declarations: [{ prop: 'font-stretch', value: '50% 150%' }],
  fallback: ['Arial Narrow', 'Helvetica Neue', 'Arial', 'sans-serif'],
})

const newsreader = localFont({
  src: [
    { path: './fonts/Newsreader.woff2', weight: '200 800', style: 'normal' },
    { path: './fonts/Newsreader-Italic.woff2', weight: '200 800', style: 'italic' },
  ],
  variable: '--font-serif',
  display: 'swap',
  fallback: ['Iowan Old Style', 'Palatino Linotype', 'Georgia', 'serif'],
  adjustFontFallback: 'Times New Roman',
})

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: `${SITE.name}, stageblog bij ${SITE.company}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    title: SITE.name,
    description: SITE.description,
    url: baseUrl,
    siteName: SITE.name,
    locale: 'nl_BE',
    type: 'website',
    images: [{ url: '/og', width: 1200, height: 630 }],
  },
  alternates: {
    types: { 'application/rss+xml': '/rss' },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#e9ece6' },
    { media: '(prefers-color-scheme: dark)', color: '#0d1813' },
  ],
}

// Dit stukje draait meteen, nog voor de pagina getekend wordt:
// - 'js' en 'motion' aanzetten (motion niet als iemand minder beweging wil);
// - lukt het script niet binnen 5 seconden, dan toont de pagina alles zonder animatie;
// - kom je terug van een artikel naar de kiosk, dan vliegt die cover terug op zijn plaats.
const bootScript = `(function(){var d=document.documentElement;d.classList.add('js');if(!matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('motion');setTimeout(function(){if(!d.classList.contains('mag-ready'))d.classList.remove('js','motion')},5000);addEventListener('pagereveal',function(e){if(!e.viewTransition||!window.navigation||!navigation.activation)return;try{var from=navigation.activation.from&&new URL(navigation.activation.from.url).pathname.match(/\\/blog\\/([^/]+)/);if(!from||!document.querySelector('.pg--kiosk'))return;var el=document.querySelector('.rack-link[data-slug="'+from[1]+'"] .cv');if(!el)return;el.style.viewTransitionName='cover';e.viewTransition.finished.finally(function(){el.style.viewTransitionName=''})}catch(_){}})})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="nl"
      className={`${anybody.variable} ${newsreader.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        <link rel="expect" href="#pg" {...{ blocking: 'render' }} />
      </head>
      <body>
        {children}
        <Script src="/mag.js" strategy="afterInteractive" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
