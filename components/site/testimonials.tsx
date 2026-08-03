'use client'

import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Play, Clock, MapPin } from 'lucide-react'

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
  thumbnail: string
  videoUrl?: string
}

function normalizeUrl(input: string) {
  const value = input.trim()
  const idx = value.search(/https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i)
  if (idx >= 0) return value.slice(idx)
  return value
}

function getYouTubeId(input: string) {
  const value = normalizeUrl(input)

  try {
    const url = new URL(value)
    const host = url.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0]
      return id || null
    }

    if (host.endsWith('youtube.com')) {
      if (url.pathname === '/watch') return url.searchParams.get('v')
      if (url.pathname.startsWith('/embed/')) return url.pathname.split('/')[2] || null
      if (url.pathname.startsWith('/shorts/')) return url.pathname.split('/')[2] || null
    }
  } catch {}

  const match = value.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{6,})/i
  )
  return match?.[1] || null
}

const initialTestimonials: VideoTestimonial[] = [
  {
    id: 4,
    name: 'Dra. Jaqueline Zmijevski',
    avatar: 'JZ',
    avatarBg: 'bg-emerald-600/30',
    avatarText: 'text-emerald-400',
    avatarBorder: 'border-emerald-500/20',
    location: 'Corumbá - MS (Médica Dermatologista)',
    text: 'Consegui estruturar meu consultório dermatológico com equipamentos de ponta através da consultoria e do planejamento da Reobote.',
    duration: '1:10 min',
    thumbnail: '/images/clients/medicaDermato.png',
    videoUrl: '/videos/DRA. JAQUELINE ZMIJEVSK - MÉDICA DERMATOLOGISTA - Reobote Consórcios (720p, h264, youtube).mp4',
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
    duration: '2:45 min',
    thumbnail: '/images/clients/advogada.png',
    videoUrl: '/videos/DRA. GISELLE PALIERAQUI - CONTEMPLAÇÃO GARANTIDA - Reobote Consórcios (720p, h264, youtube).mp4',
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
    duration: '1:20 min',
    thumbnail: '/images/clients/consorcioPontual.png',
    videoUrl: '/videos/ANDREZA SANTANA - CONSÓRCIO PONTUAL - Reobote Consórcios (720p, h264, youtube).mp4',
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
    duration: '2:15 min',
    thumbnail: '/images/clients/produtorRural.png',
    videoUrl: '/videos/ROBSON MONTEZANO - PRODUTOR RURAL - Reobote Consórcios (720p, h264, youtube).mp4',
  },
]

export function Testimonials() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [activeVideoId, setActiveVideoId] = useState<number | null>(null)

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

  const toggleVideo = (id: number) => {
    setActiveVideoId((prev) => (prev === id ? null : id))
  }

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
        <div className="relative w-full overflow-hidden">
          {/* Fileira dos Cards (Carrossel Container) */}
          <div
            ref={trackRef}
            className="flex gap-6 overflow-x-auto scroll-smooth no-scrollbar snap-x snap-mandatory py-4"
          >
            {initialTestimonials.map((item) => {
              const isActive = activeVideoId === item.id
              const youTubeId = item.videoUrl ? getYouTubeId(item.videoUrl) : null
              const videoSrc = item.videoUrl ? encodeURI(item.videoUrl) : undefined

              return (
              <div
                key={item.id}
                className="carousel-card min-w-[300px] md:min-w-[360px] max-w-[360px] bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-[28px] p-4 flex flex-col justify-between snap-start group hover:border-blue-500/50 transition-all duration-500"
              >
                {/* Thumbnail / Container da tag <video> */}
                <div className="w-full h-52 bg-slate-800 rounded-2xl overflow-hidden relative mb-4 group/video">
                  {isActive && item.videoUrl ? (
                    youTubeId ? (
                      <iframe
                        className="w-full h-full"
                        src={`https://www.youtube-nocookie.com/embed/${youTubeId}?autoplay=1&rel=0&modestbranding=1`}
                        title={`Depoimento em vídeo - ${item.name}`}
                        allow="autoplay; encrypted-media; picture-in-picture"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={videoSrc}
                        poster={item.thumbnail}
                        controls
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover brightness-95"
                      />
                    )
                  ) : (
                    <>
                      <img
                        src={item.thumbnail}
                        alt={`Depoimento em vídeo - ${item.name}`}
                        className="w-full h-full object-cover brightness-90 group-hover/video:scale-105 transition-transform duration-700"
                      />

                      {item.videoUrl && (
                        <button
                          type="button"
                          onClick={() => toggleVideo(item.id)}
                          className="absolute inset-0 bg-black/20 group-hover/video:bg-black/40 transition-colors flex items-center justify-center cursor-pointer"
                          aria-label={`Reproduzir vídeo de ${item.name}`}
                        >
                          <div className="w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 transform group-hover/video:scale-110 transition-transform duration-300 relative">
                            <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-25"></span>
                            <Play className="w-6 h-6 fill-current ml-1" />
                          </div>
                        </button>
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
