import { FileText, Users, Trophy, KeyRound } from 'lucide-react'

const steps = [
  {
    icon: FileText,
    step: '01',
    title: 'Escolha seu plano',
    description:
      'Defina o valor do crédito e o prazo que cabem no seu bolso, junto de um consultor Reobote.',
  },
  {
    icon: Users,
    step: '02',
    title: 'Entre no grupo',
    description:
      'Você se une a um grupo de pessoas com objetivos parecidos, formando um fundo comum, sem juros.',
  },
  {
    icon: Trophy,
    step: '03',
    title: 'Seja contemplado',
    description:
      'Todos os meses há contemplações por sorteio e por lance. Antecipe sua conquista quando quiser.',
  },
  {
    icon: KeyRound,
    step: '04',
    title: 'Realize seu sonho',
    description:
      'Com a carta de crédito em mãos, você compra o bem ou serviço à vista e com poder de negociação.',
  },
]

export function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-secondary/40 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mt-3 text-balance font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simples, transparente e sem juros
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Em quatro passos você entende como o consórcio transforma o seu planejamento em
            realidade.
          </p>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li
              key={s.step}
              className="relative flex flex-col rounded-2xl border border-border bg-card p-7"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="size-6" />
                </span>
                <span className="font-heading text-3xl font-extrabold text-border">
                  {s.step}
                </span>
              </div>
              <h3 className="mt-5 font-heading text-lg font-semibold text-foreground">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {s.description}
              </p>
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-3 top-1/2 hidden size-6 -translate-y-1/2 items-center justify-center lg:flex"
                >
                  <span className="size-2 rounded-full bg-brand" />
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
