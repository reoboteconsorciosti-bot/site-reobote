'use client'

import { useState } from 'react'
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

  return (
    <>
      {/* ---------- HEADER — enxuto de propósito: sem menu completo, para não
          desviar atenção do objetivo único desta página (simular e falar
          com o consultor). ---------- */}
      {/* bg 100% opaco (não translúcido) — com opacity/blur, a barra
          deixava o conteúdo claro por trás vazar e lavava a logo branca
          quando a seção atrás do header fixo era clara. */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#0d172e] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img src="/images/abertura/icon.svg" alt="Reobote Consórcios" className="h-7 sm:h-9 w-auto shrink-0" />
            <span className="text-white/30 text-lg font-light shrink-0">×</span>
            <img src="/logo-ufms.png" alt="UFMS" className="h-8 sm:h-10 w-auto shrink-0" />
          </div>
          <a
            href={santarosaLink('Olá Santarosa! Vim pela parceria UFMS e gostaria de falar sobre consórcio.')}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => fpixel.event('Contact', { content_name: 'Header - Falar com Santarosa' })}
            className="inline-flex items-center gap-1.5 sm:gap-2 bg-[#009CDE] hover:bg-[#008cc7] text-white text-xs sm:text-sm font-bold px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl transition-colors shrink-0"
          >
            <WhatsAppIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Falar no WhatsApp</span>
            <span className="sm:hidden">WhatsApp</span>
          </a>
        </div>
      </header>

      <main>
        {/* ---------- HERO ---------- */}
        <section className="relative bg-[#0d172e] text-white overflow-hidden pt-24 pb-14 sm:pt-32 sm:pb-20">
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-blue-500/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-[320px] h-[320px] bg-cyan-400/10 rounded-full blur-[100px]" />
          </div>

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            {/* Eyebrow — entrega o número de cabeça (100% off) num relance,
                pra quem só bate o olho antes de decidir se rola pra baixo. */}
            <div className="inline-flex items-center gap-1.5 bg-[#009CDE]/10 border border-[#009CDE]/25 text-[#7cd2fb] text-[11px] sm:text-xs font-bold uppercase tracking-wide px-3.5 py-1.5 rounded-full mb-5">
              <Gift className="w-3.5 h-3.5" />
              100% off na taxa de adesão
            </div>

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
            <p className="text-slate-300 text-sm sm:text-lg leading-relaxed max-w-md mx-auto mb-8">
              Assista ao vídeo abaixo e simule seu consórcio sem juros em poucos minutos.
            </p>

            {/* Vídeo vertical do fundador — thumbnail + play até o clique,
                pra não carregar o iframe do YouTube antes de precisar. Ao
                tocar, o card cresce (melhor visualização); o X fecha, para
                e encolhe de volta. O play/pause nativo do player do YouTube
                continua funcionando normalmente dentro do vídeo — só não dá
                pra sincronizar o tamanho do card com ele sem a API de
                postMessage do YouTube, então quem controla o tamanho é
                sempre o nosso botão (abrir/fechar), não o pause interno.
                Vem logo após o gancho, antes dos CTAs: é a primeira coisa
                que o pessoal quer ver, então ganha espaço maior por padrão
                (não fica escondido como um detalhe pequeno). */}
            <div className="flex flex-col items-center gap-3 mb-8">
              <span className="text-[11px] font-bold uppercase tracking-widest text-blue-400">
                Assista em 1 minuto
              </span>
              <div
                className={cn(
                  'relative aspect-[9/16] rounded-2xl overflow-hidden border border-white/10 shadow-xl shadow-black/30 bg-slate-900 transition-all duration-500 ease-out',
                  fundadorVideoPlaying ? 'w-[78vw] max-w-[320px]' : 'w-[220px] sm:w-[260px]'
                )}
              >
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
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white flex items-center justify-center transition-colors cursor-pointer"
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
                    <span className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-left">
                      <span className="block text-white text-xs font-bold">Marcelo Souza</span>
                      <span className="block text-slate-300 text-[10px]">Diretor Comercial e Fundador</span>
                    </span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
              <a
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
            <div className="grid grid-cols-3 w-full max-w-xs sm:max-w-sm mx-auto divide-x divide-white/10 border-t border-white/10 pt-5">
              <div className="text-center px-1">
                <div className="text-white font-extrabold text-sm sm:text-lg">10 anos</div>
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
        </section>

        {/* ---------- SIMULADOR — logo abaixo do hero, pra capturar o lead
            com a atenção ainda no topo. CTA final vai para o WhatsApp do
            Santarosa, nunca para o número geral da Reobote (ver
            whatsappOverride). ---------- */}
        {/* Mesmo #0d172e do hero: agora que o simulador ficou colado nele,
            usar o #070b13 do simulador da home criaria um degradê estranho
            (escuro → um pouco mais escuro → escuro de novo) antes da seção
            clara. Assim vira um único bloco escuro contínuo. */}
        <section id="simulador" className="py-14 sm:py-20 bg-[#0d172e] border-t border-b border-white/5 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-10">
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
              />
            </div>
          </div>
        </section>

        {/* ---------- VANTAGEM EXCLUSIVA: o benefício central da parceria,
            em destaque logo abaixo do hero (é o principal gatilho de
            conversão vindo da página oficial da UFMS). ---------- */}
        {/* Mesmo tom do hero (#0d172e) — continua o bloco escuro sem costura
            visível, em vez de um preto genérico do Tailwind (slate-950) que
            destoava do navy usado no resto do site. */}
        <section className="bg-[#0d172e] py-10 sm:py-12">
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

        {/* ---------- QUEM TEM DIREITO ---------- */}
        <section className="bg-soft pt-8 pb-14 sm:pt-10 sm:pb-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="section-tag justify-center">Quem tem direito</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#313335] tracking-tight mt-3">
                O benefício vale para toda a comunidade UFMS.
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Servidores ativos', Icon: Users },
                { label: 'Servidores aposentados e pensionistas', Icon: PiggyBank },
                { label: 'Estudantes da UFMS', Icon: GraduationCap },
              ].map(({ label, Icon }) => (
                <div key={label} className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-5 py-4">
                  <div className="w-10 h-10 rounded-xl bg-[#009CDE]/8 text-[#006b99] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-[#313335] leading-snug">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- POR QUE ESSA PARCERIA ---------- */}
        <section className="bg-white py-14 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
              <span className="section-tag justify-center">Vantagens da parceria</span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#313335] tracking-tight mt-3">
                Feito para a rotina de quem estuda e trabalha na UFMS.
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="dif-card">
                <div className="dif-icon"><Users className="w-6 h-6" /></div>
                <h3>Consultor dedicado</h3>
                <p>Atendimento direto com o consultor Santarosa, especialista na parceria UFMS, sem fila e sem intermediários.</p>
              </div>
              <div className="dif-card">
                <div className="dif-icon"><Gift className="w-6 h-6" /></div>
                <h3>100% off na taxa de adesão</h3>
                <p>Válido para consórcios imobiliários, de investimentos e de automóveis contratados pela comunidade UFMS.</p>
              </div>
              <div className="dif-card">
                <div className="dif-icon"><IdCard className="w-6 h-6" /></div>
                <h3>Fácil de comprovar</h3>
                <p>Basta apresentar sua carteira funcional ou estudantil no atendimento. Sem burocracia extra.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- COMO GARANTIR O BENEFÍCIO ---------- */}
        <section className="bg-soft py-14 sm:py-20">
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

        {/* ---------- SEGMENTOS (reaproveita imagens já usadas no site) ---------- */}
        <section className="bg-white py-14 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="section-tag justify-center">O que dá pra conquistar</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#313335] tracking-tight mt-3">
                Um único simulador, vários objetivos.
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                O desconto de 100% na taxa de adesão vale para imóvel, investimento e automóvel. Os demais segmentos também podem ser simulados normalmente.
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: 'Imóvel', img: '/images/consorcio/casa.avif', Icon: Home, desconto: true },
                { label: 'Automóvel', img: '/images/consorcio/haval-h6-hev-2023.jpg', Icon: Car, desconto: true },
                { label: 'Investimento', img: null, Icon: TrendingUp, desconto: true },
                { label: 'Outros segmentos', img: null, Icon: Layers, desconto: false },
              ].map(({ label, img, Icon, desconto }) => (
                <a
                  key={label}
                  href="#simulador"
                  onClick={() => fpixel.event('ViewContent', { content_name: `Segmento UFMS - ${label}` })}
                  className="group relative h-40 sm:h-52 rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
                >
                  {img ? (
                    <img src={img} alt={label} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0d172e] to-[#070b13] flex items-center justify-center">
                      <Icon className="w-10 h-10 text-white/15 group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                  {desconto && (
                    <span className="absolute top-2.5 right-2.5 bg-[#009CDE] text-white text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full">
                      100% off
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 flex items-center gap-2">
                    <Icon className="w-4 h-4 text-blue-300" />
                    <span className="text-white text-sm font-bold">{label}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- DEPOIMENTOS (prova social real da Reobote) ---------- */}
        <Testimonials />

        {/* ---------- QUEM SOMOS (condensado) ---------- */}
        <section className="bg-[#050b14] text-white py-16 sm:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
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
              Com mais de <strong>10 anos de atuação</strong>, a Reobote Consórcios acumula <strong>mais de R$1,5 bi em carteira</strong> sob gestão
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
        <section className="bg-white py-14 sm:py-20">
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
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section className="bg-soft py-16 sm:py-20">
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

        {/* ---------- CTA FINAL ---------- */}
        <section className="py-14 sm:py-20">
          <div className="container">
            <div className="cta-final">
              <h2>Sua vaga na parceria UFMS está aberta.</h2>
              <p>Simule agora ou fale direto com o consultor Santarosa pelo WhatsApp.</p>
              <div className="cta-actions">
                <a href="#simulador" onClick={() => fpixel.event('ViewContent', { content_name: 'CTA Final UFMS - Simular' })} className="btn btn-primary">
                  Simular meu consórcio
                </a>
                <a
                  href={santarosaLink('Olá Santarosa! Vim pela parceria UFMS e gostaria de falar sobre consórcio.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => fpixel.event('Contact', { content_name: 'CTA Final UFMS - WhatsApp' })}
                  className="btn btn-secondary"
                >
                  Falar com o consultor
                </a>
              </div>
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
          float do WhatsApp e o header já resolvem. ---------- */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
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
