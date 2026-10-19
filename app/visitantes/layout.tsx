import type { Metadata, Viewport } from 'next'

// Página acessada pelo QR code da parede (Wi-Fi de visitantes) — não faz
// sentido aparecer no Google, por isso o noindex.
export const metadata: Metadata = {
  title: 'Bem-vindo à Reobote | Visitantes',
  description: 'Conheça a Reobote Consórcios por dentro e conecte-se ao Wi-Fi de visitantes.',
  robots: { index: false, follow: false },
}

// viewportFit: 'cover' libera a área do notch/ilha no iPhone — os cards são
// tela cheia e já respeitam env(safe-area-inset-*) por conta própria.
export const viewport: Viewport = {
  themeColor: '#0d172e',
  colorScheme: 'dark',
  viewportFit: 'cover',
}

export default function VisitantesLayout({ children }: { children: React.ReactNode }) {
  return children
}
