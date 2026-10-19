'use client'

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import {
  ArrowRight,
  Calculator,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Copy,
  Globe,
  Home,
  Play,
  Pointer,
  RotateCcw,
  Share2,
  ShieldCheck,
  Star,
  TrendingUp,
  Trophy,
  Truck,
  Wheat,
  Wifi,
  X,
} from 'lucide-react'
import { initialTestimonials } from '@/components/site/testimonials'
import { siteConfig, whatsappLink } from '@/lib/site-config'
import * as fpixel from '@/lib/fpixel'
import { cn } from '@/lib/utils'

// ─── Wi-Fi de visitantes ────────────────────────────────────────────────────
// Rede e senha ficam fora do código de propósito (o repositório guarda o
// histórico): a placa da parede já traz o QR do Wi-Fi e a senha impressa.
// Quando o portal cativo estiver configurado, o redirecionamento pós-login
// deve apontar para /visitantes?conectado=1 — aí a página já recebe o
// visitante dizendo que ele está conectado, sem mostrar senha nenhuma.
const WIFI = {
  rede: '',
  senha: '',
}

// Link "escrever avaliação" do Perfil da Empresa no Google. O ideal é trocar
// pelo link direto (https://search.google.com/local/writereview?placeid=...),
// que abre a caixa de estrelas na hora — o Perfil da Empresa gera esse link
// em "Pedir avaliações". Até lá, cai na busca do Maps pelo endereço.
const GOOGLE_AVALIACAO_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  'Reobote Consórcios, Av. Toros Puxian, 1019, Campo Grande - MS'
)}`

const SITE_URL = 'https://reoboteconsorcios.com.br'
const COTAS_URL = 'https://cartascontempladas.reoboteconsorcios.com.br/'
const MENSAGEM_WHATSAPP = 'Olá! Estou visitando a Reobote e gostaria de falar com um consultor.'

const FOTOS = {
  fachada: '/images/quemsomos/Gemini_Generated_Image_ol1n0wol1n0wol1n.png',
  lounge: '/images/quemsomos/jonaseedu.png',
  consultores: '/images/quemsomos/consultores.png',
  adm: '/images/quemsomos/adm.png',
  parede: '/images/quemsomos/reobote.png',
}

const AMBIENTES = [
  { foto: FOTOS.lounge, titulo: 'Lounge e recepção', texto: 'Um espaço pensado pra você se sentir em casa.' },
  { foto: FOTOS.consultores, titulo: 'Time comercial', texto: 'Consultores dedicados a planejar cada conquista.' },
  { foto: FOTOS.adm, titulo: 'Administrativo', texto: 'Quem cuida de cada detalhe do seu consórcio.' },
]

// Marcos da trajetória — revisar/atualizar com a diretoria (datas, prêmios).
const TRAJETORIA = [
  {
    marco: 'O começo',
    texto: 'Nasce a Reobote — do hebraico, "lugares amplos" — para abrir caminhos a quem quer crescer com estratégia.',
  },
  {
    marco: 'Expansão',
    texto: 'Clientes em 17 estados e mais de 180 cidades do Brasil.',
  },
  {
    marco: 'Reconhecimento',
    texto: 'Premiações como Representante Diamante. Estão na nossa parede, dá uma olhada. 😉',
  },
  {
    marco: 'Novas parcerias',
    texto: 'Clube de Benefícios da UFMS: adesão 100% off para a comunidade universitária.',
  },
]

const NUMEROS = [
  { valor: 4000, casas: 0, prefixo: '+', sufixo: '', rotulo: 'clientes atendidos' },
  { valor: 17, casas: 0, prefixo: '', sufixo: '', rotulo: 'estados com clientes' },
  { valor: 180, casas: 0, prefixo: '+', sufixo: '', rotulo: 'cidades impactadas' },
  { valor: 1.5, casas: 1, prefixo: 'R$ ', sufixo: ' bi+', rotulo: 'em patrimônio conquistado' },
]

const PASSOS = [
  {
    titulo: 'Escolha seu crédito',
    texto: 'Defina o valor do bem e uma parcela que cabe no bolso. Sem juros: só taxa de administração.',
  },
  {
    titulo: 'Seja contemplado',
    texto: 'Todo mês tem assembleia. Você pode ser sorteado ou antecipar com um lance.',
  },
  {
    titulo: 'Compre à vista',
    texto: 'Com a carta de crédito na mão, você negocia como comprador à vista.',
  },
]

const SEGMENTOS = [
  { icone: Home, nome: 'Imóveis' },
  { icone: Car, nome: 'Veículos' },
  { icone: Truck, nome: 'Caminhões' },
  { icone: Wheat, nome: 'Agro' },
  { icone: TrendingUp, nome: 'Investimentos' },
]

// Três histórias de perfis diferentes (empresário, produtor rural, saúde) —
// os mesmos depoimentos em vídeo da home.
const DEPOIMENTOS = [9, 5, 4]
  .map((id) => initialTestimonials.find((t) => t.id === id))
  .filter((t): t is (typeof initialTestimonials)[number] => Boolean(t?.youtubeUrl))

// Miniatura leve do próprio YouTube (~15 KB) em vez dos PNGs de ~700 KB da
// home — essa página pode abrir no 4G antes de o Wi-Fi conectar.
function miniaturaYoutube(url: string) {
  const id = new URL(url).searchParams.get('v')
  return `https://i.ytimg.com/vi/${id}/mqdefault.jpg`
}

