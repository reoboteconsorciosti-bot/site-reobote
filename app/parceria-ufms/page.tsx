'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Home,
  Car,
  Layers,
  ArrowRight,
  ChevronRight,
  Users,
  GraduationCap,
  Plus,
  Gift,
  MapPin,
  TrendingUp,
  IdCard,
  FileCheck2,
  PiggyBank,
  Play,
  X,
  Headset,
  ArrowUpRight,
} from 'lucide-react'
import { Simulator, type SimuladorPayload } from '@/components/site/simulator'
import { Testimonials } from '@/components/site/testimonials'
import * as fpixel from '@/lib/fpixel'
import { cn } from '@/lib/utils'

// ─── Consultor dedicado da parceria (Santarosa) ─────────────────────────────
// Formato internacional, só dígitos — mesmo padrão de lib/site-config.ts.
const SANTAROSA_WHATSAPP = '5567981860175'

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

// Mensagem pré-preenchida que chega pronta pro consultor Santarosa assim que
// o lead termina a simulação — usa os mesmos dados que o simulador já
// coletou (tipo, valor, nome), sem pedir nada de novo pro usuário.
function montarMensagemSantarosa(payload: SimuladorPayload) {
  return [
    `Olá Santarosa! Sou da parceria UFMS.`,
    `Simulei um consórcio de ${payload.tipoConsórcio} no valor de ${formatBRL(payload.valorDesejado)}.`,
    `Meu nome é ${payload.nome}.`,
    `Podemos conversar sobre as condições?`,
  ].join(' ')
}

function santarosaLink(texto: string) {
  return `https://wa.me/${SANTAROSA_WHATSAPP}?text=${encodeURIComponent(texto)}`
}

// Logo real do WhatsApp (mesmo path usado no botão flutuante e no
// simulator.tsx) — em vez do ícone de balão de chat genérico do lucide, que
// não é reconhecível como WhatsApp à primeira vista.
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.39a9.9 9.9 0 004.76 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.05c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.1.11-1.77-.11-.41-.13-.94-.3-1.62-.6-2.85-1.23-4.71-4.1-4.85-4.29-.14-.19-1.16-1.54-1.16-2.94s.72-2.08.98-2.37c.25-.28.55-.35.74-.35.19 0 .37 0 .53.01.17.01.4-.06.62.48.24.58.81 2 .88 2.14.07.14.11.31.02.5-.08.19-.13.31-.26.47-.13.16-.27.36-.39.48-.13.13-.26.27-.11.53.14.26.64 1.07 1.38 1.74.95.86 1.76 1.13 2.02 1.26.26.13.41.11.56-.07.16-.18.65-.77.83-1.03.18-.26.35-.22.6-.13.24.09 1.55.74 1.82.88.26.13.44.19.5.3.06.11.06.66-.18 1.34z" />
    </svg>
  )
}

// Endereço do espaço físico da Reobote informado na página oficial do Clube
// de Benefícios da UFMS.
const ENDERECO = 'Av. Toros Puxian, nº 1019, Vila Morumbi, Campo Grande/MS'
const MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ENDERECO)}`

// Vídeo vertical (YouTube Shorts) do Marcelo Souza, Diretor Comercial e
// Fundador da Reobote, apresentando a parceria. nocookie = sem cookies de
// rastreamento antes do clique, mesmo domínio usado em testimonials.tsx.
const FUNDADOR_VIDEO_ID = '2E9TLh2ok_4'
const FUNDADOR_VIDEO_THUMB = `https://i.ytimg.com/vi/${FUNDADOR_VIDEO_ID}/hqdefault.jpg`

const faqItems = [
  {
    q: 'Quem tem direito ao benefício da parceria?',
    a: 'Servidores ativos, servidores aposentados e pensionistas, e estudantes da UFMS regularmente matriculados, em qualquer campus.',
  },
  {
    q: 'Qual é o desconto oferecido pela parceria?',
    a: '100% de desconto na taxa de adesão para consórcios imobiliários, de investimentos e de automóveis.',
  },
  {
    q: 'Que documento eu preciso apresentar?',
    a: 'Basta levar, no momento do atendimento, a Carteira de Identidade Funcional (física ou digital), a Carteira Estudantil ou outro documento oficial equivalente que comprove seu vínculo com a UFMS.',
  },
  {
    q: 'O consórcio tem juros?',
    a: 'Não. O consórcio é uma poupança coletiva regulamentada pelo Banco Central. Fora da taxa de adesão (zerada nesta parceria), você paga apenas a taxa administrativa, sem juros de financiamento.',
  },
  {
    q: 'Como falo com o consultor da parceria?',
    a: 'Ao final da simulação nesta página, o botão leva direto para o WhatsApp do consultor Santarosa, já com seus dados preenchidos na mensagem. Você também pode visitar o espaço físico da Reobote.',
  },
]

