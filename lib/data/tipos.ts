// ============================================================================
// Tipos de lectura del lado del profesor.
//
// Viven separados de las queries porque los componentes cliente los importan y
// no pueden tocar nada marcado con "server-only".
//
// Convención: lo que no se puede calcular es `null`, y la UI lo muestra como
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
  /** 0-100. null si la rutina no declara días por semana: sin eso no hay
   * denominador contra el cual medir. */
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
  /** PRs conseguidos por sus alumnos desde el lunes. */
  prsSemana: number;
};

export type SesionHistorial = {
  id: string;
  fecha: string;
  nombre: string;
  volumen: string;
  rpe: number | null;
  pr: boolean;
};

/** Datos editables del alumno, tal como los precarga el formulario. */
export type DatosAlumno = {
  id: string;
  nombre: string;
  apellido: string | null;
  email: string;
  telefono: string | null;
  /** "YYYY-MM-DD" para el <input type="date">, o null. */
  fechaNacimiento: string | null;
  activo: boolean;
};

export type AlumnoDetalle = {
  alumno: AlumnoPanel;
  datos: DatosAlumno;
  /** 1RM por ejercicio + adherencia. Vacío hasta que consiga su primer PR. */
  marcas: { label: string; value: string; unit?: string; delta?: string }[];
  /**
   * Serie de 1RM estimado del ejercicio principal, para el gráfico de línea.
   * null con menos de dos semanas de datos: una línea de un punto no es una
   * evolución.
   */
  fuerza: { ejercicio: string; serie: number[]; unidad: string } | null;
  volumenSemanal: { label: string; valor: number }[];
  historial: SesionHistorial[];
};

export type EjercicioBiblioteca = {
  id: string;
  nombre: string;
  grupo: string;
  equipamiento: string | null;
  /** Grupo muscular secundario; el kit lo muestra como "patrón". */
  patron: string | null;
  descripcion: string | null;
  /** En cuántas rutinas se usa. */
  usos: number;
  tieneVideo: boolean;
  /**
   * Si este profesor lo puede editar. Los ejercicios del seed son públicos y
   * compartidos por todos los gimnasios: se usan, no se tocan.
   */
  editable: boolean;
};

/**
 * Una fila de la tabla del constructor.
 *
 * Lleva los valores crudos (para precargar el formulario de edición) y los
 * formateados (para la tabla). Formatear en la query y no en el componente evita
 * que cada pantalla invente su propio "8-12".
 */
export type EjercicioDeDia = {
  id: string;
  ejercicioId: string;
  nombre: string;
  series: number;
  repeticionesMin: number | null;
  repeticionesMax: number | null;
  pesoSugerido: number | null;
  descansoSegundos: number | null;
  notas: string | null;
  /** "8-12", "10" o "—". */
  reps: string;
  /** "80 kg" o "—". */
  peso: string;
  /** "2:30" o "—". */
  descanso: string;
  /** Siempre "—": el RPE se registra al entrenar, no se planifica. */
  rpe: string;
};

export type DiaRutina = {
  id: string;
  numeroDia: number;
  /** Etiqueta corta del tab: "Día 1". */
  dia: string;
  foco: string;
  notas: string | null;
  ejercicios: EjercicioDeDia[];
};

export type RutinaBuilder = {
  id: string;
  nombre: string;
  objetivo: string | null;
  descripcion: string | null;
  semanas: number | null;
  diasPorSemana: number | null;
  esPlantilla: boolean;
  dias: DiaRutina[];
  /** Otras rutinas del profesor marcadas como plantilla. */
  plantillas: { id: string; nombre: string }[];
};

/** Ítem del selector de rutinas del constructor. */
export type RutinaDeLista = {
  id: string;
  nombre: string;
  esPlantilla: boolean;
  dias: number;
};

/** Opción del selector de ejercicios, agrupada por grupo muscular. */
export type OpcionEjercicio = {
  id: string;
  nombre: string;
  grupo: string;
};

export type PantallaRutinas = {
  /** null cuando el profesor todavía no creó ninguna rutina. */
  rutina: RutinaBuilder | null;
  rutinas: RutinaDeLista[];
  ejercicios: OpcionEjercicio[];
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

export type EstadoAsignacion = "activa" | "completada" | "cancelada";

export type FilaAsignacion = {
  id: string;
  alumnoId: string;
  alumno: string;
  iniciales: string;
  estadoAlumno: EstadoAlumno;
  rutinaId: string;
  rutina: string;
  desde: string;
  semana: number | null;
  semanas: number | null;
  estado: EstadoAsignacion;
  /** Atajo de `estado !== "activa"` para la UI. */
  finalizada: boolean;
};

/** Opciones de los selectores del formulario de asignación. */
export type OpcionAlumno = { id: string; nombre: string };
export type OpcionRutina = { id: string; nombre: string; esPlantilla: boolean };

export type PantallaAsignaciones = {
  plantillas: PlantillaAsignable[];
  filas: FilaAsignacion[];
  /** Opciones del formulario de alta. */
  alumnos: OpcionAlumno[];
  rutinas: OpcionRutina[];
};
