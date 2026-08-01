// ============================================================================
// Métricas derivadas del entrenamiento.
//
// Todo lo de acá se calcula al leer, sobre las filas crudas de
// `sesiones_entrenamiento` y `registros_ejercicio`. Nada se guarda: una métrica
// materializada hay que recalcularla cada vez que el alumno corrige una serie,
// y con los volúmenes de un gimnasio (cientos de filas por alumno) sumar al
// vuelo no se nota.
//
// Son funciones puras a propósito: se pueden probar sin base y las comparten el
// panel del profesor y el progreso del alumno, así los dos muestran el mismo
// número.
// ============================================================================

import { claveDeHoy, diasEntre, semanaDe, sumarDias } from "@/lib/fechas";
import { mejorRmEstimado } from "@/lib/entrenamiento/rm";

export type SesionParaMetricas = {
  clave: string;
  estado: "planificada" | "completada" | "omitida";
};

export type SerieParaMetricas = {
  clave: string;
  ejercicioId: string;
  ejercicio: string;
  peso: number | null;
  repeticiones: number | null;
  completado: boolean;
};

/** Días seguidos entrenando. Hoy sin entrenar todavía no corta la racha. */
export function calcularRacha(
  clavesEntrenadas: Iterable<string>,
  hoy = claveDeHoy(),
  limite = 365,
): number {
  const dias = new Set(clavesEntrenadas);
  if (dias.size === 0) return 0;

  let clave = dias.has(hoy) ? hoy : sumarDias(hoy, -1);
  let racha = 0;

  while (dias.has(clave) && racha < limite) {
    racha++;
    clave = sumarDias(clave, -1);
  }

  return racha;
}

/**
 * Adherencia: entrenamientos hechos sobre los que el plan pedía en el período
 * transcurrido.
 *
 * "Los que pedía" sale de `dias_por_semana` de la rutina, no de sesiones
 * planificadas: con la regla secuencial no hay un calendario contra el cual
 * comparar (ver lib/data/hoy.ts). Si la rutina no declara días por semana,
 * devuelve `null` en vez de inventar un denominador.
 *
 * El período se corta en la duración del mesociclo: pasadas las 8 semanas de un
 * plan de 8, el alumno no sigue "debiendo" entrenamientos todas las semanas.
 */
export function calcularAdherencia({
  completadas,
  inicio,
  diasPorSemana,
  duracionSemanas,
  hoy = claveDeHoy(),
}: {
  completadas: number;
  inicio: string;
  diasPorSemana: number | null;
  duracionSemanas: number | null;
  hoy?: string;
}): number | null {
  if (diasPorSemana == null || diasPorSemana <= 0) return null;

  const transcurridos = Math.max(0, diasEntre(inicio, hoy));
  const tope = duracionSemanas != null ? duracionSemanas * 7 : Infinity;
  const dias = Math.min(transcurridos, tope);

  // El primer día todavía no se le puede exigir nada.
  const esperadas = Math.floor(((dias + 1) / 7) * diasPorSemana);
  if (esperadas <= 0) return null;

  return Math.min(100, Math.round((completadas / esperadas) * 100));
}

/** "Hoy", "Ayer", "hace 3 días", "hace 2 semanas". null si nunca entrenó. */
export function ultimaSesionLegible(
  clave: string | null,
  hoy = claveDeHoy(),
): string | null {
  if (!clave) return null;

  const dias = diasEntre(clave, hoy);
  if (dias <= 0) return "Hoy";
  if (dias === 1) return "Ayer";
  if (dias < 14) return `hace ${dias} días`;

  const semanas = Math.floor(dias / 7);
  if (semanas < 9) return `hace ${semanas} semanas`;

  return `hace ${Math.floor(dias / 30)} meses`;
}

/** Días desde la última sesión completada. `null` si nunca entrenó. */
export function diasSinEntrenar(
  ultima: string | null,
  hoy = claveDeHoy(),
): number | null {
  return ultima ? Math.max(0, diasEntre(ultima, hoy)) : null;
}

export type Semana = { clave: string; etiqueta: string };

/**
 * Las últimas `cantidad` semanas, de la más vieja a la más nueva. La clave es
 * el lunes; la etiqueta, "S1".."Sn" como en el kit.
 */