export default function ParceriaUfmsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [fundadorVideoPlaying, setFundadorVideoPlaying] = useState(false)

  // CTA sticky mobile "Simular meu consórcio" — só flutua quando o CTA de
  // mesmo texto no hero NÃO está visível na tela, pra nunca duplicar a
  // mesma chamada em dois lugares ao mesmo tempo. Some deslizando pra baixo
  // assim que o CTA do hero entra em vista e volta deslizando de baixo pra
  // cima quando ele sai de vista.
  const heroSimularRef = useRef<HTMLAnchorElement | null>(null)
  const [ctaStickyVisivel, setCtaStickyVisivel] = useState(false)

  useEffect(() => {
    const el = heroSimularRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => setCtaStickyVisivel(!entry.isIntersecting),
      { threshold: 0.2 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Header: começa opaco e "cheio" no topo; assim que o usuário rola pra
  // baixo, encolhe e vira translúcido com blur — mantém um fundo escuro por
  // trás do blur (não 100% transparente) pra não lavar a logo branca quando
  // a seção atrás for clara, o mesmo problema que o header opaco original
  // evitava.
  const [headerScrolled, setHeaderScrolled] = useState(false)

  useEffect(() => {
    const aoRolar = () => setHeaderScrolled(window.scrollY > 24)
    aoRolar()
    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => window.removeEventListener('scroll', aoRolar)
  }, [])

  // Logo Reobote (e a da UFMS) somem quando o header fica translúcido/com
  // blur em cima de uma seção clara — a versão branca não tem contraste
  // nenhum contra fundo branco. Em vez de só alternar opaco↔blur, detectamos
  // de verdade qual seção está passando por baixo do header nesse instante
  // (cada <section> ganhou um data-header-theme="dark"|"light" acima) e
  // trocamos pro par de SVG que o resto do site já usa pra isso
  // (icon.svg/icon-dark.svg, ver app/page.tsx) — sem precisar analisar
  // pixel de fundo, que não funciona com os gradientes Tailwind usados nas
  // seções (background-image, não background-color).
  const [headerSobreClaro, setHeaderSobreClaro] = useState(false)

  useEffect(() => {
    const secoes = Array.from(document.querySelectorAll<HTMLElement>('[data-header-theme]'))
    if (secoes.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Entre as seções que cruzam a faixa observada agora (ver
        // rootMargin — uma linha fina logo abaixo do header), a mais alta
        // na tela é a que está de fato por baixo dele neste instante.
        const visiveis = entries.filter((e) => e.isIntersecting)
        if (visiveis.length === 0) return
        const atual = visiveis.reduce((a, b) => (a.boundingClientRect.top > b.boundingClientRect.top ? a : b))
        setHeaderSobreClaro(atual.target.getAttribute('data-header-theme') === 'light')
      },
      // Faixa fina próxima do topo, logo abaixo da altura máxima do header
      // (80px) — não precisa ser exata, só saber qual seção está ali.
      { rootMargin: '-80px 0px -85% 0px', threshold: 0 }
    )

    secoes.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* ---------- HEADER — enxuto de propósito: sem menu completo, para não
          desviar atenção do objetivo único desta página (simular e falar
          com o consultor). No topo fica opaco e "cheio"; ao rolar, encolhe
          e vira translúcido com blur, deixando só logos + botão em
          destaque. bg-[#0d172e]/80 (não 100% transparente) + backdrop-blur
          — mantém contraste pra logo branca mesmo com seção clara atrás,
          em vez de um blur "vazado" que lavava a logo. ---------- */}
      <header
        className={cn(
          'fixed top-0 inset-x-0 z-50 border-b transition-all duration-300',
          headerScrolled
            ? 'bg-[#0d172e]/45 backdrop-blur-[48px] border-white/10 shadow-lg shadow-black/20'
            : 'bg-[#0d172e] border-white/5'
        )}
      >
        <div
          className={cn(
            'max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between transition-all duration-300',
            headerScrolled ? 'h-14 sm:h-16' : 'h-16 sm:h-20'
          )}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img
              src={headerSobreClaro ? '/images/abertura/icon-dark.svg' : '/images/abertura/icon.svg'}
              alt="Reobote Consórcios"
              className={cn('w-auto shrink-0 transition-all duration-300', headerScrolled ? 'h-7 sm:h-9' : 'h-9 sm:h-12')}
            />
            <span className={cn('text-xl font-light shrink-0 transition-colors duration-300', headerSobreClaro ? 'text-slate-900/25' : 'text-white/30')}>
              ×
            </span>
            <img
              src="/logo-ufms.png"
              alt="UFMS"
              className={cn(
                'w-auto shrink-0 transition-all duration-300',
                headerScrolled ? 'h-8 sm:h-10' : 'h-10 sm:h-14',
                // Mesmo problema da logo Reobote: forçada em branco
                // (brightness-0 invert) ela some contra fundo claro — só
                // inverte quando o header está sobre seção escura.
                !headerSobreClaro && 'brightness-0 invert'
              )}
            />
          </div>
          <a
            href={santarosaLink('Olá Santarosa! Vim pela parceria UFMS e gostaria de falar sobre consórcio.')}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => fpixel.event('Contact', { content_name: 'Header - Falar com Santarosa' })}
            className={cn(
              'inline-flex items-center gap-1.5 sm:gap-2 bg-[#009CDE] hover:bg-[#008cc7] text-white text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 shrink-0',
              headerScrolled ? 'px-3 sm:px-4 py-2 sm:py-2.5' : 'px-3.5 sm:px-5 py-2.5 sm:py-3'
            )}
          >
            <WhatsAppIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Falar no WhatsApp</span>
            <span className="sm:hidden">WhatsApp</span>
          </a>
        </div>
      </header>

      <main>
        {/* ---------- HERO ---------- */}
        {/* Gradiente de cima pra baixo, percorrendo a seção inteira (não só
            os primeiros 50%) — a versão anterior (via/to iguais a 50%)
            resolvia pra plano cedo demais e quase não aparecia. Termina
            EXATAMENTE em #0d172e (mesmo tom do Simulador/Banner logo
            abaixo), pra não criar costura na virada de seção. */}
        <section data-header-theme="dark" className="relative bg-gradient-to-b from-[#1b2f57] to-[#0d172e] text-white overflow-hidden pt-24 pb-14 sm:pt-32 sm:pb-20">
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-blue-500/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-[320px] h-[320px] bg-cyan-400/10 rounded-full blur-[100px]" />
          </div>

          {/* No mobile é uma coluna só, na ordem de leitura de sempre
              (selo → título → gancho → vídeo → CTAs → selo de confiança).
              No desktop (lg+) vira grid de 2 colunas: o vídeo assume a
              coluna da direita e passa a ocupar as duas "linhas" de texto
              (block A em cima, block C embaixo) por row-span — o mesmo
              vídeo, sem duplicar nada, só reposicionado via CSS. */}
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 xl:gap-20 items-center">

              {/* BLOCK A — selo + título + gancho */}
              <div className="order-1 lg:order-1 lg:col-start-1 lg:row-start-1 text-center lg:text-left">
                {/* Título em duas linhas com pesos/tamanhos diferentes — cria
                    ritmo visual sem depender do parágrafo abaixo pra "explicar"
                    o benefício (isso já fica dito ali em cima e no vídeo). */}
                <h1 className="font-extrabold tracking-tight mb-4">
                  <span className="block text-[1.65rem] leading-[1.2] sm:text-4xl md:text-5xl sm:leading-[1.15] text-white">
                    Consórcio com condições exclusivas
                  </span>
                  <span className="block text-4xl leading-[1.15] sm:text-5xl md:text-6xl mt-1 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                    pra quem é UFMS
                  </span>
                </h1>

                {/* Gancho curto — sem repetir "quem tem direito" nem o "100%
                    desconto" (isso o vídeo logo abaixo e as seções de Vantagem
                    Exclusiva / Quem Tem Direito já cobrem em detalhe). Só empurra
                    pras duas ações que o lead realmente quer: assistir e simular. */}
                <p className="text-slate-300 text-sm sm:text-lg leading-relaxed max-w-md mx-auto lg:mx-0">
                  Assista ao vídeo e simule seu consórcio sem juros em poucos minutos.
                </p>
              </div>

              {/* BLOCK B — vídeo vertical do fundador: thumbnail + play até o
                  clique, pra não carregar o iframe do YouTube antes de
                  precisar. Ao tocar, o card cresce (melhor visualização); o X
                  fecha, para e encolhe de volta. O play/pause nativo do
                  player do YouTube continua funcionando normalmente dentro
                  do vídeo — só não dá pra sincronizar o tamanho do card com
                  ele sem a API de postMessage do YouTube, então quem
                  controla o tamanho é sempre o nosso botão (abrir/fechar),
                  não o pause interno. No mobile fica entre o gancho e os
                  CTAs (order-2); no desktop vira a coluna da direita,
                  span-2 nas linhas do bloco A + bloco C, vertical-centralizado
                  ao lado do texto. */}
              <div className="order-2 lg:order-2 lg:col-start-2 lg:row-start-1 lg:row-span-2 flex flex-col items-center justify-center gap-3 mb-8 lg:mb-0">
                <span className="text-[11px] font-bold uppercase tracking-widest text-blue-400">
                  Assista em 1 minuto
                </span>

                {/* Moldura estilo iPhone ao redor do vídeo — dá a sensação de
                    "conteúdo de celular" (reels/stories), reforçando que é um
                    vídeo vertical de verdade e não só um banner. Ilha
                    dinâmica, barra de gestos e botões laterais são só
                    decoração via CSS, sem função — a lógica de play/close
                    do vídeo continua toda dentro da "tela" (div com
                    aspect-[9/19.5], proporção real de tela de iPhone —
                    9/16 ficava curto/largo demais, "gordo" para um frame
                    de celular), intacta. */}
                <div className="relative">
                  <span className="absolute -left-[2px] top-[84px] w-[3px] h-[30px] bg-slate-700/80 rounded-l-sm" />
                  <span className="absolute -left-[2px] top-[126px] w-[3px] h-[50px] bg-slate-700/80 rounded-l-sm" />
                  <span className="absolute -right-[2px] top-[104px] w-[3px] h-[62px] bg-slate-700/80 rounded-r-sm" />

                  <div
                    className={cn(
                      'relative rounded-[2.6rem] bg-[#0b0b0d] p-[10px] shadow-2xl shadow-black/50 ring-1 ring-white/10 transition-all duration-500 ease-out',
                      fundadorVideoPlaying ? 'w-[68vw] max-w-[270px] lg:w-[255px] lg:max-w-[255px]' : 'w-[190px] sm:w-[220px] lg:w-[235px]'
                    )}
                  >
                    <div className="relative aspect-[9/19.5] rounded-[2rem] overflow-hidden bg-slate-900">
                      {fundadorVideoPlaying ? (
                        <>
                          <iframe
                            className="w-full h-full"
                            src={`https://www.youtube-nocookie.com/embed/${FUNDADOR_VIDEO_ID}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                            title="Marcelo Souza apresenta a parceria Reobote × UFMS"
                            allow="autoplay; encrypted-media; picture-in-picture"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                          />
                          <button
                            type="button"
                            onClick={() => setFundadorVideoPlaying(false)}
                            aria-label="Fechar vídeo"
                            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white flex items-center justify-center transition-colors cursor-pointer z-30"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setFundadorVideoPlaying(true)
                            fpixel.event('ViewContent', { content_name: 'Hero UFMS - Vídeo Fundador' })
                          }}
                          className="absolute inset-0 w-full h-full group cursor-pointer"
                          aria-label="Assistir vídeo de Marcelo Souza sobre a parceria UFMS"
                        >
                          <img
                            src={FUNDADOR_VIDEO_THUMB}
                            alt="Marcelo Souza, Diretor Comercial e Fundador da Reobote"
                            loading="lazy"
                            decoding="async"
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/25 group-hover:bg-black/40 transition-colors" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-[#009CDE] text-white flex items-center justify-center shadow-lg shadow-[#009CDE]/30 transform group-hover:scale-110 transition-transform duration-300 relative">
                              <span className="absolute inset-0 rounded-full bg-[#009CDE] animate-ping opacity-25" />
                              <Play className="w-6 h-6 fill-current ml-0.5" />
                            </div>
                          </div>
                          <span className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 pb-5 text-left">
                            <span className="block text-white text-xs font-bold">Marcelo Souza</span>
                            <span className="block text-slate-300 text-[10px]">Diretor Comercial e Fundador</span>
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Ilha dinâmica */}
                    <div className="absolute top-[10px] inset-x-0 mx-auto w-[64px] h-[18px] bg-black rounded-full z-20 pointer-events-none" />
                    {/* Barra de gestos */}
                    <div className="absolute bottom-[16px] inset-x-0 mx-auto w-[84px] h-[4px] bg-white/70 rounded-full z-20 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* BLOCK C — CTAs + selo de confiança. No mobile vem depois do
                  vídeo (order-3); no desktop volta pra coluna do texto,
                  embaixo do bloco A — junto os dois fecham a mesma altura
                  do vídeo ao lado (row-span-2 do bloco B). */}
              <div className="order-3 lg:order-3 lg:col-start-1 lg:row-start-2 text-center lg:text-left">
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mb-10">
                  <a
                    ref={heroSimularRef}
                    href="#simulador"
                    onClick={() => fpixel.event('ViewContent', { content_name: 'Hero UFMS - Simular Consórcio' })}
                    className="w-full sm:w-auto bg-gradient-to-b from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white font-bold text-sm px-8 py-4 rounded-xl shadow-lg shadow-[#009CDE]/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    Simular meu consórcio
                    <ChevronRight className="w-4 h-4" />
                  </a>
                  <a
                    href={santarosaLink('Olá Santarosa! Vim pela parceria UFMS e gostaria de falar sobre consórcio.')}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => fpixel.event('Contact', { content_name: 'Hero UFMS - Falar com Consultor' })}
                    className="w-full sm:w-auto bg-white/5 backdrop-blur-sm hover:bg-white/10 text-white border border-white/10 font-bold text-sm px-6 py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <WhatsAppIcon className="w-4 h-4 text-emerald-400" />
                    Falar com o consultor
                  </a>
                </div>

                {/* Selo de confiança em grid com divisórias — mais estruturado
                    no mobile do que o texto corrido separado por "|", que
                    quebrava linha de forma desalinhada em telas estreitas. */}
                <div className="grid grid-cols-3 w-full max-w-xs sm:max-w-sm mx-auto lg:mx-0 divide-x divide-white/10 border-t border-white/10 pt-5">
                  <div className="text-center px-1">
                    <div className="text-white font-extrabold text-sm sm:text-lg">12 anos</div>
                    <div className="text-slate-400 text-[10px] sm:text-xs mt-0.5 leading-tight">de mercado</div>
                  </div>
                  <div className="text-center px-1">
                    <div className="text-white font-extrabold text-sm sm:text-lg">+4.000</div>
                    <div className="text-slate-400 text-[10px] sm:text-xs mt-0.5 leading-tight">clientes atendidos</div>
                  </div>
                  <div className="text-center px-1">
                    <div className="text-white font-extrabold text-sm sm:text-lg">R$1,5 bi</div>
                    <div className="text-slate-400 text-[10px] sm:text-xs mt-0.5 leading-tight">em carteira</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ---------- SIMULADOR — logo abaixo do hero, pra capturar o lead
            com a atenção ainda no topo. CTA final vai para o WhatsApp do
            Santarosa, nunca para o número geral da Reobote (ver
            whatsappOverride). ---------- */}
        {/* Mesmo #0d172e do hero: agora que o simulador ficou colado nele,
            usar o #070b13 do simulador da home criaria um degradê estranho
            (escuro → um pouco mais escuro → escuro de novo) antes da seção
            clara. Assim vira um único bloco escuro contínuo. */}
        <section id="simulador" data-header-theme="dark" className="py-14 sm:py-20 bg-[#0d172e] border-t border-b border-white/5 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            {/* Mesmo padrão de 2 colunas do hero: no mobile o texto vem
                empilhado acima do simulador (ordem de sempre); no desktop
                (lg+) o texto vai pra esquerda e o simulador pra direita,
                lado a lado. Coluna do simulador um pouco mais larga
                (0.9fr/1.1fr) porque o card do simulador já tem até 540px
                de largura própria (.perspective-container). */}
            <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 xl:gap-20 items-center">
              <div className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0 mb-10 lg:mb-0">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Simulador Online</span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mt-3">
                  Simule agora e fale direto com o consultor da parceria.
                </h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed mt-3">
                  Ao final, você já sai direto no WhatsApp do Santarosa, com sua simulação pronta na mensagem.
                </p>
              </div>
              <div className="flex justify-center">
                <Simulator
                  origemLabel="Parceria UFMS - Landing /parceria-ufms"
                  whatsappOverride={{ telefone: SANTAROSA_WHATSAPP, montarMensagem: montarMensagemSantarosa }}
                  webhookEndpoint="/api/simulador-webhook-ufms"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ---------- VANTAGEM EXCLUSIVA: o benefício central da parceria,
            em destaque logo abaixo do hero (é o principal gatilho de
            conversão vindo da página oficial da UFMS). ---------- */}
        {/* Mesmo tom do hero (#0d172e) — continua o bloco escuro sem costura
            visível, em vez de um preto genérico do Tailwind (slate-950) que
            destoava do navy usado no resto do site. */}
        <section data-header-theme="dark" className="bg-[#0d172e] py-10 sm:py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#009CDE] to-[#006b99] p-6 sm:p-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/10 blur-3xl pointer-events-none" />
              <div className="relative shrink-0 w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <div className="relative flex-1">
                <span className="text-[11px] font-bold uppercase tracking-widest text-white/80">Vantagem exclusiva para a comunidade UFMS</span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
                  100% de desconto na taxa de adesão em consórcios imobiliários, de investimentos e de automóveis.
                </h2>
              </div>
              <a
                href="#simulador"
                onClick={() => fpixel.event('ViewContent', { content_name: 'Banner Vantagem UFMS - Simular' })}
                // Não usa .btn-white daqui: seu hover troca pra fundo azul,
                // que aqui somaria com o próprio gradiente azul do banner e
                // o botão sumiria. Feedback de hover fica só num leve cinza.
                className="relative shrink-0 w-full sm:w-auto bg-white hover:bg-gray-50 text-[#006b99] font-bold text-sm px-6 py-3.5 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Quero esse desconto
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* ---------- VANTAGENS DA PARCERIA (inclui "quem tem direito") ----------
            Antes eram 2 seções seguidas com o mesmo layout — grid de 3
            cards — uma pra elegibilidade e outra pra benefícios. Lado a
            lado, liam como a mesma informação repetida duas vezes. Aqui
            "quem tem direito" virou uma faixa compacta de chips logo
            abaixo do título, e os 3 cards grandes ficam só pros
            benefícios de verdade — um heading só, uma seção só. */}
        <section data-header-theme="light" className="bg-soft py-14 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-6">
              <span className="section-tag justify-center">Vantagens da parceria</span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#313335] tracking-tight mt-3">
                Feito para a rotina de quem estuda e trabalha na UFMS.
              </h2>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 mb-10 sm:mb-14">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mr-1">Vale para</span>
              {[
                { label: 'Servidores ativos', Icon: Users },
                { label: 'Aposentados e pensionistas', Icon: PiggyBank },
                { label: 'Estudantes da UFMS', Icon: GraduationCap },
              ].map(({ label, Icon }) => (
                <span key={label} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full pl-2 pr-3.5 py-1.5 text-xs font-semibold text-[#313335]">
                  <span className="w-5 h-5 rounded-full bg-[#009CDE]/8 text-[#006b99] flex items-center justify-center shrink-0">
                    <Icon className="w-3 h-3" />
                  </span>
                  {label}
                </span>
              ))}
            </div>

            {/* dif-card/dif-icon são classes globais (compartilhadas com o
                site institucional) — o `!` força a sobrescrita só aqui
                nesta página, sem mexer no CSS global (não afeta a home). */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="dif-card relative !overflow-hidden !bg-gradient-to-br !from-white !to-[#dbf0fb]">
                <div className="dif-icon !bg-gradient-to-br !from-[#1aaee6] !to-[#006b99] !text-white shadow-lg shadow-[#009CDE]/35">
                  <Headset className="w-6 h-6" />
                </div>
                <h3>Consultor dedicado</h3>
                <p>Atendimento direto com o consultor Santarosa, especialista na parceria UFMS, sem fila e sem intermediários.</p>
              </div>
              <div className="dif-card relative !overflow-hidden !bg-gradient-to-br !from-white !to-[#dbf0fb]">
                <div className="dif-icon !bg-gradient-to-br !from-[#1aaee6] !to-[#006b99] !text-white shadow-lg shadow-[#009CDE]/35">
                  <Gift className="w-6 h-6" />
                </div>
                <h3>100% off na taxa de adesão</h3>
                <p>Válido para consórcios imobiliários, de investimentos e de automóveis contratados pela comunidade UFMS.</p>
              </div>
              <div className="dif-card relative !overflow-hidden !bg-gradient-to-br !from-white !to-[#dbf0fb]">
                <div className="dif-icon !bg-gradient-to-br !from-[#1aaee6] !to-[#006b99] !text-white shadow-lg shadow-[#009CDE]/35">
                  <IdCard className="w-6 h-6" />
                </div>
                <h3>Fácil de comprovar</h3>
                <p>Basta apresentar sua carteira funcional ou estudantil no atendimento. Sem burocracia extra.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- COMO GARANTIR O BENEFÍCIO ---------- */}
        {/* bg-white (não bg-soft) — a seção anterior já ficou bg-soft depois
            do merge com "quem tem direito"; sem isso viravam duas seções
            claras iguais coladas, quebrando a alternância clara/branca. */}
        <section data-header-theme="light" className="bg-white py-14 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="section-tag justify-center">Como garantir seu desconto</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#313335] tracking-tight mt-3">
                Simples assim, em duas etapas.
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-white border border-gray-200 rounded-2xl p-5 flex gap-4">
                <span className="shrink-0 w-9 h-9 rounded-full bg-[#009CDE] text-white font-extrabold text-sm flex items-center justify-center">1</span>
                <div>
                  <h3 className="text-sm font-bold text-[#313335] mb-1">Simule seu consórcio</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">Escolha o valor e o tipo de consórcio no simulador logo abaixo.</p>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-5 flex gap-4">
                <span className="shrink-0 w-9 h-9 rounded-full bg-[#009CDE] text-white font-extrabold text-sm flex items-center justify-center">2</span>
                <div>
                  <h3 className="text-sm font-bold text-[#313335] mb-1">Apresente seu vínculo com a UFMS</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">No atendimento com o Santarosa, mostre um dos documentos abaixo.</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2.5">
              {[
                { label: 'Carteira funcional (física ou digital)', Icon: IdCard },
                { label: 'Carteira estudantil', Icon: GraduationCap },
                { label: 'Documento oficial equivalente', Icon: FileCheck2 },
              ].map(({ label, Icon }) => (
                <span key={label} className="inline-flex items-center gap-2 bg-white border border-gray-200 text-[#313335] text-xs font-semibold px-4 py-2.5 rounded-full">
                  <Icon className="w-3.5 h-3.5 text-[#009CDE]" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- SEGMENTOS — mesmos 4 cards de sempre (Imóvel, Automóvel,
            Investimento, Outros), na visualização do componente Segments do
            site institucional (components/site/segments.tsx): card claro,
            título + descrição, seta some/aparece no hover — só que com foto
            no topo em vez do badge de ícone (mais forte visualmente que
            ícone puro). "Investimento" segue sem foto dedicada no banco de
            imagens do site — mantém o fallback em gradiente com ícone.
            Detalhe à parte da versão do site institucional: o selo "100%
            off" nos segmentos elegíveis pela parceria. ---------- */}
        {/* bg-soft — "Como garantir" logo acima já é branca; sem isso viravam
            duas seções brancas coladas de novo. */}
        <section data-header-theme="light" className="bg-soft py-14 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="section-tag justify-center">O que dá pra conquistar</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#313335] tracking-tight mt-3">
                Um único simulador, vários objetivos.
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                O desconto de 100% na taxa de adesão vale para imóvel, investimento e automóvel. Os demais segmentos também podem ser simulados normalmente.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {[
                {
                  label: 'Imóvel',
                  img: '/images/consorcio/casa.avif',
                  Icon: Home,
                  desconto: true,
                  description: 'Casa, apartamento, terreno ou reforma.',
                },
                {
                  label: 'Automóvel',
                  img: '/images/consorcio/haval-h6-hev-2023.jpg',
                  Icon: Car,
                  desconto: true,
                  description: 'Carro novo ou seminovo, à vista, sem financiamento tradicional.',
                },
                {
                  label: 'Investimento',
                  img: null,
                  Icon: TrendingUp,
                  desconto: true,
                  description: 'Construa patrimônio com aportes programados, sem juros.',
                },
                {
                  label: 'Outros segmentos',
                  img: '/images/consorcio/post_thumbnail-92a23fafe8ad0a93598b44db4be69621.jpg',
                  Icon: Layers,
                  desconto: false,
                  description: 'Caminhões, máquinas agrícolas e serviços também podem ser simulados, fora da promoção de adesão.',
                },
              ].map(({ label, img, Icon, desconto, description }) => (
                <a
                  key={label}
                  href="#simulador"
                  onClick={() => fpixel.event('ViewContent', { content_name: `Segmento UFMS - ${label}` })}
                  className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white overflow-hidden transition-all hover:-translate-y-1 hover:border-[#009CDE]/40 hover:shadow-lg"
                >
                  <div className="relative h-36 sm:h-40 overflow-hidden shrink-0">
                    {img ? (
                      <img
                        src={img}
                        alt={label}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#0d172e] to-[#070b13] flex items-center justify-center">
                        <Icon className="w-10 h-10 text-white/15 group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}
                    {desconto && (
                      <span className="absolute top-3 right-3 bg-[#009CDE] text-white text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shadow-sm">
                        100% off
                      </span>
                    )}
                  </div>
                  <div className="p-5 sm:p-6">
                    <h3 className="flex items-center gap-1.5 text-lg font-extrabold text-[#313335] tracking-tight">
                      {label}
                      <ArrowUpRight className="w-4 h-4 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" />
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                      {description}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- DEPOIMENTOS (prova social real da Reobote) ---------- */}
        {/* wrapper só pra dar um marcador de tema pro header (ver
            data-header-theme) sem precisar tocar no componente
            compartilhado — o fundo real (#0a0f1d) continua vindo de dentro
            do próprio Testimonials. */}
        <div data-header-theme="dark">
          <Testimonials />
        </div>

        {/* ---------- QUEM SOMOS (condensado) ---------- */}
        <section data-header-theme="dark" className="relative overflow-hidden bg-[#050b14] text-white py-16 sm:py-24">
          {/* Foto real da parede/recepção da Reobote — desfocada, em
              opacidade baixa, com vinheta radial por cima (mais visível no
              centro, some nas bordas pro tom sólido da seção). Dá textura
              de marca atrás do texto sem brigar com a leitura — o fundo é
              claro na foto original, então opacidade baixa é o que garante
              contraste pro texto branco em cima. */}
          <img
            src="/images/quemsomos/reobote.png"
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover blur-md scale-110 opacity-25"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at center, transparent 0%, #050b14 78%)' }}
          />
          <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <div className="badge-tag inline-block">
              <span>● QUEM É A REOBOTE</span>
            </div>
            <h2 className="main-title !text-2xl sm:!text-3xl mt-4">
              Transparência, solidez e <span className="highlight-blue">compromisso</span> com o seu futuro.
            </h2>
            <blockquote className="quote-box text-left mt-6">
              Inspirado no significado bíblico de 'lugares amplos' e 'prosperidade', nosso propósito é abrir
              caminhos de abundância para quem escolhe crescer com estratégia.
            </blockquote>
            <p className="description-text mt-4">
              Com <strong>12 anos de atuação</strong>, a Reobote Consórcios acumula <strong>mais de R$1,5 bi em carteira</strong> sob gestão
              e <strong>mais de 4 mil clientes atendidos</strong> em todo o Brasil. Agora com atendimento dedicado pra comunidade UFMS.
            </p>
            <a
              href={santarosaLink('Olá Santarosa! Vim pela parceria UFMS e gostaria de falar sobre consórcio.')}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => fpixel.event('Lead', { content_name: 'Quem Somos UFMS - Falar com Santarosa' })}
              className="btn-cta mt-6"
            >
              Falar com o consultor da parceria
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* ---------- VENHA NOS VISITAR ---------- */}
        <section data-header-theme="light" className="bg-white py-14 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="bg-soft border border-gray-100 rounded-3xl p-6 sm:p-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-8 text-center sm:text-left">
              <div className="shrink-0 w-14 h-14 rounded-2xl bg-[#009CDE]/8 text-[#006b99] flex items-center justify-center">
                <MapPin className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#009CDE]">Venha nos visitar</span>
                <h2 className="text-lg sm:text-xl font-extrabold text-[#313335] tracking-tight mt-1 mb-1">{ENDERECO}</h2>
                <p className="text-sm text-slate-500">Descubra a melhor forma de investir no seu futuro sem pagar juros abusivos. Visite nosso espaço ou fale pelo WhatsApp.</p>
              </div>
              <div className="shrink-0 flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
                <a
                  href={MAPS_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => fpixel.event('ViewContent', { content_name: 'Visita UFMS - Ver no Mapa' })}
                  className="btn btn-secondary btn-sm justify-center"
                >
                  Ver no mapa
                </a>
                <a
                  href={santarosaLink('Olá Santarosa! Vim pela parceria UFMS e gostaria de visitar o espaço da Reobote.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => fpixel.event('Contact', { content_name: 'Visita UFMS - WhatsApp' })}
                  className="btn btn-primary btn-sm justify-center"
                >
                  Falar no WhatsApp
                </a>
              </div>
            </div>

            <div className="mt-6 rounded-3xl overflow-hidden border border-gray-100 h-[320px] sm:h-[380px]">
              <iframe
                src={`https://www.google.com/maps?q=${encodeURIComponent(ENDERECO)}&output=embed`}
                title={`Mapa — ${ENDERECO}`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section data-header-theme="light" className="bg-soft py-16 sm:py-20">
          <div className="container">
            <div className="section-head center text-center max-w-2xl mx-auto mb-10">
              <span className="section-tag justify-center">Dúvidas frequentes</span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
                Perguntas sobre a parceria UFMS.
              </h2>
            </div>
            <div className="faq-list">
              {faqItems.map((item, index) => {
                const isOpen = openFaq === index
                return (
                  <div key={item.q} className={`faq-item ${isOpen ? 'open' : ''}`}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="faq-q w-full text-left bg-transparent border-0"
                    >
                      <span>{item.q}</span>
                      <div className="plus">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </button>
                    <div className="faq-a" style={{ maxHeight: isOpen ? '260px' : '0' }}>
                      <div className="faq-a-inner">{item.a}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </main>

      {/* ---------- FOOTER — minimalista de propósito: página de conversão,
          sem links institucionais que levariam o lead pra fora do funil. ---------- */}
      <footer className="!pt-10 !pb-24 lg:!pb-10">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <img src="/images/logo/LOGO-BRANCA.png" alt="Reobote Consórcios" loading="lazy" decoding="async" className="footer-logo !mb-0 !h-6" />
            <span className="text-xs text-[#7c838a] text-center">
              © 2026 Reobote Consórcios · Parceria UFMS · Todos os direitos reservados.
            </span>
            <a
              href="https://www.termsfeed.com/live/679b12e6-b61e-4330-bfb2-c164bd25b8d3"
              className="text-xs text-[#9aa1a8] hover:text-white transition-colors"
            >
              Política de Privacidade
            </a>
          </div>
        </div>
      </footer>

      {/* ---------- WHATSAPP FLUTUANTE — coerente com o CTA: sempre Santarosa. ---------- */}
      <a
        href={santarosaLink('Olá Santarosa! Vim pela parceria UFMS e gostaria de falar sobre consórcio.')}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => fpixel.event('Lead', { content_name: 'Botão Flutuante WhatsApp UFMS' })}
        // Some no mobile: a barra fixa "Simular meu consórcio" já cobre o
        // rodapé da tela lá embaixo, e o círculo flutuante ficaria colado
        // em cima dela. Só reaparece no desktop, onde a barra não existe.
        className="wa-float !hidden lg:!flex"
        aria-label="Falar com o consultor Santarosa no WhatsApp"
      >
        <WhatsAppIcon className="w-7 h-7 text-white" />
      </a>

      {/* ---------- CTA STICKY MOBILE — reforça a conversão sem depender do
          usuário rolar de volta até o simulador; some no desktop, onde o
          float do WhatsApp e o header já resolvem. Continua fixed o tempo
          todo (nunca sai do DOM/display:none) — só desliza pra fora da tela
          via transform quando o CTA do hero ou o do CTA final estão
          visíveis (ver ctaStickyVisivel/IntersectionObserver acima), pra
          nunca mostrar dois botões "Simular meu consórcio" ao mesmo tempo. */}
      <div
        className={cn(
          'lg:hidden fixed bottom-0 inset-x-0 z-40 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-transform duration-500 ease-out',
          ctaStickyVisivel ? 'translate-y-0' : 'translate-y-full pointer-events-none'
        )}
        aria-hidden={!ctaStickyVisivel}
      >
        <a
          href="#simulador"
          onClick={() => fpixel.event('ViewContent', { content_name: 'Sticky Mobile UFMS - Simular' })}
          className="w-full bg-gradient-to-b from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white font-bold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#009CDE]/20 active:scale-95 transition-all"
        >
          Simular meu consórcio
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>
    </>
  )
}
