import { crmEnv } from './env'
import { rateLimit } from './rate-limit'

// Cliente fino pra API v1 do CRM (crm.reoboteconsorcios.com.br). Cada
// função aqui espelha 1 endpoint documentado — nenhuma regra de negócio
// sobre QUAIS horários existem ou estão livres mora aqui, isso é
// responsabilidade do próprio CRM. Este arquivo só sabe formar o request,
// proteger a cota compartilhada e traduzir erro em algo que as rotas
// internas (app/api/crm/*) conseguem tratar.

export class CrmApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'CrmApiError'
  }
}

async function crmFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${crmEnv.apiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${crmEnv.apiKey()}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    // Nunca cachear: disponibilidade e criação de negócio são sempre em
    // tempo real — um GET desatualizado aqui gera double-booking.
    cache: 'no-store',
  })

  const body = await res.json().catch(() => null)

  if (!res.ok || !body?.success) {
    const code = body?.error as string | undefined
    throw new CrmApiError(code ?? `Falha ao chamar ${path} (HTTP ${res.status})`, res.status, code)
  }

  return body.data as T
}

// Cota da API do CRM é por chave/organização, não por visitante — um
// ataque distribuído (várias origens, cada uma dentro do limite por IP
// aplicado em app/api/crm/*) ainda conseguiria estourar o teto real do CRM
// e derrubar a integração pra todo mundo (esta, a landing page de anúncios
// e qualquer outra coisa que fale com o mesmo CRM). Isso reserva uma fatia
// abaixo do teto documentado e rejeita cedo (sem nem chamar o CRM) quando
// estourar, em vez de deixar o CRM devolver 429 pra gente descobrir na
// prática onde está o limite.
function assertGlobalCrmBudget(bucket: string, limit: number, windowMs: number) {
  const result = rateLimit(`global:crm:${bucket}`, limit, windowMs)
  if (!result.ok) {
    throw new CrmApiError(
      'Limite de requisições ao CRM atingido, tente novamente em instantes',
      429,
      'global_rate_limited'
    )
  }
}

// O CRM tem uma condição de corrida conhecida na criação de contato: dois
// POST /deals com o mesmo telefone quase ao mesmo tempo (ex: duplo toque
// no botão) podem os dois não encontrar um contato existente, os dois
// tentarem criar, e o segundo esbarrar na restrição de telefone único do
// banco. O próprio CRM devolve essa mensagem específica avisando que é
// seguro tentar de novo — então tentamos, automaticamente, sem quem chamou
// createDeal nunca ver esse erro.
function isRetryableContactConflict(err: unknown): boolean {
  return err instanceof CrmApiError && err.status === 400 && err.message.includes('Conflito ao criar contato')
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export interface CreateDealParams {
  nome: string
  telefone: string
  descricao?: string
  origem?: string
}

export interface CreateDealResult {
  dealId: string
  contactId: string
}

export async function createDeal(params: CreateDealParams): Promise<CreateDealResult> {
  assertGlobalCrmBudget('deals', 25, 60_000) // teto real do CRM: 30/min em /deals

  const origem = params.origem ?? 'Site institucional'

  const body = JSON.stringify({
    contact: {
      name: params.nome,
      // Só `whatsapp`, nunca `phone` — mandar `phone` sozinho aciona um
      // bug de deduplicação conhecido do lado do CRM (reenvio do mesmo
      // número gera erro de conflito em vez de atualizar o contato
      // existente).
      whatsapp: params.telefone,
    },
    ownerId: crmEnv.consultorId(),
    description: params.descricao ?? '',
    source: origem,
  })

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const data = await crmFetch<{ id: string; contact: { id: string } }>('/api/v1/deals', {
        method: 'POST',
        body,
      })
      return { dealId: data.id, contactId: data.contact.id }
    } catch (err) {
      if (attempt === 2 || !isRetryableContactConflict(err)) throw err
      await delay(300)
    }
  }
  // Inatingível (o loop acima sempre retorna ou lança) — só pra o TS ver
  // que a função sempre resolve ou rejeita em todo caminho.
  throw new CrmApiError('Falha ao criar negócio', 500)
}

// Os 5 horários fixos por dia útil que o CRM oferece (1h30 de intervalo
// entre eles) — usado pra validar no servidor que um `time` recebido bate
// exatamente na grade real, em vez de confiar em qualquer string HH:MM.
export const FIXED_SLOT_TIMES = ['08:30', '10:00', '11:30', '13:00', '14:30'] as const
export type FixedSlotTime = (typeof FIXED_SLOT_TIMES)[number]

