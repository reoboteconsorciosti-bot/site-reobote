import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Parceria Reobote × Clube de Benefícios UFMS | 100% off na adesão',
  description:
    'Parceria exclusiva com o Clube de Benefícios da UFMS: 100% de desconto na taxa de adesão em consórcios imobiliários, de investimentos e de automóveis para servidores, aposentados, pensionistas e estudantes.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Parceria Reobote × Clube de Benefícios UFMS',
    description: '100% de desconto na taxa de adesão para a comunidade UFMS.',
    type: 'website',
    locale: 'pt_BR',
  },
}

export default function ParceriaUfmsLayout({ children }: { children: React.ReactNode }) {
  return children
}
