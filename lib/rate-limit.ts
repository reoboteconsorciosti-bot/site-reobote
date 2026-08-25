// Limitador em memória, sem dependência externa (Redis etc.) — suficiente
// pro tráfego de um único site institucional rodando num único container,
// mas com uma limitação real: reseta ao reiniciar o processo e não
// compartilha estado se um dia isso rodar em mais de uma réplica. Se a
// escala exigir isso, precisa virar um contador externo compartilhado.
//
// Dois níveis de proteção, porque resolvem ameaças diferentes:
//   - `rateLimit(`rota:${ip}`, ...)` por IP: barra um único visitante/bot
//     martelando uma rota específica.
//   - `rateLimit('global:crm:...', ...)` sem IP: protege a cota real da
//     API do CRM (compartilhada entre esta integração, a landing page de
//     anúncios e qualquer outra coisa que fale com o mesmo CRM) — sem
//     isso, um pico de tráfego distribuído (várias origens, cada uma
//     dentro do próprio limite por IP) ainda conseguiria estourar o teto
//     real da API e derrubar a cota pra todo mundo.

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

// Limpeza periódica pra não vazar memória com chaves que só aparecem uma
// vez (bucket expirado nunca mais é lido, mas ficaria ocupando o Map pra
// sempre sem isso). `.unref()` evita que esse timer sozinho mantenha o
// processo Node vivo.
setInterval(
  () => {
    const now = Date.now()
    for (const [key, bucket] of buckets) {
      if (now > bucket.resetAt) buckets.delete(key)
    }
  },
  10 * 60 * 1000
).unref()

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true }
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) }
  }

  bucket.count++
  return { ok: true }
}

export function getClientIp(req: Request): string {
  // Proxy reverso típico (EasyPanel e afins) injeta x-forwarded-for; sem
  // esse header, cai pra um bucket único ("unknown") — pior caso é todo
  // cliente sem o header compartilhar 1 limite, nunca um jeito de burlar
  // o limite via header ausente.
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}