// Títulos: o globals.css define h1/h2 com uma regra fora de @layer, que
// sempre vence as utilities do Tailwind — por isso o `!` (mesmo motivo do
// header da parceria-ufms). O mesmo vale para `a { color: inherit }`: links
// recebem a cor via `!text-*`.
const FONTE_TITULO = '!font-[family-name:var(--font-jakarta)]'

// ─── Helpers ────────────────────────────────────────────────────────────────

type ContextoCard = {
  avancar: () => void
  reiniciar: () => void
  abrirWifi: () => void
  conectado: boolean
  rastrear: (acao: string) => void
}

type Card = {
  id: string
  // Duração em ms até avançar sozinho. 0 = card final, não avança.
  duracao: number
  // Card de fundo claro: a barra de progresso e a logo trocam para escuro.
  claro?: boolean
  // Imagens do card, pré-carregadas quando o card anterior entra na tela.
  imagens?: string[]
  render: (ctx: ContextoCard) => ReactNode
}

async function copiarTexto(texto: string) {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    // A mini-janela do portal cativo (iOS) e navegadores antigos não
    // expõem a Clipboard API — cai no método antigo de selecionar e copiar.
    const campo = document.createElement('textarea')
    campo.value = texto
    campo.setAttribute('readonly', '')
    campo.style.position = 'fixed'
    campo.style.opacity = '0'
    document.body.appendChild(campo)
    campo.select()
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {}
    campo.remove()
    return ok
  }
}

function useContagem(alvo: number, duracao = 1600, atraso = 0) {
  const [valor, setValor] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValor(alvo)
      return
    }
    let raf = 0
    let inicio: number | null = null
    const passo = (agora: number) => {
      if (inicio === null) inicio = agora
      const p = Math.min(1, Math.max(0, (agora - inicio - atraso) / duracao))
      setValor(alvo * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(passo)
    }
    raf = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(raf)
  }, [alvo, duracao, atraso])

  return valor
}

// Entrada em cascata dos elementos de cada card (ordem 0, 1, 2…).
function Surge({ ordem, className, children }: { ordem: number; className?: string; children: ReactNode }) {
  return (
    <div className={cn('vis-rise', className)} style={{ animationDelay: `${150 + ordem * 90}ms` }}>
      {children}
    </div>
  )
}

function Moldura({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col justify-end px-6 pt-24 pb-[max(env(safe-area-inset-bottom),28px)]',
        className
      )}
    >
      {children}
    </div>
  )
}

function Rotulo({ children, claro }: { children: ReactNode; claro?: boolean }) {
  return (
    <span
      className={cn(
        'text-[11px] font-bold uppercase tracking-[0.18em]',
        claro ? 'text-[#008cc7]' : 'text-[#4dc0ec]'
      )}
    >
      {children}
    </span>
  )
}

function Brilhos() {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div className="absolute -top-24 -right-24 w-[360px] h-[360px] rounded-full bg-[#009CDE]/25 blur-[110px]" />
      <div className="absolute -bottom-32 -left-24 w-[320px] h-[320px] rounded-full bg-cyan-400/10 blur-[100px]" />
    </div>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.39a9.9 9.9 0 004.76 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.05c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.1.11-1.77-.11-.41-.13-.94-.3-1.62-.6-2.85-1.23-4.71-4.1-4.85-4.29-.14-.19-1.16-1.54-1.16-2.94s.72-2.08.98-2.37c.25-.28.55-.35.74-.35.19 0 .37 0 .53.01.17.01.4-.06.62.48.24.58.81 2 .88 2.14.07.14.11.31.02.5-.08.19-.13.31-.26.47-.13.16-.27.36-.39.48-.13.13-.26.27-.11.53.14.26.64 1.07 1.38 1.74.95.86 1.76 1.13 2.02 1.26.26.13.41.11.56-.07.16-.18.65-.77.83-1.03.18-.26.35-.22.6-.13.24.09 1.55.74 1.82.88.26.13.44.19.5.3.06.11.06.66-.18 1.34z" />
    </svg>
  )
}

// O lucide-react 1.x removeu os ícones de marcas — Instagram desenhado à mão,
// o mesmo traço do rodapé da home.
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" />
    </svg>
  )
}

// ─── Wi-Fi (usado no card final e na gaveta do botão do topo) ──────────────

function InfoWifi({ conectado, rastrear }: { conectado: boolean; rastrear: (acao: string) => void }) {
  const [copiado, setCopiado] = useState(false)

  if (conectado) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-left">
        <CircleCheck className="w-6 h-6 text-emerald-400 shrink-0" />
        <div>
          <p className="font-bold text-white">Você já está conectado</p>
          <p className="text-sm text-slate-300 mt-0.5">A rede de visitantes está liberada no seu celular. Aproveite!</p>
        </div>
      </div>
    )
  }

  if (!WIFI.rede || !WIFI.senha) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
        <p className="font-bold text-white">Use o QR code ① da placa</p>
        <p className="text-sm text-slate-300 mt-0.5">Aponte a câmera para ele e o celular conecta sozinho. A rede e a senha também estão escritas na placa.</p>
      </div>
    )
  }

  const copiar = async () => {
    if (await copiarTexto(WIFI.senha)) {
      setCopiado(true)
      rastrear('Copiar senha Wi-Fi')
      window.setTimeout(() => setCopiado(false), 2200)
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-left">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Rede</p>
      <p className="mt-0.5 text-lg font-bold text-white break-all">{WIFI.rede}</p>

      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Senha</p>
      <div className="mt-1.5 flex items-center gap-2">
        <code className="flex-1 min-w-0 rounded-xl bg-black/30 px-3.5 py-3 font-mono text-lg font-semibold tracking-wide text-white break-all select-all">
          {WIFI.senha}
        </code>
        <button
          type="button"
          onClick={copiar}
          aria-label="Copiar senha do Wi-Fi"
          className={cn(
            'shrink-0 inline-flex items-center gap-1.5 rounded-xl px-4 py-3 text-sm font-bold transition-all active:scale-95',
            copiado ? 'bg-emerald-500 text-white' : 'bg-[#009CDE] text-white hover:bg-[#008cc7]'
          )}
        >
          {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copiado ? 'Copiada' : 'Copiar'}
        </button>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-slate-400">
        Abra <strong className="text-slate-200">Ajustes › Wi-Fi</strong>, escolha{' '}
        <strong className="text-slate-200">{WIFI.rede}</strong> e cole a senha.
      </p>
    </div>
  )
}

