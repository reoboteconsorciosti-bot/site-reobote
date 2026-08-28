import { NextResponse } from 'next/server'
import { siteConfig, whatsappLink } from '@/lib/site-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export interface SimuladorPayload {
  tipoConsórcio: string
  desejaSimular: 'Valor do Crédito' | 'Valor da Parcela'
  valorDesejado: number
  nome: string
  telefone: string
  perguntaExtraTipo: 'motivacao' | 'prazo'
  motivoInteresse?: string
  prazoContratacao?:
    | 'compra imediata'
    | 'curto prazo (até 30 dias)'
    | 'médio prazo (até 3 meses)'
    | 'apenas pesquisando por enquanto'
  agendamentoOpcao: 'hoje' | 'amanha' | 'outro'
  agendamentoHorario?: string
  agendamentoDisponibilidade?: string
  reuniaoLead: string
  // Opcional para manter compatibilidade com chamadores antigos do payload
  // (ex: integrações externas) que ainda não enviam esse campo.
  origem?: string
}

function validarPayload(body: unknown): body is SimuladorPayload {
  if (!body || typeof body !== 'object') return false

  const b = body as Record<string, unknown>

  const camposObrigatorios = [
    'tipoConsórcio',
    'desejaSimular',
    'valorDesejado',
    'nome',
    'telefone',
    'perguntaExtraTipo',
    'agendamentoOpcao',
    'reuniaoLead',
  ]
  for (const campo of camposObrigatorios) {
    if (!(campo in b)) return false
  }

  if (typeof b.tipoConsórcio !== 'string' || b.tipoConsórcio.trim().length === 0) return false
  if (b.desejaSimular !== 'Valor do Crédito' && b.desejaSimular !== 'Valor da Parcela') return false
  if (typeof b.valorDesejado !== 'number' || isNaN(b.valorDesejado) || b.valorDesejado <= 0) return false
  if (typeof b.nome !== 'string' || b.nome.trim().length < 2) return false
  if (typeof b.telefone !== 'string' || b.telefone.replace(/\D/g, '').length < 11) return false
  if (b.perguntaExtraTipo !== 'motivacao' && b.perguntaExtraTipo !== 'prazo') return false
  if (b.perguntaExtraTipo === 'motivacao') {
    if (typeof b.motivoInteresse !== 'string' || b.motivoInteresse.trim().length < 3) return false
  } else {
    const opcoes = [
      'compra imediata',
      'curto prazo (até 30 dias)',
      'médio prazo (até 3 meses)',
      'apenas pesquisando por enquanto',
    ] as const
    if (
      typeof b.prazoContratacao !== 'string' ||
      !opcoes.includes(b.prazoContratacao as (typeof opcoes)[number])
    ) {
      return false
    }
  }

  if (b.agendamentoOpcao !== 'hoje' && b.agendamentoOpcao !== 'amanha' && b.agendamentoOpcao !== 'outro') {
    return false
  }
  if (b.agendamentoOpcao === 'hoje' || b.agendamentoOpcao === 'amanha') {
    if (typeof b.agendamentoHorario !== 'string' || b.agendamentoHorario.trim().length === 0) return false
  } else {
    if (typeof b.agendamentoDisponibilidade !== 'string' || b.agendamentoDisponibilidade.trim().length < 2) {
      return false
    }
  }

  if (typeof b.reuniaoLead !== 'string' || b.reuniaoLead.trim().length === 0) return false

  return true
}

function formatarBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function montarMensagem(p: SimuladorPayload): string {
  const valorFormatado = formatarBRL(p.valorDesejado)
  const linhaExtra =
    p.perguntaExtraTipo === 'motivacao'
      ? `• Motivo do Interesse: ${p.motivoInteresse}`
      : `• Prazo para Contratar: ${p.prazoContratacao}`

  return [
    `*NOVO LEAD - SITE REOBOTE*`,
    ``,
    `• Nome: ${p.nome}`,
    `• WhatsApp: ${p.telefone}`,
    `• Tipo de Consórcio: ${p.tipoConsórcio}`,
    `• Modo de Simulação: ${p.desejaSimular}`,
    `• Valor Desejado: ${valorFormatado}`,
    linhaExtra,
    `• Reunião: ${p.reuniaoLead}`,
    ``,
    `Origem: ${p.origem || 'Simulador Online - site Reobote Consórcios'}`,
  ].join('\n')
}

