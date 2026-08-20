'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Play, Clock, MapPin } from 'lucide-react'

// Velocidade do scroll automático e contínuo do carrossel de depoimentos (px/s).
const AUTO_SCROLL_SPEED = 32

export interface VideoTestimonial {
  id: number
  name: string
  avatar: string
  avatarBg: string
  avatarText: string
  avatarBorder: string
  location: string
  text: string
  duration: string
  thumbnail?: string
  // Link do vídeo no YouTube. Enquanto não for definido, o card mostra um
  // placeholder de "link pendente" em vez de tentar tocar algo.
  youtubeUrl?: string
}

function getYouTubeId(input: string) {
  try {
    const url = new URL(input.trim())
    const host = url.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      return url.pathname.split('/').filter(Boolean)[0] || null
    }

    if (host.endsWith('youtube.com')) {
      if (url.pathname === '/watch') return url.searchParams.get('v')
      if (url.pathname.startsWith('/embed/')) return url.pathname.split('/')[2] || null
      if (url.pathname.startsWith('/shorts/')) return url.pathname.split('/')[2] || null
    }
  } catch { }

  const match = input.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{6,})/i
  )
  return match?.[1] || null
}

const initialTestimonials: VideoTestimonial[] = [
  {
    id: 9,
    name: 'Teomar Garcia',
    avatar: 'TG',
    avatarBg: 'bg-teal-600/30',
    avatarText: 'text-teal-400',
    avatarBorder: 'border-teal-500/20',
    location: 'Mato Grosso do Sul (Empresário - Academia)',
    text: 'Construí a estrutura da minha academia através do consórcio, sem pagar juros e com todo o suporte da equipe Reobote do início ao fim.',
    duration: '1:58 min',
    thumbnail: '/images/clients/teomar_garcia.png',
    youtubeUrl: "https://www.youtube.com/watch?v=73L2zktBOGs"
  },
  {
    id: 8,
    name: 'Paulo Costa',
    avatar: 'PC',
    avatarBg: 'bg-orange-600/30',
    avatarText: 'text-orange-400',
    avatarBorder: 'border-orange-500/20',
    location: 'Mato Grosso do Sul',
    text: 'A alavancagem patrimonial que consegui com o consórcio mudou minha forma de investir e multiplicar meu patrimônio.',
    duration: '3:33 min',
    thumbnail: '/images/clients/paulo_costa.png',
    youtubeUrl: "https://www.youtube.com/watch?v=Cy2wFwCZJMQ"
  },
  {
    id: 7,
    name: 'Dr. Lucas Vieira',
    avatar: 'LV',
    avatarBg: 'bg-violet-600/30',
    avatarText: 'text-violet-400',
    avatarBorder: 'border-violet-500/20',
    location: 'Mato Grosso do Sul',
    text: 'Vendi minha carta de crédito contemplada com segurança e agilidade através da Reobote, um processo transparente do início ao fim.',
    duration: '2:17 min',
    thumbnail: '/images/clients/lucas_vieira.png',
    youtubeUrl: "https://www.youtube.com/watch?v=nXGhdxJQrHk"
  },
  {
    id: 6,
    name: 'Charles Pagnicelli',
    avatar: 'CP',
    avatarBg: 'bg-cyan-600/30',
    avatarText: 'text-cyan-400',
    avatarBorder: 'border-cyan-500/20',
    location: 'Mato Grosso do Sul',
    text: 'O consórcio é a solução: consegui planejar minha conquista com parcelas que cabem no meu orçamento, sem juros abusivos.',
    duration: '1:45 min',
    thumbnail: '/images/clients/charles.png',
    youtubeUrl: "https://www.youtube.com/watch?v=I1nEBkP3pDQ"
  },
  {
    id: 5,
    name: 'Arthêmio Olegário Jr',
    avatar: 'AO',
    avatarBg: 'bg-rose-600/30',
    avatarText: 'text-rose-400',
    avatarBorder: 'border-rose-500/20',
    location: 'Mato Grosso do Sul (Produtor Rural)',
    text: 'Como produtor rural, o consórcio me deu o fôlego financeiro para investir em maquinário sem comprometer o caixa da propriedade.',
    duration: '2:20 min',
    thumbnail: '/images/clients/arthemio.png',
    youtubeUrl: "https://www.youtube.com/watch?v=Cdf2dXN-zH0"
  },
  {
    id: 4,
    name: 'Dra. Jaqueline Zmijevski',
    avatar: 'JZ',
    avatarBg: 'bg-emerald-600/30',
    avatarText: 'text-emerald-400',
    avatarBorder: 'border-emerald-500/20',
    location: 'Corumbá - MS (Médica Dermatologista)',
    text: 'Consegui estruturar meu consultório dermatológico com equipamentos de ponta através da consultoria e do planejamento da Reobote.',
    duration: '2:14 min',
    thumbnail: '/images/clients/medicaDermato.png',
    youtubeUrl: "https://www.youtube.com/watch?v=EYWhPBs2x7s"
  },
  {
    id: 3,
    name: 'Dra. Giselle Palieraqui',
    avatar: 'GP',
    avatarBg: 'bg-amber-600/30',
    avatarText: 'text-amber-400',
    avatarBorder: 'border-amber-500/20',
    location: 'Campo Grande - MS (Contemplação Garantida)',
    text: 'Ter a segurança e a garantia de contemplação planejada mudou totalmente meus investimentos e a expansão do meu consultório.',
    duration: '3:06 min',
    thumbnail: '/images/clients/advogada.png',
    youtubeUrl: "https://www.youtube.com/watch?v=_C61GklYPeY"
  },
  {
    id: 2,
    name: 'Andreza Santana',
    avatar: 'AS',
    avatarBg: 'bg-indigo-600/30',
    avatarText: 'text-indigo-400',
    avatarBorder: 'border-indigo-500/20',
    location: 'Campo Grande - MS',
    text: 'Minha experiência com o consórcio pontual foi incrível, todo o suporte da Reobote fez a diferença para eu tirar meus planos do papel.',
    duration: '2:05 min',
    thumbnail: '/images/clients/consorcioPontual.png',
    youtubeUrl: "https://www.youtube.com/watch?v=LlSi8WvY13Q"
  },
  {
    id: 1,
    name: 'Robson Montezano',
    avatar: 'RM',
    avatarBg: 'bg-blue-600/30',
    avatarText: 'text-blue-400',
    avatarBorder: 'border-blue-500/20',
    location: 'Maracaju - MS (Produtor Rural)',
    text: 'Consegui tirar minha colheitadeira nova sem pagar nenhuma taxa de juros. O suporte da Reobote foi essencial do início ao fim.',
    duration: '2:11 min',
    thumbnail: '/images/clients/produtorRural.png',
    youtubeUrl: 'https://www.youtube.com/watch?v=tnSL4AU6oVE'
  },
]

