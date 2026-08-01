"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Dumbbell,
  LayoutTemplate,
  Pencil,
  Plus,
  Send,
  Trash2,
} from "lucide-react"

import {
  duplicarRutina,
  eliminarDia,
  eliminarRutina,
  moverEjercicio,
  quitarEjercicioDeDia,
} from "@/lib/actions/rutinas"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AccionSimple } from "@/components/coach/avisos"
import { Celda, EmptyHint, Eyebrow } from "@/components/coach/piezas"
import { SelectNativo } from "@/components/coach/form"
import {
  DiaDialog,
  EjercicioDeDiaDialog,
  RutinaDialog,
} from "@/components/coach/rutina-dialogs"
import { cn } from "@/lib/utils"
import type {
  DiaRutina,
  EjercicioDeDia,
  OpcionEjercicio,
  RutinaBuilder as Rutina,
  RutinaDeLista,
} from "@/lib/data/tipos"

const COLUMNAS = "grid-cols-[2fr_70px_70px_90px_80px_70px_112px]"

/**
 * Constructor de rutinas.
 *
 * El día activo es estado local; todo lo demás son Server Actions.
 */
function RutinaBuilder({
  rutina,
  rutinas,
  ejercicios,
}: {
  rutina: Rutina
  rutinas: RutinaDeLista[]
  ejercicios: OpcionEjercicio[]
}) {
  const router = useRouter()
  const [diaId, setDiaId] = React.useState<string | null>(rutina.dias[0]?.id ?? null)

  // Al cambiar de rutina (o al borrar el día abierto) el id guardado deja de
  // existir: se cae al primer día en vez de mostrar la tabla vacía.
  const dia = rutina.dias.find((d) => d.id === diaId) ?? rutina.dias[0]

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
              <div className="mt-2 flex flex-wrap gap-1.5">
                {rutina.esPlantilla ? (
                  <Badge size="sm" variant="info">
                    Plantilla
                  </Badge>
                ) : null}
                {rutina.objetivo ? <Badge size="sm">{rutina.objetivo}</Badge> : null}
                {rutina.semanas != null ? (
                  <Badge size="sm">{rutina.semanas} semanas</Badge>
                ) : null}
                {rutina.diasPorSemana != null ? (
                  <Badge size="sm">{rutina.diasPorSemana} días/sem</Badge>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <RutinaDialog rutina={rutina}>
                <Button variant="ghost" size="sm">
                  <Pencil aria-hidden />
                  Editar
                </Button>
              </RutinaDialog>
              <AccionSimple
                action={duplicarRutina}
                campos={{ id: rutina.id }}
                variant="ghost"
                size="sm"
              >
                <Copy aria-hidden />
                Duplicar
              </AccionSimple>
              <Button size="sm" asChild>
                <Link href={`/asignaciones?rutina=${rutina.id}`}>
                  <Send aria-hidden />
                  <span className="hidden sm:inline">Asignar a alumnos</span>
                  <span className="sm:hidden">Asignar</span>
                </Link>
              </Button>
            </div>
          </CardContent>

          {/* Selector de rutina + alta. Sin esto, el constructor solo abre la
              última tocada y no hay forma de volver a una anterior. */}
          <CardContent className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <SelectNativo
              aria-label="Rutina a editar"
              value={rutina.id}
              onChange={(e) => router.push(`/rutinas?rutina=${e.target.value}`)}
              className="sm:max-w-xs"
            >
              {rutinas.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                  {r.esPlantilla ? " · plantilla" : ""} ({r.dias}{" "}
                  {r.dias === 1 ? "día" : "días"})
                </option>
              ))}
            </SelectNativo>

            <div className="flex gap-2">
              <RutinaDialog>
                <Button variant="outline" size="sm">
                  <Plus aria-hidden />
                  Nueva rutina
                </Button>
              </RutinaDialog>
              <AccionSimple
                action={eliminarRutina}
                campos={{ id: rutina.id }}
                confirmar={`¿Archivar "${rutina.nombre}"? Deja de aparecer en el constructor y en las plantillas. El historial de los alumnos no se toca.`}
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 aria-hidden />
                Archivar
              </AccionSimple>
            </div>
          </CardContent>

          <CardContent>
            <div className="-mx-(--card-spacing) flex gap-2 overflow-x-auto px-(--card-spacing) pb-0.5">
              {rutina.dias.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDiaId(d.id)}
                  aria-pressed={d.id === dia?.id}
                  className={cn(
                    "min-w-23 shrink-0 rounded-md border-2 p-3 text-left transition-colors duration-[var(--dur-fast)] ease-out lg:flex-1",
                    d.id === dia?.id
                      ? "border-primary bg-accent-soft"
                      : "border-border bg-card hover:bg-muted"
                  )}
                >
                  <div
                    className={cn(
                      "font-heading text-xl leading-tight font-bold",
                      d.id === dia?.id ? "text-accent-soft-strong" : "text-foreground"
                    )}
                  >
                    {d.dia}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {d.foco} · {d.ejercicios.length} ej.
                  </div>
                </button>
              ))}

              <DiaDialog rutinaId={rutina.id}>
                <button
                  type="button"
                  className="flex min-w-23 shrink-0 flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-border p-3 text-muted-foreground transition-colors duration-[var(--dur-fast)] hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50 lg:flex-1"
                >
                  <Plus aria-hidden className="size-5" />
                  <span className="text-xs font-semibold">Agregar día</span>
                </button>
              </DiaDialog>
            </div>
          </CardContent>
        </Card>

        {dia ? (
          <TablaDelDia
            dia={dia}
            ejercicios={ejercicios}
            esUnicoDia={rutina.dias.length === 1}
          />
        ) : (
          <Card>
            <EmptyHint icon={<Dumbbell aria-hidden />}>
              Esta rutina todavía no tiene días. Agregá el primero para empezar a
              cargar ejercicios.
            </EmptyHint>
          </Card>
        )}
      </div>

      <PanelLateral rutina={rutina} />
    </div>
  )
}

