// ============================================================================
// Contrato único de todas las Server Actions del panel.
//
// Una action nunca lanza al cliente: devuelve un ResultadoAction. El motivo es
// que el error de una action se muestra dentro del formulario que la disparó
// (con useActionState), no en el error boundary de la ruta. Una excepción que
// escapa tira abajo la pantalla entera y el profesor pierde lo que estaba
// cargando.
//
// Las únicas excepciones que SÍ tienen que escapar son las de control de flujo
// de Next (redirect / notFound): las relanza `unstable_rethrow`.
// ============================================================================

import "server-only";

import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { ErrorDeAutorizacion } from "@/lib/auth/guards";

/** Errores por campo, con la forma que devuelve `z.flattenError`. */
export type ErroresDeCampo = Record<string, string[] | undefined>;

export type ResultadoAction<T = undefined> =
  | { ok: true; datos: T; mensaje?: string }
  | { ok: false; mensaje: string; errores?: ErroresDeCampo };

/**
 * Estado inicial de un `useActionState`. No es ok ni error: es "todavía no se
 * envió nada", así que el formulario arranca sin mensajes.
 */
export type EstadoForm<T = undefined> = ResultadoAction<T> | null;

export function ok<T = undefined>(datos: T, mensaje?: string): ResultadoAction<T> {
  return { ok: true, datos, mensaje };
}

export function fallo(mensaje: string, errores?: ErroresDeCampo): ResultadoAction<never> {
  return { ok: false, mensaje, errores };
}

/**
 * FormData -> objeto plano, listo para `safeParse`.
 *
 * Los campos vacíos se pasan como `undefined` en vez de `""`: en el modelo casi
 * todo lo opcional es NULL, y `""` no es NULL. Los checkbox de HTML no mandan
 * nada cuando están destildados, así que el schema los tiene que leer con
 * default (ver `booleanoDeForm` en lib/validaciones/comunes.ts).
 *
 * Los `File` se descartan: en la v1 no hay uploads (fotos de progreso y videos
 * quedaron fuera) y dejarlos pasar solo confunde a los schemas.
 */
export function objetoDeFormData(formData: FormData): Record<string, unknown> {
  const objeto: Record<string, unknown> = {};

  for (const [clave, valor] of formData.entries()) {
    // React agrega campos $ACTION_* al FormData de una Server Action.
    if (clave.startsWith("$ACTION")) continue;
    if (typeof valor !== "string") continue;

    const limpio = valor.trim();
    objeto[clave] = limpio === "" ? undefined : limpio;
  }

  return objeto;
}

/** Valida el FormData contra el schema y devuelve los errores ya aplanados. */
export function validar<S extends z.ZodType>(
  schema: S,
  formData: FormData,
): { ok: true; datos: z.output<S> } | { ok: false; resultado: ResultadoAction<never> } {
  return validarObjeto(schema, objetoDeFormData(formData));
}

/**
 * Igual que `validar`, pero sobre un objeto ya armado.
 *
 * Lo necesitan los formularios con listas —la carga de un ejercicio manda N
 * series—, porque `objetoDeFormData` aplana el FormData a un objeto plano y se
 * queda con el último valor de cada nombre repetido.
 */
export function validarObjeto<S extends z.ZodType>(
  schema: S,
  objeto: unknown,
): { ok: true; datos: z.output<S> } | { ok: false; resultado: ResultadoAction<never> } {
  const parseado = schema.safeParse(objeto);

  if (!parseado.success) {
    const { fieldErrors, formErrors } = z.flattenError(parseado.error);
    return {
      ok: false,
      resultado: fallo(
        formErrors[0] ?? "Revisá los datos del formulario.",
        fieldErrors as ErroresDeCampo,
      ),
    };
  }

  return { ok: true, datos: parseado.data };
}

/**
 * Envuelve el cuerpo de una Server Action y traduce a ResultadoAction todo lo
 * que se pueda escapar: guards que lanzan, violaciones de constraint de la base
 * y cualquier error inesperado.
 *
 * El error crudo se loguea del lado del servidor y al cliente le llega un texto
 * en castellano. Un mensaje de Prisma en pantalla no le dice nada al profesor y
 * filtra la forma del schema.
 */
export async function ejecutar<T>(
  cuerpo: () => Promise<ResultadoAction<T>>,
): Promise<ResultadoAction<T>> {
  try {
    return await cuerpo();
  } catch (error) {
    // redirect() / notFound() de los guards: tienen que seguir de largo.
    unstable_rethrow(error);

    if (error instanceof ErrorDeAutorizacion) {
      console.error("[action] autorización:", error.message);
      return fallo("No tenés permiso para hacer esto.");
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(`[action] prisma ${error.code}:`, error.message);
      return fallo(MENSAJE_PRISMA[error.code] ?? "No se pudo guardar el cambio.");
    }

    console.error("[action] error inesperado:", error);
    return fallo("Algo falló al guardar. Probá de nuevo.");
  }
}

const MENSAJE_PRISMA: Record<string, string> = {
  // Unique violation. El texto es genérico porque el mismo código cubre el
  // nombre repetido de un ejercicio y el día repetido de una rutina; cuando el
  // caso importa, la action lo chequea antes y devuelve su propio mensaje.
  P2002: "Ya existe un registro con esos datos.",
  // FK rota: el id vino del cliente y apunta a algo que no está.
  P2003: "El dato relacionado no existe o fue eliminado.",
  // Update/delete sobre una fila que no está.
  P2025: "El registro ya no existe. Actualizá la pantalla.",
};
