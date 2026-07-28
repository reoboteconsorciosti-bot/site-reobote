import {
  Home,
  Car,
  Truck,
  Tractor,
  Plane,
  Wrench,
  ArrowUpRight,
} from 'lucide-react'
import { whatsappLink } from '@/lib/site-config'

const segments = [
  {
    icon: Home,
    title: 'Imóveis',
    description:
      'Casa, apartamento, terreno, construção ou reforma. Use o crédito para comprar ou quitar financiamentos.',
  },
  {
    icon: Car,
    title: 'Veículos',
    description:
      'Carros novos ou seminovos, motos e utilitários. Escolha o modelo ideal com poder de compra à vista.',
  },
  {
    icon: Truck,
    title: 'Caminhões',
    description:
      'Renove ou amplie sua frota com planos pensados para transportadores e autônomos.',
  },
  {
    icon: Tractor,
    title: 'Máquinas agrícolas',
    description:
      'Tratores, colheitadeiras e implementos para impulsionar a produtividade no campo.',
  },
  {
    icon: Wrench,
    title: 'Serviços',
    description:
      'Reformas, viagens, procedimentos e projetos. Planeje conquistas que vão além de bens.',
  },
  {
    icon: Plane,
    title: 'Pesados & especiais',
    description:
      'Embarcações, aeronaves e equipamentos de alto valor com condições sob medida.',
  },
]

export function Segments() {
  return (
    <section id="segmentos" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">
            Áreas de atuação
          </p>
          <h2 className="mt-3 text-balance font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Um consórcio para cada objetivo
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Seja qual for o seu sonho, temos um plano com a parcela certa para você. Escolha o
            segmento e comece a planejar.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {segments.map((s) => (
            <a
              key={s.title}
              href={whatsappLink(`Olá! Tenho interesse no consórcio de ${s.title}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex flex-col rounded-2xl border border-border bg-card p-7 transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg"
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <s.icon className="size-6" />
              </span>
              <h3 className="mt-5 flex items-center gap-1.5 font-heading text-xl font-semibold text-foreground">
                {s.title}
                <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {s.description}
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