function TablaDelDia({
  dia,
  ejercicios,
  esUnicoDia,
}: {
  dia: DiaRutina
  ejercicios: OpcionEjercicio[]
  esUnicoDia: boolean
}) {
  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 lg:px-5">
        <div className="min-w-0">
          <div className="text-md font-semibold text-foreground">
            {dia.dia} · {dia.foco}
          </div>
          {dia.notas ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{dia.notas}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-1">
          <DiaDialog dia={dia}>
            <Button variant="ghost" size="sm">
              <Pencil aria-hidden />
              Editar día
            </Button>
          </DiaDialog>
          <AccionSimple
            action={eliminarDia}
            campos={{ id: dia.id }}
            confirmar={`¿Eliminar "${dia.foco}" y sus ${dia.ejercicios.length} ejercicios?`}
            variant="ghost"
            size="icon-sm"
            aria-label="Eliminar día"
            disabled={esUnicoDia}
            title={
              esUnicoDia ? "Una rutina necesita al menos un día" : "Eliminar día"
            }
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 aria-hidden />
          </AccionSimple>
        </div>
      </div>

      {dia.ejercicios.length === 0 ? (
        <EmptyHint icon={<Dumbbell aria-hidden />}>
          Este día todavía no tiene ejercicios.
        </EmptyHint>
      ) : (
        <>
          {/* Desktop: tabla */}
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
            <span className="text-right">Acciones</span>
          </div>
          {dia.ejercicios.map((ex, i) => (
            <FilaEjercicio
              key={ex.id}
              ejercicio={ex}
              ejercicios={ejercicios}
                esPrimero={i === 0}
              esUltimo={i === dia.ejercicios.length - 1}
            />
          ))}
        </>
      )}

      <div className="px-4 py-3 lg:px-5">
        <EjercicioDeDiaDialog rutinaDiaId={dia.id} ejercicios={ejercicios}>
          <Button variant="ghost" size="sm">
            <Plus aria-hidden />
            Agregar ejercicio
          </Button>
        </EjercicioDeDiaDialog>
      </div>
    </Card>
  )
}

