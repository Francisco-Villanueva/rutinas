"use server";

// ============================================================================
// Alta y gestión de alumnos.
//
// El alumno no se registra solo: lo da de alta su profesor. Eso implica crear
// la cuenta de los dos lados —Clerk (identidad) y `usuarios` (rol, gimnasio,
// vínculo con el profesor)— dentro de la misma action, en vez de esperar un
// webhook `user.created`.
//
// El alumno entra con su email y el código que Clerk le manda por mail: la
// cuenta se crea sin contraseña. Si la instancia de Clerk tuviera la contraseña
// como única estrategia de ingreso, `createUser` va a rechazar el
// `skipPasswordRequirement` y el error se muestra en el formulario.
// ============================================================================

import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";

import { prisma } from "@/lib/db";
import {
  assertEsProfesorDe,
  requireProfesorConGimnasio,
} from "@/lib/auth/guards";
import { ejecutar, fallo, ok, validar } from "@/lib/actions/resultado";
import type { ResultadoAction } from "@/lib/actions/resultado";
import {
  cambiarEstadoAlumnoSchema,
  editarAlumnoSchema,
  invitarAlumnoSchema,
} from "@/lib/validaciones/alumnos";

function revalidarAlumnos() {
  revalidatePath("/alumnos");
  revalidatePath("/dashboard");
  revalidatePath("/asignaciones");
}

/**
 * Crea la cuenta del alumno en Clerk y su fila en `usuarios`, vinculada a este
 * profesor.
 *
 * Las dos escrituras no pueden ser una sola transacción: Clerk es un servicio
 * externo. Si la base falla después de que Clerk creó el usuario, se borra el
 * usuario de Clerk para no dejar una cuenta que puede loguearse y no tiene fila
 * en `usuarios` (esas terminan en /sin-acceso, sin forma de arreglarlo desde la
 * UI).
 */
export async function invitarAlumno(
  _estado: unknown,
  formData: FormData,
): Promise<ResultadoAction<{ id: string }>> {
  return ejecutar(async () => {
    const profesor = await requireProfesorConGimnasio();

    const validacion = validar(invitarAlumnoSchema, formData);
    if (!validacion.ok) return validacion.resultado;

    const { email, nombre, apellido, telefono, fechaNacimiento } = validacion.datos;

    const existente = await prisma.usuario.findUnique({
      where: { email },
      select: { id: true, rol: true },
    });

    if (existente) {
      return fallo("Ese email ya está en uso.", {
        email: [
          existente.rol === "alumno"
            ? "Ya hay un alumno con este email."
            : `Ese email ya pertenece a un usuario con rol ${existente.rol}.`,
        ],
      });
    }

    const clerk = await clerkClient();

    let clerkUserId: string;
    try {
      const usuarioDeClerk = await clerk.users.createUser({
        emailAddress: [email],
        firstName: nombre,
        // La API de Clerk no acepta null para "sin apellido", solo omitirlo.
        lastName: apellido ?? undefined,
        skipPasswordRequirement: true,
      });
      clerkUserId = usuarioDeClerk.id;
    } catch (error) {
      const detalle = mensajeDeClerk(error);
      console.error("[invitarAlumno] clerk:", error);
      return fallo(
        detalle
          ? `No se pudo crear la cuenta: ${detalle}`
          : "No se pudo crear la cuenta del alumno. Probá de nuevo en un rato.",
      );
    }

    try {
      const alumno = await prisma.usuario.create({
        data: {
          clerkUserId,
          email,
          nombre,
          apellido,
          telefono,
          fechaNacimiento,
          rol: "alumno",
          gimnasioId: profesor.gimnasioId,
          vinculosComoAlumno: { create: { profesorId: profesor.id } },
        },
        select: { id: true },
      });

      revalidarAlumnos();

      return ok(
        { id: alumno.id },
        `${nombre} ya puede entrar con ${email}.`,
      );
    } catch (error) {
      // Compensación: sin esto queda una cuenta de Clerk huérfana y el email
      // bloqueado para un segundo intento.
      await clerk.users
        .deleteUser(clerkUserId)
        .catch((fallaAlBorrar) =>
          console.error("[invitarAlumno] no se pudo revertir en Clerk:", fallaAlBorrar),
        );
      throw error;
    }
  });
}

export async function editarAlumno(
  _estado: unknown,
  formData: FormData,
): Promise<ResultadoAction<{ id: string }>> {
  return ejecutar(async () => {
    const validacion = validar(editarAlumnoSchema, formData);
    if (!validacion.ok) return validacion.resultado;

    const { id, ...datos } = validacion.datos;
    await assertEsProfesorDe(id);

    await prisma.usuario.update({
      where: { id },
      data: { ...datos, actualizadoEn: new Date() },
    });

    revalidarAlumnos();
    revalidatePath(`/alumnos/${id}`);

    return ok({ id }, "Datos del alumno actualizados.");
  });
}

/**
 * Da de baja o vuelve a habilitar al alumno.
 *
 * `usuarios.activo = false` le corta el acceso (ver requireUsuario) pero deja
 * intactos su historial y sus asignaciones: es la baja que necesita un gimnasio
 * cuando alguien deja de entrenar por un tiempo.
 */
export async function cambiarEstadoAlumno(
  _estado: unknown,
  formData: FormData,
): Promise<ResultadoAction<{ id: string }>> {
  return ejecutar(async () => {
    const validacion = validar(cambiarEstadoAlumnoSchema, formData);
    if (!validacion.ok) return validacion.resultado;

    const { id, activo } = validacion.datos;
    await assertEsProfesorDe(id);

    await prisma.usuario.update({
      where: { id },
      data: { activo, actualizadoEn: new Date() },
    });

    revalidarAlumnos();
    revalidatePath(`/alumnos/${id}`);

    return ok({ id }, activo ? "Alumno reactivado." : "Alumno dado de baja.");
  });
}

/**
 * Texto que devuelve la API de Clerk (viene en inglés).
 *
 * Se lee a mano en vez de importar `isClerkAPIResponseError`: ese helper vive en
 * el paquete de cliente de Clerk y no corresponde traerlo a un módulo que solo
 * corre en el servidor.
 */
function mensajeDeClerk(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("errors" in error)) return null;

  const errores = (error as { errors?: { longMessage?: string; message?: string }[] })
    .errors;
  const primero = errores?.[0];

  return primero?.longMessage ?? primero?.message ?? null;
}
