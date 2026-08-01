"use client"

import * as React from "react"
import { useActionState } from "react"
import { Trash2 } from "lucide-react"

import {
  crearEjercicio,
  desactivarEjercicio,
  editarEjercicio,
} from "@/lib/actions/ejercicios"
import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import {
  AvisoDeError,
  BotonEnviar,
  Campo,
  erroresDe,
  propsDeCampo,
  useCerrarAlExito,
} from "@/components/coach/form"
import type { EjercicioBiblioteca } from "@/lib/data/tipos"

/**
 * Alta y edición de un ejercicio de la biblioteca.
 *
 * El formulario vive en un componente aparte que se monta recién al abrir el
 * dialog: así el estado de useActionState (mensajes y errores del intento
 * anterior) se descarta al cerrar, en vez de reaparecer la próxima vez.
 */
function EjercicioDialog({
  ejercicio,
  grupos,
  equipamientos,
  children,
}: {
  /** Sin ejercicio es un alta; con ejercicio, la edición de ese. */
  ejercicio?: EjercicioBiblioteca
  grupos: string[]
  equipamientos: string[]
  children: React.ReactNode
}) {
  const [abierto, setAbierto] = React.useState(false)
  const cerrar = React.useCallback(() => setAbierto(false), [])

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {ejercicio ? "Editar ejercicio" : "Nuevo ejercicio"}
          </DialogTitle>
          <DialogDescription>
            {ejercicio
              ? "Los cambios se aplican en todas las rutinas que lo usan."
              : "Queda en la biblioteca de tu gimnasio, disponible para todas tus rutinas."}
          </DialogDescription>
        </DialogHeader>

        <FormularioEjercicio
          ejercicio={ejercicio}
          grupos={grupos}
          equipamientos={equipamientos}
          onExito={cerrar}
        />
      </DialogContent>
    </Dialog>
  )
}

function FormularioEjercicio({
  ejercicio,
  grupos,
  equipamientos,
  onExito,
}: {
  ejercicio?: EjercicioBiblioteca
  grupos: string[]
  equipamientos: string[]
  onExito: () => void
}) {
  const [estado, accion] = useActionState(
    ejercicio ? editarEjercicio : crearEjercicio,
    null
  )
  useCerrarAlExito(estado, onExito)

  const errores = erroresDe(estado)

  return (
    <>
      <form action={accion} className="flex flex-col gap-4">
        {ejercicio ? <input type="hidden" name="id" value={ejercicio.id} /> : null}

        <AvisoDeError estado={estado} />

        <Campo name="nombre" label="Nombre" error={errores.nombre}>
          <Input
            {...propsDeCampo("nombre", errores.nombre)}
            defaultValue={ejercicio?.nombre}
            placeholder="Press de banca con mancuernas"
            maxLength={120}
            required
            autoFocus
          />
        </Campo>

        <div className="grid gap-4 lg:grid-cols-2">
          <Campo
            name="grupoMuscular"
            label="Grupo muscular"
            error={errores.grupoMuscular}
            ayuda="Elegí uno de la lista o escribí uno nuevo."
          >
            <Input
              {...propsDeCampo("grupoMuscular", errores.grupoMuscular)}
              defaultValue={ejercicio?.grupo}
              list="grupos-musculares"
              placeholder="Pecho"
              maxLength={60}
              required
            />
            <datalist id="grupos-musculares">
              {grupos.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </Campo>

          <Campo
            name="grupoMuscularSecundario"
            label="Grupo secundario"
            error={errores.grupoMuscularSecundario}
            ayuda="Opcional."
          >
            <Input
              {...propsDeCampo(
                "grupoMuscularSecundario",
                errores.grupoMuscularSecundario
              )}
              defaultValue={ejercicio?.patron ?? ""}
              list="grupos-musculares"
              placeholder="Tríceps"
              maxLength={60}
            />
          </Campo>
        </div>

        <Campo
          name="equipamiento"
          label="Equipamiento"
          error={errores.equipamiento}
          ayuda="Opcional."
        >
          <Input
            {...propsDeCampo("equipamiento", errores.equipamiento)}
            defaultValue={ejercicio?.equipamiento ?? ""}
            list="equipamientos"
            placeholder="Mancuernas"
            maxLength={60}
          />
          <datalist id="equipamientos">
            {equipamientos.map((e) => (
              <option key={e} value={e} />
            ))}
          </datalist>
        </Campo>

        <Campo
          name="descripcion"
          label="Notas"
          error={errores.descripcion}
          ayuda="Opcional: consignas técnicas, variantes, advertencias."
        >
          <Textarea
            {...propsDeCampo("descripcion", errores.descripcion)}
            defaultValue={ejercicio?.descripcion ?? ""}
            rows={3}
            maxLength={500}
            placeholder="Codos a 45°, bajar controlado."
          />
        </Campo>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Cancelar
            </Button>
          </DialogClose>
          <BotonEnviar>{ejercicio ? "Guardar cambios" : "Crear ejercicio"}</BotonEnviar>
        </DialogFooter>
      </form>

      {/* Fuera del <form> de arriba: son dos actions distintas y los form no se
          pueden anidar. */}
      {ejercicio ? <BajaDeEjercicio ejercicio={ejercicio} onExito={onExito} /> : null}
    </>
  )
}

/**
 * Baja lógica, con confirmación en dos pasos. No hace falta un AlertDialog
 * anidado dentro del dialog de edición: el botón se transforma en la pregunta.
 */
function BajaDeEjercicio({
  ejercicio,
  onExito,
}: {
  ejercicio: EjercicioBiblioteca
  onExito: () => void
}) {
  const [confirmando, setConfirmando] = React.useState(false)
  const [estado, accion] = useActionState(desactivarEjercicio, null)
  useCerrarAlExito(estado, onExito)

  return (
    <form
      action={accion}
      className="flex flex-col gap-2 border-t border-border pt-4"
    >
      <input type="hidden" name="id" value={ejercicio.id} />

      <AvisoDeError estado={estado} />

      {confirmando ? (
        <div className="flex flex-col gap-2.5">
          <p className="text-sm text-body">
            {ejercicio.usos > 0
              ? `Este ejercicio se usa en ${ejercicio.usos} ${
                  ejercicio.usos === 1 ? "rutina" : "rutinas"
                }. Al darlo de baja deja de aparecer en la biblioteca, pero las rutinas y el historial que ya lo tienen no se modifican.`
              : "Deja de aparecer en la biblioteca. El historial de entrenamiento no se toca."}
          </p>
          <div className="flex gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmando(false)}
            >
              Cancelar
            </Button>
            <BotonEnviar variant="destructive" size="sm">
              Sí, dar de baja
            </BotonEnviar>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setConfirmando(true)}
        >
          <Trash2 aria-hidden />
          Dar de baja
        </Button>
      )}
    </form>
  )
}

export { EjercicioDialog }
