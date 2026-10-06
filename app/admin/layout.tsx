import './admin.css'
import type { Metadata } from 'next'

// Het beheer: nooit in zoekmachines, altijd vers van de server.
export const metadata: Metadata = {
  title: 'Beheer',
  robots: { index: false, follow: false, nocache: true },
}

export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="pg" className="adm">
      {children}
    </div>
  )
}
