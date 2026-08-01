// ============================================================================
// Fechas del gimnasio.
//
// Las sesiones de entrenamiento se guardan como DATE: una sesión es "el
// martes", no "el martes a las 3 UTC". Eso obliga a definir qué día es "hoy",
// y la respuesta no es la del servidor: en Vercel corre en UTC, así que un
// entrenamiento cargado a las 21:30 de Buenos Aires ya es el día siguiente en
// UTC y "hoy te toca" mostraría el día equivocado.
//
// Todo el día que se guarda se construye a mediodía UTC. Deja 12 horas de
// colchón para cualquier corrimiento de zona al leer, y es la misma convención
// que usa `fechaSchema` en lib/validaciones/comunes.ts.
//
// Mientras haya un solo gimnasio hardcodeado, la zona es una constante. Cuando
// exista multi-gimnasio, sale de la fila de `gimnasios`.
// ============================================================================

export const ZONA_GIMNASIO = "America/Argentina/Buenos_Aires";

const FORMATO_CLAVE = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA_GIMNASIO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** "YYYY-MM-DD" del día en curso en la zona del gimnasio. */
export function claveDeHoy(): string {
  // en-CA formatea justo como YYYY-MM-DD.
  return FORMATO_CLAVE.format(new Date());
}

/** "YYYY-MM-DD" de un DATE ya leído de la base (viene a medianoche UTC). */
export function claveDeFecha(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" -> Date a mediodía UTC, listo para guardar en una columna DATE. */
export function fechaDesdeClave(clave: string): Date {
  return new Date(`${clave}T12:00:00.000Z`);
}

/** El día de hoy en la zona del gimnasio, listo para guardar. */
export function hoyEnGimnasio(): Date {
  return fechaDesdeClave(claveDeHoy());
}

/**
 * Rango [desde, hasta) que cubre un día, para filtrar una columna DATE.
 *
 * Se usa un rango y no una igualdad a propósito: al leer, un DATE vuelve como
 * medianoche UTC, pero lo que se guarda se construye a mediodía. Un `equals`
 * queda a merced de cómo serialice el driver; el rango matchea siempre.
 */
export function rangoDelDia(clave: string): { gte: Date; lt: Date } {
  return {
    gte: new Date(`${clave}T00:00:00.000Z`),
    lt: new Date(`${sumarDias(clave, 1)}T00:00:00.000Z`),
  };
}

/** Suma días a una clave sin pasar por el huso horario local. */
export function sumarDias(clave: string, dias: number): string {
  const fecha = fechaDesdeClave(clave);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return claveDeFecha(fecha);
}

/**
 * Las siete claves de la semana que contiene a `clave`, de lunes a domingo.
 * La semana arranca el lunes: es como lee un plan de entrenamiento cualquiera.
 */
export function semanaDe(clave: string): string[] {
  const fecha = fechaDesdeClave(clave);
  // getUTCDay: 0 = domingo. Al lunes le corresponde 0 de offset.
  const offsetAlLunes = (fecha.getUTCDay() + 6) % 7;
  const lunes = sumarDias(clave, -offsetAlLunes);

  return Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
}

/** Diferencia en días entre dos claves (b - a). */
export function diasEntre(a: string, b: string): number {
  const MS_POR_DIA = 24 * 60 * 60 * 1000;
  return Math.round(
    (fechaDesdeClave(b).getTime() - fechaDesdeClave(a).getTime()) / MS_POR_DIA,
  );
}

const FORMATO_DIA_CORTO = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  timeZone: "UTC", // la clave ya está en la zona del gimnasio
});

const FORMATO_FECHA_MEDIA = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

/** "L", "M", "X"… la inicial del día para la tira de la semana. */
export function inicialDelDia(clave: string): string {
  const dia = FORMATO_DIA_CORTO.format(fechaDesdeClave(clave));
  return dia.charAt(0).toUpperCase();
}

/** "Lun 21 jul", para listas de historial. */
export function fechaLegible(clave: string): string {
  const texto = FORMATO_FECHA_MEDIA.format(fechaDesdeClave(clave));
  return texto.charAt(0).toUpperCase() + texto.slice(1).replace(",", "");
}

/** "Hoy", "Ayer" o la fecha legible. */
export function cuandoLegible(clave: string, hoy = claveDeHoy()): string {
  const diferencia = diasEntre(clave, hoy);
  if (diferencia === 0) return "Hoy";
  if (diferencia === 1) return "Ayer";
  return fechaLegible(clave);
}
