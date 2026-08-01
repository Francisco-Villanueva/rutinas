// ============================================================================
// ESTOS GUARDS SE LLAMAN AL INICIO DE CADA SERVER ACTION.
// No alcanza con llamarlos en el layout.
//
// Un layout protege la *navegación*, no la Server Action. Toda Server Action
// es un endpoint POST público: cualquiera con el action id puede invocarla
// directamente con curl, sin pasar nunca por el layout que la "protege".
// El layout de (profesor) no impide que un alumno ejecute una action de
// profesor; solo impide que vea la pantalla.
//
// Regla: si una Server Action lee o escribe datos de alguien, su primera línea
// es un require* o un assert* de este módulo. Sin excepciones.
//
// El proxy tampoco protege nada: ver proxy.ts.
// ============================================================================

import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/db";
import type { Usuario } from "@/generated/prisma/client";

/** Adónde mandar a cada rol después del login. */
export const RUTA_INICIAL = {
  profesor: "/dashboard",
  alumno: "/hoy",
  admin: "/dashboard",
} as const;

/**
 * Falla de autorización: hay sesión y hay fila en `usuarios`, pero ese usuario
 * no tiene permiso sobre este recurso. Se lanza (no se devuelve) para que sea
 * imposible ignorarla por accidente.
 */
export class ErrorDeAutorizacion extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorDeAutorizacion";
  }
}

/**
 * Resuelve el userId de Clerk a la fila de `usuarios` vía `clerk_user_id`.
 *
 * Devuelve `null` si no hay sesión o si no existe la fila (un usuario de Clerk
 * al que todavía nadie dio de alta en la base).
 *
 * Envuelto en `cache()` de React: se ejecuta una sola vez por request por más
 * que lo llamen diez guards distintos en el mismo árbol.
 *
 * Es el único punto del módulo que devuelve algo falsy. Para autorizar, usar
 * los require* / assert* de abajo.
 */
export const getUsuarioActual = cache(async (): Promise<Usuario | null> => {
  const { userId } = await auth();
  if (!userId) return null;

  return prisma.usuario.findUnique({
    where: { clerkUserId: userId },
  });
});

/**
 * Exige una sesión con fila en `usuarios` y la cuenta activa.
 * Nunca devuelve null: o devuelve el Usuario o redirige.
 */
export async function requireUsuario(): Promise<Usuario> {
  const usuario = await getUsuarioActual();

  // Sin sesión de Clerk: a login.
  if (!usuario) {
    const { userId } = await auth();
    // Hay sesión de Clerk pero no hay fila en `usuarios`: la cuenta existe del
    // lado del proveedor y nadie la dio de alta acá. Mandarlo a /sign-in haría
    // un loop infinito, porque ya está logueado.
    redirect(userId ? "/sin-acceso" : "/sign-in");
  }

  // Baja lógica: la fila existe pero el profesor desactivó al alumno.
  if (!usuario.activo) {
    redirect("/sin-acceso");
  }

  return usuario;
}

/** Exige rol profesor. Si el rol es otro, redirige a la home de *su* rol. */
export async function requireProfesor(): Promise<Usuario> {
  const usuario = await requireUsuario();

  if (usuario.rol !== "profesor") {
    redirect(RUTA_INICIAL[usuario.rol]);
  }

  return usuario;
}

/** Exige rol alumno. Si el rol es otro, redirige a la home de *su* rol. */
export async function requireAlumno(): Promise<Usuario> {
  const usuario = await requireUsuario();

  if (usuario.rol !== "alumno") {
    redirect(RUTA_INICIAL[usuario.rol]);
  }

  return usuario;
}

/**
 * Exige que el profesor actual tenga a `alumnoId` asignado mediante una fila
 * activa en `profesor_alumno`. Lanza `ErrorDeAutorizacion` si no.
 *
 * Devuelve el profesor para no tener que volver a pedirlo.
 *
 * A diferencia de los require*, esto lanza en vez de redirigir: se llama desde
 * Server Actions que mutan datos, donde un redirect silencioso escondería que
 * la operación no se hizo.
 */
export async function assertEsProfesorDe(alumnoId: string): Promise<Usuario> {
  const profesor = await requireProfesor();

  const vinculo = await prisma.profesorAlumno.findFirst({
    where: {
      profesorId: profesor.id,
      alumnoId,
      activo: true,
    },
    select: { id: true },
  });

  if (!vinculo) {
    throw new ErrorDeAutorizacion(
      `El profesor ${profesor.id} no tiene asignado al alumno ${alumnoId}.`,
    );
  }

  return profesor;
}

/**
 * Exige que el alumno actual sea `alumnoId`: impide que un alumno lea o escriba
 * datos de otro cambiando un id en el payload de la Server Action.
 * Lanza `ErrorDeAutorizacion` si no coincide.
 */
export async function assertEsPropioAlumno(alumnoId: string): Promise<Usuario> {
  const alumno = await requireAlumno();

  if (alumno.id !== alumnoId) {
    throw new ErrorDeAutorizacion(
      `El alumno ${alumno.id} intentó acceder a datos del alumno ${alumnoId}.`,
    );
  }

  return alumno;
}

