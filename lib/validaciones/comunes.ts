// ============================================================================
// Piezas de validación compartidas por los schemas de las Server Actions.
//
// Los mensajes están en castellano y en segunda persona porque se muestran tal
// cual debajo del campo, sin traducción intermedia.
//
// Estos schemas asumen la normalización de `objetoDeFormData` (ver
// lib/actions/resultado.ts): los campos vienen trimeados y los vacíos llegan
// como `undefined`, no como "". Por eso `.optional()` alcanza para "no lo cargó"
// y no hace falta distinguir vacío de ausente.
//
// Todo lo opcional sale como `null`, nunca como `undefined`. Es la diferencia
// entre poder borrar un dato y no poder: Prisma interpreta `undefined` como "no
// toques esta columna", así que un campo vaciado en el formulario de edición se
// guardaría con el valor viejo. `null` lo borra, y en un alta es equivalente a
// no mandarlo porque todas estas columnas son nullable.
// ============================================================================

import { z } from "zod";

/** Cualquier id de la base: todas las PKs del modelo son UUID. */
export const idSchema = z.uuid("Identificador inválido.");

/** Campo de texto obligatorio, con el nombre del campo en el mensaje. */
export function textoRequerido(campo: string, max = 120) {
  return z
    .string(`Ingresá ${campo}.`)
    .min(1, `Ingresá ${campo}.`)
    .max(max, `${mayuscula(campo)} no puede superar los ${max} caracteres.`);
}

/** Campo de texto opcional: `null` cuando el profesor lo dejó vacío. */
export function textoOpcional(campo: string, max = 120) {
  return z
    .string()
    .max(max, `${mayuscula(campo)} no puede superar los ${max} caracteres.`)
    .optional()
    .transform((valor) => valor ?? null);
}

/** Entero opcional dentro de un rango, tolerando el string que manda el form. */
export function enteroOpcional(campo: string, min: number, max: number) {
  return z.coerce
    .number(`${mayuscula(campo)} tiene que ser un número.`)
    .int(`${mayuscula(campo)} tiene que ser un número entero.`)
    .min(min, `${mayuscula(campo)} no puede ser menor que ${min}.`)
    .max(max, `${mayuscula(campo)} no puede ser mayor que ${max}.`)
    .optional()
    .transform((valor) => valor ?? null);
}

/** Entero obligatorio dentro de un rango. */
export function enteroRequerido(campo: string, min: number, max: number) {
  return z.coerce
    .number(`Ingresá ${campo}.`)
    .int(`${mayuscula(campo)} tiene que ser un número entero.`)
    .min(min, `${mayuscula(campo)} no puede ser menor que ${min}.`)
    .max(max, `${mayuscula(campo)} no puede ser mayor que ${max}.`);
}

/**
 * Decimal opcional para las columnas DECIMAL(6,2) de peso. Se redondea a dos
 * decimales acá: Postgres lo haría igual al insertar, y así lo que se guarda es
 * lo mismo que se validó.
 */
export function pesoOpcional(campo = "el peso") {
  return z.coerce
    .number(`${mayuscula(campo)} tiene que ser un número.`)
    .min(0, `${mayuscula(campo)} no puede ser negativo.`)
    .max(9999.99, `${mayuscula(campo)} no puede superar los 9999,99 kg.`)
    .transform((valor) => Math.round(valor * 100) / 100)
    .optional()
    .transform((valor) => valor ?? null);
}

/**
 * Checkbox de HTML: manda "on" cuando está tildado y no manda nada cuando no.
 * `z.coerce.boolean()` no sirve — convierte el string "false" en `true`.
 */
export const booleanoDeForm = z
  .enum(["on", "true", "false"], "Valor inválido.")
  .optional()
  .transform((valor) => valor === "on" || valor === "true");

/**
 * Fecha en formato YYYY-MM-DD (lo que manda `<input type="date">`) convertida a
 * un Date a mediodía UTC.
 *
 * El mediodía no es capricho: las fechas del modelo son DATE y el driver manda
 * un timestamp. Con las 00:00 UTC, cualquier corrimiento negativo de zona deja
 * la fecha guardada un día antes de la que eligió el profesor.
 *
 * La validez se chequea comparando las partes y no con `isNaN`: `new Date` no
 * rechaza un 31 de febrero, lo corre al 3 de marzo. Verificado: sin esta
 * comparación, "1994-02-31" pasaba y se guardaba como otra fecha.
 */
export const fechaSchema = z
  .string("Ingresá una fecha.")
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha no tiene un formato válido.")
  .transform((texto) => {
    const [anio, mes, dia] = texto.split("-").map(Number);
    return { anio, mes, dia, fecha: new Date(Date.UTC(anio, mes - 1, dia, 12)) };
  })
  .refine(
    ({ anio, mes, dia, fecha }) =>
      fecha.getUTCFullYear() === anio &&
      fecha.getUTCMonth() === mes - 1 &&
      fecha.getUTCDate() === dia,
    "Esa fecha no existe.",
  )
  .transform(({ fecha }) => fecha);

/** Como `fechaSchema`, pero `null` cuando el campo quedó vacío. */
export const fechaOpcional = fechaSchema
  .optional()
  .transform((fecha) => fecha ?? null);

function mayuscula(campo: string) {
  // Los nombres de campo llegan como "el nombre" / "las series": para arrancar
  // una oración hay que subir la primera letra.
  return campo.charAt(0).toUpperCase() + campo.slice(1);
}
