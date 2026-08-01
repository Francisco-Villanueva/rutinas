"use client"

import * as React from "react"
import { useActionState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, Plus, Timer, Trophy } from "lucide-react"

import { guardarEjercicio } from "@/lib/actions/sesiones"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AvisoDeError, BotonEnviar } from "@/components/coach/form"
import { mejorRmEstimado } from "@/lib/entrenamiento/rm"
import { SelectorRpe } from "@/components/alumno/piezas"
import { cn } from "@/lib/utils"
import type { EjercicioDeHoy } from "@/lib/data/alumno-tipos"

/**
 * Carga de un ejercicio, contra el LogWorkoutScreen del kit.
 *
 * Los inputs son no controlados a propósito: el alumno escribe con una mano y el
 * celular apoyado, y un re-render por tecla en un input numérico es justo donde
 * se pierden dígitos. React solo maneja cuántas filas hay, el timer y el 1RM.
 */
function LogEjercicio({
  ejercicio,
  sesionId,
  dia,
  siguienteId,
}: {
  ejercicio: EjercicioDeHoy
  sesionId: string
  dia: string
  siguienteId: string | null
}) {
  const router = useRouter()
  const [estado, accion] = useActionState(guardarEjercicio, null)

  // Al menos las series del plan; más, si en un guardado anterior se agregaron.
  const [cantidad, setCantidad] = React.useState(() =>
    Math.max(ejercicio.series, ejercicio.cargadas.length),
  )
  const [descansoDesde, setDescansoDesde] = React.useState<number | null>(null)
  const [estimado, setEstimado] = React.useState(() =>
    mejor1RM(ejercicio.cargadas.map((s) => ({ peso: s.peso, reps: s.repeticiones }))),
  )

  React.useEffect(() => {
    if (!estado?.ok) return
    // Guardado: se vuelve a la lista del día, como el "Guardar ejercicio" del kit.
    router.push(siguienteId ? `/hoy/${siguienteId}` : "/hoy")
  }, [estado, router, siguienteId])

  /** Recalcula el 1RM leyendo el formulario, sin controlar cada input. */
  function alEscribir(evento: React.FormEvent<HTMLFormElement>) {
    const datos = new FormData(evento.currentTarget)
    const series = Array.from({ length: cantidad }, (_, i) => ({
      peso: numero(datos.get(`serie-${i + 1}-peso`)),
      reps: numero(datos.get(`serie-${i + 1}-reps`)),
    }))
    setEstimado(mejor1RM(series))
  }

  const objetivo = [
    `${ejercicio.series} × ${ejercicio.reps}`,
    ejercicio.pesoSugerido != null ? `@ ${ejercicio.pesoSugerido} kg` : null,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <form action={accion} onInput={alEscribir} className="flex flex-col gap-4 px-5 pt-3">
      <input type="hidden" name="sesionId" value={sesionId} />
      <input type="hidden" name="rutinaEjercicioId" value={ejercicio.rutinaEjercicioId} />
      <input type="hidden" name="cantidadSeries" value={cantidad} />

      <header className="flex items-center gap-2.5">
        <Button variant="ghost" size="icon-sm" aria-label="Volver" asChild>
          <Link href="/hoy">
            <ArrowLeft aria-hidden />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-heading text-lg leading-tight font-bold text-foreground">
            {ejercicio.nombre}
          </h1>
          <p className="truncate font-mono text-sm text-muted-foreground">
            {dia} · objetivo {objetivo}
          </p>
        </div>
        {estimado != null ? (
          <Badge variant="pr">
            <Trophy aria-hidden />
            1RM {estimado}
          </Badge>
        ) : null}
      </header>

      <AvisoDeError estado={estado} />

      {ejercicio.descansoSegundos != null ? (
        <TimerDeDescanso
          segundos={ejercicio.descansoSegundos}
          iniciadoEn={descansoDesde}
        />
      ) : null}

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[32px_1fr_1fr_52px] gap-2.5 px-1 text-2xs font-bold tracking-caps text-muted-foreground uppercase">
          <span>Set</span>
          <span>Peso (kg)</span>
          <span>Reps</span>
          <span className="sr-only">Hecha</span>
        </div>

        {Array.from({ length: cantidad }, (_, i) => (
          <FilaDeSerie
            key={i}
            numero={i + 1}
            cargada={ejercicio.cargadas[i]}
            pesoSugerido={ejercicio.pesoSugerido}
            repsSugeridas={ejercicio.repeticionesMin ?? ejercicio.repeticionesMax}
            onConfirmar={() => setDescansoDesde(Date.now())}
          />
        ))}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit"
          onClick={() => setCantidad((n) => n + 1)}
          disabled={cantidad >= 20}
        >
          <Plus aria-hidden />
          Agregar serie
        </Button>
      </div>

      <Card>
        <CardContent>
          <SelectorRpe name="rpe" valor={ejercicio.cargadas[0]?.rpe ?? null} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notas" className="text-2xs font-bold tracking-caps text-body uppercase">
          Notas rápidas
        </label>
        <Input
          id="notas"
          name="notas"
          maxLength={300}
          placeholder="Me costó la última serie…"
        />
      </div>

      {ejercicio.notas ? (
        <p className="rounded-md bg-info-soft px-3.5 py-2.5 text-sm text-body">
          <span className="font-semibold">Del profe:</span> {ejercicio.notas}
        </p>
      ) : null}

      <BotonEnviar size="lg" className="w-full">
        <Check aria-hidden />
        Guardar ejercicio
      </BotonEnviar>
    </form>
  )
}

