'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  Home,
  Car,
  Truck,
  Tractor,
  Wrench,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  User,
  Phone,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const segments = [
  {
    id: 'imoveis',
    label: 'Imóvel',
    icon: Home,
    credito: { min: 80000, max: 10000000, step: 10000, default: 300000 },
    parcela: { min: 200, max: 8500, step: 50, default: 2000 }
  },
  {
    id: 'veiculos',
    label: 'Automóvel',
    icon: Car,
    credito: { min: 30000, max: 1000000, step: 5000, default: 80000 },
    parcela: { min: 300, max: 3000, step: 50, default: 900 }
  },
  {
    id: 'caminhoes',
    label: 'Caminhão',
    icon: Truck,
    credito: { min: 100000, max: 1500000, step: 10000, default: 250000 },
    parcela: { min: 1000, max: 9000, step: 100, default: 2500 }
  },
  {
    id: 'agricola',
    label: 'Máquinas',
    icon: Tractor,
    credito: { min: 80000, max: 700000, step: 10000, default: 200000 },
    parcela: { min: 800, max: 8000, step: 100, default: 2000 }
  },
  {
    id: 'servicos',
    label: 'Serviços',
    icon: Wrench,
    credito: { min: 10000, max: 100000, step: 2000, default: 30000 },
    parcela: { min: 200, max: 2000, step: 50, default: 500 }
  },
  {
    id: 'investimento',
    label: 'Investimento',
    icon: TrendingUp,
    credito: { min: 50000, max: 2000000, step: 10000, default: 500000 },
    parcela: { min: 500, max: 20000, step: 100, default: 3500 }
  }
] as const

type SegmentId = (typeof segments)[number]['id']
type SimStatus = 'idle' | 'loading' | 'success' | 'error'
type PerguntaExtraTipo = 'motivacao' | 'prazo'
type PrazoContratacao =
  | 'compra imediata'
  | 'curto prazo (até 30 dias)'
  | 'médio prazo (até 3 meses)'
  | 'apenas pesquisando por enquanto'

interface SimuladorPayload {
  tipoConsórcio: string
  desejaSimular: 'Valor do Crédito' | 'Valor da Parcela'
  valorDesejado: number
  nome: string
  telefone: string
  perguntaExtraTipo: PerguntaExtraTipo
  motivoInteresse?: string
  prazoContratacao?: PrazoContratacao
}

interface WebhookResposta {
  sucesso: boolean
  mensagem?: string
  linkWhatsapp?: string
  erro?: string
}

