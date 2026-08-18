// Leitura centralizada das variáveis de ambiente usadas pela integração com
// o CRM. Nunca importado por um Client Component — este módulo só é usado
// dentro de app/api/crm/*, então nenhum destes valores (em especial a API
// key) chega ao navegador.

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Variável de ambiente obrigatória ausente: ${name}`)
  return value
}

export const crmEnv = {
  apiBaseUrl: () => process.env.CRM_API_BASE_URL || 'https://crm.reoboteconsorcios.com.br',
  apiKey: () => required('CRM_API_KEY'),

  // Consultor fixo que recebe hoje todo lead de agendamento (Vinícius
  // Campos) — decisão de negócio isolada aqui numa única variável pra
  // trocar fácil quando entrar distribuição entre consultores (round-robin
  // ainda não definido, é conversa futura). O valor literal serve de
  // fallback pra funcionar sem configuração extra; defina
  // CRM_CONSULTOR_ID no ambiente pra sobrescrever sem precisar mexer em
  // código.
  consultorId: () => process.env.CRM_CONSULTOR_ID || 'cms5fphdf0000tovpws607y7a',

  // Webhook do n8n que avisa o Vinícius e o Renan (supervisor) via
  // WhatsApp/Evolution API quando alguém agenda (ou pede outro horário) —
  // é o mesmo workflow "agendamento-lp" já usado noutras integrações,
  // então tem uma URL própria, separada do WHATSAPP_WEBHOOK_URL do
  // simulador (rotas diferentes do mesmo n8n, propósitos diferentes).
  notifyWebhookUrl: () => required('CRM_NOTIFY_WEBHOOK_URL'),
}
