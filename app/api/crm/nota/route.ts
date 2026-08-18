import { NextResponse } from 'next/server'
import { appendDealNote, CrmApiError } from '@/lib/crm'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { validateDealNote } from '@/lib/validation'
import { getRegisteredLead } from '@/lib/lead-registry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Usada quando nenhum dos 5 horários fixos serve — texto livre que o lead
// escreve, anotado na descrição do negócio já existente (nunca cria
// agendamento nenhum, os horários são fixos e texto livre não bate na
// grade). Best-effort do ponto de vista do fluxo: se falhar, o consultor
// ainda recebe a preferência via WhatsApp por POST /api/crm/notificar —
// esta rota é reforço, não a única via.
export async function POST(req: Request) {
  const ip = getClientIp(req)
  const limited = rateLimit(`crm:nota:${ip}`, 8, 10 * 60 * 1000)
  if (!limited.ok) {
    return NextResponse.json({ error: 'Muitas tentativas' }, { status: 429 })
  }

  const rawBody = await req.json().catch(() => null)
  if (!rawBody) return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })

  const validated = validateDealNote(rawBody)
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }
  const { dealId, nota } = validated.data

  // Mesmo princípio do /api/crm/agendamento e /api/crm/notificar: só
  // aceita nota pra um negócio que este servidor realmente criou via
  // /api/crm/deal.
  const registered = getRegisteredLead(dealId)
  if (!registered) {
    return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 })
  }

  try {
    await appendDealNote(dealId, nota)
    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof CrmApiError) {
      if (err.status === 429) {
        return NextResponse.json({ error: 'Muitas tentativas, aguarde alguns instantes.' }, { status: 429 })
      }
      console.error('[api/crm/nota] CRM recusou', err.status, err.message)
      return NextResponse.json({ error: 'Não foi possível registrar a preferência agora.' }, { status: 502 })
    }
    console.error('[api/crm/nota] erro inesperado', err)
    return NextResponse.json({ error: 'Erro inesperado' }, { status: 500 })
  }
}
