"use client"

import * as React from "react"
import { LayoutTemplate, Send, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SectionHead } from "@/components/coach/section-head"
import { AsignacionDialog } from "@/components/coach/asignacion-dialog"
import { cn } from "@/lib/utils"
import type {
  OpcionAlumno,
  OpcionRutina,
  PlantillaAsignable,
} from "@/lib/data/tipos"

/**
 * Columna de plantillas: cada una abre el formulario de asignación con esa
 * rutina ya elegida. La selección de la tarjeta es local y solo la destaca.
 */
function AsignacionesPlantillas({
  plantillas,
  alumnos,
  rutinas,
  alumnoPorDefecto,
  asignable,
}: {
  plantillas: PlantillaAsignable[]
  alumnos: OpcionAlumno[]
  rutinas: OpcionRutina[]
  alumnoPorDefecto?: string
  /** false con el dataset de ejemplo o sin alumnos: los ids no sirven. */
  asignable: boolean
}) {
  const [sel, setSel] = React.useState(0)

  return (
    <div className="flex flex-col gap-2.5 lg:sticky lg:top-[calc(var(--spacing-topbar)+var(--spacing)*8)] lg:gap-4">
      <SectionHead icon={<LayoutTemplate aria-hidden />} title="Plantillas" />

      {plantillas.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            Todavía no guardaste ninguna rutina como plantilla. Marcá una rutina
            como plantilla desde el constructor.
          </CardContent>
        </Card>
      ) : (
        plantillas.map((t, i) => (
          <Card
            key={t.id}
            accent={i === sel}
            interactive
            role="button"
            tabIndex={0}
            aria-pressed={i === sel}
            onClick={() => setSel(i)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                setSel(i)
              }
            }}
            className={cn(i === sel && "border-primary")}
          >
            <CardContent>
              <div className="text-md font-semibold text-foreground">{t.nombre}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {t.objetivo ? <Badge size="sm">{t.objetivo}</Badge> : null}
                {t.dias != null ? <Badge size="sm">{t.dias} días/sem</Badge> : null}
                {t.semanas != null ? <Badge size="sm">{t.semanas} sem</Badge> : null}
              </div>
            </CardContent>
            <CardContent className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users aria-hidden className="size-3.5 text-faint" />
                {t.asignadas} asignadas
              </span>
              <AsignacionDialog
                alumnos={alumnos}
                rutinas={rutinas}
                rutinaPorDefecto={t.id}
                alumnoPorDefecto={alumnoPorDefecto}
              >
                <Button
                  size="sm"
                  variant={i === sel ? "default" : "ghost"}
                  disabled={!asignable}
                  title={asignable ? undefined : "Necesitás al menos un alumno"}
                  // El click no tiene que llegar a la Card, que también es
                  // clickeable para seleccionarla.
                  onClick={(e) => e.stopPropagation()}
                >
                  <Send aria-hidden />
                  Asignar
                </Button>
              </AsignacionDialog>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

export { AsignacionesPlantillas }