async function encaminharParaWebhookExterno(payload: SimuladorPayload, mensagem: string) {
  const webhookUrl =
    process.env.WHATSAPP_WEBHOOK_URL ||
    process.env.NEXT_PUBLIC_WHATSAPP_WEBHOOK_URL

  console.log('[WEBHOOK] URL configurada:', webhookUrl ? webhookUrl.substring(0, 60) + '...' : 'VAZIA')

  if (!webhookUrl) {
    console.warn('[WEBHOOK] Nenhuma URL encontrada nas variáveis de ambiente.')
    return { encaminhado: false, motivo: 'WHATSAPP_WEBHOOK_URL não configurada' }
  }

  const metodo = (process.env.WHATSAPP_WEBHOOK_METHOD || 'POST').toUpperCase() as 'GET' | 'POST' | 'PUT'

  const corpoPadrao = {
    evento: 'nova_simulacao',
    timestamp: new Date().toISOString(),
    payload,
    mensagemFormatada: mensagem,
    telefoneDestino: siteConfig.whatsapp,
  }

  try {
    let resposta: Response

    if (metodo === 'GET') {
      const params = new URLSearchParams()
      params.set('evento', corpoPadrao.evento)
      params.set('timestamp', corpoPadrao.timestamp)
      params.set('payload_json', JSON.stringify(corpoPadrao.payload))
      params.set('mensagemFormatada', corpoPadrao.mensagemFormatada)
      params.set('telefoneDestino', corpoPadrao.telefoneDestino)
      params.set('nome', payload.nome)
      params.set('telefone', payload.telefone)
      params.set('tipoConsorcio', payload.tipoConsórcio)
      params.set('desejaSimular', payload.desejaSimular)
      params.set('valorDesejado', String(payload.valorDesejado))
      params.set('perguntaExtraTipo', payload.perguntaExtraTipo)
      if (payload.perguntaExtraTipo === 'motivacao' && payload.motivoInteresse) {
        params.set('motivoInteresse', payload.motivoInteresse)
      }
      if (payload.perguntaExtraTipo === 'prazo' && payload.prazoContratacao) {
        params.set('prazoContratacao', payload.prazoContratacao)
      }
      params.set('agendamentoOpcao', payload.agendamentoOpcao)
      if (
        (payload.agendamentoOpcao === 'hoje' || payload.agendamentoOpcao === 'amanha') &&
        payload.agendamentoHorario
      ) {
        params.set('agendamentoHorario', payload.agendamentoHorario)
      }
      if (payload.agendamentoOpcao === 'outro' && payload.agendamentoDisponibilidade) {
        params.set('agendamentoDisponibilidade', payload.agendamentoDisponibilidade)
      }
      params.set('reuniaoLead', payload.reuniaoLead)

      const separador = webhookUrl.includes('?') ? '&' : '?'
      const urlFinal = `${webhookUrl}${separador}${params.toString()}`

      console.log(`[WEBHOOK] Chamando GET para:`, urlFinal.substring(0, 120))

      resposta = await fetch(urlFinal, {
        method: 'GET',
        headers: {
          ...(process.env.WHATSAPP_WEBHOOK_SECRET
            ? { 'x-webhook-secret': process.env.WHATSAPP_WEBHOOK_SECRET }
            : {}),
        },
        cache: 'no-store',
      })
    } else {
      console.log(`[WEBHOOK] Chamando ${metodo} para ${webhookUrl.substring(0, 80)}...`)

      resposta = await fetch(webhookUrl, {
        method: metodo,
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.WHATSAPP_WEBHOOK_SECRET
            ? { 'x-webhook-secret': process.env.WHATSAPP_WEBHOOK_SECRET }
            : {}),
        },
        body: JSON.stringify(corpoPadrao),
        cache: 'no-store',
      })
    }

    const textoResposta = await resposta.text()
    console.log(
      `[WEBHOOK] Retornou status=${resposta.status} ok=${resposta.ok} body=`,
      textoResposta.substring(0, 300)
    )

    return {
      encaminhado: resposta.ok,
      status: resposta.status,
      resposta: textoResposta,
    }
  } catch (erro) {
    const msg = erro instanceof Error ? erro.message : 'Erro desconhecido ao chamar webhook externo'
    console.error('[WEBHOOK] Erro na chamada:', msg)
    return {
      encaminhado: false,
      motivo: msg,
    }
  }
}

export async function POST(request: Request) {
  console.log('[ROUTE] Recebido POST em /api/simulador-webhook')
  console.log('[ROUTE] Env vars:', {
    url: process.env.WHATSAPP_WEBHOOK_URL ? 'SET' : 'NOT SET',
    url_public: process.env.NEXT_PUBLIC_WHATSAPP_WEBHOOK_URL ? 'SET' : 'NOT SET',
    method: process.env.WHATSAPP_WEBHOOK_METHOD || 'default(POST)',
  })

  try {
    const body = await request.json()
    console.log('[ROUTE] Payload recebido:', JSON.stringify(body))

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

    const mensagem = montarMensagem(body)

    const resultadoWebhook = await encaminharParaWebhookExterno(body, mensagem)

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
    console.error('[ROUTE] Erro interno:', msg)
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
