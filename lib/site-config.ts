// Dados de contato — substitua pelos dados oficiais da Reobote Consórcios.
export const siteConfig = {
  name: 'Reobote Consórcios',
  // Número usado nos links do WhatsApp (formato internacional, apenas dígitos).
  whatsapp: '5567981156454',
  whatsappLabel: '(00) 00000-0000',
  phone: '(67) 98115-6454',
  email: 'contato@reoboteconsorcios.com.br',
  address: 'Av. Principal, 1000 — Centro, Sua Cidade — UF',
  instagram: 'https://instagram.com/reoboteconsorcios',
  facebook: 'https://facebook.com/reoboteconsorcios',
  cnpj: '61.554.410/0001-79',
} as const

export function whatsappLink(message?: string) {
  const base = `https://wa.me/${siteConfig.whatsapp}`
  if (!message) return base
  return `${base}?text=${encodeURIComponent(message)}`
}

export const navLinks = [
  { label: 'Início', href: '#inicio' },
  { label: 'Segmentos', href: '#segmentos' },
  { label: 'Vantagens', href: '#vantagens' },
  { label: 'Simulador', href: '#simulador' },
  { label: 'Unidades', href: '#unidades' },
  { label: 'Dúvidas', href: '#faq' },
] as const
