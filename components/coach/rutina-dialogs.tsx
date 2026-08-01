"use client"

// ============================================================================
// Formularios del constructor de rutinas: la rutina, sus días y las filas de
// ejercicio de cada día.
//
// Los tres siguen el mismo molde: el <Dialog> guarda solo si está abierto, y el
// formulario (con su useActionState) se monta recién adentro, así los errores
// del intento anterior no reaparecen al reabrirlo.
// ============================================================================

import * as React from "react"
import { useActionState } from "react"
import { useRouter } from "next/navigation"

import {
  agregarEjercicioADia,
  crearDia,
  crearRutina,
  editarDia,
  editarEjercicioDeDia,
  editarRutina,
} from "@/lib/actions/rutinas"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  AvisoDeError,
  BotonEnviar,
  Campo,
  erroresDe,
  propsDeCampo,
  SelectNativo,
  useCerrarAlExito,
} from "@/components/coach/form"
import type {
  DiaRutina,
  EjercicioDeDia,
  OpcionEjercicio,
  RutinaBuilder,
} from "@/lib/data/tipos"

/** Descansos de la planilla del entrenador, en segundos. */
const DESCANSOS = [30, 45, 60, 75, 90, 120, 150, 180, 240, 300]

// ----------------------------------------------------------------------------
// Rutina
// ----------------------------------------------------------------------------

function RutinaDialog({
  rutina,
  children,
}: {
  /** Sin rutina es un alta; con rutina, la edición de esa. */
  rutina?: RutinaBuilder
  children: React.ReactNode
}) {
  const [abierto, setAbierto] = React.useState(false)
  const cerrar = React.useCallback(() => setAbierto(false), [])

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{rutina ? "Editar rutina" : "Nueva rutina"}</DialogTitle>
          <DialogDescription>
            {rutina
              ? "Los cambios se ven en las asignaciones que ya usan esta rutina."
              : "Después vas a poder cargarle los días y los ejercicios."}
          </DialogDescription>
        </DialogHeader>
        <FormularioRutina rutina={rutina} onExito={cerrar} />
      </DialogContent>
    </Dialog>
  )
}

function FormularioRutina({
  rutina,
  onExito,
}: {
  rutina?: RutinaBuilder
  onExito: () => void
}) {
  const router = useRouter()
  const [estado, accion] = useActionState(rutina ? editarRutina : crearRutina, null)

  // Al crear no alcanza con cerrar: hay que abrir la rutina nueva, que es lo que
  // el profesor va a querer editar enseguida.
  React.useEffect(() => {
    if (!estado?.ok) return
    onExito()
    if (!rutina) router.push(`/rutinas?rutina=${estado.datos.id}`)
  }, [estado, onExito, router, rutina])

  const errores = erroresDe(estado)

  return (
    <form action={accion} className="flex flex-col gap-4">
      {rutina ? <input type="hidden" name="id" value={rutina.id} /> : null}

      <AvisoDeError estado={estado} />

      <Campo name="nombre" label="Nombre" error={errores.nombre}>
        <Input
          {...propsDeCampo("nombre", errores.nombre)}
          defaultValue={rutina?.nombre}
          placeholder="Fuerza 4 días — Mesociclo 1"
          maxLength={120}
          required
          autoFocus
        />
      </Campo>

      <Campo name="objetivo" label="Objetivo" error={errores.objetivo} ayuda="Opcional.">
        <Input
          {...propsDeCampo("objetivo", errores.objetivo)}
          defaultValue={rutina?.objetivo ?? ""}
          list="objetivos-rutina"
          placeholder="Fuerza"
          maxLength={60}
        />
        <datalist id="objetivos-rutina">
          <option value="Fuerza" />
          <option value="Hipertrofia" />
          <option value="Resistencia" />
          <option value="Recomposición" />
          <option value="Rehabilitación" />
        </datalist>
      </Campo>

      <div className="grid grid-cols-2 gap-4">
        <Campo
          name="duracionSemanas"
          label="Semanas"
          error={errores.duracionSemanas}
          ayuda="Duración del mesociclo."
        >
          <Input
            {...propsDeCampo("duracionSemanas", errores.duracionSemanas)}
            type="number"
            inputMode="numeric"
            min={1}
            max={52}
            defaultValue={rutina?.semanas ?? ""}
            placeholder="8"
          />
        </Campo>

        <Campo
          name="diasPorSemana"
          label="Días por semana"
          error={errores.diasPorSemana}
          ayuda="Opcional."
        >
          <Input
            {...propsDeCampo("diasPorSemana", errores.diasPorSemana)}
            type="number"
            inputMode="numeric"
            min={1}
            max={7}
            defaultValue={rutina?.diasPorSemana ?? ""}
            placeholder="4"
          />
        </Campo>
      </div>

      <Campo
        name="descripcion"
        label="Descripción"
        error={errores.descripcion}
        ayuda="Opcional: para qué es esta rutina y cómo progresarla."
      >
        <Textarea
          {...propsDeCampo("descripcion", errores.descripcion)}
          defaultValue={rutina?.descripcion ?? ""}
          rows={3}
          maxLength={500}
        />
      </Campo>

      <div className="flex items-start gap-2.5 rounded-md border border-border bg-muted px-3.5 py-3">
        <Checkbox
          id="esPlantilla"
          name="esPlantilla"
          defaultChecked={rutina?.esPlantilla}
          className="mt-0.5"
        />
        <div className="min-w-0">
          <Label htmlFor="esPlantilla">Guardar como plantilla</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Las plantillas aparecen en la pantalla de asignaciones y se pueden
            duplicar para adaptarlas a cada alumno.
          </p>
        </div>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="ghost">
            Cancelar
          </Button>
        </DialogClose>
        <BotonEnviar>{rutina ? "Guardar cambios" : "Crear rutina"}</BotonEnviar>
      </DialogFooter>
    </form>
  )
}

