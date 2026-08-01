"use client"

import * as React from "react"
import { Dumbbell, Pencil, Play, Plus, Search, SearchX } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tag } from "@/components/tag"
import { EmptyHint } from "@/components/coach/piezas"
import { EjercicioDialog } from "@/components/coach/ejercicio-dialog"
import type { EjercicioBiblioteca } from "@/lib/data/tipos"

const TODOS = "Todos"

/**
 * Color del punto por grupo muscular. Sale de las series de datos del DS
 * (--chart-1..5) más el ámbar de PR: es categórico, no semántico.
 */
const COLOR_GRUPO: Record<string, string> = {
  Pecho: "bg-info",
  Espalda: "bg-primary",
  Pierna: "bg-pr",
  Hombros: "bg-chart-4",
  Bíceps: "bg-destructive",
  Tríceps: "bg-destructive",
  Brazos: "bg-destructive",
  Core: "bg-warning",
}

function EjerciciosLista({
  ejercicios,
  grupos,
}: {
  ejercicios: EjercicioBiblioteca[]
  grupos: string[]
}) {
  const [grupo, setGrupo] = React.useState(TODOS)
  const [q, setQ] = React.useState("")

  const lista = ejercicios.filter(
    (e) =>
      (grupo === TODOS || e.grupo === grupo) &&
      e.nombre.toLowerCase().includes(q.trim().toLowerCase())
  )

  // Sugerencias del form de alta: se arman con lo que ya hay cargado, para que
  // el profesor no invente "Mancuerna" al lado de "Mancuernas".
  const equipamientos = React.useMemo(
    () =>
      [...new Set(ejercicios.map((e) => e.equipamiento).filter((v) => v != null))].sort(
        (a, b) => a.localeCompare(b, "es")
      ),
    [ejercicios]
  )

  return (
    <div className="flex flex-col gap-3.5 lg:gap-6">
      <div className="flex items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-faint"
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar ejercicio…"
            aria-label="Buscar ejercicio"
            className="pl-10"
          />
        </div>
        <EjercicioDialog grupos={grupos} equipamientos={equipamientos}>
          <Button>
            <Plus aria-hidden />
            <span className="hidden sm:inline">Nuevo ejercicio</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </EjercicioDialog>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 lg:mx-0 lg:flex-wrap lg:px-0">
        {[TODOS, ...grupos].map((g) => (
          <Tag
            key={g}
            role="button"
            tabIndex={0}
            active={g === grupo}
            aria-pressed={g === grupo}
            onClick={() => setGrupo(g)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                setGrupo(g)
              }
            }}
            className="cursor-pointer"
          >
            {g}
          </Tag>
        ))}
      </div>

      {lista.length === 0 ? (
        <Card>
          <EmptyHint icon={<SearchX aria-hidden />}>
            No hay ejercicios que coincidan.
          </EmptyHint>
        </Card>
      ) : (
        <div className="grid gap-2.5 lg:grid-cols-3 lg:gap-4">
          {lista.map((e) => (
            <Card key={e.id} className="gap-0 py-0">
              <div className="relative flex h-[132px] items-center justify-center border-b border-border bg-muted">
                <span className="flex size-13 items-center justify-center rounded-md bg-accent-soft">
                  <Dumbbell aria-hidden className="size-6.5 text-accent-soft-strong" />
                </span>
                {e.tieneVideo ? (
                  <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-2xs font-semibold text-body shadow-sm">
                    <Play aria-hidden className="size-3 text-primary" />
                    Video
                  </span>
                ) : null}
                <span
                  aria-hidden
                  className={`absolute top-2.5 left-2.5 size-2.5 rounded-full ${
                    COLOR_GRUPO[e.grupo] ?? "bg-faint"
                  }`}
                />
              </div>
              <CardContent className="py-3.5">
                <div className="text-md leading-snug font-semibold text-foreground">
                  {e.nombre}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {e.patron ?? "—"}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-wrap gap-1.5">
                    <Badge size="sm">{e.grupo}</Badge>
                    {e.equipamiento ? <Badge size="sm">{e.equipamiento}</Badge> : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="font-mono text-2xs whitespace-nowrap text-faint">
                      {e.usos} rut.
                    </span>
                    {/* Los del catálogo público no se editan: son de todos los
                        gimnasios. Ver assertEjercicioEditable. */}
                    {e.editable ? (
                      <EjercicioDialog
                        ejercicio={e}
                        grupos={grupos}
                        equipamientos={equipamientos}
                      >
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Editar ${e.nombre}`}
                        >
                          <Pencil aria-hidden />
                        </Button>
                      </EjercicioDialog>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export { EjerciciosLista }
