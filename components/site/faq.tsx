'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const faqs = [
  {
    q: 'O consórcio tem juros?',
    a: 'Não. No consórcio você não paga juros. A única cobrança é a taxa de administração, que remunera a administradora pela gestão do grupo — bem menor do que os juros de um financiamento.',
  },
  {
    q: 'Como funcionam as contemplações?',
    a: 'Todos os meses ocorrem contemplações por sorteio e por lance. No sorteio, qualquer participante pode ser contemplado. No lance, quem oferece a maior antecipação de parcelas conquista a carta de crédito mais cedo.',
  },
  {
    q: 'Posso usar a carta de crédito como quiser?',
    a: 'A carta de crédito é usada para adquirir bens ou serviços dentro do segmento contratado. Em imóveis, por exemplo, você pode comprar, construir, reformar ou quitar um financiamento existente.',
  },
  {
    q: 'O que acontece se eu desistir?',
    a: 'Você pode sair do grupo e recebe os valores pagos conforme as regras do contrato, geralmente após o encerramento do grupo ou por contemplação. Nossos consultores explicam todas as condições antes da adesão.',
  },
  {
    q: 'A Reobote é uma empresa segura?',
    a: 'Sim. Operamos com administradoras autorizadas e fiscalizadas pelo Banco Central do Brasil, seguindo todas as normas do setor de consórcios.',
  },
  {
    q: 'Preciso dar entrada?',
    a: 'Não é necessário dar entrada. Você começa a pagar as parcelas mensais e pode ofertar lances quando quiser antecipar a contemplação.',
  },
]

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">Dúvidas</p>
          <h2 className="mt-3 text-balance font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Perguntas frequentes
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {faqs.map((item, i) => {
            const isOpen = open === i
            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-heading text-base font-semibold text-foreground sm:text-lg">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={cn(
                      'size-5 shrink-0 text-muted-foreground transition-transform duration-300',
                      isOpen && 'rotate-180 text-brand',
                    )}
                  />
                </button>
                <div
                  className={cn(
                    'grid transition-all duration-300',
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 text-pretty leading-relaxed text-muted-foreground">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