// ============================================================================
// Guards de pertenencia para las mutaciones del profesor.
//
// Todos siguen la misma forma: el cliente manda un id, y acá se vuelve a leer
// la fila filtrando por el profesor logueado. Nunca se confía en que el id que
// llegó sea de quien lo mandó — validar el *formato* del id (zod) no dice nada
// sobre de quién es la fila.
//
// Devuelven el profesor más lo mínimo que la action necesita del recurso, para
// no repetir la query.
// ============================================================================

/** Exige que `rutinaId` sea una rutina activa del profesor logueado. */
export async function assertEsProfesorDeRutina(
  rutinaId: string,
): Promise<{ profesor: Usuario; rutinaId: string }> {
  const profesor = await requireProfesor();

  const rutina = await prisma.rutina.findFirst({
    where: { id: rutinaId, profesorId: profesor.id, activo: true },
    select: { id: true },
  });

  if (!rutina) {
    throw new ErrorDeAutorizacion(
      `La rutina ${rutinaId} no existe o no es del profesor ${profesor.id}.`,
    );
  }

  return { profesor, rutinaId: rutina.id };
}

/** Exige que `diaId` pertenezca a una rutina activa del profesor logueado. */
export async function assertEsProfesorDeDia(
  diaId: string,
): Promise<{ profesor: Usuario; diaId: string; rutinaId: string }> {
  const profesor = await requireProfesor();

  const dia = await prisma.rutinaDia.findFirst({
    where: { id: diaId, rutina: { profesorId: profesor.id, activo: true } },
    select: { id: true, rutinaId: true },
  });

  if (!dia) {
    throw new ErrorDeAutorizacion(
      `El día ${diaId} no existe o no es de una rutina del profesor ${profesor.id}.`,
    );
  }

  return { profesor, diaId: dia.id, rutinaId: dia.rutinaId };
}

/** Exige que `rutinaEjercicioId` cuelgue de una rutina activa del profesor. */
export async function assertEsProfesorDeRutinaEjercicio(
  rutinaEjercicioId: string,
): Promise<{
  profesor: Usuario;
  rutinaEjercicioId: string;
  rutinaDiaId: string;
  orden: number;
}> {
  const profesor = await requireProfesor();

  const fila = await prisma.rutinaEjercicio.findFirst({
    where: {
      id: rutinaEjercicioId,
      rutinaDia: { rutina: { profesorId: profesor.id, activo: true } },
    },
    select: { id: true, rutinaDiaId: true, orden: true },
  });

  if (!fila) {
    throw new ErrorDeAutorizacion(
      `El ejercicio de rutina ${rutinaEjercicioId} no es del profesor ${profesor.id}.`,
    );
  }

  return {
    profesor,
    rutinaEjercicioId: fila.id,
    rutinaDiaId: fila.rutinaDiaId,
    orden: fila.orden,
  };
}

/** Exige que `asignacionId` haya sido creada por el profesor logueado. */
export async function assertEsProfesorDeAsignacion(
  asignacionId: string,
): Promise<{ profesor: Usuario; asignacionId: string; alumnoId: string }> {
  const profesor = await requireProfesor();

  const asignacion = await prisma.asignacionRutina.findFirst({
    where: { id: asignacionId, profesorId: profesor.id },
    select: { id: true, alumnoId: true },
  });

  if (!asignacion) {
    throw new ErrorDeAutorizacion(
      `La asignación ${asignacionId} no existe o no es del profesor ${profesor.id}.`,
    );
  }

  return { profesor, asignacionId: asignacion.id, alumnoId: asignacion.alumnoId };
}

/**
 * Exige que el profesor pueda *editar* `ejercicioId`.
 *
 * Los ejercicios del seed son `es_publico = true` y no cuelgan de ningún
 * gimnasio: se ven desde toda la app pero no los edita nadie desde la UI, o el
 * primer profesor que renombre "Press banca" se lo cambia a todos los demás.
 * Editable = del gimnasio del profesor.
 */
export async function assertEjercicioEditable(
  ejercicioId: string,
): Promise<{ profesor: Usuario; ejercicioId: string }> {
  const profesor = await requireProfesor();

  const ejercicio = await prisma.ejercicio.findFirst({
    where: { id: ejercicioId, gimnasioId: profesor.gimnasioId, esPublico: false },
    select: { id: true },
  });

  if (!ejercicio) {
    throw new ErrorDeAutorizacion(
      `El ejercicio ${ejercicioId} no existe o no es editable por el profesor ${profesor.id}.`,
    );
  }

  return { profesor, ejercicioId: ejercicio.id };
}

/**
 * Exige que el profesor tenga gimnasio asignado. Todo lo que crea (ejercicios,
 * alumnos) cuelga del gimnasio, y `usuarios.gimnasio_id` es nullable: sin esto,
 * un profesor sin gimnasio crearía filas huérfanas que después no ve nadie.
 */
export async function requireProfesorConGimnasio(): Promise<
  Usuario & { gimnasioId: string }
> {
  const profesor = await requireProfesor();

  if (!profesor.gimnasioId) {
    throw new ErrorDeAutorizacion(
      `El profesor ${profesor.id} no tiene gimnasio asignado.`,
    );
  }

  return profesor as Usuario & { gimnasioId: string };
}