// ─── Cards ──────────────────────────────────────────────────────────────────

function CardBoasVindas({ avancar, abrirWifi, conectado }: ContextoCard) {
  return (
    <div className="absolute inset-0 bg-[#0d172e]">
      <img src={FOTOS.fachada} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover vis-kenburns" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d172e] via-[#0d172e]/75 via-45% to-[#0d172e]/15" />

      <Moldura>
        <Surge ordem={0}>
          {conectado ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Você está conectado ao Wi-Fi
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-100 backdrop-blur-md">
              <Wifi className="w-3.5 h-3.5 text-[#4dc0ec]" />
              Wi-Fi para visitantes
            </span>
          )}
        </Surge>

        <Surge ordem={1}>
          <h1
            className={cn(
              FONTE_TITULO,
              'mt-4 text-[clamp(2.4rem,11vw,3.1rem)] font-extrabold leading-[1.02] tracking-tight text-white'
            )}
          >
            Que bom ter{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4dc0ec] to-cyan-200">você</span> aqui.
          </h1>
        </Surge>

        <Surge ordem={2}>
          <p className="mt-4 max-w-[32ch] text-base leading-relaxed text-slate-300">
            Enquanto está com a gente, que tal conhecer a Reobote por dentro? Leva cerca de 1 minuto.
          </p>
        </Surge>

        <Surge ordem={3} className="mt-7 flex flex-col gap-3">
          <button
            type="button"
            onClick={avancar}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#009CDE] px-6 py-4 text-base font-bold text-white shadow-lg shadow-[#009CDE]/30 transition-all hover:bg-[#008cc7] active:scale-[0.98]"
          >
            Começar o tour
            <ArrowRight className="w-5 h-5" />
          </button>
          {!conectado && (
            <button
              type="button"
              onClick={abrirWifi}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-slate-100 backdrop-blur-md transition-all hover:bg-white/10 active:scale-[0.98]"
            >
              <Wifi className="w-4 h-4" />
              Só quero o Wi-Fi
            </button>
          )}
        </Surge>

        <Surge ordem={5} className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Pointer className="w-4 h-4 vis-tap" />
          Toque para avançar · segure para pausar
        </Surge>
      </Moldura>
    </div>
  )
}

