import { NextResponse } from 'next/server'
import { createAppointment, CrmApiError } from '@/lib/crm'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { validateCreateAppointment } from '@/lib/validation'
import { getRegisteredLead } from '@/lib/lead-registry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Reserva um dos 5 horários fixos pro negócio já criado via
// POST /api/crm/deal. Texto livre de horário alternativo NUNCA chega
// nesta rota — isso vai pra POST /api/crm/nota, já que os horários são
// fixos e texto livre não bate na grade.
export async function POST(req: Request) {
  const ip = getClientIp(req)
  const limited = rateLimit(`crm:agendamento:${ip}`, 8, 10 * 60 * 1000)
  if (!limited.ok) {
    return NextResponse.json(
      { error: 'Muitas tentativas, aguarde alguns minutos.' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } }
    )
  }

  const rawBody = await req.json().catch(() => null)
  if (!rawBody) return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })

  const validated = validateCreateAppointment(rawBody)
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }
  const { dealId, contactId, date, time } = validated.data

  // `dealId` só pode ser um negócio que este mesmo servidor criou de
  // verdade via /api/crm/deal — impede que alguém sem passar pelo fluxo
  // fabrique um dealId qualquer só pra reservar/monopolizar os 5 horários
  // do dia (negando a vaga pra leads reais).
  const registered = getRegisteredLead(dealId)
  if (!registered || registered.contactId !== contactId) {
    return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 })
  }

  try {
    const result = await createAppointment({ dealId, contactId, date, time })
    return NextResponse.json({ success: true, data: result }, { status: 201 })
  } catch (err) {
    if (err instanceof CrmApiError) {
      // 409 = alguém reservou esse horário entre um GET /disponibilidade
      // anterior e este POST — propagado como está (não vira erro
      // genérico), pra quem chamou saber que precisa consultar a
      // disponibilidade de novo em vez de tentar de novo o mesmo horário.
      if (err.status === 409) {
        return NextResponse.json({ error: 'slot_unavailable' }, { status: 409 })
      }
      if (err.status === 429) {
        return NextResponse.json({ error: 'Muitas tentativas, aguarde alguns instantes.' }, { status: 429 })
      }
      console.error('[api/crm/agendamento] CRM recusou', err.status, err.message)
      return NextResponse.json({ error: 'Não foi possível confirmar o agendamento agora.' }, { status: 502 })
    }
    console.error('[api/crm/agendamento] erro inesperado', err)
    return NextResponse.json({ error: 'Erro inesperado' }, { status: 500 })
  }
}
