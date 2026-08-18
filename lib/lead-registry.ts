// Memória server-side dos negócios (deals) criados de verdade via
// POST /api/crm/deal — existe só pra as rotas seguintes (agendamento,
// nota, notificação) nunca precisarem confiar no dealId/contactId/nome/
// telefone que o cliente manda de volta. Sem isso, qualquer um podia
// chamar essas rotas direto com dados inventados e:
//   - reservar/monopolizar os 5 horários do dia sem ter passado pelo fluxo;
//   - anexar uma nota numa negociação que não é dele;
//   - fazer o n8n mandar uma mensagem de WhatsApp forjada pro
//     consultor/supervisor como se fosse um lead real.
//
// Mesma ressalva do rate-limit.ts: em memória, single-instance — reseta
// ao reiniciar e não é compartilhada entre réplicas. Aceitável aqui
// porque o ciclo de vida de um lead (criar negócio -> agendar ou desistir)
// dura minutos, nunca horas.

type RegisteredLead = {
  contactId: string
  nome: string
  telefone: string
  createdAt: number
}

const registry = new Map<string, RegisteredLead>()
const TTL_MS = 2 * 60 * 60 * 1000 // 2h — folga generosa acima de qualquer sessão de agendamento real

setInterval(
  () => {
    const now = Date.now()
    for (const [dealId, entry] of registry) {
      if (now - entry.createdAt > TTL_MS) registry.delete(dealId)
    }
  },
  30 * 60 * 1000
).unref()

export function registerLead(dealId: string, contactId: string, nome: string, telefone: string): void {
  registry.set(dealId, { contactId, nome, telefone, createdAt: Date.now() })
}

export function getRegisteredLead(dealId: string): RegisteredLead | undefined {
  const entry = registry.get(dealId)
  if (!entry) return undefined
  if (Date.now() - entry.createdAt > TTL_MS) {
    registry.delete(dealId)
    return undefined
  }
  return entry
}
