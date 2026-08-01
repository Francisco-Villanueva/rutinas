// ============================================================================
// Tipos de lectura del lado del profesor.
//
// Viven separados de las queries porque los mocks de lib/mock/ también los usan
// y esos módulos no pueden importar nada marcado con "server-only".
//
// Convención: lo que todavía no tiene query es `null`, y la UI lo muestra como
// "—" o "Sin datos". No inventar números: un valor plausible pero falso en un
// panel de entrenador es peor que un guión.
// ============================================================================

export type EstadoAlumno = "activo" | "ausente";

export type TonoAlerta = "info" | "warning" | "destructive";

export type AlumnoPanel = {
  id: string;
  nombre: string;
  iniciales: string;
  objetivo: string | null;
  estado: EstadoAlumno;
  /** Texto listo para mostrar: "Hoy", "hace 3 días". null si nunca entrenó. */
  ultimaSesion: string | null;
  /** 0-100. null mientras no exista la query de adherencia. */
  adherencia: number | null;
  racha: number | null;
  alerta: { texto: string; tono: TonoAlerta } | null;
  /** Nombre de la rutina asignada. null si no tiene ninguna activa. */
  plan: string | null;
  semana: number | null;
  semanas: number | null;
};

export type TipoActividad = "pr" | "sesion" | "metrica";

export type EventoActividad = {
  id: string;
  alumno: string;
  tipo: TipoActividad;
  texto: string;
  detalle: string;
  cuando: string;
};

export type PanelProfesor = {
  alumnos: AlumnoPanel[];
  actividad: EventoActividad[];
  /** null mientras no exista la query sobre records_personales. */
  prsSemana: number | null;
  esDemo: boolean;
};

export type SesionHistorial = {
  id: string;
  fecha: string;
  nombre: string;
  volumen: string;
  rpe: number | null;
  pr: boolean;
};

export type AlumnoDetalle = {
  alumno: AlumnoPanel;
  /** 1RM por ejercicio + adherencia. Vacío mientras no exista la query. */
  marcas: { label: string; value: string; unit?: string; delta?: string }[];
  /** Serie de 1RM estimado del ejercicio principal, para el gráfico de línea. */
  fuerza: { ejercicio: string; serie: number[]; unidad: string } | null;
  volumenSemanal: { label: string; valor: number }[];
  historial: SesionHistorial[];
  esDemo: boolean;
};

export type EjercicioBiblioteca = {
  id: string;
  nombre: string;
  grupo: string;
  equipamiento: string | null;
  /** Grupo muscular secundario; el kit lo muestra como "patrón". */
  patron: string | null;
  /** En cuántas rutinas se usa. */
  usos: number;
  tieneVideo: boolean;
};

export type EjercicioDeDia = {
  id: string;
  nombre: string;
  series: number;
  reps: string;
  peso: string;
  descanso: string;
  rpe: string;
};

export type DiaRutina = {
  id: string;
  /** Etiqueta corta del tab: "Día 1", "Lun". */
  dia: string;
  foco: string;
  ejercicios: EjercicioDeDia[];
};

export type RutinaBuilder = {
  id: string;
  nombre: string;
  objetivo: string | null;
  semanas: number | null;
  dias: DiaRutina[];
  /** Otras rutinas del profesor marcadas como plantilla. */
  plantillas: { id: string; nombre: string }[];
  esDemo: boolean;
};

export type PlantillaAsignable = {
  id: string;
  nombre: string;
  objetivo: string | null;
  dias: number | null;
  semanas: number | null;
  /** Cuántas asignaciones activas tiene. */
  asignadas: number;
};

export type FilaAsignacion = {
  id: string;
  alumno: string;
  iniciales: string;
  estadoAlumno: EstadoAlumno;
  rutina: string;
  desde: string;
  semana: number | null;
  semanas: number | null;
  finalizada: boolean;
};

export type PantallaAsignaciones = {
  plantillas: PlantillaAsignable[];
  filas: FilaAsignacion[];
  esDemo: boolean;
};