export function Simulator() {
  const [segmentId, setSegmentId] = useState<SegmentId>('imoveis')
  const [simMode, setSimMode] = useState<'credito' | 'parcela'>('credito')
  const [value, setValue] = useState<number>(300000)

  const [isFlipped, setIsFlipped] = useState(false)
  const [perguntaExtraTipo, setPerguntaExtraTipo] = useState<PerguntaExtraTipo>('motivacao')

  const frontRef = useRef<HTMLDivElement | null>(null)
  const backRef = useRef<HTMLDivElement | null>(null)
  const [cardHeight, setCardHeight] = useState<number | null>(null)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [motivoInteresse, setMotivoInteresse] = useState('')
  const [prazoContratacao, setPrazoContratacao] = useState<PrazoContratacao | ''>('')
  const [errors, setErrors] = useState<{
    name?: boolean
    phone?: boolean
    motivoInteresse?: boolean
    prazoContratacao?: boolean
  }>({})

  const [submitStatus, setSubmitStatus] = useState<SimStatus>('idle')
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [linkWhatsappGerado, setLinkWhatsappGerado] = useState<string>('')
  const [lastPayload, setLastPayload] = useState<SimuladorPayload | null>(null)

  const activeSegment = segments.find(s => s.id === segmentId)!
  const config = activeSegment[simMode]

  useEffect(() => {
    setValue(config.default)
  }, [segmentId, simMode, config.default])

  useLayoutEffect(() => {
    const frontEl = frontRef.current
    const backEl = backRef.current
    if (!frontEl || !backEl) return

    const measure = () => {
      const el = isFlipped ? backEl : frontEl
      const next = Math.ceil(el.getBoundingClientRect().height)
      if (!next) return
      setCardHeight(prev => (prev === next ? prev : next))
    }

    measure()

    const ro = new ResizeObserver(measure)
    ro.observe(frontEl)
    ro.observe(backEl)
    window.addEventListener('resize', measure)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [isFlipped])

  const formatBRL = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, '')
    if (input.length > 11) input = input.slice(0, 11)

    if (input.length > 6) {
      input = `(${input.slice(0, 2)}) ${input.slice(2, 7)}-${input.slice(7)}`
    } else if (input.length > 2) {
      input = `(${input.slice(0, 2)}) ${input.slice(2)}`
    } else if (input.length > 0) {
      input = `(${input}`
    }
    setPhone(input)
    if (errors.phone) setErrors(prev => ({ ...prev, phone: false }))
  }

  const validateForm = () => {
    const newErrors: { name?: boolean; phone?: boolean; motivoInteresse?: boolean; prazoContratacao?: boolean } =
      {}
    if (!name.trim()) newErrors.name = true
    if (phone.length < 14) newErrors.phone = true
    if (perguntaExtraTipo === 'motivacao') {
      if (!motivoInteresse.trim()) newErrors.motivoInteresse = true
    } else {
      if (!prazoContratacao) newErrors.prazoContratacao = true
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const construirPayload = (): SimuladorPayload => {
    return {
      tipoConsórcio: activeSegment.label,
      desejaSimular: simMode === 'credito' ? 'Valor do Crédito' : 'Valor da Parcela',
      valorDesejado: value,
      nome: name.trim(),
      telefone: phone,
      perguntaExtraTipo,
      motivoInteresse: perguntaExtraTipo === 'motivacao' ? motivoInteresse.trim() : undefined,
      prazoContratacao: perguntaExtraTipo === 'prazo' ? (prazoContratacao as PrazoContratacao) : undefined,
    }
  }

  const enviarSimulacao = async () => {
    if (!validateForm()) return

    const payload = construirPayload()
    setLastPayload(payload)
    setSubmitStatus('loading')
    setStatusMessage('Enviando sua simulação...')
    setLinkWhatsappGerado('')

    try {
      const resposta = await fetch('/api/simulador-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const dados: WebhookResposta = await resposta.json()

      if (!resposta.ok || !dados.sucesso) {
        throw new Error(dados.erro || 'Falha ao processar simulação.')
      }

      setSubmitStatus('success')
      setStatusMessage(dados.mensagem || 'Simulação enviada com sucesso!')
      if (dados.linkWhatsapp) {
        setLinkWhatsappGerado(dados.linkWhatsapp)
      }
    } catch (err) {
      setSubmitStatus('error')
      setStatusMessage(
        err instanceof Error ? err.message : 'Erro desconhecido ao enviar simulação.'
      )
    }
  }

  const reiniciarSimulacao = () => {
    setSubmitStatus('idle')
    setStatusMessage('')
    setLinkWhatsappGerado('')
    setName('')
    setPhone('')
    setMotivoInteresse('')
    setPrazoContratacao('')
    setPerguntaExtraTipo('motivacao')
    setErrors({})
    setIsFlipped(false)
  }

  return (
    <div className="perspective-container">
      <div
        className={`card-flipper ${isFlipped ? 'card-flipped' : ''}`}
        style={cardHeight ? { height: cardHeight } : undefined}
      >

        {/* LADO A: Formulário de Simulação */}
        <div
          ref={frontRef}
          className="card-front bg-white rounded-[32px] p-8 text-[#313335] shadow-[0_20px_50px_rgba(0,156,222,0.06)] border border-slate-100/50 flex flex-col gap-7"
        >

          {/* 1. Tipo de Consórcio */}
          <div>
            <label className="block text-xs font-bold tracking-widest text-slate-400 uppercase mb-3.5">
              1 · Selecione o tipo de consórcio
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {segments.map((s) => {
                const Icon = s.icon
                const isActive = segmentId === s.id
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSegmentId(s.id)}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all duration-300 group cursor-pointer ${isActive
                      ? 'border-[#009CDE] bg-slate-50/50 text-[#009CDE] shadow-sm shadow-[#009CDE]/10 font-bold scale-[1.02]'
                      : 'border-slate-100 text-slate-500 bg-white hover:border-slate-200 hover:text-slate-700 active:scale-98'
                      }`}
                  >
                    <Icon className={`w-6 h-6 mb-1.5 transition-transform duration-300 ${isActive ? 'text-[#009CDE]' : 'text-slate-400 group-hover:scale-115'
                      }`} />
                    <span className="text-[11px] tracking-tight">{s.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. Como deseja simular? */}
          <div>
            <label className="block text-xs font-bold tracking-widest text-slate-400 uppercase mb-3.5">
              2 · Como deseja simular?
            </label>
            <div className="relative w-full h-[48px] bg-slate-50 rounded-xl p-1 flex items-center border border-slate-100/50">
              <div
                className="absolute top-1 bottom-1 rounded-lg bg-white shadow-sm border border-slate-100 transition-all duration-300"
                style={{
                  left: simMode === 'credito' ? '4px' : '50%',
                  right: simMode === 'credito' ? '50%' : '4px',
                }}
              />
              <button
                type="button"
                onClick={() => setSimMode('credito')}
                className={`flex-1 text-center text-xs font-bold z-10 transition-colors duration-200 cursor-pointer ${simMode === 'credito' ? 'text-[#009CDE]' : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                Por Crédito
              </button>
              <button
                type="button"
                onClick={() => setSimMode('parcela')}
                className={`flex-1 text-center text-xs font-bold z-10 transition-colors duration-200 cursor-pointer ${simMode === 'parcela' ? 'text-[#009CDE]' : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                Por Parcela
              </button>
            </div>
          </div>

          {/* 3. Valor Desejado */}
          <div className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                3 · Valor desejado
              </label>
              <span className="text-xs font-medium text-slate-500">
                {simMode === 'credito'
                  ? 'Qual crédito você deseja contratar?'
                  : 'Qual parcela mensal você pretende pagar?'}
              </span>
            </div>

            <div className="w-full bg-slate-50 rounded-2xl px-5 py-3.5 flex items-center justify-between border border-slate-100">
              <span className="text-xl font-black text-[#313335] tracking-tight">
                {formatBRL(value)}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white border border-slate-100 rounded-lg px-2.5 py-1 shadow-sm">
                BRL
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <input
                type="range"
                min={config.min}
                max={config.max}
                step={config.step}
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#009CDE] transition-all hover:bg-slate-200"
              />
              <div className="flex justify-between text-[10px] font-semibold text-slate-400 px-0.5">
                <span>{formatBRL(config.min)}</span>
                <span>{formatBRL(config.max)}</span>
              </div>
            </div>
          </div>

          {/* Botão de Destaque para Continuar */}
          <div className="pt-1.5">
            <button
              type="button"
              onClick={() => {
                setMotivoInteresse('')
                setPrazoContratacao('')
                setErrors({})
                setPerguntaExtraTipo(Math.random() < 0.5 ? 'motivacao' : 'prazo')
                setIsFlipped(true)
              }}
              className="w-full bg-[#009CDE] hover:bg-[#008cc7] text-white font-bold text-sm py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 shadow-md shadow-[#009CDE]/10 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              Continuar simulação
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
          </div>

        </div>

        {/* LADO B: Coleta de Dados Pessoais + Estados de Feedback */}
        <div
          ref={backRef}
          className="card-back bg-white rounded-[32px] p-8 text-[#313335] shadow-[0_20px_50px_rgba(0,156,222,0.06)] border border-slate-100/50 flex flex-col justify-between"
        >

          {submitStatus === 'idle' || submitStatus === 'loading' ? (
            <>
              <div className="flex flex-col gap-6">
                {/* Header */}
                <div>
                  <button
                    type="button"
                    onClick={() => setIsFlipped(false)}
                    disabled={submitStatus === 'loading'}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#009CDE] transition-colors mb-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar e alterar valores
                  </button>
                  <h3 className="text-xl font-extrabold text-[#313335] tracking-tight">Estamos quase lá!</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Insira seus dados abaixo para receber as propostas completas de consórcio personalizadas no seu WhatsApp.
                  </p>
                </div>

                {/* Input Nome */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                    Seu nome completo
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-4 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Digite seu nome..."
                      value={name}
                      disabled={submitStatus === 'loading'}
                      onChange={(e) => {
                        setName(e.target.value)
                        if (errors.name) setErrors(prev => ({ ...prev, name: false }))
                      }}
                      className={cn(
                        "w-full bg-slate-50 border focus:bg-white rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed",
                        errors.name
                          ? "border-red-500 focus:border-red-500"
                          : "border-slate-100 focus:border-[#009CDE]"
                      )}
                      required
                    />
                  </div>
                  {errors.name && (
                    <span className="text-red-500 text-[10px] font-semibold px-1 mt-0.5">deve preencher os campos primeiro</span>
                  )}
                </div>

                {/* Input Telefone */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                    Seu WhatsApp
                  </label>
                  <div className="relative flex items-center">
                    <Phone className="absolute left-4 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={phone}
                      disabled={submitStatus === 'loading'}
                      onChange={handlePhoneChange}
                      className={cn(
                        "w-full bg-slate-50 border focus:bg-white rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed",
                        errors.phone
                          ? "border-red-500 focus:border-red-500"
                          : "border-slate-100 focus:border-[#009CDE]"
                      )}
                      required
                    />
                  </div>
                  {errors.phone && (
                    <span className="text-red-500 text-[10px] font-semibold px-1 mt-0.5">deve preencher os campos primeiro</span>
                  )}
                </div>

                {perguntaExtraTipo === 'motivacao' ? (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                      <span>O que motivou seu interesse pelo consórcio?</span>
                    </label>
                    <textarea
                      placeholder="Descreva aqui..."
                      value={motivoInteresse}
                      disabled={submitStatus === 'loading'}
                      onChange={(e) => {
                        setMotivoInteresse(e.target.value)
                        if (errors.motivoInteresse) {
                          setErrors(prev => ({ ...prev, motivoInteresse: false }))
                        }
                      }}
                      className={cn(
                        "w-full bg-slate-50 border focus:bg-white rounded-2xl py-3.5 px-4 text-sm outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed min-h-[120px] resize-none",
                        errors.motivoInteresse
                          ? "border-red-500 focus:border-red-500"
                          : "border-slate-100 focus:border-[#009CDE]"
                      )}
                      required
                    />
                    {errors.motivoInteresse && (
                      <span className="text-red-500 text-[10px] font-semibold px-1 mt-0.5">deve preencher os campos primeiro</span>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                      <span>Para quando você pretende contratar o consórcio?</span>
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {(
                        [
                          'compra imediata',
                          'curto prazo (até 30 dias)',
                          'médio prazo (até 3 meses)',
                          'apenas pesquisando por enquanto',
                        ] as const
                      ).map((opcao) => {
                        const isActive = prazoContratacao === opcao
                        return (
                          <button
                            key={opcao}
                            type="button"
                            disabled={submitStatus === 'loading'}
                            onClick={() => {
                              setPrazoContratacao(opcao)
                              if (errors.prazoContratacao) {
                                setErrors(prev => ({ ...prev, prazoContratacao: false }))
                              }
                            }}
                            className={cn(
                              "w-full bg-white border rounded-2xl px-4 py-4 flex items-center justify-between text-left transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer",
                              isActive
                                ? "border-[#009CDE] shadow-sm shadow-[#009CDE]/10"
                                : "border-slate-100 hover:border-slate-200"
                            )}
                          >
                            <span className="text-sm font-semibold text-[#313335] leading-snug">
                              {opcao}
                            </span>
                            <span
                              className={cn(
                                "w-5 h-5 rounded-full border flex items-center justify-center shrink-0",
                                isActive ? "border-[#009CDE]" : "border-slate-300"
                              )}
                            >
                              <span
                                className={cn(
                                  "w-2.5 h-2.5 rounded-full",
                                  isActive ? "bg-[#009CDE]" : "bg-transparent"
                                )}
                              />
                            </span>
                          </button>
                        )
                      })}
                    </div>
                    {errors.prazoContratacao && (
                      <span className="text-red-500 text-[10px] font-semibold px-1 mt-0.5">deve selecionar uma opção</span>
                    )}
                  </div>
                )}
              </div>

              {/* Botão de Envio para Webhook */}
              <div className="pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={enviarSimulacao}
                  disabled={submitStatus === 'loading'}
                  className="w-full bg-[#009CDE] hover:bg-[#008cc7] disabled:bg-[#008cc7]/80 text-white font-bold text-sm py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 shadow-md shadow-[#009CDE]/10 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:translate-y-0 disabled:cursor-not-allowed"
                >
                  {submitStatus === 'loading' ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      Enviando simulação...
                    </>
                  ) : (
                    <>
                      Ver simulação completa
                      <ArrowRight className="w-4.5 h-4.5" />
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-5 h-full text-center py-4">
              {submitStatus === 'success' ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 ring-4 ring-emerald-50">
                    <CheckCircle2 className="w-9 h-9" strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-[#0d172e] tracking-tight mb-2">
                      Simulação enviada!
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
                      {statusMessage} Um de nossos especialistas entrará em contato em breve.
                    </p>
                  </div>

                  {linkWhatsappGerado && (
                    <a
                      href={linkWhatsappGerado}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/15 hover:-translate-y-0.5 cursor-pointer"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.39a9.9 9.9 0 004.76 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.05c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.1.11-1.77-.11-.41-.13-.94-.3-1.62-.6-2.85-1.23-4.71-4.1-4.85-4.29-.14-.19-1.16-1.54-1.16-2.94s.72-2.08.98-2.37c.25-.28.55-.35.74-.35.19 0 .37 0 .53.01.17.01.4-.06.62.48.24.58.81 2 .88 2.14.07.14.11.31.02.5-.08.19-.13.31-.26.47-.13.16-.27.36-.39.48-.13.13-.26.27-.11.53.14.26.64 1.07 1.38 1.74.95.86 1.76 1.13 2.02 1.26.26.13.41.11.56-.07.16-.18.65-.77.83-1.03.18-.26.35-.22.6-.13.24.09 1.55.74 1.82.88.26.13.44.19.5.3.06.11.06.66-.18 1.34z" />
                      </svg>
                      Falar no WhatsApp agora
                    </a>
                  )}

                  {lastPayload && (
                    <div className="w-full text-left bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                        Resumo da simulação
                      </p>
                      <dl className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <dt className="text-slate-500">Consórcio</dt>
                          <dd className="font-semibold text-[#313335]">{lastPayload.tipoConsórcio}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-slate-500">Modo</dt>
                          <dd className="font-semibold text-[#313335]">{lastPayload.desejaSimular}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-slate-500">Valor</dt>
                          <dd className="font-semibold text-[#009CDE]">{formatBRL(lastPayload.valorDesejado)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-slate-500">Cliente</dt>
                          <dd className="font-semibold text-[#313335]">{lastPayload.nome}</dd>
                        </div>
                        {lastPayload.perguntaExtraTipo === 'motivacao' ? (
                          <div className="flex justify-between gap-4">
                            <dt className="text-slate-500 shrink-0">Motivação</dt>
                            <dd className="font-semibold text-[#313335] text-right line-clamp-2">
                              {lastPayload.motivoInteresse}
                            </dd>
                          </div>
                        ) : (
                          <div className="flex justify-between gap-4">
                            <dt className="text-slate-500 shrink-0">Prazo</dt>
                            <dd className="font-semibold text-[#313335] text-right line-clamp-2">
                              {lastPayload.prazoContratacao}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={reiniciarSimulacao}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#009CDE] transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Fazer nova simulação
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 ring-4 ring-red-50">
                    <AlertCircle className="w-9 h-9" strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-[#0d172e] tracking-tight mb-2">
                      Ops! Não foi possível enviar.
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
                      {statusMessage} Tente novamente em instantes.
                    </p>
                  </div>

                  <div className="w-full flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={enviarSimulacao}
                      className="w-full bg-[#009CDE] hover:bg-[#008cc7] text-white font-bold text-sm py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-[#009CDE]/10 cursor-pointer"
                    >
                      Tentar novamente
                    </button>
                    <button
                      type="button"
                      onClick={reiniciarSimulacao}
                      className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#009CDE] transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Começar simulação do zero
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  )
}
