import { z } from "zod";

import { idSchema, textoOpcional, textoRequerido } from "@/lib/validaciones/comunes";

/**
 * Alta de un ejercicio de la biblioteca del gimnasio.
 *
 * `gimnasioId` y `creadoPor` no están en el schema a propósito: los pone la
 * action a partir del profesor logueado. Todo lo que sale de la sesión nunca
 * viaja en el formulario.
 */
export const crearEjercicioSchema = z.object({
  nombre: textoRequerido("el nombre del ejercicio", 120),
  grupoMuscular: textoRequerido("el grupo muscular", 60),
  grupoMuscularSecundario: textoOpcional("el grupo secundario", 60),
  equipamiento: textoOpcional("el equipamiento", 60),
  descripcion: textoOpcional("la descripción", 500),
});

export const editarEjercicioSchema = crearEjercicioSchema.extend({
  id: idSchema,
});

export const idEjercicioSchema = z.object({ id: idSchema });

export type CrearEjercicioInput = z.output<typeof crearEjercicioSchema>;
