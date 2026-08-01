import { z } from "zod";

import {
  booleanoDeForm,
  enteroOpcional,
  enteroRequerido,
  idSchema,
  pesoOpcional,
  textoOpcional,
  textoRequerido,
} from "@/lib/validaciones/comunes";

// ----------------------------------------------------------------------------
// Rutina
// ----------------------------------------------------------------------------

export const crearRutinaSchema = z.object({
  nombre: textoRequerido("el nombre de la rutina", 120),
  objetivo: textoOpcional("el objetivo", 60),
  descripcion: textoOpcional("la descripción", 500),
  duracionSemanas: enteroOpcional("la duración en semanas", 1, 52),
  diasPorSemana: enteroOpcional("los días por semana", 1, 7),
  esPlantilla: booleanoDeForm,
});

export const editarRutinaSchema = crearRutinaSchema.extend({ id: idSchema });

export const idRutinaSchema = z.object({ id: idSchema });

// ----------------------------------------------------------------------------
// Días de la rutina
//
// `numeroDia` no viaja en el formulario: lo calcula la action como el siguiente
// de la rutina. Es parte de una constraint única (uq_rutina_dia) y dejarlo en
// manos del cliente solo abre la puerta a colisiones.
// ----------------------------------------------------------------------------

export const crearDiaSchema = z.object({
  rutinaId: idSchema,
  nombre: textoRequerido("el nombre del día", 80),
  notas: textoOpcional("las notas", 500),
});

export const editarDiaSchema = z.object({
  id: idSchema,
  nombre: textoRequerido("el nombre del día", 80),
  notas: textoOpcional("las notas", 500),
});

export const idDiaSchema = z.object({ id: idSchema });

// ----------------------------------------------------------------------------
// Ejercicios dentro de un día
// ----------------------------------------------------------------------------

/**
 * Campos comunes al alta y a la edición de una fila del día.
 *
 * El rango de repeticiones se valida cruzado (máximo >= mínimo) más abajo: por
 * separado los dos campos son válidos y aún así el rango puede estar al revés.
 */
const camposEjercicioDeDia = {
  ejercicioId: idSchema,
  series: enteroRequerido("la cantidad de series", 1, 20),
  repeticionesMin: enteroOpcional("las repeticiones mínimas", 1, 200),
  repeticionesMax: enteroOpcional("las repeticiones máximas", 1, 200),
  pesoSugerido: pesoOpcional("el peso sugerido"),
  descansoSegundos: enteroOpcional("el descanso", 0, 3600),
  notas: textoOpcional("las notas", 300),
};

const rangoDeRepeticiones = <T extends z.ZodType<{
  repeticionesMin: number | null;
  repeticionesMax: number | null;
}>>(
  schema: T,
) =>
  schema.refine(
    (datos) =>
      datos.repeticionesMin == null ||
      datos.repeticionesMax == null ||
      datos.repeticionesMax >= datos.repeticionesMin,
    {
      error: "El máximo de repeticiones no puede ser menor que el mínimo.",
      path: ["repeticionesMax"],
    },
  );

export const agregarEjercicioSchema = rangoDeRepeticiones(
  z.object({ rutinaDiaId: idSchema, ...camposEjercicioDeDia }),
);

export const editarEjercicioDeDiaSchema = rangoDeRepeticiones(
  z.object({ id: idSchema, ...camposEjercicioDeDia }),
);

export const idEjercicioDeDiaSchema = z.object({ id: idSchema });

/** Reordenamiento de a un paso: el constructor tiene botones, no drag & drop. */
export const moverEjercicioSchema = z.object({
  id: idSchema,
  direccion: z.enum(["arriba", "abajo"], "Dirección inválida."),
});
