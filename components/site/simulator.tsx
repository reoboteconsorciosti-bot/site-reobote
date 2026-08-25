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
import * as fpixel from '@/lib/fpixel'

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
type AgendamentoOpcao = 'hoje' | 'amanha' | 'outro'

interface SimuladorPayload {
  tipoConsórcio: string
  desejaSimular: 'Valor do Crédito' | 'Valor da Parcela'
  valorDesejado: number
  nome: string
  telefone: string
  perguntaExtraTipo: PerguntaExtraTipo
  motivoInteresse?: string
  prazoContratacao?: PrazoContratacao
  agendamentoOpcao: AgendamentoOpcao
  agendamentoHorario?: string
  agendamentoDisponibilidade?: string
  // Resumo pronto em texto do que o lead escolheu na tela de agendamento,
  // já formatado para entrar direto na mensagem enviada ao webhook/WhatsApp.
  reuniaoLead: string
}

// Nomes em pt-BR usados para montar a data por extenso a partir de
// new Date().getMonth() (0-11) e new Date().getDay() (0-6), como pedido.
const NOMES_MES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]
const NOMES_DIA_SEMANA = [
  'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
  'quinta-feira', 'sexta-feira', 'sábado',
]

function formatarDataExtenso(data: Date) {
  const diaSemana = NOMES_DIA_SEMANA[data.getDay()]
  const dia = data.getDate()
  const mes = NOMES_MES[data.getMonth()]
  return `${diaSemana}, ${dia} de ${mes}`
}

// Tempo de espera após "Continuar simulação" antes de criar o negócio no
// CRM e avisar "cliente se interessou mas não marcou agendamento" — só
// dispara se o lead não completar o agendamento antes disso (ver
// avancarParaAgendamento/criarNegocioSeNecessario).
const AVISO_SEM_AGENDAMENTO_DELAY_MS = 3 * 60 * 1000 // temporário — era 5 * 60 * 1000 (5 min), agora 20s só para teste

