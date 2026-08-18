import { crmEnv } from './env'

// Payload exatamente como o workflow "agendamento-lp" espera — o texto da
// mensagem de WhatsApp em si é decidido dentro do n8n a partir do campo
// `agendado`; este arquivo só entrega o payload, nunca decide conteúdo de
// mensagem.
export type CrmNotifyPayload =
  | {
      nome: string
      telefone: string
      dealId: string
      contactId: string
      agendado: true
      data: string
      hora: string
      origem: 'site'
    }
  | {
      nome: string
      telefone: string
      dealId: string
      contactId: string
      agendado: false
      preferenciaHorario: string
      origem: 'site'
    }

// Dispara o aviso de agendamento (ou de preferência de horário) pro n8n.
// Sempre best-effort: nunca relança — o negócio/agendamento já foi
// confirmado no CRM antes desta chamada, então uma falha aqui não pode
// derrubar a resposta pro usuário, só fica registrada no log do servidor
// pra investigar depois.
export async function notifyCrmAgendamento(payload: CrmNotifyPayload): Promise<void> {
  try {
    const res = await fetch(crmEnv.notifyWebhookUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })

    if (!res.ok) {
      console.error(`[crm-notify] falha ao notificar n8n (HTTP ${res.status}) — dealId=${payload.dealId}`)
    }
  } catch (err) {
    console.error('[crm-notify] erro inesperado ao notificar n8n', err)
  }
}
