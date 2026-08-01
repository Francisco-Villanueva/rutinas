import { z } from "zod";

import {
  enteroOpcional,
  idSchema,
  pesoOpcional,
  textoOpcional,
} from "@/lib/validaciones/comunes";

/** Arranque de la sesión del día contra un día concreto de la rutina. */
export const empezarSesionSchema = z.object({
  asignacionId: idSchema,
  rutinaDiaId: idSchema,
});

/**
 * Una serie tal como la carga el alumno.
 *
 * `numeroSerie` no viaja en el formulario: lo calcula la action a partir de la
 * posición de la fila y del desplazamiento del bloque. Es parte de una
 * constraint única y no tiene sentido dejarlo en manos del cliente.
 */
export const serieSchema = z.object({
  peso: pesoOpcional("el peso"),
  repeticiones: enteroOpcional("las repeticiones", 0, 200),
  completado: z.boolean(),
});

/**
 * Guardado de un ejercicio completo: todas sus series de una.
 *
 * Es una sola operación y no una por serie porque así lo plantea la pantalla del
 * kit (una vista por ejercicio con su botón "Guardar ejercicio"), y porque
 * escribir las series juntas en una transacción evita dejar un ejercicio a medio
 * cargar si se corta la conexión en el medio.
 */
export const guardarEjercicioSchema = z.object({
  sesionId: idSchema,
  rutinaEjercicioId: idSchema,
  /** El RPE es del ejercicio: se aplica a todas sus series. */
  rpe: enteroOpcional("el RPE", 1, 10),
  notas: textoOpcional("las notas", 300),
  series: z
    .array(serieSchema)
    .min(1, "Cargá al menos una serie.")
    .max(20, "No se pueden cargar más de 20 series por ejercicio."),
});

export const finalizarSesionSchema = z.object({
  id: idSchema,
  duracionMinutos: enteroOpcional("la duración", 1, 600),
  rpeGeneral: enteroOpcional("el RPE de la sesión", 1, 10),
  notas: textoOpcional("las notas", 500),
});

export const idSesionSchema = z.object({ id: idSchema });