function FilaDeSerie({
  numero,
  cargada,
  pesoSugerido,
  repsSugeridas,
  onConfirmar,
}: {
  numero: number
  cargada?: { peso: number | null; repeticiones: number | null; completado: boolean }
  pesoSugerido: number | null
  repsSugeridas: number | null
  onConfirmar: () => void
}) {
  const [hecha, setHecha] = React.useState(cargada?.completado ?? false)

  return (
    <div className="grid grid-cols-[32px_1fr_1fr_52px] items-center gap-2.5">
      <span className="flex h-10 items-center justify-center rounded-sm bg-muted font-mono text-sm font-bold text-body">
        {numero}
      </span>
      <Input
        name={`serie-${numero}-peso`}
        type="number"
        inputMode="decimal"
        step="0.5"
        min={0}
        aria-label={`Peso de la serie ${numero}`}
        // El sugerido del plan precargado: el alumno confirma, no transcribe.
        defaultValue={cargada?.peso ?? pesoSugerido ?? ""}
      />
      <Input
        name={`serie-${numero}-reps`}
        type="number"
        inputMode="numeric"
        min={0}
        aria-label={`Repeticiones de la serie ${numero}`}
        defaultValue={cargada?.repeticiones ?? repsSugeridas ?? ""}
      />
      <label
        className={cn(
          "flex h-10 cursor-pointer items-center justify-center rounded-sm border-2 transition-colors duration-[var(--dur-fast)]",
          hecha ? "border-transparent bg-primary" : "border-input bg-card",
        )}
      >
        <input
          type="checkbox"
          name={`serie-${numero}-hecho`}
          defaultChecked={hecha}
          onChange={(e) => {
            setHecha(e.target.checked)
            // El descanso arranca cuando termina la serie, no cuando se guarda.
            if (e.target.checked) onConfirmar()
          }}
          className="peer sr-only"
        />
        <span className="sr-only">Serie {numero} hecha</span>
        <Check
          aria-hidden
          className={cn(
            "size-[18px]",
            hecha ? "text-primary-foreground" : "text-faint",
          )}
        />
      </label>
    </div>
  )
}

/** Cuenta regresiva del descanso. Arranca cuando se confirma una serie. */
function TimerDeDescanso({
  segundos,
  iniciadoEn,
}: {
  segundos: number
  iniciadoEn: number | null
}) {
  const [ahora, setAhora] = React.useState(() => Date.now())

  React.useEffect(() => {
    if (iniciadoEn == null) return

    const id = setInterval(() => setAhora(Date.now()), 500)
    return () => clearInterval(id)
  }, [iniciadoEn])

  // El clamp cubre el hueco entre que arranca el descanso y el primer tick del
  // intervalo: hasta entonces `ahora` es anterior a `iniciadoEn` y el
  // transcurrido daría negativo, mostrando más tiempo del que corresponde.
  const transcurrido =
    iniciadoEn == null ? 0 : Math.max(0, Math.floor((ahora - iniciadoEn) / 1000))
  const restante = Math.max(0, segundos - transcurrido)
  const terminado = iniciadoEn != null && restante === 0

  return (
    <Card className={cn("border-transparent", terminado ? "bg-success-soft" : "bg-muted")}>
      <CardContent className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-body">
          <Timer aria-hidden className="size-5 text-primary" />
          {terminado ? "Descanso terminado" : "Descanso"}
        </span>
        <span
          aria-live={terminado ? "polite" : "off"}
          className="font-mono text-2xl font-bold text-foreground tabular-nums"
        >
          {Math.floor(restante / 60)}:{String(restante % 60).padStart(2, "0")}
        </span>
      </CardContent>
    </Card>
  )
}

/**
 * El 1RM de la mejor serie. Sale del mismo módulo que usa el motor de PRs: si
 * acá se estimara distinto, el número que ve el alumno mientras carga no
 * coincidiría con el PR que le queda guardado.
 */
function mejor1RM(series: { peso: number | null; reps: number | null }[]) {
  const estimado = mejorRmEstimado(
    series.map((s) => ({ peso: s.peso, repeticiones: s.reps })),
  )

  return estimado == null ? null : Math.round(estimado)
}

function numero(valor: FormDataEntryValue | null) {
  if (typeof valor !== "string" || valor.trim() === "") return null
  const parseado = Number(valor)
  return Number.isFinite(parseado) ? parseado : null
}

export { LogEjercicio }
