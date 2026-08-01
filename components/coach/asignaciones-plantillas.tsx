"use client"

import * as React from "react"
import { LayoutTemplate, Send, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SectionHead } from "@/components/coach/section-head"
import { cn } from "@/lib/utils"
import type { PlantillaAsignable } from "@/lib/data/tipos"

/**
 * Columna de plantillas. La selección es local y solo destaca la tarjeta: el
 * botón Asignar espera su Server Action.
 */
function AsignacionesPlantillas({
  plantillas,
}: {
  plantillas: PlantillaAsignable[]
}) {
  const [sel, setSel] = React.useState(0)

  return (
    <div className="flex flex-col gap-2.5 lg:sticky lg:top-[calc(var(--spacing-topbar)+var(--spacing)*8)] lg:gap-4">
      <SectionHead icon={<LayoutTemplate aria-hidden />} title="Plantillas" />

      {plantillas.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            Todavía no guardaste ninguna rutina como plantilla.
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
              <Button
                size="sm"
                variant={i === sel ? "default" : "ghost"}
                disabled
                title="Próximamente"
              >
                <Send aria-hidden />
                Asignar
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

export { AsignacionesPlantillas }
