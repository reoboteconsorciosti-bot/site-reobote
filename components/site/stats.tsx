const stats = [
  { value: '+12 mil', label: 'Clientes atendidos' },
  { value: 'R$ 800M', label: 'Em créditos liberados' },
  { value: '15 anos', label: 'De mercado' },
  { value: '4,9/5', label: 'Avaliação dos clientes' },
]

export function Stats() {
  return (
    <section className="border-y border-border bg-primary py-14 text-primary-foreground">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
              {s.value}
            </p>
            <p className="mt-2 text-sm text-primary-foreground/70">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
