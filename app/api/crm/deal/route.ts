import { NextResponse } from 'next/server'
import { createDeal, CrmApiError } from '@/lib/crm'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { validateCreateDeal } from '@/lib/validation'
import { registerLead } from '@/lib/lead-registry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Primeiro passo do fluxo de agendamento: cria o contato + negócio no CRM.
// As rotas seguintes (agendamento, nota, notificação) só aceitam
// dealId/contactId que tenham passado por aqui — ver lib/lead-registry.ts.
export async function POST(req: Request) {
  // Rota pública, sem autenticação — precisa de limite próprio pra não
  // virar porta de spam pro CRM (ver lib/rate-limit.ts pro porquê de
  // também existir um limite global, aplicado dentro de lib/crm.ts).
  const ip = getClientIp(req)
  const limited = rateLimit(`crm:deal:${ip}`, 8, 10 * 60 * 1000)
  if (!limited.ok) {
    return NextResponse.json(
      { error: 'Muitas tentativas, aguarde alguns minutos.' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } }
    )
  }

  const rawBody = await req.json().catch(() => null)
  if (!rawBody) return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })

  const validated = validateCreateDeal(rawBody)
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }

  try {
    const { dealId, contactId } = await createDeal(validated.data)
    registerLead(dealId, contactId, validated.data.nome, validated.data.telefone, validated.data.descricao ?? '')

    return NextResponse.json({ success: true, dealId, contactId }, { status: 201 })
  } catch (err) {
    if (err instanceof CrmApiError) {
      if (err.status === 429) {
        return NextResponse.json({ error: 'Muitas tentativas, aguarde alguns instantes.' }, { status: 429 })
      }
      console.error('[api/crm/deal] CRM recusou a criação do negócio', err.status, err.message)
      return NextResponse.json({ error: 'Não foi possível registrar seus dados agora. Tente novamente.' }, { status: 502 })
    }
    console.error('[api/crm/deal] erro inesperado', err)
    return NextResponse.json({ error: 'Erro inesperado' }, { status: 500 })
  }
}
