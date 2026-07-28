import Image from 'next/image'
import { Check, PiggyBank, CalendarClock, Landmark, Sparkles } from 'lucide-react'

const benefits = [
  {
    icon: PiggyBank,
    title: 'Sem juros',
    description: 'Você paga apenas a taxa de administração, muito abaixo dos juros de um financiamento.',
  },
  {
    icon: CalendarClock,
    title: 'Parcelas que cabem no bolso',
    description: 'Planos flexíveis e prazos longos para você planejar sem comprometer o orçamento.',
  },
  {
    icon: Landmark,
    title: 'Segurança total',
    description: 'Administradora autorizada e fiscalizada pelo Banco Central do Brasil.',
  },
  {
    icon: Sparkles,
    title: 'Poder de compra à vista',
    description: 'Com a carta de crédito você negocia melhores preços e descontos como quem paga à vista.',
  },
]

const checklist = [
  'Use o crédito como entrada e antecipe a contemplação',
  'Lances livres e embutidos para acelerar a conquista',
  'Atendimento humano do início à realização do sonho',
  'Planos para pessoa física e jurídica',
]

export function Benefits() {
  return (
    <section id="vantagens" className="py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div className="relative order-last lg:order-first">
          <div className="overflow-hidden rounded-3xl border border-border shadow-xl">
            <Image
              src="/images/consultoria.png"
              alt="Consultora da Reobote apresentando um plano de consórcio a um cliente"
              width={680}
              height={640}
              className="h-full w-full object-cover"
            />
          </div>
          <ul className="absolute -right-4 bottom-6 space-y-2 rounded-2xl border border-border bg-background/95 p-4 shadow-lg backdrop-blur sm:-right-6">
            {checklist.slice(0, 2).map((item) => (
              <li key={item} className="flex max-w-[15rem] items-start gap-2 text-sm text-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                <span className="font-medium">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">
            Por que a Reobote
          </p>
          <h2 className="mt-3 text-balance font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            A forma inteligente de conquistar mais pagando menos
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            O consórcio é o caminho de quem planeja o futuro com consciência. Sem juros abusivos
            e com a orientação de especialistas.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {benefits.map((b) => (
              <div key={b.title} className="rounded-2xl border border-border bg-card p-5">
                <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <b.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-heading text-base font-semibold text-foreground">
                  {b.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {b.description}
                </p>
              </div>
            ))}
          </div>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {checklist.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="size-3.5" />
                </span>
                <span className="font-medium leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