// ----------------------------------------------------------------------------
// Día
// ----------------------------------------------------------------------------

function DiaDialog({
  rutinaId,
  dia,
  children,
}: {
  /** Requerido para el alta; en la edición sale del día. */
  rutinaId?: string
  dia?: DiaRutina
  children: React.ReactNode
}) {
  const [abierto, setAbierto] = React.useState(false)
  const cerrar = React.useCallback(() => setAbierto(false), [])

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dia ? `Editar ${dia.dia}` : "Nuevo día"}</DialogTitle>
          <DialogDescription>
            El nombre del día es el foco del entrenamiento: lo que ve el alumno
            en &quot;hoy te toca&quot;.
          </DialogDescription>
        </DialogHeader>
        <FormularioDia rutinaId={rutinaId} dia={dia} onExito={cerrar} />
      </DialogContent>
    </Dialog>
  )
}

function FormularioDia({
  rutinaId,
  dia,
  onExito,
}: {
  rutinaId?: string
  dia?: DiaRutina
  onExito: () => void
}) {
  const [estado, accion] = useActionState(dia ? editarDia : crearDia, null)
  useCerrarAlExito(estado, onExito)

  const errores = erroresDe(estado)

  return (
    <form action={accion} className="flex flex-col gap-4">
      {dia ? (
        <input type="hidden" name="id" value={dia.id} />
      ) : (
        <input type="hidden" name="rutinaId" value={rutinaId} />
      )}

      <AvisoDeError estado={estado} />

      <Campo name="nombre" label="Nombre del día" error={errores.nombre}>
        <Input
          {...propsDeCampo("nombre", errores.nombre)}
          defaultValue={dia?.foco}
          placeholder="Empuje — Pecho / Hombros"
          maxLength={80}
          required
          autoFocus
        />
      </Campo>

      <Campo
        name="notas"
        label="Notas"
        error={errores.notas}
        ayuda="Opcional: entrada en calor, consignas generales del día."
      >
        <Textarea
          {...propsDeCampo("notas", errores.notas)}
          defaultValue={dia?.notas ?? ""}
          rows={3}
          maxLength={500}
        />
      </Campo>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="ghost">
            Cancelar
          </Button>
        </DialogClose>
        <BotonEnviar>{dia ? "Guardar cambios" : "Agregar día"}</BotonEnviar>
      </DialogFooter>
    </form>
  )
}

// ----------------------------------------------------------------------------
// Ejercicio dentro de un día
// ----------------------------------------------------------------------------

function EjercicioDeDiaDialog({
  rutinaDiaId,
  fila,
  ejercicios,
  children,
}: {
  /** Requerido para el alta; en la edición sale de la fila. */
  rutinaDiaId?: string
  fila?: EjercicioDeDia
  ejercicios: OpcionEjercicio[]
  children: React.ReactNode
}) {
  const [abierto, setAbierto] = React.useState(false)
  const cerrar = React.useCallback(() => setAbierto(false), [])

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{fila ? "Editar ejercicio" : "Agregar ejercicio"}</DialogTitle>
          <DialogDescription>
            Las series, repeticiones y el peso son la sugerencia del plan. El
            alumno carga después lo que realmente hizo.
          </DialogDescription>
        </DialogHeader>
        <FormularioEjercicioDeDia
          rutinaDiaId={rutinaDiaId}
          fila={fila}
          ejercicios={ejercicios}
          onExito={cerrar}
        />
      </DialogContent>
    </Dialog>
  )
}