// "YYYY-MM-DD" no fuso local do navegador — é o formato que a rota interna
// GET /api/crm/disponibilidade?date=... espera.
function toDateKey(data: Date) {
  const y = data.getFullYear()
  const m = String(data.getMonth() + 1).padStart(2, '0')
  const d = String(data.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isBusinessDay(data: Date) {
  const dia = data.getDay()
  return dia >= 1 && dia <= 5
}

// "Amanhã" de verdade só faz sentido como dia útil — o CRM recusa (400)
// data que caia em fim de semana. Sem isso, clicar em "Agendar para
// amanhã" numa sexta (amanhã = sábado) ou num sábado (amanhã = domingo)
// sempre falhava, mesmo com tudo funcionando certo — o GET chegava no
// backend normalmente, só que pra uma data que o CRM nunca aceitaria.
function getProximoDiaUtil(apartirDe: Date) {
  const proximo = new Date(apartirDe)
  proximo.setDate(proximo.getDate() + 1)
  while (!isBusinessDay(proximo)) {
    proximo.setDate(proximo.getDate() + 1)
  }
  return proximo
}

interface AvailabilitySlot {
  time: string
  available: boolean
}

type HorariosStatus = 'idle' | 'loading' | 'error'

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

  // Segundo flip, aninhado dentro do verso do card: dados pessoais (frente)
  // ⇄ agendamento (verso), reaproveitando o mesmo mecanismo de flip 3D.
  const [step2Flipped, setStep2Flipped] = useState(false)
  const innerFrontRef = useRef<HTMLDivElement | null>(null)
  const innerBackRef = useRef<HTMLDivElement | null>(null)
  const [innerCardHeight, setInnerCardHeight] = useState<number | null>(null)

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

  const [agendamentoOpcao, setAgendamentoOpcao] = useState<AgendamentoOpcao | ''>('')
  const [agendamentoHorario, setAgendamentoHorario] = useState('')
  const [agendamentoDisponibilidade, setAgendamentoDisponibilidade] = useState('')
  const [agendamentoErrors, setAgendamentoErrors] = useState<{
    opcao?: boolean
    horario?: boolean
    disponibilidade?: boolean
    // Horário escolhido foi reservado por outra pessoa entre a busca de
    // disponibilidade e a tentativa de confirmar (409 do CRM) — mensagem
    // diferente de "esqueceu de escolher", ver validateAgendamento/enviarSimulacao.
    slotIndisponivel?: boolean
  }>({})

  // Negócio real criado no CRM (POST /api/crm/deal) assim que os dados
  // pessoais são confirmados — dealId/contactId viram obrigatórios pra
  // reservar o horário de verdade (POST /api/crm/agendamento) lá na frente.
  const [dealId, setDealId] = useState<string | null>(null)
  const [contactId, setContactId] = useState<string | null>(null)
  const [dealStatus, setDealStatus] = useState<'idle' | 'creating' | 'error'>('idle')
  const [dealError, setDealError] = useState('')

  // Timer de 5 minutos armado assim que o negócio é criado: se o lead não
  // terminar o agendamento (não clicar em "Ver simulação completa") até lá,
  // avisa o consultor que "o lead se interessou mas não agendou a visita".
  // Cancelado assim que a simulação é enviada com sucesso — nesse caso o
  // aviso real (agendado/preferência) já cobre o consultor, não faz sentido
  // mandar os dois.
  const semAgendamentoTimeoutRef = useRef<number | null>(null)

  const cancelarAvisoSemAgendamento = () => {
    if (semAgendamentoTimeoutRef.current !== null) {
      window.clearTimeout(semAgendamentoTimeoutRef.current)
      semAgendamentoTimeoutRef.current = null
    }
  }

  // Grade real de horários (hoje/amanhã), buscada no back — que por sua vez
  // consulta o CRM — assim que o lead confirma os dados pessoais, antes de
  // ele sequer ver a tela de agendamento.
  const [horariosStatus, setHorariosStatus] = useState<HorariosStatus>('idle')
  const [horariosPorData, setHorariosPorData] = useState<Record<string, AvailabilitySlot[]>>({})

  const [submitStatus, setSubmitStatus] = useState<SimStatus>('idle')
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [linkWhatsappGerado, setLinkWhatsappGerado] = useState<string>('')
  const [lastPayload, setLastPayload] = useState<SimuladorPayload | null>(null)

  const activeSegment = segments.find(s => s.id === segmentId)!
  const config = activeSegment[simMode]

  // "Hoje" em termos de calendário local do navegador de quem está
  // preenchendo. "Amanhã" é o próximo dia útil a partir de hoje (nunca
  // fim de semana) — ver getProximoDiaUtil.
  const hojeKey = toDateKey(new Date())
  const amanhaDate = getProximoDiaUtil(new Date())
  const amanhaKey = toDateKey(amanhaDate)
  const dataKeySelecionada = agendamentoOpcao === 'hoje' ? hojeKey : agendamentoOpcao === 'amanha' ? amanhaKey : null
  const slotsSelecionados = dataKeySelecionada ? horariosPorData[dataKeySelecionada] : undefined

  useEffect(() => {
    setValue(config.default)
  }, [segmentId, simMode, config.default])

  // Garante que o timer de 5min nunca sobrevive ao componente (ex: usuário
  // sai da página com o card de agendamento aberto).
  useEffect(() => cancelarAvisoSemAgendamento, [])

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

  // Mesma lógica de medição acima, só que para o flip interno (dados
  // pessoais ⇄ agendamento) que vive dentro do verso do card externo.
  useLayoutEffect(() => {
    const frontEl = innerFrontRef.current
    const backEl = innerBackRef.current
    if (!frontEl || !backEl) return

    const measure = () => {
      const el = step2Flipped ? backEl : frontEl
      const next = Math.ceil(el.getBoundingClientRect().height)
      if (!next) return
      setInnerCardHeight(prev => (prev === next ? prev : next))
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
  }, [step2Flipped])

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

  // Busca a grade real de horários de hoje e de amanhã na rota interna
  // (que por sua vez consulta o CRM) — nunca os dois dias na tela sem saber
  // de verdade o que está livre. Chamada ao avançar pro agendamento e
  // reaproveitada como "tentar novamente" se a busca falhar.
  const carregarDisponibilidade = async () => {
    setHorariosStatus('loading')

    try {
      const [respHoje, respAmanha] = await Promise.all([
        fetch(`/api/crm/disponibilidade?date=${hojeKey}`, { cache: 'no-store' }),
        fetch(`/api/crm/disponibilidade?date=${amanhaKey}`, { cache: 'no-store' }),
      ])
      const [dadosHoje, dadosAmanha] = await Promise.all([respHoje.json(), respAmanha.json()])

      if (!respHoje.ok || !dadosHoje?.success || !respAmanha.ok || !dadosAmanha?.success) {
        throw new Error('Falha ao carregar disponibilidade')
      }

      setHorariosPorData({
        [hojeKey]: dadosHoje.data.slots as AvailabilitySlot[],
        [amanhaKey]: dadosAmanha.data.slots as AvailabilitySlot[],
      })
      setHorariosStatus('idle')
    } catch {
      setHorariosStatus('error')
    }
  }

  // Descrição legível do que foi simulado — vira o campo `description` do
  // negócio criado no CRM (não existe formulário de qualificação aqui como
  // no lp_agendamento_automatico, então isso ocupa o mesmo lugar).
  const montarDescricaoDeal = () =>
    [
      `Tipo de Consórcio: ${activeSegment.label}`,
      `Modo de Simulação: ${simMode === 'credito' ? 'Valor do Crédito' : 'Valor da Parcela'}`,
      `Valor Desejado: ${formatBRL(value)}`,
      perguntaExtraTipo === 'motivacao'
        ? `Motivo do Interesse: ${motivoInteresse.trim()}`
        : `Prazo para Contratar: ${prazoContratacao}`,
    ].join('\n')

  // Cria o negócio no CRM só na primeira vez que alguém realmente precisa
  // dele — no timeout de 5min (se o lead não terminar) ou em
  // enviarSimulacao (se terminar antes) — nunca no clique de "Continuar
  // simulação" em si. Os dois pontos de chamada usam essa mesma função;
  // `negocioPromiseRef` garante que, se os dois dispararem quase ao mesmo
  // tempo, só uma requisição de criação saia (a segunda chamada espera a
  // mesma promise em vez de criar um negócio duplicado).
  const negocioPromiseRef = useRef<Promise<{ dealId: string; contactId: string }> | null>(null)

  const criarNegocioSeNecessario = (): Promise<{ dealId: string; contactId: string }> => {
    if (dealId && contactId) return Promise.resolve({ dealId, contactId })
    if (negocioPromiseRef.current) return negocioPromiseRef.current

    const promise = (async () => {
      setDealStatus('creating')
      setDealError('')
      try {
        const resposta = await fetch('/api/crm/deal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: name.trim(),
            telefone: phone,
            descricao: montarDescricaoDeal(),
            origem: 'Simulador Online - site Reobote Consórcios',
          }),
        })
        const dados = await resposta.json().catch(() => null)

        if (!resposta.ok || !dados?.success) {
          throw new Error(dados?.error || 'Não foi possível registrar seus dados agora.')
        }

        setDealId(dados.dealId)
        setContactId(dados.contactId)
        setDealStatus('idle')
        return { dealId: dados.dealId as string, contactId: dados.contactId as string }
      } catch (err) {
        setDealStatus('error')
        setDealError(err instanceof Error ? err.message : 'Erro inesperado ao registrar seus dados.')
        throw err
      } finally {
        negocioPromiseRef.current = null
      }
    })()

    negocioPromiseRef.current = promise
    return promise
  }

  // Ao confirmar os dados pessoais, só avança pro próximo verso do card —
  // o agendamento — e busca a grade real de horários (não depende de
  // negócio nenhum criado ainda). O negócio em si (POST /api/crm/deal) só
  // é criado daqui 5 minutos, e só se o lead não terminar sozinho antes
  // disso (ver criarNegocioSeNecessario/enviarSimulacao) — clicar aqui não
  // deve, sozinho, gerar negócio nenhum no CRM.
  const avancarParaAgendamento = () => {
    if (!validateForm()) return

    // FB Pixel Event — primeiro momento em que o lead entrega dado de
    // contato de verdade (nome + telefone), antes mesmo do agendamento.
    fpixel.event('CompleteRegistration', {
      content_name: 'Dados Pessoais Simulador',
      content_category: activeSegment.label,
      value,
      currency: 'BRL',
    })

    setAgendamentoErrors({})
    setStep2Flipped(true)
    carregarDisponibilidade()

    cancelarAvisoSemAgendamento()
    semAgendamentoTimeoutRef.current = window.setTimeout(async () => { // temporário — 20s para teste
      semAgendamentoTimeoutRef.current = null
      try {
        // Tenta criar o negócio no CRM e notificar pela rota normal
        const { dealId: id } = await criarNegocioSeNecessario()
        await fetch('/api/crm/notificar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dealId: id, agendado: false, negocioCriado: true }),
        })
      } catch {
        // temporário — fallback: se o CRM falhou, envia direto pelo webhook
        // do simulador para o consultor saber que houve interesse mesmo sem
        // o deal ter sido criado no CRM.
        try {
          await fetch('/api/simulador-webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tipoConsórcio: activeSegment.label,
              desejaSimular: simMode === 'credito' ? 'Valor do Crédito' : 'Valor da Parcela',
              valorDesejado: value,
              nome: name.trim(),
              telefone: phone,
              perguntaExtraTipo,
              motivoInteresse: perguntaExtraTipo === 'motivacao' ? motivoInteresse.trim() : undefined,
              prazoContratacao: perguntaExtraTipo === 'prazo' ? prazoContratacao : undefined,
              agendamentoOpcao: 'outro' as AgendamentoOpcao,
              agendamentoDisponibilidade: 'Cliente se interessou mas não agendou visita',
              reuniaoLead: 'Cliente se interessou mas não agendou visita',
            }),
          })
        } catch {
          // Best-effort: se nem o fallback funcionar, nada mais a fazer
        }
      }
    }, AVISO_SEM_AGENDAMENTO_DELAY_MS)
  }

  const validateAgendamento = () => {
    const newErrors: { opcao?: boolean; horario?: boolean; disponibilidade?: boolean } = {}
    if (!agendamentoOpcao) {
      newErrors.opcao = true
    } else if (agendamentoOpcao === 'hoje' || agendamentoOpcao === 'amanha') {
      if (!agendamentoHorario) newErrors.horario = true
    } else {
      if (!agendamentoDisponibilidade.trim()) newErrors.disponibilidade = true
    }
    setAgendamentoErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Resumo pronto em texto do que foi escolhido na tela de agendamento —
  // vira a variável `reuniaoLead` do payload, já pronta para a mensagem.
  const montarReuniaoLead = () => {
    if (agendamentoOpcao === 'hoje') {
      return `Hoje, ${formatarDataExtenso(new Date())} às ${agendamentoHorario}`
    }
    if (agendamentoOpcao === 'amanha') {
      return `Amanhã, ${formatarDataExtenso(amanhaDate)} às ${agendamentoHorario}`
    }
    if (agendamentoOpcao === 'outro') {
      return `Disponibilidade informada pelo lead: ${agendamentoDisponibilidade.trim()}`
    }
    return ''
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
      agendamentoOpcao: agendamentoOpcao as AgendamentoOpcao,
      agendamentoHorario:
        agendamentoOpcao === 'hoje' || agendamentoOpcao === 'amanha' ? agendamentoHorario : undefined,
      agendamentoDisponibilidade:
        agendamentoOpcao === 'outro' ? agendamentoDisponibilidade.trim() : undefined,
      reuniaoLead: montarReuniaoLead(),
    }
  }

  // Gatilho real da reserva/nota no CRM + envio do webhook — só dispara
  // depois que o agendamento (último verso do card) também estiver
  // validado. Ordem importa: primeiro tenta reservar de verdade no CRM
  // (pode falhar com 409 se alguém levou o horário antes), só then segue
  // pro aviso via WhatsApp e pro webhook original.
  const enviarSimulacao = async () => {
    if (!validateAgendamento()) return

    setSubmitStatus('loading')
    setStatusMessage('Enviando sua simulação...')
    setLinkWhatsappGerado('')

    try {
      // Cria o negócio no CRM agora, se o timeout de 5min ainda não tiver
      // criado (ver criarNegocioSeNecessario) — é aqui que "quando foi
      // agendado" passa a existir de fato no negócio.
      const { dealId: id, contactId: cid } = await criarNegocioSeNecessario()

      if (agendamentoOpcao === 'hoje' || agendamentoOpcao === 'amanha') {
        const respAgenda = await fetch('/api/crm/agendamento', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dealId: id, contactId: cid, date: dataKeySelecionada, time: agendamentoHorario }),
        })

        if (respAgenda.status === 409) {
          // Alguém reservou esse horário entre a busca de disponibilidade e
          // esta confirmação — nunca finge sucesso: devolve o lead pra
          // escolha, com a grade já atualizada.
          setSubmitStatus('idle')
          setStatusMessage('')
          setAgendamentoHorario('')
          setAgendamentoErrors({ slotIndisponivel: true })
          await carregarDisponibilidade()
          return
        }

        const dadosAgenda = await respAgenda.json().catch(() => null)
        if (!respAgenda.ok || !dadosAgenda?.success) {
          throw new Error(dadosAgenda?.error || 'Não foi possível confirmar o agendamento agora.')
        }
      } else if (agendamentoOpcao === 'outro') {
        const respNota = await fetch('/api/crm/nota', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dealId: id,
            nota: `Disponibilidade informada pelo lead: ${agendamentoDisponibilidade.trim()}`,
          }),
        })
        const dadosNota = await respNota.json().catch(() => null)
        if (!respNota.ok || !dadosNota?.success) {
          throw new Error(dadosNota?.error || 'Não foi possível registrar sua preferência agora.')
        }
      }

      // O agendamento (ou a nota de preferência) foi confirmado de
      // verdade — cancela o aviso de "interessado mas não agendou" armado
      // em avancarParaAgendamento, pra não mandar os dois pro consultor.
      cancelarAvisoSemAgendamento()

      // Aviso via WhatsApp pro consultor e o supervisor — best-effort do
      // lado do servidor (a rota interna nunca relança), então não precisa
      // travar o fluxo do lead esperando.
      fetch('/api/crm/notificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          agendamentoOpcao === 'outro'
            ? { dealId: id, agendado: false, preferenciaHorario: agendamentoDisponibilidade.trim() }
            : { dealId: id, agendado: true, data: dataKeySelecionada, hora: agendamentoHorario }
        ),
      }).catch(() => { })

      const payload = construirPayload()
      setLastPayload(payload)

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
      
      // FB Pixel Event
      fpixel.event('Lead', { 
        content_name: 'Simulador Concluído',
        value: payload.valorDesejado,
        currency: 'BRL'
      })

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
    setAgendamentoOpcao('')
    setAgendamentoHorario('')
    setAgendamentoDisponibilidade('')
    setAgendamentoErrors({})
    setDealId(null)
    setContactId(null)
    setDealStatus('idle')
    setDealError('')
    setHorariosStatus('idle')
    setHorariosPorData({})
    setStep2Flipped(false)
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

                // FB Pixel Event
                fpixel.event('InitiateCheckout', { 
                  content_name: 'Simulador Iniciado',
                  content_category: activeSegment.label,
                  value,
                  currency: 'BRL'
                })
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
            <div className="perspective-container" style={{ maxWidth: 'none' }}>
              <div
                className={`card-flipper ${step2Flipped ? 'card-flipped' : ''}`}
                style={innerCardHeight ? { height: innerCardHeight } : undefined}
              >

                {/* VERSO B.1: Coleta de Dados Pessoais */}
                <div ref={innerFrontRef} className="card-front flex flex-col justify-between gap-6">
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

                  {/* Botão só avança pro agendamento — não cria nada no CRM
                  ainda. O negócio de verdade só nasce daqui 5 minutos (se o
                  lead não terminar sozinho antes) ou no clique de "Ver
                  simulação completa", o que vier primeiro — ver
                  criarNegocioSeNecessario. */}
                  <div className="pt-6 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={avancarParaAgendamento}
                      className="w-full bg-[#009CDE] hover:bg-[#008cc7] text-white font-bold text-sm py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 shadow-md shadow-[#009CDE]/10 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                    >
                      Continuar simulação
                      <ArrowRight className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                {/* VERSO B.2: Agendamento — gatilho real do webhook */}
                <div ref={innerBackRef} className="card-back flex flex-col justify-between gap-6">
                  <div className="flex flex-col gap-6">
                    {/* Header */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setStep2Flipped(false)}
                        disabled={submitStatus === 'loading'}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#009CDE] transition-colors mb-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar e revisar meus dados
                      </button>
                      <h3 className="text-xl font-extrabold text-[#313335] tracking-tight">Vamos agendar sua conversa?</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Hoje é {formatarDataExtenso(new Date())}. Escolha a melhor forma de conversarmos sobre sua simulação.
                      </p>
                    </div>

                    {/* 3 opções de agendamento */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                        Quando podemos falar com você?
                      </label>
                      <div className="grid grid-cols-1 gap-3">
                        {(
                          [
                            {
                              id: 'hoje' as const,
                              titulo: 'Agendar reunião para hoje',
                              subtitulo: formatarDataExtenso(new Date()),
                            },
                            {
                              id: 'amanha' as const,
                              titulo: 'Agendar para amanhã',
                              subtitulo: formatarDataExtenso(amanhaDate),
                            },
                            {
                              id: 'outro' as const,
                              titulo: 'Prefiro informar minha disponibilidade',
                              subtitulo: 'Você escreve o melhor dia e horário',
                            },
                          ]
                        ).map((opcao) => {
                          const isActive = agendamentoOpcao === opcao.id
                          return (
                            <button
                              key={opcao.id}
                              type="button"
                              disabled={submitStatus === 'loading'}
                              onClick={() => {
                                setAgendamentoOpcao(opcao.id)
                                setAgendamentoErrors({})
                                if (opcao.id !== agendamentoOpcao) {
                                  setAgendamentoHorario('')
                                }
                              }}
                              className={cn(
                                "w-full bg-white border rounded-2xl px-4 py-4 flex items-center justify-between text-left transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer",
                                isActive
                                  ? "border-[#009CDE] shadow-sm shadow-[#009CDE]/10"
                                  : "border-slate-100 hover:border-slate-200"
                              )}
                            >
                              <span className="flex flex-col">
                                <span className="text-sm font-semibold text-[#313335] leading-snug">
                                  {opcao.titulo}
                                </span>
                                <span className="text-[11px] text-slate-400 mt-0.5 capitalize">
                                  {opcao.subtitulo}
                                </span>
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
                      {agendamentoErrors.opcao && (
                        <span className="text-red-500 text-[10px] font-semibold px-1 mt-0.5">deve selecionar uma opção</span>
                      )}
                    </div>

                    {/* Horários — grade real, buscada em /api/crm/disponibilidade
                      (rota interna que consulta o CRM) assim que o lead clicou
                      em "Continuar simulação", antes de chegar nesta tela. */}
                    {(agendamentoOpcao === 'hoje' || agendamentoOpcao === 'amanha') && (
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                          Horários disponíveis
                        </label>

                        {horariosStatus === 'loading' && !slotsSelecionados ? (
                          <div className="grid grid-cols-3 gap-2.5">
                            {[0, 1, 2, 3, 4].map((i) => (
                              <div key={i} className="h-[42px] rounded-xl bg-slate-100 animate-pulse" />
                            ))}
                          </div>
                        ) : horariosStatus === 'error' ? (
                          <div className="flex flex-col items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                            <span className="text-xs text-red-600 font-medium">
                              Não foi possível carregar os horários agora.
                            </span>
                            <button
                              type="button"
                              onClick={carregarDisponibilidade}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              Tentar novamente
                            </button>
                          </div>
                        ) : slotsSelecionados && slotsSelecionados.every((slot) => !slot.available) ? (
                          <span className="text-xs text-slate-500">
                            Nenhum horário disponível {agendamentoOpcao === 'hoje' ? 'para hoje' : 'para amanhã'}. Tente a outra data ou informe sua disponibilidade.
                          </span>
                        ) : (
                          <div className="grid grid-cols-3 gap-2.5">
                            {(slotsSelecionados ?? []).map((slot) => {
                              const isActive = agendamentoHorario === slot.time
                              return (
                                <button
                                  key={slot.time}
                                  type="button"
                                  disabled={submitStatus === 'loading' || !slot.available}
                                  title={!slot.available ? 'Horário já ocupado' : undefined}
                                  onClick={() => {
                                    setAgendamentoHorario(slot.time)
                                    if (agendamentoErrors.horario) {
                                      setAgendamentoErrors(prev => ({ ...prev, horario: false }))
                                    }
                                  }}
                                  className={cn(
                                    "py-3 rounded-xl border text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
                                    isActive
                                      ? "border-[#009CDE] bg-slate-50/50 text-[#009CDE] shadow-sm shadow-[#009CDE]/10"
                                      : "border-slate-100 text-slate-500 bg-white hover:border-slate-200"
                                  )}
                                >
                                  {slot.time}
                                </button>
                              )
                            })}
                          </div>
                        )}

                        {agendamentoErrors.slotIndisponivel && (
                          <span className="text-red-500 text-[10px] font-semibold px-1 mt-0.5">
                            esse horário acabou de ser reservado por outra pessoa — escolha outro
                          </span>
                        )}
                        {agendamentoErrors.horario && !agendamentoErrors.slotIndisponivel && (
                          <span className="text-red-500 text-[10px] font-semibold px-1 mt-0.5">deve escolher um horário</span>
                        )}
                      </div>
                    )}

                    {/* Disponibilidade em texto livre */}
                    {agendamentoOpcao === 'outro' && (
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                          Quando você estará disponível?
                        </label>
                        <textarea
                          placeholder="Ex: terça ou quinta à tarde, depois das 15h..."
                          value={agendamentoDisponibilidade}
                          disabled={submitStatus === 'loading'}
                          onChange={(e) => {
                            setAgendamentoDisponibilidade(e.target.value)
                            if (agendamentoErrors.disponibilidade) {
                              setAgendamentoErrors(prev => ({ ...prev, disponibilidade: false }))
                            }
                          }}
                          className={cn(
                            "w-full bg-slate-50 border focus:bg-white rounded-2xl py-3.5 px-4 text-sm outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed min-h-[100px] resize-none",
                            agendamentoErrors.disponibilidade
                              ? "border-red-500 focus:border-red-500"
                              : "border-slate-100 focus:border-[#009CDE]"
                          )}
                          required
                        />
                        {agendamentoErrors.disponibilidade && (
                          <span className="text-red-500 text-[10px] font-semibold px-1 mt-0.5">conte pra gente quando você estará disponível</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Botão de Envio para Webhook — gatilho real da simulação */}
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
                </div>

              </div>
            </div>
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
                      onClick={() => fpixel.event('Contact', { content_name: 'Pós-Simulação WhatsApp' })}
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
