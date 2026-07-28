'use client'

import { useState } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { MapPin, Phone, Building2 } from 'lucide-react'
import { activeUFs, findState, unitsByState } from '@/lib/units'
import { whatsappLink } from '@/lib/site-config'
import { cn } from '@/lib/utils'

const GEO_URL = '/geo/br-states.min.json'

export function UnitsMap() {
  const [selectedUF, setSelectedUF] = useState<string>('SP')
  const [hoveredUF, setHoveredUF] = useState<string | null>(null)

  const selected = findState(selectedUF)

  return (
    <section id="unidades" className="bg-secondary/40 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">
            Onde estamos
          </p>
          <h2 className="mt-3 text-balance font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Unidades por todo o Brasil
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Selecione um estado no mapa para ver as unidades Reobote mais próximas de você.
          </p>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:items-center">
          {/* Mapa */}
          <div className="relative rounded-3xl border border-border bg-card p-4 sm:p-6">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ scale: 780, center: [-54, -15] }}
              width={520}
              height={520}
              style={{ width: '100%', height: 'auto' }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const uf = String(geo.id)
                    const isActive = activeUFs.includes(uf)
                    const isSelected = uf === selectedUF
                    const isHovered = uf === hoveredUF
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onMouseEnter={() => isActive && setHoveredUF(uf)}
                        onMouseLeave={() => setHoveredUF(null)}
                        onClick={() => isActive && setSelectedUF(uf)}
                        style={{
                          default: {
                            fill: isSelected
                              ? 'var(--primary)'
                              : isActive
                                ? 'var(--brand)'
                                : 'var(--muted)',
                            stroke: 'var(--card)',
                            strokeWidth: 0.75,
                            outline: 'none',
                            opacity: isActive && !isSelected && isHovered ? 0.8 : 1,
                            cursor: isActive ? 'pointer' : 'default',
                            transition: 'fill 0.2s, opacity 0.2s',
                          },
                          hover: {
                            fill: isSelected
                              ? 'var(--primary)'
                              : isActive
                                ? 'var(--brand)'
                                : 'var(--muted)',
                            outline: 'none',
                            opacity: isActive ? 0.85 : 1,
                          },
                          pressed: { outline: 'none' },
                        }}
                      />
                    )
                  })
                }
              </Geographies>
            </ComposableMap>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-sm bg-primary" /> Selecionado
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-sm bg-brand" /> Com unidades
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-sm bg-muted" /> Em expansão
              </span>
            </div>
          </div>

          {/* Lista de estados + unidades */}
          <div>
            <div className="flex flex-wrap gap-2">
              {unitsByState.map((s) => (
                <button
                  key={s.uf}
                  type="button"
                  onClick={() => setSelectedUF(s.uf)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                    selectedUF === s.uf
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground hover:bg-secondary',
                  )}
                >
                  {s.uf}
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-3xl border border-border bg-card p-6 sm:p-7">
              <div className="flex items-center gap-2">
                <Building2 className="size-5 text-brand" />
                <h3 className="font-heading text-xl font-bold text-foreground">
                  {selected?.name}
                </h3>
                <span className="ml-auto rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                  {selected?.units.length}{' '}
                  {selected && selected.units.length > 1 ? 'unidades' : 'unidade'}
                </span>
              </div>

              <ul className="mt-5 space-y-4">
                {selected?.units.map((u) => (
                  <li
                    key={`${u.city}-${u.phone}`}
                    className="flex flex-col gap-2 rounded-2xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                        <MapPin className="size-4" />
                      </span>
                      <div>
                        <p className="font-semibold text-foreground">{u.city}</p>
                        <p className="text-sm text-muted-foreground">{u.address}</p>
                      </div>
                    </div>
                    <a
                      href={`tel:${u.phone.replace(/\D/g, '')}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                    >
                      <Phone className="size-3.5" />
                      {u.phone}
                    </a>
                  </li>
                ))}
              </ul>

              <a
                href={whatsappLink(
                  `Olá! Quero atendimento da unidade Reobote em ${selected?.name}.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
              >
                Falar com a unidade de {selected?.name}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
