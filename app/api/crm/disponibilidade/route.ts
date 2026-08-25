import { NextResponse } from 'next/server'
import { getAvailability, CrmApiError } from '@/lib/crm'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// Grade de horários (5 fixos, 1h30 de intervalo) de um dia específico, pro
// consultor fixo (CRM_CONSULTOR_ID). `?date=YYYY-MM-DD` é obrigatório aqui
// — quem consome esta rota já sabe se quer "hoje" ou "amanhã" (o texto
// livre de horário alternativo nunca passa por aqui, vai direto pra
// POST /api/crm/nota). Data no passado ou dia não útil é repassada como
// veio do CRM (400), não tentamos adivinhar/corrigir a data pedida.
export async function GET(req: Request) {
  const ip = getClientIp(req)
  const limited = rateLimit(`crm:disponibilidade:${ip}`, 20, 60 * 1000)
  if (!limited.ok) {
    return NextResponse.json(
      { error: 'Muitas tentativas, aguarde um instante.' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } }
    )
  }

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  if (!date || !DATE_RE.test(date)) {
    return NextResponse.json({ error: 'Parâmetro "date" (YYYY-MM-DD) é obrigatório' }, { status: 400 })
  }

  try {
    const availability = await getAvailability(date)
    return NextResponse.json({ success: true, data: availability })
  } catch (err) {
    if (err instanceof CrmApiError) {
      if (err.status === 429) {
        return NextResponse.json({ error: 'Muitas tentativas, aguarde um instante.' }, { status: 429 })
      }
      if (err.status === 400) {
        // Data no passado ou dia não útil — decisão do CRM, propagada como
        // está pra quem chamou saber que precisa escolher outra data.
        return NextResponse.json({ error: err.code ?? 'invalid_date' }, { status: 400 })
      }
      console.error('[api/crm/disponibilidade] CRM recusou', err.status, err.message)
      return NextResponse.json({ error: 'Não foi possível carregar os horários agora.' }, { status: 502 })
    }
    console.error('[api/crm/disponibilidade] erro inesperado', err)
    return NextResponse.json({ error: 'Erro inesperado' }, { status: 500 })
  }
}
