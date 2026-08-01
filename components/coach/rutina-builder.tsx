"use client"

import * as React from "react"
import {
  Dumbbell,
  EllipsisVertical,
  GripVertical,
  Pencil,
  Plus,
  Send,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tag } from "@/components/tag"
import { Celda, EmptyHint, Eyebrow } from "@/components/coach/piezas"
import { cn } from "@/lib/utils"
import type { RutinaBuilder as Rutina } from "@/lib/data/tipos"

const COLUMNAS = "grid-cols-[2fr_70px_70px_90px_80px_70px_40px]"

/**
 * Constructor de rutinas. Los tabs de día son estado local; editar, reordenar y
 * agregar ejercicios necesitan sus Server Actions, así que esos controles están
 * deshabilitados. La tabla ya es la definitiva.
 */
function RutinaBuilder({ rutina }: { rutina: Rutina }) {
  const [diaIdx, setDiaIdx] = React.useState(0)
  const dia = rutina.dias[diaIdx]

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_280px] lg:gap-6">
      <div className="flex flex-col gap-3.5 lg:gap-5">
        <Card size="lg">
          <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <div className="min-w-0">
              <Eyebrow className="text-accent-soft-strong">
                Constructor de rutina
              </Eyebrow>
              <h2 className="mt-1 font-heading text-xl leading-tight font-bold tracking-display text-foreground lg:text-2xl">
                {rutina.nombre}
              </h2>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="ghost" size="sm" disabled title="Próximamente">
                <Pencil aria-hidden />
                Editar
              </Button>
              <Button size="sm" disabled title="Próximamente">
                <Send aria-hidden />
                <span className="hidden sm:inline">Asignar a alumnos</span>
                <span className="sm:hidden">Asignar</span>
              </Button>
            </div>
          </CardContent>

          <CardContent>
            <div className="-mx-(--card-spacing) flex gap-2 overflow-x-auto px-(--card-spacing) pb-0.5">
              {rutina.dias.map((d, i) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDiaIdx(i)}
                  aria-pressed={i === diaIdx}
                  className={cn(
                    "min-w-23 shrink-0 rounded-md border-2 p-3 text-left transition-colors duration-[var(--dur-fast)] ease-out lg:flex-1",
                    i === diaIdx
                      ? "border-primary bg-accent-soft"
                      : "border-border bg-card hover:bg-muted"
                  )}
                >
                  <div
                    className={cn(
                      "font-heading text-xl leading-tight font-bold",
                      i === diaIdx ? "text-accent-soft-strong" : "text-foreground"
                    )}
                  >
                    {d.dia}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {d.foco} · {d.ejercicios.length} ej.
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 py-0">
          {!dia || dia.ejercicios.length === 0 ? (
            <EmptyHint icon={<Dumbbell aria-hidden />}>
              Este día todavía no tiene ejercicios.
            </EmptyHint>
          ) : (
            <>
              {/* Desktop: tabla editable */}
              <div
                className={cn(
                  "hidden border-b border-border px-5 py-3 text-2xs font-bold tracking-caps text-muted-foreground uppercase lg:grid",
                  COLUMNAS
                )}
              >
                <span>Ejercicio</span>
                <span>Series</span>
                <span>Reps</span>
                <span>Peso</span>
                <span>Desc.</span>
                <span>RPE</span>
                <span />
              </div>
              {dia.ejercicios.map((ex) => (
                <div key={ex.id} className="border-b border-border">
                  <div
                    className={cn("hidden items-center px-5 py-3 lg:grid", COLUMNAS)}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <GripVertical aria-hidden className="size-4 shrink-0 text-faint" />
                      <span className="flex size-[34px] shrink-0 items-center justify-center rounded-sm bg-accent-soft">
                        <Dumbbell
                          aria-hidden
                          className="size-[17px] text-accent-soft-strong"
                        />
                      </span>
                      <span className="truncate text-sm font-semibold text-foreground">
                        {ex.nombre}
                      </span>
                    </div>
                    <Celda>{ex.series}</Celda>
                    <Celda>{ex.reps}</Celda>
                    <Celda>{ex.peso}</Celda>
                    <Celda>{ex.descanso}</Celda>
                    <Celda>{ex.rpe}</Celda>
                    <EllipsisVertical aria-hidden className="size-4 text-faint" />
                  </div>

                  {/* Mobile: nombre arriba, datos en mini-tarjetas */}
                  <div className="px-4 py-3 lg:hidden">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-[34px] shrink-0 items-center justify-center rounded-sm bg-accent-soft">
                        <Dumbbell
                          aria-hidden
                          className="size-[17px] text-accent-soft-strong"
                        />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                        {ex.nombre}
                      </span>
                      <EllipsisVertical aria-hidden className="size-4 text-faint" />
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <MiniDato k="Series" v={ex.series} />
                      <MiniDato k="Reps" v={ex.reps} />
                      <MiniDato k="Peso" v={ex.peso} />
                      <MiniDato k="Desc" v={ex.descanso} />
                      <MiniDato k="RPE" v={ex.rpe} />
                    </div>
                  </div>
                </div>
              ))}
              <div className="px-4 py-3 lg:px-5">
                <Button variant="ghost" size="sm" disabled title="Próximamente">
                  <Plus aria-hidden />
                  Agregar ejercicio
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Columna lateral: plantillas + periodización */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-[calc(var(--spacing-topbar)+var(--spacing)*8)]">
        <Card>
          <CardContent className="flex items-center justify-between gap-2">
            <Eyebrow>Plantillas</Eyebrow>
            <Button variant="ghost" size="sm" disabled title="Próximamente">
              <Plus aria-hidden />
              Nueva
            </Button>
          </CardContent>
          <CardContent className="flex flex-col gap-2">
            {rutina.plantillas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Todavía no guardaste ninguna rutina como plantilla.
              </p>
            ) : (
              rutina.plantillas.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  disabled
                  title="Próximamente"
                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2.5 text-left disabled:opacity-60"
                >
                  <span className="truncate text-sm font-semibold text-body">
                    {t.nombre}
                  </span>
                  <Plus aria-hidden className="size-[15px] shrink-0 text-faint" />
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Eyebrow>Periodización</Eyebrow>
          </CardContent>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="duracion">Duración (semanas)</Label>
              <Input
                id="duracion"
                type="number"
                defaultValue={rutina.semanas ?? 8}
                disabled
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Tag active>Lineal</Tag>
              <Tag>Ondulante</Tag>
              <Tag>Bloques</Tag>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MiniDato({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex-[1_1_54px] rounded-sm border border-border bg-muted px-2 py-1.5 text-center">
      <div className="text-[10px] tracking-label text-faint uppercase">{k}</div>
      <div className="font-mono text-sm font-semibold text-foreground">{v}</div>
    </div>
  )
}

export { RutinaBuilder }
