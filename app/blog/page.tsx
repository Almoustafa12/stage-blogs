import { Kiosk } from 'app/components/kiosk'

export const metadata = {
  title: 'Mijn blogs',
  description: 'Alle weken van mijn stage bij Nexu, van week 1 tot nu.',
  alternates: { canonical: '/' },
}

// /blog toont dezelfde kiosk als de startpagina.
export default function Page() {
  return <Kiosk />
}
