// ============================================================================
// Tipos de lectura del lado del alumno.
//
// Separados de las queries por el mismo motivo que lib/data/tipos.ts: los
// componentes cliente los importan y no pueden tocar nada "server-only".
// ============================================================================

/**
 * Espacio de numeración reservado a cada aparición de un ejercicio dentro de un
 * día. Lo usan la query de "hoy" (para leer) y la action de guardado (para
 * escribir): si cambia, cambian los dos o lo leído deja de coincidir con lo
 * guardado. Ver `desplazamiento` más abajo.
 */
export const BLOQUE_DE_SERIES = 100;

/** Una serie ya cargada en la sesión. */
export type SerieCargada = {
  numeroSerie: number;
  peso: number | null;
  repeticiones: number | null;
  rpe: number | null;
  completado: boolean;
};

export type EjercicioDeHoy = {
  /** Id de la fila de `rutina_ejercicios`: identifica el ejercicio *del plan*. */
  rutinaEjercicioId: string;
  ejercicioId: string;
  nombre: string;
  grupo: string;
  series: number;
  repeticionesMin: number | null;
  repeticionesMax: number | null;
  pesoSugerido: number | null;
  descansoSegundos: number | null;
  notas: string | null;
  /** Ya formateados: "8-12", "80 kg", "2:30". */
  reps: string;
  peso: string;
  descanso: string;
  /**
   * Cuánto se le suma al número de serie antes de guardarlo: 0 para la primera
   * aparición del ejercicio en el día, 100 para la segunda, 200 para la tercera.
   *
   * `uq_registro_serie` es (sesión, ejercicio, número de serie), así que si el
   * profesor pone el mismo ejercicio dos veces en un día (dos bloques con
   * esquemas distintos), las dos vueltas chocarían en la serie 1. Separar los
   * bloques de a 100 lo resuelve sin tocar el modelo y deja lugar para las
   * series de más que el alumno agregue. En pantalla siempre se ven como 1..N.
   */
  desplazamiento: number;
  /** Lo que el alumno ya cargó de este ejercicio en la sesión de hoy. */
  cargadas: SerieCargada[];
  /** Todas las series confirmadas. */
  hecho: boolean;
};

export type DiaDeHoy = {
  id: string;
  numeroDia: number;
  nombre: string;
  notas: string | null;
};

export type PlanDeHoy = {
  asignacionId: string;
  rutina: string;
  /** Semana en curso del mesociclo y total, si la rutina las declara. */
  semana: number | null;
  semanas: number | null;
  /** Notas que el profesor dejó al asignar la rutina. */
  notasDelProfesor: string | null;
};

export type SesionEnCurso = {
  id: string;
  estado: "planificada" | "completada" | "omitida";
  duracionMinutos: number | null;
  rpeGeneral: number | null;
  notas: string | null;
};

export type DiaDeLaSemana = {
  clave: string;
  inicial: string;
  estado: "hecho" | "hoy" | "pendiente";
};

export type PantallaHoy = {
  nombre: string;
  racha: number;
  semana: DiaDeLaSemana[];
  /** null cuando el alumno todavía no tiene ninguna rutina activa. */
  plan: PlanDeHoy | null;
  dia: DiaDeHoy | null;
  ejercicios: EjercicioDeHoy[];
  /** La sesión de hoy, si ya se empezó. */
  sesion: SesionEnCurso | null;
  hechos: number;
  /** Minutos estimados: la suma de series por su descanso, más el trabajo. */
  estimadoMinutos: number | null;
};

/** Fila de la lista de historial. */
export type SesionDeHistorial = {
  id: string;
  clave: string;
  cuando: string;
  dia: string;
  estado: "planificada" | "completada" | "omitida";
  /** Toneladas levantadas, ya formateado. null si no cargó nada. */
  volumen: string | null;
  rpe: number | null;
  series: number;
};

export type RegistroDeSesion = {
  ejercicio: string;
  series: SerieCargada[];
  /** Volumen del ejercicio en kg. */
  volumen: number;
};

export type DetalleDeSesion = {
  id: string;
  clave: string;
  cuando: string;
  dia: string;
  rutina: string | null;
  estado: "planificada" | "completada" | "omitida";
  duracionMinutos: number | null;
  rpeGeneral: number | null;
  notas: string | null;
  ejercicios: RegistroDeSesion[];
  volumen: string | null;
};
