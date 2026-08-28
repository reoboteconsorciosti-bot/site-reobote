import { NextResponse } from 'next/server'
import { formatarBRL, montarMensagemUFMS, validarPayloadUFMS, encaminharParaWebhookExterno } from '@/lib/simulador-webhook'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Webhook dedicado da landing /parceria-ufms — desconectado de propósito do
// CRM e do webhook geral do site institucional (WHATSAPP_WEBHOOK_URL). Essa
// rota só faz uma coisa: valida o payload simplificado (tipo/valor do
// consórcio + dados pessoais, sem etapa de agendamento — ver
// SimuladorPayloadUFMS em lib/simulador-webhook.ts) e encaminha pro n8n da
// parceria. Nada de deal/nota/notificação no CRM. Dá pra sobrescrever a URL
// via env (LP_UFMS_WEBHOOK_URL) sem rebuild, mas o padrão já é o n8n da
// parceria.
const UFMS_WEBHOOK_URL =
  process.env.LP_UFMS_WEBHOOK_URL || 'https://reobote-n8n.to0i0r.easypanel.host/webhook/lp-ufms'

export async function POST(request: Request) {
  console.log('[ROUTE-UFMS] Recebido POST em /api/simulador-webhook-ufms')

  try {
    const body = await request.json()
    console.log('[ROUTE-UFMS] Payload recebido:', JSON.stringify(body))

    if (!validarPayloadUFMS(body)) {
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
          },
        },
        { status: 400 }
      )
    }

    const mensagem = montarMensagemUFMS(body, 'Simulador Online - Parceria UFMS')

    // telefoneDestino só identifica quem o n8n deveria notificar no corpo do
    // webhook — como não existe mais link de WhatsApp gerado por esta rota
    // (isso já é resolvido no cliente via whatsappOverride do Santarosa),
    // não precisa do número geral da Reobote (siteConfig.whatsapp) aqui.
    const resultadoWebhook = await encaminharParaWebhookExterno(
      body,
      mensagem,
      body.telefone,
      {
        url: UFMS_WEBHOOK_URL,
        metodo: (process.env.LP_UFMS_WEBHOOK_METHOD || 'POST').toUpperCase() as 'GET' | 'POST' | 'PUT',
        secret: process.env.LP_UFMS_WEBHOOK_SECRET,
      },
      '[WEBHOOK-UFMS]'
    )

    return NextResponse.json(
      {
        sucesso: true,
        mensagem: 'Lead processado com sucesso.',
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
