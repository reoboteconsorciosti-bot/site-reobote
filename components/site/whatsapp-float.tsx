import { MessageCircle } from 'lucide-react'
import { whatsappLink } from '@/lib/site-config'

export function WhatsappFloat() {
  return (
    <a
      href={whatsappLink('Olá! Vim pelo site e quero falar com um consultor da Reobote.')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-brand px-4 py-3.5 text-sm font-semibold text-brand-foreground shadow-lg transition-transform hover:scale-105 sm:bottom-6 sm:right-6"
    >
      <MessageCircle className="size-5" />
      <span className="hidden sm:inline">Fale conosco</span>
    </a>
  )
}