function CardPorDentro() {
  const ciclo = 9000
  const fase = ciclo / AMBIENTES.length

  return (
    <div className="absolute inset-0 bg-[#0d172e]">
      <div className="absolute inset-x-0 top-0 h-[68%] overflow-hidden">
        {AMBIENTES.map((a, i) => (
          <img
            key={a.foto}
            src={a.foto}
            alt={a.titulo}
            draggable={false}
            className="vis-cycle absolute inset-0 h-full w-full object-cover"
            style={{ animationDuration: `${ciclo}ms`, animationDelay: `${i * fase}ms` }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d172e]/40 via-transparent to-[#0d172e]" />
      </div>

      <Moldura>
        <Surge ordem={0}>
          <Rotulo>Bem-vindo à nossa casa</Rotulo>
        </Surge>
        <Surge ordem={1}>
          <h2 className={cn(FONTE_TITULO, 'mt-2 text-[clamp(2rem,9vw,2.6rem)] font-extrabold leading-[1.05] tracking-tight text-white')}>
            A Reobote por dentro
          </h2>
        </Surge>

        {/* Legenda acompanha a foto da vez — mesma animação e mesmos delays. */}
        <Surge ordem={2} className="relative mt-5 h-[92px]">
          {AMBIENTES.map((a, i) => (
            <div
              key={a.titulo}
              className="vis-cycle absolute inset-0 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-md"
              style={{ animationDuration: `${ciclo}ms`, animationDelay: `${i * fase}ms` }}
            >
              <p className="font-bold text-white">{a.titulo}</p>
              <p className="text-sm text-slate-300">{a.texto}</p>
            </div>
          ))}
        </Surge>
      </Moldura>
    </div>
  )
}

function CardTrajetoria() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-[#1b2f57] to-[#0d172e] overflow-hidden">
      <Brilhos />
      <Moldura className="justify-center">
        <Surge ordem={0}>
          <Rotulo>Nossa trajetória</Rotulo>
        </Surge>
        <Surge ordem={1}>
          <h2 className={cn(FONTE_TITULO, 'mt-2 text-[clamp(2rem,9vw,2.6rem)] font-extrabold leading-[1.05] tracking-tight text-white')}>
            12 anos abrindo{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4dc0ec] to-cyan-200">caminhos</span>.
          </h2>
        </Surge>

        <ol className="relative mt-7 space-y-5 [@media(max-height:700px)]:space-y-3.5">
          <span aria-hidden="true" className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-[#009CDE] via-[#009CDE]/40 to-transparent" />
          {TRAJETORIA.map((t, i) => (
            <li key={t.marco} className="vis-rise relative pl-8" style={{ animationDelay: `${450 + i * 160}ms` }}>
              <span aria-hidden="true" className="absolute left-0 top-1 w-[15px] h-[15px] rounded-full border-[3px] border-[#0d172e] bg-[#009CDE] shadow-[0_0_0_4px_rgba(0,156,222,0.2)]" />
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#4dc0ec]">{t.marco}</p>
              <p className="mt-0.5 text-[15px] leading-snug text-slate-200">{t.texto}</p>
            </li>
          ))}
        </ol>
      </Moldura>
    </div>
  )
}

function Numero({ valor, casas, prefixo, sufixo, rotulo, ordem }: (typeof NUMEROS)[number] & { ordem: number }) {
  const atual = useContagem(valor, 1500, 350 + ordem * 120)
  const texto = atual.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })

  return (
    <div className="vis-rise rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md" style={{ animationDelay: `${300 + ordem * 120}ms` }}>
      <p className={cn(FONTE_TITULO, 'whitespace-nowrap text-[clamp(1.6rem,7.5vw,2.1rem)] font-extrabold tracking-tight text-white tabular-nums')}>
        <span className={cn(prefixo.length > 1 && 'text-[0.6em] mr-0.5')}>{prefixo}</span>
        {texto}
        <span className={cn(sufixo && 'text-[0.6em] ml-0.5')}>{sufixo}</span>
      </p>
      <p className="mt-1 text-xs leading-snug text-slate-300">{rotulo}</p>
    </div>
  )
}

function CardNumeros() {
  return (
    <div className="absolute inset-0 bg-[#0d172e]">
      <img src={FOTOS.parede} alt="Parede da Reobote com prêmios" draggable={false} className="absolute inset-x-0 top-0 h-[58%] w-full object-cover vis-kenburns" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d172e]/30 via-[#0d172e]/60 via-40% to-[#0d172e] to-60%" />

      <Moldura>
        <Surge ordem={0}>
          <Rotulo>Em números</Rotulo>
        </Surge>
        <Surge ordem={1}>
          <h2 className={cn(FONTE_TITULO, 'mt-2 text-[clamp(1.9rem,8.5vw,2.4rem)] font-extrabold leading-[1.08] tracking-tight text-white')}>
            Confiança que se constrói todo dia.
          </h2>
        </Surge>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {NUMEROS.map((n, i) => (
            <Numero key={n.rotulo} {...n} ordem={i} />
          ))}
        </div>
      </Moldura>
    </div>
  )
}

function CardComoFunciona() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-white to-[#eef4f8] overflow-hidden">
      <div aria-hidden="true" className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full bg-[#009CDE]/10 blur-[90px]" />

      <Moldura className="justify-center">
        <Surge ordem={0}>
          <Rotulo claro>Consórcio em 30 segundos</Rotulo>
        </Surge>
        <Surge ordem={1}>
          <h2 className={cn(FONTE_TITULO, 'mt-2 text-[clamp(1.9rem,8.5vw,2.4rem)] [@media(max-height:720px)]:text-[1.7rem] font-extrabold leading-[1.08] tracking-tight text-[#0d172e]')}>
            Simples, planejado e <span className="text-[#009CDE]">sem juros</span>.
          </h2>
        </Surge>

        {/* Telas baixas (iPhone SE e afins): passos mais compactos e sem os
            chips de segmento, pra caber tudo sem rolagem. */}
        <ol className="mt-6 space-y-3 [@media(max-height:720px)]:mt-4 [@media(max-height:720px)]:space-y-2">
          {PASSOS.map((p, i) => (
            <li
              key={p.titulo}
              className="vis-rise flex gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_-14px_rgba(13,23,46,0.25)] [@media(max-height:720px)]:gap-3 [@media(max-height:720px)]:p-3"
              style={{ animationDelay: `${400 + i * 220}ms` }}
            >
              <span className={cn(FONTE_TITULO, 'flex w-9 h-9 shrink-0 items-center justify-center rounded-xl bg-[#009CDE] text-base font-extrabold text-white')}>
                {i + 1}
              </span>
              <div>
                <p className="font-bold text-[#0d172e]">{p.titulo}</p>
                <p className="mt-0.5 text-sm leading-snug text-slate-500 [@media(max-height:720px)]:text-[13px]">{p.texto}</p>
              </div>
            </li>
          ))}
        </ol>

        <Surge ordem={9} className="mt-5 flex flex-wrap gap-2 [@media(max-height:720px)]:hidden">
          {SEGMENTOS.map(({ icone: Icone, nome }) => (
            <span key={nome} className="inline-flex items-center gap-1.5 rounded-full bg-[#0d172e]/[0.05] px-3 py-1.5 text-xs font-semibold text-slate-600">
              <Icone className="w-3.5 h-3.5 text-[#009CDE]" />
              {nome}
            </span>
          ))}
        </Surge>

        <Surge ordem={10} className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Regulamentado pelo Banco Central do Brasil
        </Surge>
      </Moldura>
    </div>
  )
}

function CardDepoimentos({ rastrear }: ContextoCard) {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-[#0d172e] to-[#070b13] overflow-hidden">
      <Brilhos />
      <Moldura className="justify-center">
        <Surge ordem={0}>
          <Rotulo>Quem já conquistou</Rotulo>
        </Surge>
        <Surge ordem={1}>
          <h2 className={cn(FONTE_TITULO, 'mt-2 text-[clamp(1.9rem,8.5vw,2.4rem)] font-extrabold leading-[1.08] tracking-tight text-white')}>
            Histórias reais de clientes Reobote.
          </h2>
        </Surge>

        <ul className="mt-6 space-y-3">
          {DEPOIMENTOS.map((d, i) => (
            <li key={d.id} className="vis-rise" style={{ animationDelay: `${400 + i * 160}ms` }}>
              <a
                href={d.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => rastrear(`Depoimento - ${d.name}`)}
                className="flex gap-3.5 rounded-2xl border border-white/10 bg-white/[0.05] p-3 !text-white transition-colors hover:bg-white/10 active:scale-[0.99]"
              >
                <div className="relative w-[104px] shrink-0 overflow-hidden rounded-xl aspect-video bg-white/10">
                  <img src={miniaturaYoutube(d.youtubeUrl!)} alt="" loading="lazy" draggable={false} className="h-full w-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <span className="flex w-8 h-8 items-center justify-center rounded-full bg-white/90 text-[#0d172e]">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </span>
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold">{d.name}</p>
                  <p className="text-[11px] text-[#4dc0ec] truncate">{d.location}</p>
                  <p className="mt-1 text-xs leading-snug text-slate-300 line-clamp-2">“{d.text}”</p>
                </div>
              </a>
            </li>
          ))}
        </ul>

        <Surge ordem={8} className="mt-4 text-center text-xs text-slate-500">
          Toque em uma história para assistir
        </Surge>
      </Moldura>
    </div>
  )
}

function CardProximoPasso({ rastrear }: ContextoCard) {
  const acoes = [
    {
      href: '/#simulador',
      externo: false,
      icone: <Calculator className="w-5 h-5" />,
      titulo: 'Simular meu consórcio',
      texto: 'Descubra sua parcela em 1 minuto',
      destaque: true,
      onClick: () => fpixel.event('ViewContent', { content_name: 'Visitantes - Simular Consórcio' }),
    },
    {
      href: whatsappLink(MENSAGEM_WHATSAPP),
      externo: true,
      icone: <WhatsAppIcon className="w-5 h-5" />,
      titulo: 'Falar com um consultor',
      texto: 'Atendimento pelo WhatsApp',
      destaque: false,
      onClick: () => fpixel.event('Lead', { content_name: 'Visitantes - Falar com Consultor' }),
    },
    {
      href: COTAS_URL,
      externo: true,
      icone: <Trophy className="w-5 h-5" />,
      titulo: 'Ver cotas contempladas',
      texto: 'Cartas aprovadas, sem esperar sorteio',
      destaque: false,
      onClick: () =>
        fpixel.event('ViewContent', {
          content_name: 'Visitantes - Consultar Cotas Contempladas',
          content_category: 'Cotas Contempladas',
        }),
    },
  ]

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-[#1b2f57] to-[#0d172e] overflow-hidden">
      <Brilhos />
      <Moldura className="justify-center">
        <Surge ordem={0}>
          <Rotulo>E você?</Rotulo>
        </Surge>
        <Surge ordem={1}>
          <h2 className={cn(FONTE_TITULO, 'mt-2 text-[clamp(2rem,9vw,2.6rem)] font-extrabold leading-[1.05] tracking-tight text-white')}>
            Qual vai ser a sua próxima{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4dc0ec] to-cyan-200">conquista</span>?
          </h2>
        </Surge>

        <div className="mt-7 space-y-3">
          {acoes.map((a, i) => (
            <a
              key={a.titulo}
              href={a.href}
              {...(a.externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              onClick={() => {
                a.onClick()
                rastrear(a.titulo)
              }}
              className={cn(
                'vis-rise flex items-center gap-4 rounded-2xl p-4 transition-all active:scale-[0.98]',
                a.destaque
                  ? 'bg-[#009CDE] !text-white shadow-lg shadow-[#009CDE]/25 hover:bg-[#008cc7]'
                  : 'border border-white/10 bg-white/[0.06] !text-white hover:bg-white/10'
              )}
              style={{ animationDelay: `${400 + i * 140}ms` }}
            >
              <span className={cn('flex w-11 h-11 shrink-0 items-center justify-center rounded-xl', a.destaque ? 'bg-white/20' : 'bg-white/10 text-[#4dc0ec]')}>
                {a.icone}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{a.titulo}</span>
                <span className={cn('block text-xs', a.destaque ? 'text-white/80' : 'text-slate-400')}>{a.texto}</span>
              </span>
              <ChevronRight className="w-5 h-5 shrink-0 opacity-60" />
            </a>
          ))}
        </div>

        <Surge ordem={8} className="mt-5 text-center text-sm text-slate-400">
          Prefere conversar ao vivo? É só chamar alguém do nosso time aqui. 😊
        </Surge>
      </Moldura>
    </div>
  )
}

function CardAjudinha({ rastrear }: ContextoCard) {
  const indicar = async () => {
    rastrear('Indicar a Reobote')
    const texto = 'Conheci a Reobote Consórcios e lembrei de você! Dá uma olhada:'
    if (navigator.share) {
      try {
        await navigator.share({ title: siteConfig.name, text: texto, url: SITE_URL })
      } catch {}
      return
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${texto} ${SITE_URL}`)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-white to-[#eef4f8] overflow-hidden">
      <div aria-hidden="true" className="absolute -bottom-24 -left-20 w-[320px] h-[320px] rounded-full bg-amber-300/20 blur-[90px]" />

      <Moldura className="justify-center">
        <Surge ordem={0} className="flex gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star
              key={i}
              className="vis-rise w-8 h-8 fill-amber-400 text-amber-400"
              style={{ animationDelay: `${200 + i * 110}ms` }}
            />
          ))}
        </Surge>
        <Surge ordem={2} className="mt-5">
          <Rotulo claro>Uma ajudinha?</Rotulo>
        </Surge>
        <Surge ordem={3}>
          <h2 className={cn(FONTE_TITULO, 'mt-2 text-[clamp(1.9rem,8.5vw,2.4rem)] font-extrabold leading-[1.08] tracking-tight text-[#0d172e]')}>
            Gostou da visita? Conta pra gente.
          </h2>
        </Surge>
        <Surge ordem={4}>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-500">
            Sua avaliação ajuda outras pessoas a encontrarem a Reobote. Leva 10 segundos.
          </p>
        </Surge>

        <Surge ordem={5} className="mt-7 space-y-3">
          <a
            href={GOOGLE_AVALIACAO_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => rastrear('Avaliar no Google')}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#0d172e] px-6 py-4 text-base font-bold !text-white shadow-lg shadow-[#0d172e]/20 transition-all hover:bg-[#1b2f57] active:scale-[0.98]"
          >
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            Avaliar no Google
          </a>
          <div className="grid grid-cols-2 gap-3">
            <a
              href={siteConfig.instagram}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => rastrear('Seguir no Instagram')}
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3.5 text-sm font-bold !text-[#0d172e] transition-all hover:border-slate-300 active:scale-[0.98]"
            >
              <InstagramIcon className="w-[18px] h-[18px] text-[#d6249f]" />
              Seguir
            </a>
            <button
              type="button"
              onClick={indicar}
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3.5 text-sm font-bold text-[#0d172e] transition-all hover:border-slate-300 active:scale-[0.98]"
            >
              <Share2 className="w-[18px] h-[18px] text-[#009CDE]" />
              Indicar
            </button>
          </div>
        </Surge>
      </Moldura>
    </div>
  )
}

function CardWifi({ reiniciar, conectado, rastrear }: ContextoCard) {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-[#1b2f57] to-[#0d172e] overflow-hidden">
      <Brilhos />
      <Moldura className="justify-center">
        <Surge ordem={0} className="flex justify-center">
          <div className="relative flex w-20 h-20 items-center justify-center">
            <span className="vis-ring absolute inset-0 rounded-full bg-[#009CDE]/40" />
            <span className="vis-ring absolute inset-0 rounded-full bg-[#009CDE]/40" style={{ animationDelay: '1.2s' }} />
            <span className="relative flex w-20 h-20 items-center justify-center rounded-full bg-[#009CDE] shadow-xl shadow-[#009CDE]/40">
              <Wifi className="w-9 h-9 text-white" />
            </span>
          </div>
        </Surge>

        <Surge ordem={1} className="mt-6 text-center">
          <h2 className={cn(FONTE_TITULO, 'text-[clamp(1.9rem,8.5vw,2.4rem)] font-extrabold leading-[1.08] tracking-tight text-white')}>
            Prontinho! O Wi-Fi é todo seu.
          </h2>
          <p className="mt-2 text-[15px] text-slate-300">Obrigado por conhecer a Reobote. 💙</p>
        </Surge>

        <Surge ordem={2} className="mt-6">
          <InfoWifi conectado={conectado} rastrear={rastrear} />
        </Surge>

        <Surge ordem={3} className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={reiniciar}
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-3 py-3.5 text-sm font-semibold text-slate-100 transition-all hover:bg-white/10 active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            Ver de novo
          </button>
          <a
            href="/"
            onClick={() => rastrear('Ir para o site')}
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-3 py-3.5 text-sm font-semibold !text-slate-100 transition-all hover:bg-white/10 active:scale-[0.98]"
          >
            <Globe className="w-4 h-4" />
            Ver o site
          </a>
        </Surge>
      </Moldura>
    </div>
  )
}

const CARDS: Card[] = [
  { id: 'Boas-vindas', duracao: 9000, imagens: [FOTOS.fachada], render: (ctx) => <CardBoasVindas {...ctx} /> },
  { id: 'Por dentro', duracao: 9000, imagens: AMBIENTES.map((a) => a.foto), render: () => <CardPorDentro /> },
  { id: 'Trajetória', duracao: 11000, render: () => <CardTrajetoria /> },
  { id: 'Números', duracao: 7500, imagens: [FOTOS.parede], render: () => <CardNumeros /> },
  { id: 'Como funciona', duracao: 12000, claro: true, render: () => <CardComoFunciona /> },
  {
    id: 'Depoimentos',
    duracao: 10000,
    imagens: DEPOIMENTOS.map((d) => miniaturaYoutube(d.youtubeUrl!)),
    render: (ctx) => <CardDepoimentos {...ctx} />,
  },
  { id: 'Próximo passo', duracao: 11000, render: (ctx) => <CardProximoPasso {...ctx} /> },
  { id: 'Avaliação', duracao: 10000, claro: true, render: (ctx) => <CardAjudinha {...ctx} /> },
  { id: 'Wi-Fi', duracao: 0, render: (ctx) => <CardWifi {...ctx} /> },
]

// ─── Página ─────────────────────────────────────────────────────────────────

export default function VisitantesPage() {
  const [indice, setIndice] = useState(0)
  // Incrementa a cada navegação — usado como `key` do card e da barra de
  // progresso, para reiniciar as animações mesmo voltando para o mesmo card.
  const [passo, setPasso] = useState(0)
  const [segurando, setSegurando] = useState(false)
  const [wifiAberto, setWifiAberto] = useState(false)
  const [oculto, setOculto] = useState(false)
  const [conectado, setConectado] = useState(false)
  const [local, setLocal] = useState<string | null>(null)

  const card = CARDS[indice]
  const pausado = segurando || wifiAberto || oculto

  // ?conectado=1 → veio do portal cativo, já está online.
  // ?local=recepcao → qual placa/QR trouxe o visitante (um QR por ambiente).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setConectado(params.get('conectado') === '1')
    setLocal(params.get('local'))
  }, [])

  const rastrear = useCallback(
    (acao: string) => fpixel.customEvent('VisitantesAcao', { content_name: acao, local: local ?? 'nao-informado' }),
    [local]
  )

  // Ref espelhando o índice: avançar/voltar são chamados de timers, gestos
  // e teclado, e precisam do valor atual sem esperar o re-render.
  const indiceRef = useRef(0)

  const irPara = useCallback((novo: number) => {
    const destino = Math.max(0, Math.min(CARDS.length - 1, novo))
    indiceRef.current = destino
    setIndice(destino)
    setPasso((p) => p + 1)
  }, [])

  const avancar = useCallback(() => {
    if (indiceRef.current < CARDS.length - 1) irPara(indiceRef.current + 1)
  }, [irPara])

  // Voltar no primeiro card só reinicia ele (igual aos stories do Instagram).
  const voltar = useCallback(() => irPara(indiceRef.current - 1), [irPara])

  const reiniciar = useCallback(() => irPara(0), [irPara])
  const abrirWifi = useCallback(() => {
    setWifiAberto(true)
    rastrear('Abrir Wi-Fi')
  }, [rastrear])

  useEffect(() => {
    fpixel.customEvent('VisitantesTour', {
      content_name: CARDS[indice].id,
      posicao: indice + 1,
      local: local ?? 'nao-informado',
    })
    // `local` de fora de propósito: só um evento por card visto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice])

  // Pré-carrega as fotos do próximo card para a troca não piscar.
  useEffect(() => {
    CARDS[indice + 1]?.imagens?.forEach((src) => {
      const img = new Image()
      img.src = src
    })
  }, [indice])

  // Aba em segundo plano (foi responder o WhatsApp, abriu o YouTube…) pausa
  // o tour — quando voltar, está no mesmo ponto.
  useEffect(() => {
    const aoMudar = () => setOculto(document.visibilityState === 'hidden')
    document.addEventListener('visibilitychange', aoMudar)
    return () => document.removeEventListener('visibilitychange', aoMudar)
  }, [])

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setWifiAberto(false)
      if (wifiAberto) return
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        avancar()
      }
      if (e.key === 'ArrowLeft') voltar()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [avancar, voltar, wifiAberto])

  // ── Gestos: toque à direita avança, à esquerda volta, segurar pausa,
  // arrastar para os lados troca de card. Botões e links dos cards ficam
  // fora disso (ver `ehInterativo`).
  const gesto = useRef<{ x: number; y: number; timer: number; segurou: boolean } | null>(null)

  const ehInterativo = (alvo: EventTarget | null) =>
    alvo instanceof Element && Boolean(alvo.closest('a, button, input, code, [data-interativo]'))

  const aoPressionar = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (ehInterativo(e.target) || (e.pointerType === 'mouse' && e.button !== 0)) return
    const timer = window.setTimeout(() => {
      if (gesto.current) gesto.current.segurou = true
      setSegurando(true)
    }, 220)
    gesto.current = { x: e.clientX, y: e.clientY, timer, segurou: false }
  }

  const aoMover = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesto.current
    if (!g || g.segurou) return
    if (Math.abs(e.clientX - g.x) > 12 || Math.abs(e.clientY - g.y) > 12) window.clearTimeout(g.timer)
  }

  const aoSoltar = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesto.current
    if (!g) return
    window.clearTimeout(g.timer)
    gesto.current = null

    if (g.segurou) {
      setSegurando(false)
      return
    }

    const dx = e.clientX - g.x
    const dy = e.clientY - g.y
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) avancar()
      else voltar()
      return
    }
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      const rect = e.currentTarget.getBoundingClientRect()
      if (e.clientX - rect.left < rect.width * 0.3) voltar()
      else avancar()
    }
  }

  const aoCancelar = () => {
    if (gesto.current) window.clearTimeout(gesto.current.timer)
    gesto.current = null
    setSegurando(false)
  }

  const ctx: ContextoCard = { avancar, reiniciar, abrirWifi, conectado, rastrear }
  const fundoDesktop = card.imagens?.[0] ?? FOTOS.fachada

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#05080f] font-[family-name:var(--font-inter)] overscroll-none">
      {/* Desktop: a moldura de celular fica no centro, com a foto do card
          desfocada ao fundo. No celular isso fica todo coberto pelo card. */}
      <img
        src={fundoDesktop}
        alt=""
        aria-hidden="true"
        className="hidden md:block absolute inset-0 h-full w-full object-cover scale-110 blur-3xl opacity-30 transition-opacity"
      />

      <div className="relative flex h-full w-full items-center justify-center md:gap-8">
        <button
          type="button"
          onClick={voltar}
          aria-label="Card anterior"
          className={cn(
            'hidden md:flex w-12 h-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20',
            indice === 0 && 'invisible'
          )}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div
          className={cn(
            'relative h-full w-full overflow-hidden bg-[#0d172e] touch-none select-none [-webkit-touch-callout:none]',
            'md:h-[min(880px,calc(100dvh-48px))] md:w-auto md:aspect-[9/19] md:rounded-[36px] md:shadow-2xl md:shadow-black/60 md:ring-1 md:ring-white/10',
            pausado && 'vis-paused'
          )}
          onPointerDown={aoPressionar}
          onPointerMove={aoMover}
          onPointerUp={aoSoltar}
          onPointerCancel={aoCancelar}
          onContextMenu={(e) => e.preventDefault()}
          aria-roledescription="carrossel"
          aria-label="Tour pela Reobote"
        >
          <div key={passo} className="absolute inset-0" aria-live="polite">
            {card.render(ctx)}
          </div>

          {/* Topo: progresso + logo + Wi-Fi. Some enquanto o dedo segura a
              tela, para a pessoa ver a foto inteira (como nos stories). */}
          <div
            className={cn(
              'absolute inset-x-0 top-0 z-20 px-3 pt-[max(env(safe-area-inset-top),10px)] md:px-6 md:pt-4 transition-opacity duration-200',
              segurando ? 'opacity-0' : 'opacity-100'
            )}
          >
            {!card.claro && (
              <div aria-hidden="true" className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/45 to-transparent pointer-events-none" />
            )}

            <div className="relative flex gap-1" role="progressbar" aria-valuemin={1} aria-valuemax={CARDS.length} aria-valuenow={indice + 1}>
              {CARDS.map((c, i) => (
                <div key={c.id} className={cn('h-[3px] flex-1 overflow-hidden rounded-full', card.claro ? 'bg-[#0d172e]/15' : 'bg-white/30')}>
                  {i < indice || (i === indice && c.duracao === 0) ? (
                    <div className={cn('h-full w-full', card.claro ? 'bg-[#0d172e]' : 'bg-white')} />
                  ) : i === indice ? (
                    <div
                      key={passo}
                      className={cn('vis-fill h-full w-full', card.claro ? 'bg-[#0d172e]' : 'bg-white')}
                      style={{ animationDuration: `${c.duracao}ms` }}
                      onAnimationEnd={(e) => {
                        if (e.animationName === 'vis-fill') avancar()
                      }}
                    />
                  ) : null}
                </div>
              ))}
            </div>

            <div className="relative mt-3 flex items-center justify-between">
              <img
                src={card.claro ? '/images/abertura/icon-dark.svg' : '/images/abertura/icon.svg'}
                alt="Reobote Consórcios"
                draggable={false}
                className="h-8 w-auto"
              />
              {card.id !== 'Wi-Fi' && (
                <button
                  type="button"
                  onClick={abrirWifi}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold backdrop-blur-md transition-all active:scale-95',
                    card.claro
                      ? 'bg-[#0d172e]/[0.06] text-[#0d172e] hover:bg-[#0d172e]/10'
                      : 'bg-white/15 text-white hover:bg-white/25'
                  )}
                >
                  {conectado ? <span className="w-2 h-2 rounded-full bg-emerald-400" /> : <Wifi className="w-3.5 h-3.5" />}
                  Wi-Fi
                </button>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={avancar}
          aria-label="Próximo card"
          className={cn(
            'hidden md:flex w-12 h-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20',
            indice === CARDS.length - 1 && 'invisible'
          )}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Gaveta do Wi-Fi — fora da área do tour (que fica com as animações
          pausadas enquanto ela está aberta). */}
      {wifiAberto && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label="Wi-Fi para visitantes">
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setWifiAberto(false)}
            className="vis-fade absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="vis-sheet relative w-full max-w-md rounded-t-[28px] md:rounded-[28px] border border-white/10 bg-[#0d172e] px-6 pt-3 pb-[max(env(safe-area-inset-bottom),24px)] md:pb-6 shadow-2xl">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/20 md:hidden" />
            <div className="flex items-center justify-between">
              <h2 className={cn(FONTE_TITULO, 'flex items-center gap-2 text-xl font-extrabold text-white')}>
                <Wifi className="w-5 h-5 text-[#4dc0ec]" />
                Wi-Fi para visitantes
              </h2>
              <button
                type="button"
                onClick={() => setWifiAberto(false)}
                aria-label="Fechar"
                className="flex w-9 h-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5">
              <InfoWifi conectado={conectado} rastrear={rastrear} />
            </div>

            <button
              type="button"
              onClick={() => {
                setWifiAberto(false)
                if (indice === 0) avancar()
              }}
              className="mt-5 w-full rounded-2xl bg-[#009CDE] px-6 py-4 text-base font-bold text-white transition-all hover:bg-[#008cc7] active:scale-[0.98]"
            >
              {indice === 0 ? 'Aproveitar e fazer o tour' : 'Voltar ao tour'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
