import Image from 'next/image'
import { ArrowRight, ShieldCheck, TrendingUp, Star } from 'lucide-react'
import { whatsappLink } from '@/lib/site-config'

export function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden pt-24 lg:pt-28">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-60" />
      <div className="pointer-events-none absolute -right-40 -top-40 -z-10 size-[520px] rounded-full bg-accent blur-3xl" />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:py-20 lg:px-8">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3.5 py-1.5 text-xs font-semibold text-secondary-foreground">
            <span className="flex size-1.5 rounded-full bg-brand" />
            Administradora autorizada • Sem juros
          </span>

          <h1 className="mt-6 text-balance font-heading text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Conquiste seus objetivos{' '}
            <span className="text-brand">sem pagar juros</span>
          </h1>

          <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
            Imóveis, veículos, caminhões, máquinas agrícolas e serviços. Com a Reobote
            Consórcios você planeja hoje e realiza amanhã, com parcelas que cabem no seu
            orçamento e total transparência.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#simulador"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110"
            >
              Simular meu consórcio
              <ArrowRight className="size-4" />
            </a>
            <a
              href={whatsappLink('Olá! Quero falar com um consultor da Reobote.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-7 py-3.5 text-base font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              Falar com consultor
            </a>
          </div>

          <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-border pt-8">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Clientes
              </dt>
              <dd className="mt-1 font-heading text-2xl font-bold text-foreground">+12 mil</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Créditos liberados
              </dt>
              <dd className="mt-1 font-heading text-2xl font-bold text-foreground">R$ 800M</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Satisfação
              </dt>
              <dd className="mt-1 flex items-center gap-1 font-heading text-2xl font-bold text-foreground">
                4,9
                <Star className="size-4 fill-brand text-brand" />
              </dd>
            </div>
          </dl>
        </div>

        <div className="relative">
          <div className="relative overflow-hidden rounded-3xl border border-border shadow-xl">
            <Image
              src="/images/hero-familia.png"
              alt="Casal comemorando a conquista da casa própria com a Reobote Consórcios"
              width={720}
              height={820}
              priority
              className="h-full w-full object-cover"
            />
          </div>

          <div className="absolute -bottom-5 -left-4 flex items-center gap-3 rounded-2xl border border-border bg-background/95 px-4 py-3 shadow-lg backdrop-blur sm:-left-6">
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">100% regulamentado</p>
              <p className="text-xs text-muted-foreground">Fiscalizado pelo Banco Central</p>
            </div>
          </div>

          <div className="absolute -right-3 top-8 flex items-center gap-3 rounded-2xl border border-border bg-background/95 px-4 py-3 shadow-lg backdrop-blur sm:top-12">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">Sem juros</p>
              <p className="text-xs text-muted-foreground">Apenas taxa administrativa</p>
            </div>
          </div>
        </div>
      </div>

      <LogoStrip />
    </section>
  )
}

function LogoStrip() {
  const items = ['Banco Central', 'ABAC', 'Reclame Aqui RA1000', 'Proteção patrimonial']
  return (
    <div className="border-y border-border bg-secondary/50">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 py-5 sm:px-6 lg:px-8">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Confiança comprovada
        </span>
        {items.map((item) => (
          <span key={item} className="text-sm font-semibold text-foreground/70">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
