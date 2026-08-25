import { siteConfig } from './site-config'

// Todo aviso de agendamento (agendou de verdade, deixou preferência de
// horário livre, ou só criou o negócio e nunca voltou pra terminar) vai
// pro MESMO webhook que o simulador já usa — WHATSAPP_WEBHOOK_URL,
// primeira variável do .env.local. O workflow "agendamento-lp" (uma URL
// separada, CRM_NOTIFY_WEBHOOK_URL) foi retirado — nada mais aponta pra
// ele, então nem existe mais como variável de ambiente.

export type NotifyEvent =
  | { tipo: 'agendado'; data: string; hora: string }
  | { tipo: 'preferencia_horario'; preferenciaHorario: string }
  // Negócio criado no CRM, mas o lead não chegou a confirmar um
  // agendamento — nem escolheu horário, nem deixou preferência. Disparado
  // pelo timeout de 5 minutos no simulador (ver components/site/simulator.tsx),
  // não na hora do clique: dar tempo do lead terminar sozinho antes de
  // avisar o consultor de um interesse que ainda pode virar agendamento.
  | { tipo: 'sem_agendamento' }

export interface NotifyInput {
  nome: string
  telefone: string
  dealId: string
  contactId: string
  evento: NotifyEvent
  // Resumo da simulação (tipo de consórcio, modo, valor, motivo/prazo) —
  // o mesmo texto já guardado na descrição do negócio no CRM desde o
  // clique de "Continuar simulação" (ver lib/lead-registry.ts). Crucial
  // no aviso de "sem_agendamento": sem isso, o consultor só recebia
  // nome/telefone e um "não agendou" seco, sem saber em que a pessoa
  // estava interessada.
  descricao?: string
}

// Um único campo/linha "agendamento", com um valor diferente conforme o
// que aconteceu — mesmo texto usado no JSON do payload e na mensagem, pra
// quem for ler (ou configurar uma condição no n8n) ter um só lugar pra
// olhar em vez de precisar combinar `evento`+`agendado`+campos variados.
function montarResumoAgendamento(evento: NotifyEvent): string {
  if (evento.tipo === 'agendado') return `${evento.data} às ${evento.hora}`
  if (evento.tipo === 'preferencia_horario') return `Preferência de horário informada: ${evento.preferenciaHorario}`
  return 'Cliente se interessou mas não marcou agendamento'
}

function montarMensagem(input: NotifyInput, resumoAgendamento: string): string {
  return [
    `*NOVO LEAD - SITE REOBOTE (agendamento)*`,
    ``,
    `• Nome: ${input.nome}`,
    `• WhatsApp: ${input.telefone}`,
    ...(input.descricao ? [input.descricao] : []),
    `• Agendamento: ${resumoAgendamento}`,
    ``,
    `Origem: Simulador Online - site Reobote Consórcios`,
  ].join('\n')
}

// Best-effort: nunca relança — o negócio (e o agendamento, quando existe)
// já foram confirmados no CRM antes desta chamada, uma falha aqui não pode
// derrubar a resposta pro usuário, só fica registrada no log do servidor.
export async function notifySiteWorkflow(input: NotifyInput): Promise<void> {
  const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL
  if (!webhookUrl) {
    console.error('[site-notify] WHATSAPP_WEBHOOK_URL não configurada')
    return
  }

  const resumoAgendamento = montarResumoAgendamento(input.evento)
  const mensagem = montarMensagem(input, resumoAgendamento)

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        evento:
          input.evento.tipo === 'agendado'
            ? 'agendamento_confirmado'
            : input.evento.tipo === 'preferencia_horario'
              ? 'preferencia_horario_informada'
              : 'lead_sem_agendamento',
        timestamp: new Date().toISOString(),
        payload: {
          nome: input.nome,
          telefone: input.telefone,
          contactId: input.contactId,
          descricao: input.descricao || undefined,
          agendamento: resumoAgendamento,
          ...input.evento,
        },
        mensagemFormatada: mensagem,
        telefoneDestino: siteConfig.whatsapp,
      }),
      cache: 'no-store',
    })

    if (!res.ok) {
      console.error(`[site-notify] falha ao notificar siteWorkflow (HTTP ${res.status}) — dealId=${input.dealId}`)
    }
  } catch (err) {
    console.error('[site-notify] erro inesperado ao notificar siteWorkflow', err)
  }
}
