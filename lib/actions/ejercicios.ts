"use server";

// ============================================================================
// Biblioteca de ejercicios.
//
// Los ejercicios del seed son públicos (`es_publico = true`, sin gimnasio) y no
// se editan desde la UI: son compartidos por todos los gimnasios. Lo que crea el
// profesor cuelga de su gimnasio y solo lo ve él. Esa frontera la impone
// `assertEjercicioEditable`, no el formulario.
// ============================================================================

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import {
  assertEjercicioEditable,
  requireProfesorConGimnasio,
} from "@/lib/auth/guards";
import { ejecutar, fallo, ok, validar } from "@/lib/actions/resultado";
import type { ResultadoAction } from "@/lib/actions/resultado";
import {
  crearEjercicioSchema,
  editarEjercicioSchema,
  idEjercicioSchema,
} from "@/lib/validaciones/ejercicios";

/** Pantallas que muestran ejercicios y hay que refrescar tras una mutación. */
function revalidarEjercicios() {
  revalidatePath("/ejercicios");
  // El constructor lista los ejercicios disponibles para agregar a un día.
  revalidatePath("/rutinas");
}

export async function crearEjercicio(
  _estado: unknown,
  formData: FormData,
): Promise<ResultadoAction<{ id: string }>> {
  return ejecutar(async () => {
    const profesor = await requireProfesorConGimnasio();

    const validacion = validar(crearEjercicioSchema, formData);
    if (!validacion.ok) return validacion.resultado;

    const datos = validacion.datos;

    // uq_ejercicio_nombre_gimnasio ya lo impide, pero el P2002 que devuelve
    // Postgres no dice qué campo chocó. Chequearlo acá permite marcar el input.
    const repetido = await prisma.ejercicio.findFirst({
      where: { gimnasioId: profesor.gimnasioId, nombre: datos.nombre },
      select: { id: true, activo: true },
    });

    if (repetido) {
      return fallo("Ya tenés un ejercicio con ese nombre.", {
        nombre: [
          repetido.activo
            ? "Ya existe un ejercicio con este nombre."
            : "Existe un ejercicio con este nombre, dado de baja.",
        ],
      });
    }

    const ejercicio = await prisma.ejercicio.create({
      data: {
        ...datos,
        gimnasioId: profesor.gimnasioId,
        creadoPor: profesor.id,
        esPublico: false,
      },
      select: { id: true },
    });

    revalidarEjercicios();

    return ok({ id: ejercicio.id }, "Ejercicio creado.");
  });
}

export async function editarEjercicio(
  _estado: unknown,
  formData: FormData,
): Promise<ResultadoAction<{ id: string }>> {
  return ejecutar(async () => {
    const validacion = validar(editarEjercicioSchema, formData);
    if (!validacion.ok) return validacion.resultado;

    const { id, ...datos } = validacion.datos;
    const { profesor } = await assertEjercicioEditable(id);

    const repetido = await prisma.ejercicio.findFirst({
      where: {
        gimnasioId: profesor.gimnasioId,
        nombre: datos.nombre,
        id: { not: id },
      },
      select: { id: true },
    });

    if (repetido) {
      return fallo("Ya tenés otro ejercicio con ese nombre.", {
        nombre: ["Ya existe un ejercicio con este nombre."],
      });
    }

    await prisma.ejercicio.update({
      where: { id },
      data: { ...datos, actualizadoEn: new Date() },
    });

    revalidarEjercicios();

    return ok({ id }, "Ejercicio actualizado.");
  });
}

/**
 * Baja lógica. No se borra la fila: `rutina_ejercicios`, `registros_ejercicio` y
 * `records_personales` la referencian, y un DELETE se llevaría puesto el
 * historial de entrenamiento de los alumnos.
 */
export async function desactivarEjercicio(
  _estado: unknown,
  formData: FormData,
): Promise<ResultadoAction<{ id: string }>> {
  return ejecutar(async () => {
    const validacion = validar(idEjercicioSchema, formData);
    if (!validacion.ok) return validacion.resultado;

    const { id } = validacion.datos;
    await assertEjercicioEditable(id);

    await prisma.ejercicio.update({
      where: { id },
      data: { activo: false, actualizadoEn: new Date() },
    });

    revalidarEjercicios();

    return ok({ id }, "Ejercicio dado de baja.");
  });
}
