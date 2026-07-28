import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Reobote Consórcios | Planejamento financeiro para conquistar seu patrimônio',
  description: 'A Reobote Consórcios ajuda você a planejar e conquistar imóveis, veículos, caminhões, máquinas agrícolas e investimentos com consultoria especializada em todo o Brasil.',
  keywords: [
    'consórcio',
    'consórcio de imóveis',
    'consórcio de veículos',
    'consórcio de caminhões',
    'consórcio rural',
    'Reobote Consórcios',
  ],
  openGraph: {
    title: 'Reobote Consórcios | O consórcio inteligente para conquistar patrimônio',
    description: 'Planejamento financeiro sólido, atendimento nacional e consultoria especializada em consórcios de imóveis, veículos, caminhões e máquinas agrícolas.',
    type: 'website',
    locale: 'pt_BR',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`light ${inter.variable} ${jakarta.variable}`}
    >
      <body>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
