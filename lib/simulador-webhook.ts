// Lógica compartilhada entre as rotas de webhook do simulador
// (/api/simulador-webhook e /api/simulador-webhook-ufms): validação do
// payload, montagem da mensagem formatada e o encaminhamento HTTP para o
// integrador externo. Cada rota só decide PARA ONDE encaminhar (qual URL,
// método e segredo) — o formato do payload e da mensagem é sempre o mesmo,
// como pedido: "reaproveitar o payload e estrutura, apenas mude o webhook".

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

export function validarPayload(body: unknown): body is SimuladorPayload {
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

export function formatarBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

export function montarMensagem(p: SimuladorPayload, origemPadrao: string): string {
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
    `Origem: ${p.origem || origemPadrao}`,
  ].join('\n')
}

export interface WebhookAlvo {
  url: string
  metodo?: 'GET' | 'POST' | 'PUT'
  secret?: string
}

export async function encaminharParaWebhookExterno(
  payload: SimuladorPayload,
  mensagem: string,
  telefoneDestino: string,
  alvo: WebhookAlvo,
  logPrefixo = '[WEBHOOK]'
) {
  console.log(`${logPrefixo} URL configurada:`, alvo.url ? alvo.url.substring(0, 60) + '...' : 'VAZIA')

  if (!alvo.url) {
    console.warn(`${logPrefixo} Nenhuma URL configurada.`)
    return { encaminhado: false, motivo: 'Webhook não configurado' }
  }

  const metodo = (alvo.metodo || 'POST').toUpperCase() as 'GET' | 'POST' | 'PUT'

  const corpoPadrao = {
    evento: 'nova_simulacao',
    timestamp: new Date().toISOString(),
    payload,
    mensagemFormatada: mensagem,
    telefoneDestino,
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

      const separador = alvo.url.includes('?') ? '&' : '?'
      const urlFinal = `${alvo.url}${separador}${params.toString()}`

      console.log(`${logPrefixo} Chamando GET para:`, urlFinal.substring(0, 120))

      resposta = await fetch(urlFinal, {
        method: 'GET',
        headers: {
          ...(alvo.secret ? { 'x-webhook-secret': alvo.secret } : {}),
        },
        cache: 'no-store',
      })
    } else {
      console.log(`${logPrefixo} Chamando ${metodo} para ${alvo.url.substring(0, 80)}...`)

      resposta = await fetch(alvo.url, {
        method: metodo,
        headers: {
          'Content-Type': 'application/json',
          ...(alvo.secret ? { 'x-webhook-secret': alvo.secret } : {}),
        },
        body: JSON.stringify(corpoPadrao),
        cache: 'no-store',
      })
    }

    const textoResposta = await resposta.text()
    console.log(
      `${logPrefixo} Retornou status=${resposta.status} ok=${resposta.ok} body=`,
      textoResposta.substring(0, 300)
    )

    return {
      encaminhado: resposta.ok,
      status: resposta.status,
      resposta: textoResposta,
    }
  } catch (erro) {
    const msg = erro instanceof Error ? erro.message : 'Erro desconhecido ao chamar webhook externo'
    console.error(`${logPrefixo} Erro na chamada:`, msg)
    return {
      encaminhado: false,
      motivo: msg,
    }
  }
}
