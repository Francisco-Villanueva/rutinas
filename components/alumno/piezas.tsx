import * as React from "react"
import { Check, Dumbbell } from "lucide-react"

import { cn } from "@/lib/utils"
import type { DiaDeLaSemana } from "@/lib/data/alumno-tipos"

/**
 * Tira de la semana (lunes a domingo).
 *
 * Marca los días en los que el alumno entrenó, no los días "planificados": con
 * la regla secuencial la rutina no está atada al calendario, así que un
 * "planificado para el viernes" sería inventado.
 */
function TiraDeLaSemana({ dias }: { dias: DiaDeLaSemana[] }) {
  return (
    <div className="flex gap-1.5" aria-label="Tu semana">
      {dias.map((dia) => (
        <div
          key={dia.clave}
          className={cn(
            "flex-1 rounded-md border py-2 text-center",
            dia.estado === "hoy"
              ? "border-transparent bg-primary text-primary-foreground"
              : dia.estado === "hecho"
                ? "border-transparent bg-accent-soft"
                : "border-border bg-muted",
          )}
        >
          <div
            className={cn(
              "text-[11px] font-bold",
              dia.estado === "hoy" ? "text-primary-foreground" : "text-muted-foreground",
            )}
          >
            {dia.inicial}
          </div>
          <div className="mt-1 flex h-4 items-center justify-center">
            {dia.estado === "hecho" ? (
              <Check aria-label="Entrenaste" className="size-3.5 text-accent-soft-strong" />
            ) : dia.estado === "hoy" ? (
              <Dumbbell aria-hidden className="size-3.5 text-primary-foreground" />
            ) : (
              <span aria-hidden className="size-1 rounded-full bg-faint" />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Selector de RPE en chips.
 *
 * Son radios nativos escondidos con el estilo puesto en el `<span>` hermano vía
 * `peer-checked`: no necesita estado de React, entra en el FormData solo y se
 * puede navegar con el teclado como cualquier grupo de radios.
 *
 * El rango arranca en 6 como en el kit: por debajo de 6 la escala no discrimina
 * nada útil para alguien que está entrenando.
 */
function SelectorRpe({
  name,
  valor,
  label = "Esfuerzo (RPE)",
}: {
  name: string
  valor: number | null
  label?: string
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-2xs font-bold tracking-caps text-body uppercase">
        {label}
      </legend>
      <div className="flex gap-1.5">
        <OpcionRpe name={name} value="" activo={valor == null}>
          —
        </OpcionRpe>
        {[6, 7, 8, 9, 10].map((n) => (
          <OpcionRpe key={n} name={name} value={String(n)} activo={valor === n}>
            {n}
          </OpcionRpe>
        ))}
      </div>
    </fieldset>
  )
}

function OpcionRpe({
  name,
  value,
  activo,
  children,
}: {
  name: string
  value: string
  activo: boolean
  children: React.ReactNode
}) {
  return (
    <label className="flex-1 cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={activo}
        className="peer sr-only"
      />
      <span className="flex h-11 items-center justify-center rounded-sm bg-muted font-mono text-md font-bold text-body transition-colors duration-[var(--dur-fast)] peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50">
        {children}
      </span>
    </label>
  )
}

/** Dato con etiqueta chica, para las metas de la sesión. */
function DatoDeSesion({
  icono,
  children,
}: {
  icono: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground [&>svg]:size-3.5">
      {icono}
      {children}
    </span>
  )
}

export { DatoDeSesion, SelectorRpe, TiraDeLaSemana }
