import { MessageCircle, ArrowRight } from 'lucide-react'
import { whatsappLink } from '@/lib/site-config'

export function CtaSection() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12 lg:py-20">
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-brand/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 size-64 rounded-full bg-brand/20 blur-3xl" />

          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-balance font-heading text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              Pronto para realizar o seu próximo objetivo?
            </h2>
            <p className="mt-5 text-pretty text-lg leading-relaxed text-primary-foreground/80">
              Fale agora com um consultor Reobote e descubra o plano ideal para você, sua família
              ou o seu negócio.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href={whatsappLink('Olá! Quero realizar meu objetivo com a Reobote Consórcios.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-7 py-3.5 text-base font-semibold text-brand-foreground transition-all hover:brightness-110"
              >
                <MessageCircle className="size-4" />
                Falar no WhatsApp
              </a>
              <a
                href="#simulador"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-primary-foreground/25 bg-primary-foreground/5 px-7 py-3.5 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
              >
                Simular consórcio
                <ArrowRight className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