function FilaEjercicio({
  ejercicio: ex,
  ejercicios,
  esPrimero,
  esUltimo,
}: {
  ejercicio: EjercicioDeDia
  ejercicios: OpcionEjercicio[]
  esPrimero: boolean
  esUltimo: boolean
}) {
  // Los mismos controles en desktop y mobile: se declaran una vez y se ubican
  // distinto en cada layout.
  const acciones = (
    <div className="flex shrink-0 items-center justify-end gap-0.5">
      <AccionSimple
        action={moverEjercicio}
        campos={{ id: ex.id, direccion: "arriba" }}
        variant="ghost"
        size="icon-sm"
        aria-label={`Subir ${ex.nombre}`}
        disabled={esPrimero}
        silenciarExito
      >
        <ArrowUp aria-hidden />
      </AccionSimple>
      <AccionSimple
        action={moverEjercicio}
        campos={{ id: ex.id, direccion: "abajo" }}
        variant="ghost"
        size="icon-sm"
        aria-label={`Bajar ${ex.nombre}`}
        disabled={esUltimo}
        silenciarExito
      >
        <ArrowDown aria-hidden />
      </AccionSimple>
      <EjercicioDeDiaDialog fila={ex} ejercicios={ejercicios}>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Editar ${ex.nombre}`}
        >
          <Pencil aria-hidden />
        </Button>
      </EjercicioDeDiaDialog>
      <AccionSimple
        action={quitarEjercicioDeDia}
        campos={{ id: ex.id }}
        confirmar={`¿Quitar ${ex.nombre} de este día?`}
        variant="ghost"
        size="icon-sm"
        aria-label={`Quitar ${ex.nombre}`}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 aria-hidden />
      </AccionSimple>
    </div>
  )

  return (
    <div className="border-b border-border last:border-b-0">
      <div className={cn("hidden items-center px-5 py-3 lg:grid", COLUMNAS)}>
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-[34px] shrink-0 items-center justify-center rounded-sm bg-accent-soft">
            <Dumbbell aria-hidden className="size-[17px] text-accent-soft-strong" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">
              {ex.nombre}
            </div>
            {ex.notas ? (
              <div className="truncate text-xs text-muted-foreground">{ex.notas}</div>
            ) : null}
          </div>
        </div>
        <Celda>{ex.series}</Celda>
        <Celda>{ex.reps}</Celda>
        <Celda>{ex.peso}</Celda>
        <Celda>{ex.descanso}</Celda>
        <Celda>{ex.rpe}</Celda>
        {acciones}
      </div>

      {/* Mobile: nombre arriba, datos en mini-tarjetas */}
      <div className="px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2.5">
          <span className="flex size-[34px] shrink-0 items-center justify-center rounded-sm bg-accent-soft">
            <Dumbbell aria-hidden className="size-[17px] text-accent-soft-strong" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-foreground">
              {ex.nombre}
            </div>
            {ex.notas ? (
              <div className="truncate text-xs text-muted-foreground">{ex.notas}</div>
            ) : null}
          </div>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <MiniDato k="Series" v={ex.series} />
          <MiniDato k="Reps" v={ex.reps} />
          <MiniDato k="Peso" v={ex.peso} />
          <MiniDato k="Desc" v={ex.descanso} />
          <MiniDato k="RPE" v={ex.rpe} />
        </div>
        <div className="mt-2 flex justify-end">{acciones}</div>
      </div>
    </div>
  )
}

function PanelLateral({ rutina }: { rutina: Rutina }) {
  return (
    <div className="flex flex-col gap-4 lg:sticky lg:top-[calc(var(--spacing-topbar)+var(--spacing)*8)]">
      <Card>
        <CardContent className="flex items-center justify-between gap-2">
          <Eyebrow>Plantillas</Eyebrow>
          <span className="text-xs text-muted-foreground">
            <LayoutTemplate aria-hidden className="inline size-3.5" />
          </span>
        </CardContent>
        <CardContent className="flex flex-col gap-2">
          {rutina.plantillas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no guardaste ninguna rutina como plantilla. Marcá una en
              &quot;Editar&quot; para reutilizarla.
            </p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Duplicá una plantilla para adaptarla a un alumno sin tocar el
                original.
              </p>
              {rutina.plantillas.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2"
                >
                  <span className="truncate text-sm font-semibold text-body">
                    {t.nombre}
                  </span>
                  <AccionSimple
                    action={duplicarRutina}
                    campos={{ id: t.id }}
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Duplicar ${t.nombre}`}
                  >
                    <Copy aria-hidden />
                  </AccionSimple>
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Eyebrow>Periodización</Eyebrow>
        </CardContent>
        <CardContent className="flex flex-col gap-2.5">
          <Dato label="Duración" valor={rutina.semanas ? `${rutina.semanas} semanas` : "—"} />
          <Dato
            label="Días por semana"
            valor={rutina.diasPorSemana != null ? String(rutina.diasPorSemana) : "—"}
          />
          <Dato label="Días cargados" valor={String(rutina.dias.length)} />
          <Dato
            label="Ejercicios"
            valor={String(
              rutina.dias.reduce((total, d) => total + d.ejercicios.length, 0)
            )}
          />
          {rutina.descripcion ? (
            <p className="border-t border-border pt-2.5 text-sm text-muted-foreground">
              {rutina.descripcion}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-mono text-sm font-semibold text-body">{valor}</span>
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
