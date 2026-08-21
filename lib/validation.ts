import { FIXED_SLOT_TIMES } from './crm'

// Validação server-side dos campos recebidos pelas rotas app/api/crm/*.
// Essas rotas são públicas e sem autenticação (alvo de qualquer POST direto,
// não só do frontend deste site) — nada garante que o body veio mesmo do
// nosso formulário, então tudo que o cliente manda precisa ser conferido de
// novo aqui, nunca só na UI.

const MAX_NOME_LENGTH = 120
const MAX_DESCRICAO_LENGTH = 2000
const MAX_ORIGEM_LENGTH = 120
const MAX_NOTA_LENGTH = 500 // bem abaixo do teto real do CRM (2000) pra nota, de propósito
const MAX_PREFERENCIA_LENGTH = 500

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^\d{2}:\d{2}$/

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function validateNome(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length >= 2 && value.length <= MAX_NOME_LENGTH
}

function validateTelefone(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const digits = value.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 13
}

function validateDate(value: unknown): value is string {
  return typeof value === 'string' && DATE_RE.test(value)
}

function validateFixedSlotTime(value: unknown): value is string {
  return typeof value === 'string' && TIME_RE.test(value) && (FIXED_SLOT_TIMES as readonly string[]).includes(value)
}

// ─── POST /api/crm/deal ────────────────────────────────────────────────
export interface CreateDealInput {
  nome: string
  telefone: string
  descricao?: string
  origem?: string
}

export function validateCreateDeal(body: unknown): { ok: true; data: CreateDealInput } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null) return { ok: false, error: 'Corpo inválido' }
  const b = body as Record<string, unknown>

  if (!validateNome(b.nome)) return { ok: false, error: 'Nome inválido' }
  if (!validateTelefone(b.telefone)) return { ok: false, error: 'Telefone inválido' }
  if (b.descricao !== undefined && (typeof b.descricao !== 'string' || b.descricao.length > MAX_DESCRICAO_LENGTH)) {
    return { ok: false, error: 'Descrição inválida' }
  }
  if (b.origem !== undefined && (typeof b.origem !== 'string' || b.origem.length > MAX_ORIGEM_LENGTH)) {
    return { ok: false, error: 'Origem inválida' }
  }

  return {
    ok: true,
    data: {
      nome: (b.nome as string).trim(),
      telefone: b.telefone as string,
      descricao: (b.descricao as string | undefined)?.trim() || undefined,
      origem: (b.origem as string | undefined)?.trim() || undefined,
    },
  }
}

// ─── POST /api/crm/agendamento ─────────────────────────────────────────
export interface CreateAppointmentInput {
  dealId: string
  contactId: string
  date: string
  time: string
}

export function validateCreateAppointment(
  body: unknown
): { ok: true; data: CreateAppointmentInput } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null) return { ok: false, error: 'Corpo inválido' }
  const b = body as Record<string, unknown>

  if (!isNonEmptyString(b.dealId)) return { ok: false, error: 'dealId inválido' }
  if (!isNonEmptyString(b.contactId)) return { ok: false, error: 'contactId inválido' }
  if (!validateDate(b.date)) return { ok: false, error: 'Data inválida' }
  // Precisa bater exatamente num dos 5 horários da grade — nunca aceitar
  // qualquer HH:MM só porque o formato passou no regex.
  if (!validateFixedSlotTime(b.time)) return { ok: false, error: 'Horário inválido' }

  return {
    ok: true,
    data: { dealId: b.dealId as string, contactId: b.contactId as string, date: b.date as string, time: b.time as string },
  }
}

// ─── POST /api/crm/nota ────────────────────────────────────────────────
export interface DealNoteInput {
  dealId: string
  nota: string
}

export function validateDealNote(body: unknown): { ok: true; data: DealNoteInput } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null) return { ok: false, error: 'Corpo inválido' }
  const b = body as Record<string, unknown>

  if (!isNonEmptyString(b.dealId)) return { ok: false, error: 'dealId inválido' }
  if (!isNonEmptyString(b.nota) || (b.nota as string).length > MAX_NOTA_LENGTH) {
    return { ok: false, error: 'Nota inválida' }
  }

  return { ok: true, data: { dealId: b.dealId as string, nota: (b.nota as string).trim() } }
}

// ─── POST /api/crm/notificar ───────────────────────────────────────────
// Nome/telefone NUNCA entram aqui — quem chama /api/crm/notificar só pode
// informar o que aconteceu nesta chamada (agendou ou não, quando, qual
// preferência foi escrita, ou só que o negócio foi criado); quem é o lead
// vem sempre do lead-registry, nunca do body (ver
// app/api/crm/notificar/route.ts).
export type NotifyInput =
  | { dealId: string; agendado: true; data: string; hora: string }
  | { dealId: string; agendado: false; preferenciaHorario: string }
  // Disparado ao clicar "Continuar simulação": o negócio já existe no CRM,
  // mas o lead ainda não escolheu horário nem deixou preferência — sem
  // isso, quem some no meio do fluxo de agendamento nunca gera aviso
  // nenhum pro consultor, mesmo já tendo virado um negócio real no CRM.
  | { dealId: string; agendado: false; negocioCriado: true }

export function validateNotify(body: unknown): { ok: true; data: NotifyInput } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null) return { ok: false, error: 'Corpo inválido' }
  const b = body as Record<string, unknown>

  if (!isNonEmptyString(b.dealId)) return { ok: false, error: 'dealId inválido' }
  if (typeof b.agendado !== 'boolean') return { ok: false, error: 'Campo "agendado" inválido' }

  if (b.agendado) {
    if (!validateDate(b.data)) return { ok: false, error: 'Data inválida' }
    if (!validateFixedSlotTime(b.hora)) return { ok: false, error: 'Horário inválido' }
    return { ok: true, data: { dealId: b.dealId as string, agendado: true, data: b.data as string, hora: b.hora as string } }
  }

  if (b.negocioCriado === true) {
    return { ok: true, data: { dealId: b.dealId as string, agendado: false, negocioCriado: true } }
  }

  if (!isNonEmptyString(b.preferenciaHorario) || (b.preferenciaHorario as string).length > MAX_PREFERENCIA_LENGTH) {
    return { ok: false, error: 'Preferência de horário inválida' }
  }
  return {
    ok: true,
    data: { dealId: b.dealId as string, agendado: false, preferenciaHorario: (b.preferenciaHorario as string).trim() },
  }
}