export interface AvailabilitySlot {
  time: string
  available: boolean
}

export interface CrmDayAvailability {
  consultorId: string
  date: string
  timezone: string
  slots: AvailabilitySlot[]
  googleCalendarConnected: boolean
}

// `date` (YYYY-MM-DD) opcional — sem ele, o CRM aplica a cascata dele a
// partir de hoje. Com ele, pede a grade de um dia específico. Data no
// passado ou dia não útil vira 400 do CRM (propagado como CrmApiError daqui
// pra cima) — quem chamar decide como comunicar isso, não precisamos
// reimplementar essa checagem aqui.
export async function getAvailability(date?: string): Promise<CrmDayAvailability> {
  assertGlobalCrmBudget('availability', 50, 60_000) // teto real do CRM: 60/min

  const qs = new URLSearchParams({ consultorId: crmEnv.consultorId() })
  if (date) qs.set('date', date)
  return crmFetch<CrmDayAvailability>(`/api/v1/availability?${qs.toString()}`)
}

export interface CreateAppointmentParams {
  contactId: string
  dealId: string
  date: string
  time: string
}

export interface CreateAppointmentResult {
  taskId: string
  contactId: string
  dealId: string
  scheduledAt: string // ISO 8601 em UTC
  googleCalendarSynced: boolean
}

// O CRM revalida no servidor dele que o horário ainda está livre — devolve
// 409 (CrmApiError com status 409) se alguém reservou primeiro entre um GET
// /availability anterior e esta chamada. Quem chamar createAppointment
// precisa tratar esse 409 como esperado (pedir disponibilidade de novo),
// nunca assumir que um horário "visto livre" antes continua livre agora.
export async function createAppointment(params: CreateAppointmentParams): Promise<CreateAppointmentResult> {
  assertGlobalCrmBudget('appointments', 25, 60_000) // teto real do CRM: 30/min

  return crmFetch<CreateAppointmentResult>('/api/v1/appointments', {
    method: 'POST',
    body: JSON.stringify({
      consultorId: crmEnv.consultorId(),
      contactId: params.contactId,
      dealId: params.dealId,
      date: params.date,
      time: params.time,
    }),
  })
}

// Anexa (não sobrescreve) uma nota na descrição de um negócio já existente
// — usado pra registrar a preferência de horário quando o lead escreve
// texto livre em vez de escolher um dos 5 horários fixos. Limite real do
// CRM é 2000 caracteres; a validação de entrada (app/api/crm/nota) já
// aplica um teto bem mais apertado antes de chegar aqui.
export async function appendDealNote(dealId: string, note: string): Promise<void> {
  // Mesmo recurso (/api/v1/deals) do createDeal — compartilha o mesmo
  // orçamento global em vez de um bucket próprio, pra não arriscar contar
  // "25 + 25" contra um teto real que é só 30/min no total desse endpoint.
  assertGlobalCrmBudget('deals', 25, 60_000)

  await crmFetch(`/api/v1/deals/${encodeURIComponent(dealId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ note }),
  })
}

// ─── Cálculo de "hoje" e "próximo dia útil" em horário do Brasil ──────────
// Campo Grande/MS é sempre UTC-4 (o Brasil aboliu horário de verão em
// 2019, então esse offset nunca muda ao longo do ano — nada de tabela de
// transição pra manter). Usado só pra saber QUE datas perguntar/oferecer;
// quem decide de verdade se uma data tem vaga é sempre a resposta do CRM.
const BRAZIL_UTC_OFFSET_HOURS = 4

export function getBrazilTodayDateKey(reference: Date = new Date()): string {
  const shifted = new Date(reference.getTime() - BRAZIL_UTC_OFFSET_HOURS * 60 * 60 * 1000)
  const y = shifted.getUTCFullYear()
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0')
  const d = String(shifted.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isBusinessDay(dateKey: string): boolean {
  const [y, m, d] = dateKey.split('-').map(Number)
  const weekday = new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay()
  return weekday >= 1 && weekday <= 5
}

function addDaysToKey(dateKey: string, delta: number): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const next = new Date(Date.UTC(y, m - 1, d + delta))
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`
}

// Primeiro dia útil estritamente depois de `dateKey` (nunca o próprio
// `dateKey`, mesmo que ele já seja útil).
export function getNextBusinessDay(dateKey: string): string {
  let candidate = addDaysToKey(dateKey, 1)
  while (!isBusinessDay(candidate)) candidate = addDaysToKey(candidate, 1)
  return candidate
}