export function ultimasSemanas(cantidad: number, hoy = claveDeHoy()): Semana[] {
  const lunesActual = semanaDe(hoy)[0];

  return Array.from({ length: cantidad }, (_, i) => ({
    clave: sumarDias(lunesActual, (i - (cantidad - 1)) * 7),
    etiqueta: `S${i + 1}`,
  }));
}

/** El lunes de la semana que contiene a `clave`. */
export function lunesDe(clave: string): string {
  return semanaDe(clave)[0];
}

/**
 * Volumen (peso × repeticiones) por semana, en toneladas y con un decimal.
 *
 * Solo las series confirmadas: el volumen es lo que se levantó, no lo que se
 * planificó.
 */
export function volumenPorSemana(
  series: SerieParaMetricas[],
  semanas: Semana[],
): { label: string; valor: number }[] {
  const porLunes = new Map<string, number>();

  for (const serie of series) {
    if (!serie.completado) continue;
    const kilos = (serie.peso ?? 0) * (serie.repeticiones ?? 0);
    if (kilos <= 0) continue;

    const lunes = lunesDe(serie.clave);
    porLunes.set(lunes, (porLunes.get(lunes) ?? 0) + kilos);
  }

  return semanas.map((semana) => ({
    label: semana.etiqueta,
    valor: Math.round(((porLunes.get(semana.clave) ?? 0) / 1000) * 10) / 10,
  }));
}

/** Volumen total en kilos de un conjunto de series confirmadas. */
export function volumenTotal(series: SerieParaMetricas[]): number {
  return series.reduce(
    (total, s) =>
      total + (s.completado ? (s.peso ?? 0) * (s.repeticiones ?? 0) : 0),
    0,
  );
}

/**
 * Mejor 1RM estimado por semana para un ejercicio.
 *
 * Las semanas sin datos se rellenan con el último valor conocido: una línea
 * cortada por una semana de descanso se lee como una caída de fuerza, que es
 * justo lo contrario de lo que pasó. Las semanas anteriores al primer dato
 * quedan fuera de la serie.
 */
export function serieDeFuerza(
  series: SerieParaMetricas[],
  ejercicioId: string,
  semanas: Semana[],
): number[] {
  const porLunes = new Map<string, number>();

  for (const serie of series) {
    if (!serie.completado || serie.ejercicioId !== ejercicioId) continue;

    const estimado = mejorRmEstimado([
      { peso: serie.peso, repeticiones: serie.repeticiones },
    ]);
    if (estimado == null) continue;

    const lunes = lunesDe(serie.clave);
    porLunes.set(lunes, Math.max(porLunes.get(lunes) ?? 0, estimado));
  }

  const valores: number[] = [];
  let ultimo: number | null = null;

  for (const semana of semanas) {
    const valor: number | null = porLunes.get(semana.clave) ?? ultimo;
    if (valor == null) continue; // todavía no hay ningún dato de este ejercicio
    valores.push(Math.round(valor));
    ultimo = valor;
  }

  return valores;
}

/** El ejercicio con más series confirmadas: el "principal" del alumno. */
export function ejercicioPrincipal(
  series: SerieParaMetricas[],
): { ejercicioId: string; nombre: string } | null {
  const conteo = new Map<string, { nombre: string; series: number }>();

  for (const serie of series) {
    if (!serie.completado) continue;
    const actual = conteo.get(serie.ejercicioId);
    if (actual) actual.series++;
    else conteo.set(serie.ejercicioId, { nombre: serie.ejercicio, series: 1 });
  }

  let mejor: { ejercicioId: string; nombre: string; series: number } | null = null;

  for (const [ejercicioId, datos] of conteo) {
    if (!mejor || datos.series > mejor.series) {
      mejor = { ejercicioId, nombre: datos.nombre, series: datos.series };
    }
  }

  return mejor ? { ejercicioId: mejor.ejercicioId, nombre: mejor.nombre } : null;
}

/** 8200 -> "8.2 t"; 620 -> "620 kg"; 0 -> null. */
export function formatoVolumen(kilos: number): string | null {
  if (kilos <= 0) return null;
  if (kilos < 1000) return `${Math.round(kilos)} kg`;
  return `${(kilos / 1000).toFixed(1)} t`;
}