function FormularioEjercicioDeDia({
  rutinaDiaId,
  fila,
  ejercicios,
  onExito,
}: {
  rutinaDiaId?: string
  fila?: EjercicioDeDia
  ejercicios: OpcionEjercicio[]
  onExito: () => void
}) {
  const [estado, accion] = useActionState(
    fila ? editarEjercicioDeDia : agregarEjercicioADia,
    null
  )
  useCerrarAlExito(estado, onExito)

  const errores = erroresDe(estado)
  const grupos = agruparPorGrupoMuscular(ejercicios)

  return (
    <form action={accion} className="flex flex-col gap-4">
      {fila ? (
        <input type="hidden" name="id" value={fila.id} />
      ) : (
        <input type="hidden" name="rutinaDiaId" value={rutinaDiaId} />
      )}

      <AvisoDeError estado={estado} />

      <Campo name="ejercicioId" label="Ejercicio" error={errores.ejercicioId}>
        <SelectNativo
          {...propsDeCampo("ejercicioId", errores.ejercicioId)}
          defaultValue={fila?.ejercicioId ?? ""}
          required
        >
          <option value="" disabled>
            Elegí un ejercicio…
          </option>
          {grupos.map(([grupo, delGrupo]) => (
            <optgroup key={grupo} label={grupo}>
              {delGrupo.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </optgroup>
          ))}
        </SelectNativo>
      </Campo>

      <div className="grid grid-cols-3 gap-3">
        <Campo name="series" label="Series" error={errores.series}>
          <Input
            {...propsDeCampo("series", errores.series)}
            type="number"
            inputMode="numeric"
            min={1}
            max={20}
            defaultValue={fila?.series ?? 3}
            required
          />
        </Campo>

        <Campo name="repeticionesMin" label="Reps mín." error={errores.repeticionesMin}>
          <Input
            {...propsDeCampo("repeticionesMin", errores.repeticionesMin)}
            type="number"
            inputMode="numeric"
            min={1}
            max={200}
            defaultValue={fila?.repeticionesMin ?? ""}
            placeholder="8"
          />
        </Campo>

        <Campo name="repeticionesMax" label="Reps máx." error={errores.repeticionesMax}>
          <Input
            {...propsDeCampo("repeticionesMax", errores.repeticionesMax)}
            type="number"
            inputMode="numeric"
            min={1}
            max={200}
            defaultValue={fila?.repeticionesMax ?? ""}
            placeholder="12"
          />
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Campo
          name="pesoSugerido"
          label="Peso sugerido (kg)"
          error={errores.pesoSugerido}
        >
          <Input
            {...propsDeCampo("pesoSugerido", errores.pesoSugerido)}
            type="number"
            inputMode="decimal"
            step="0.5"
            min={0}
            max={9999.99}
            defaultValue={fila?.pesoSugerido ?? ""}
            placeholder="60"
          />
        </Campo>

        <Campo name="descansoSegundos" label="Descanso" error={errores.descansoSegundos}>
          <SelectNativo
            {...propsDeCampo("descansoSegundos", errores.descansoSegundos)}
            defaultValue={fila?.descansoSegundos ?? ""}
          >
            <option value="">Sin especificar</option>
            {DESCANSOS.map((segundos) => (
              <option key={segundos} value={segundos}>
                {formatoDescansoCorto(segundos)}
              </option>
            ))}
          </SelectNativo>
        </Campo>
      </div>

      <Campo
        name="notas"
        label="Notas técnicas"
        error={errores.notas}
        ayuda="Opcional: tempo, consignas, variantes."
      >
        <Input
          {...propsDeCampo("notas", errores.notas)}
          defaultValue={fila?.notas ?? ""}
          maxLength={300}
          placeholder="Bajar en 3 segundos"
        />
      </Campo>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="ghost">
            Cancelar
          </Button>
        </DialogClose>
        <BotonEnviar>{fila ? "Guardar cambios" : "Agregar al día"}</BotonEnviar>
      </DialogFooter>
    </form>
  )
}

/** Los ejercicios ya vienen ordenados por grupo: solo hay que partirlos. */
function agruparPorGrupoMuscular(ejercicios: OpcionEjercicio[]) {
  const porGrupo = new Map<string, OpcionEjercicio[]>()

  for (const ejercicio of ejercicios) {
    const actual = porGrupo.get(ejercicio.grupo)
    if (actual) actual.push(ejercicio)
    else porGrupo.set(ejercicio.grupo, [ejercicio])
  }

  return [...porGrupo.entries()]
}

/** 150 -> "2:30 min"; 45 -> "45 s". */
function formatoDescansoCorto(segundos: number) {
  if (segundos < 60) return `${segundos} s`
  const resto = segundos % 60
  return resto === 0
    ? `${segundos / 60} min`
    : `${Math.floor(segundos / 60)}:${String(resto).padStart(2, "0")} min`
}

export { DiaDialog, EjercicioDeDiaDialog, RutinaDialog }
