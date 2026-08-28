import { NextResponse } from 'next/server'
import { siteConfig, whatsappLink } from '@/lib/site-config'
import {
  validarPayload,
  formatarBRL,
  montarMensagem,
  encaminharParaWebhookExterno,
} from '@/lib/simulador-webhook'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Webhook dedicado da landing /parceria-ufms — não pode compartilhar o
// WHATSAPP_WEBHOOK_URL do site institucional (esse aqui é controlado pelo
// n8n do lado da parceria, com automação própria). Payload e mensagem
// enviados são exatamente os mesmos de /api/simulador-webhook (ver
// lib/simulador-webhook.ts); só o destino muda. Dá pra sobrescrever via env
// (LP_UFMS_WEBHOOK_URL) sem depender de rebuild, mas o padrão já é o n8n da
// parceria.
const UFMS_WEBHOOK_URL =
  process.env.LP_UFMS_WEBHOOK_URL || 'https://reobote-n8n.to0i0r.easypanel.host/webhook/lp-ufms'

export async function POST(request: Request) {
  console.log('[ROUTE-UFMS] Recebido POST em /api/simulador-webhook-ufms')

  try {
    const body = await request.json()
    console.log('[ROUTE-UFMS] Payload recebido:', JSON.stringify(body))

    if (!validarPayload(body)) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: 'Payload inválido. Verifique os campos obrigatórios e seus formatos.',
          camposEsperados: {
            tipoConsórcio: 'string',
            desejaSimular: '"Valor do Crédito" | "Valor da Parcela"',
            valorDesejado: 'number (positivo)',
            nome: 'string (mín. 2 caracteres)',
            telefone: 'string (mín. 11 dígitos)',
            perguntaExtraTipo: '"motivacao" | "prazo"',
            motivoInteresse: 'string (mín. 3 caracteres) (quando perguntaExtraTipo="motivacao")',
            prazoContratacao:
              '"compra imediata" | "curto prazo (até 30 dias)" | "médio prazo (até 3 meses)" | "apenas pesquisando por enquanto" (quando perguntaExtraTipo="prazo")',
            agendamentoOpcao: '"hoje" | "amanha" | "outro"',
            agendamentoHorario: 'string (quando agendamentoOpcao="hoje" ou "amanha")',
            agendamentoDisponibilidade: 'string (mín. 2 caracteres) (quando agendamentoOpcao="outro")',
            reuniaoLead: 'string (resumo pronto do agendamento, ex.: "Hoje, terça-feira, 18 de agosto às 09:00")',
          },
        },
        { status: 400 }
      )
    }

    const mensagem = montarMensagem(body, 'Simulador Online - Parceria UFMS')

    const resultadoWebhook = await encaminharParaWebhookExterno(
      body,
      mensagem,
      siteConfig.whatsapp,
      {
        url: UFMS_WEBHOOK_URL,
        metodo: (process.env.LP_UFMS_WEBHOOK_METHOD || 'POST').toUpperCase() as 'GET' | 'POST' | 'PUT',
        secret: process.env.LP_UFMS_WEBHOOK_SECRET,
      },
      '[WEBHOOK-UFMS]'
    )

    const linkWhatsapp = whatsappLink(mensagem)

    return NextResponse.json(
      {
        sucesso: true,
        mensagem: 'Lead processado com sucesso.',
        linkWhatsapp,
        integradorExterno: resultadoWebhook,
        dadosRecebidos: {
          ...body,
          valorFormatado: formatarBRL(body.valorDesejado),
        },
      },
      { status: 200 }
    )
  } catch (erro) {
    const msg = erro instanceof Error ? erro.message : String(erro)
    console.error('[ROUTE-UFMS] Erro interno:', msg)
    return NextResponse.json(
      {
        sucesso: false,
        erro: 'Erro interno no processamento do webhook.',
        detalhe: msg,
      },
      { status: 500 }
    )
  }
}