export function Testimonials() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const toggleVideo = (index: number) => {
    setActiveIndex((prev) => (prev === index ? null : index))
  }

  const handleScroll = (direction: 'left' | 'right') => {
    if (!trackRef.current) return
    const card = trackRef.current.querySelector('.carousel-card') as HTMLElement
    const gap = 24
    const scrollAmount = (card?.offsetWidth || 340) + gap

    if (direction === 'left') {
      if (trackRef.current.scrollLeft <= 0) {
        trackRef.current.scrollTo({ left: trackRef.current.scrollWidth, behavior: 'smooth' })
      } else {
        trackRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
      }
    } else {
      if (trackRef.current.scrollLeft + trackRef.current.clientWidth >= trackRef.current.scrollWidth - 10) {
        trackRef.current.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        trackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
      }
    }
  }

  // Avanço automático e contínuo do carrossel (efeito esteira): desloca o
  // scroll pixel a pixel a cada frame em vez de pular cartão a cartão.
  // A lista é renderizada duas vezes (ver o map abaixo) para que, ao cruzar a
  // metade do scrollWidth, o scroll volte ao início de forma instantânea e
  // imperceptível — o conteúdo logo ali é idêntico.
  // Pausa ao passar o mouse por cima.
  //
  // O offset é acumulado numa variável local (não lido de volta de
  // track.scrollLeft a cada frame): o getter scrollLeft devolve um valor
  // arredondado para inteiro, e como o incremento por frame é bem menor que
  // 1px, ler-somar-gravar nele descartaria a parte fracionária a cada frame
  // e a rolagem nunca avançaria (fica "tentando" e parada no mesmo pixel).
  useEffect(() => {
    if (isPaused || activeIndex !== null) return

    const track = trackRef.current
    if (!track) return

    let frameId: number
    let lastTimestamp: number | null = null
    let offset = track.scrollLeft

    const step = (timestamp: number) => {
      if (lastTimestamp !== null) {
        const deltaSeconds = (timestamp - lastTimestamp) / 1000
        offset += AUTO_SCROLL_SPEED * deltaSeconds

        const loopWidth = track.scrollWidth / 2
        if (loopWidth > 0 && offset >= loopWidth) {
          offset -= loopWidth
        }

        track.scrollLeft = offset
      }
      lastTimestamp = timestamp
      frameId = window.requestAnimationFrame(step)
    }

    frameId = window.requestAnimationFrame(step)
    return () => window.cancelAnimationFrame(frameId)
  }, [isPaused, activeIndex])

  return (
    <section id="depoimentos" className="bg-[#0a0f1d] py-16 md:py-24 text-white">
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 space-y-8">

        {/* Header do Carrossel com os Botões de Seta */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-[2px] bg-blue-500"></span>
              <span className="text-xs font-bold tracking-widest text-blue-400 uppercase">Histórias Reais</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white font-heading">
              Quem planeja, conquista.
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Veja os depoimentos em vídeo de clientes que transformaram suas vidas.
            </p>
          </div>

          {/* Botões Controles da Fileira */}
          <div className="flex gap-3">
            <button
              onClick={() => handleScroll('left')}
              className="w-12 h-12 rounded-full border border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-white flex items-center justify-center transition-all duration-300 hover:border-blue-500 active:scale-95 disabled:opacity-40"
              aria-label="Depoimento Anterior"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              className="w-12 h-12 rounded-full border border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-white flex items-center justify-center transition-all duration-300 hover:border-blue-500 active:scale-95"
              aria-label="Próximo Depoimento"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Janela de Visualização (Track Wrapper) */}
        <div
          className="relative w-full overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          // No celular não existe mouseenter/mouseleave — sem isso, o loop de
          // auto-scroll continuava sobrescrevendo track.scrollLeft a cada
          // frame por cima do gesto de arrastar do usuário, travando o swipe.
          // Pausa durante o toque e só retoma a esteira automática depois.
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          onTouchCancel={() => setIsPaused(false)}
        >
          {/* Fileira dos Cards (Carrossel Container) */}
          <div
            ref={trackRef}
            className="flex gap-6 overflow-x-auto no-scrollbar py-4"
            // touch-action: pan-x evita que o navegador fique tentando decidir
            // entre gesto vertical (rolar a página) e horizontal (arrastar o
            // carrossel) a cada toque — essa indecisão é o que dá a sensação
            // de travamento no primeiro instante do swipe. -webkit-overflow-
            // scrolling: touch liga o scroll com inércia nativa no iOS.
            style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch', transform: 'translateZ(0)' }}
          >
            {/* Lista duplicada: permite o loop contínuo (ver efeito de auto-scroll acima)
                sem que o fim da fileira original fique visível durante o wrap. */}
            {[...initialTestimonials, ...initialTestimonials].map((item, index) => {
              const hasLink = Boolean(item.youtubeUrl)
              const isActive = activeIndex === index
              const youTubeId = item.youtubeUrl ? getYouTubeId(item.youtubeUrl) : null

              return (
                <div
                  key={`${item.id}-${index}`}
                  // Sem backdrop-blur aqui: aplicado em ~18 cards (lista duplicada
                  // para o loop) ele é caro pra compositar durante o scroll no
                  // celular e era parte da sensação de travamento. bg mais opaco
                  // substitui o efeito de vidro sem custo de blur em tempo real.
                  // transition-colors (em vez de transition-all) evita observar
                  // propriedades que não mudam, como a posição de scroll.
                  className="carousel-card min-w-[300px] md:min-w-[360px] max-w-[360px] bg-slate-900/70 border border-white/10 rounded-[28px] p-4 flex flex-col justify-between group hover:border-blue-500/50 transition-colors duration-500"
                >
                  {/* Thumbnail / Capa do vídeo */}
                  <div className="w-full h-52 bg-slate-800 rounded-2xl overflow-hidden relative mb-4 group/video">
                    {isActive && youTubeId ? (
                      <iframe
                        className="w-full h-full"
                        src={`https://www.youtube-nocookie.com/embed/${youTubeId}?autoplay=1&rel=0&modestbranding=1`}
                        title={`Depoimento em vídeo - ${item.name}`}
                        allow="autoplay; encrypted-media; picture-in-picture"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    ) : (
                      <>
                        {item.thumbnail ? (
                          <img
                            src={item.thumbnail}
                            alt={`Depoimento em vídeo - ${item.name}`}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover brightness-90 group-hover/video:scale-105 transition-transform duration-700"
                          />
                        ) : (
                          // Sem foto de capa ainda: placeholder consistente com a cor do avatar.
                          <div
                            className={`w-full h-full flex items-center justify-center ${item.avatarBg} ${item.avatarText}`}
                          >
                            <span className="text-3xl font-extrabold tracking-wide opacity-70">{item.avatar}</span>
                          </div>
                        )}

                        {hasLink ? (
                          <button
                            type="button"
                            onClick={() => toggleVideo(index)}
                            className="absolute inset-0 bg-black/20 group-hover/video:bg-black/40 transition-colors flex items-center justify-center cursor-pointer"
                            aria-label={`Reproduzir vídeo de ${item.name}`}
                          >
                            <div className="w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 transform group-hover/video:scale-110 transition-transform duration-300 relative">
                              <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-25"></span>
                              <Play className="w-6 h-6 fill-current ml-1" />
                            </div>
                          </button>
                        ) : (
                          // Link do YouTube ainda não cadastrado: placeholder sem navegação.
                          <div
                            className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center gap-2 cursor-not-allowed"
                            title="Link do YouTube pendente"
                          >
                            <div className="w-14 h-14 rounded-full bg-slate-700/80 text-slate-300 flex items-center justify-center border border-white/10">
                              <Play className="w-6 h-6 fill-current ml-1" />
                            </div>
                            <span className="text-[10px] font-medium text-slate-300 bg-black/50 px-2 py-0.5 rounded-md">
                              Link do YouTube pendente
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-medium tracking-wide flex items-center gap-1 text-white pointer-events-none z-10">
                      <Clock className="w-3 h-3 text-blue-400" /> {item.duration}
                    </span>
                  </div>

                  {/* Detalhes do Cliente */}
                  <div className="px-2">
                    <p className="text-slate-300 text-xs md:text-sm italic leading-relaxed mb-4">
                      "{item.text}"
                    </p>
                    <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                      <div
                        className={`w-10 h-10 rounded-full ${item.avatarBg} font-bold ${item.avatarText} flex items-center justify-center text-sm border ${item.avatarBorder}`}
                      >
                        {item.avatar}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{item.name}</h4>
                        <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-500" /> {item.location}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </section>
  )
}
