import { NextResponse } from 'next/server'
import { notifySiteWorkflow, type NotifyEvent } from '@/lib/site-notify'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { validateNotify } from '@/lib/validation'
import { getRegisteredLead } from '@/lib/lead-registry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Dispara o aviso pro consultor/supervisor em 3 momentos possíveis — logo
// após POST /api/crm/deal (negócio criado, ainda sem agendamento — só
// depois de um timeout de 5min sem o lead terminar, ver
// components/site/simulator.tsx), depois de POST /api/crm/agendamento
// (agendou de verdade) ou de POST /api/crm/nota (só deixou uma preferência
// de horário) — sempre pro mesmo webhook do simulador (WHATSAPP_WEBHOOK_URL,
// ver lib/site-notify.ts). Esta rota nunca decide sozinha o que aconteceu,
// só avisa sobre algo que já foi confirmado antes.
export async function POST(req: Request) {
  // Generoso mas ainda limitado — best-effort não deve virar porta aberta
  // pra inundar o WhatsApp do time com avisos forjados.
  const ip = getClientIp(req)
  const limited = rateLimit(`crm:notificar:${ip}`, 20, 10 * 60 * 1000)
  if (!limited.ok) {
    return NextResponse.json({ error: 'Muitas tentativas' }, { status: 429 })
  }

  const rawBody = await req.json().catch(() => null)
  if (!rawBody) return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })

  const validated = validateNotify(rawBody)
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }
  const input = validated.data

  // Ponto central da segurança desta rota: NUNCA confiar em nome/telefone
  // vindos do body — esta rota é pública, então qualquer um poderia chamá-
  // la direto e forjar um "lead" inteiro pra fazer o n8n mandar uma
  // mensagem inventada pro WhatsApp do consultor/supervisor. Os únicos
  // dados que realmente identificam quem é o lead vêm do registro que só
  // /api/crm/deal consegue criar; do body só aceitamos o que descreve O QUE
  // ACONTECEU nesta chamada (agendou ou não, quando, qual preferência, ou
  // só que o negócio existe sem agendamento).
  const registered = getRegisteredLead(input.dealId)
  if (!registered) {
    return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 })
  }

  const evento: NotifyEvent =
    'negocioCriado' in input
      ? { tipo: 'sem_agendamento' }
      : input.agendado
        ? { tipo: 'agendado', data: input.data, hora: input.hora }
        : { tipo: 'preferencia_horario', preferenciaHorario: input.preferenciaHorario }

  // Sem `await`: o aviso de WhatsApp nunca pode travar a resposta pro
  // usuário — o negócio/agendamento já foi confirmado no CRM antes desta
  // chamada, então dispara e responde 202 na hora. notifySiteWorkflow já é
  // best-effort por dentro (nunca relança), o .catch aqui é uma segunda
  // rede de segurança contra qualquer rejeição não tratada.
  notifySiteWorkflow({
    nome: registered.nome,
    telefone: registered.telefone,
    dealId: input.dealId,
    contactId: registered.contactId,
    descricao: registered.descricao,
    evento,
  }).catch((err) => console.error('[api/crm/notificar] falha inesperada', err))

  return NextResponse.json({ ok: true }, { status: 202 })
}
