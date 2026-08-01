import { CheckCircle2, ClipboardCheck, Plus, RotateCcw, Trash2, XCircle } from "lucide-react";

import { getAsignaciones } from "@/lib/data/asignaciones";
import {
  cambiarEstadoAsignacion,
  eliminarAsignacion,
} from "@/lib/actions/asignaciones";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SectionHead } from "@/components/coach/section-head";
import { AsignacionesPlantillas } from "@/components/coach/asignaciones-plantillas";
import { AsignacionDialog } from "@/components/coach/asignacion-dialog";
import { AccionSimple } from "@/components/coach/avisos";
import { AvatarAlumno, BannerDemo, Celda, EmptyHint } from "@/components/coach/piezas";
import { cn } from "@/lib/utils";
import type { FilaAsignacion } from "@/lib/data/tipos";

const COLUMNAS = "grid-cols-[1.6fr_1.4fr_90px_1.1fr_100px_128px]";

export default async function AsignacionesPage({
  searchParams,
}: {
  // Preselección al llegar desde el detalle de un alumno o desde el constructor.
  searchParams: Promise<{ alumno?: string; rutina?: string }>;
}) {
  const [{ alumno: alumnoId, rutina: rutinaId }, datos] = await Promise.all([
    searchParams,
    getAsignaciones(),
  ]);

  const { plantillas, filas, alumnos, rutinas, esDemo } = datos;
  const activas = filas.filter((f) => !f.finalizada).length;

  // Sin alumnos o sin rutinas no hay nada que asignar: el formulario quedaría
  // con un select vacío.
  const sePuedeAsignar = alumnos.length > 0 && rutinas.length > 0;

  return (
    <div className="flex w-full max-w-app flex-col gap-4 p-4 lg:gap-6 lg:p-8">
      {esDemo ? (
        <BannerDemo>
          Todavía no hay rutinas asignadas. Esto es el dataset del UI kit: se ve,
          no se edita.
        </BannerDemo>
      ) : null}

      <div className="grid items-start gap-5 lg:grid-cols-[300px_1fr] lg:gap-6">
        <AsignacionesPlantillas
          plantillas={plantillas}
          alumnos={alumnos}
          rutinas={rutinas}
          alumnoPorDefecto={alumnoId}
          asignable={sePuedeAsignar && !esDemo}
        />

        <section>
          <SectionHead
            icon={<ClipboardCheck aria-hidden />}
            title="Asignaciones activas"
            count={activas}
            action={
              <AsignacionDialog
                alumnos={alumnos}
                rutinas={rutinas}
                alumnoPorDefecto={alumnoId}
                rutinaPorDefecto={rutinaId}
              >
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  disabled={!sePuedeAsignar}
                  title={
                    sePuedeAsignar
                      ? undefined
                      : "Necesitás al menos un alumno y una rutina"
                  }
                >
                  <Plus aria-hidden />
                  <span className="hidden sm:inline">Nueva asignación</span>
                  <span className="sm:hidden">Nueva</span>
                </Button>
              </AsignacionDialog>
            }
          />
          <Card className="gap-0 py-0">
            {filas.length === 0 ? (
              <EmptyHint icon={<ClipboardCheck aria-hidden />}>
                Todavía no asignaste ninguna rutina.
              </EmptyHint>
            ) : (
              <>
                <div
                  className={cn(
                    "hidden border-b border-border px-5 py-3 text-2xs font-semibold tracking-caps text-muted-foreground uppercase lg:grid",
                    COLUMNAS
                  )}
                >
                  <span>Alumno</span>
                  <span>Rutina</span>
                  <span>Desde</span>
                  <span>Progreso</span>
                  <span>Estado</span>
                  <span className="text-right">Acciones</span>
                </div>
                {filas.map((f, i) => (
                  <FilaAsignacionItem
                    key={f.id}
                    fila={f}
                    ultima={i === filas.length - 1}
                    editable={!esDemo}
                  />
                ))}
              </>
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}

function FilaAsignacionItem({
  fila,
  ultima,
  editable,
}: {
  fila: FilaAsignacion;
  ultima: boolean;
  editable: boolean;
}) {
  const progreso =
    fila.semana != null && fila.semanas ? Math.round((fila.semana / fila.semanas) * 100) : 0;
  const mesociclo =
    fila.semana != null && fila.semanas != null ? `${fila.semana}/${fila.semanas}` : "—";
  const estado = <EstadoAsignacionBadge fila={fila} />;

  const acciones = (
    <div className="flex shrink-0 items-center justify-end gap-0.5">
      {fila.estado === "activa" ? (
        <>
          <AccionSimple
            action={cambiarEstadoAsignacion}
            campos={{ id: fila.id, estado: "completada" }}
            variant="ghost"
            size="icon-sm"
            aria-label={`Finalizar la rutina de ${fila.alumno}`}
            title="Finalizar"
            disabled={!editable}
          >
            <CheckCircle2 aria-hidden />
          </AccionSimple>
          <AccionSimple
            action={cambiarEstadoAsignacion}
            campos={{ id: fila.id, estado: "cancelada" }}
            confirmar={`¿Cancelar la rutina de ${fila.alumno}? Queda en el historial como cancelada.`}
            variant="ghost"
            size="icon-sm"
            aria-label={`Cancelar la rutina de ${fila.alumno}`}
            title="Cancelar"
            disabled={!editable}
          >
            <XCircle aria-hidden />
          </AccionSimple>
        </>
      ) : (
        <AccionSimple
          action={cambiarEstadoAsignacion}
          campos={{ id: fila.id, estado: "activa" }}
          variant="ghost"
          size="icon-sm"
          aria-label={`Reactivar la rutina de ${fila.alumno}`}
          title="Reactivar"
          disabled={!editable}
        >
          <RotateCcw aria-hidden />
        </AccionSimple>
      )}
      <AccionSimple
        action={eliminarAsignacion}
        campos={{ id: fila.id }}
        confirmar={`¿Eliminar la asignación de ${fila.alumno}? Solo se puede si todavía no registró sesiones.`}
        variant="ghost"
        size="icon-sm"
        aria-label={`Eliminar la asignación de ${fila.alumno}`}
        title="Eliminar"
        disabled={!editable}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 aria-hidden />
      </AccionSimple>
    </div>
  );

  return (
    <div
      className={cn(
        !ultima && "border-b border-border",
        fila.finalizada && "opacity-60"
      )}
    >
      {/* Desktop */}
      <div className={cn("hidden items-center px-5 py-3.5 lg:grid", COLUMNAS)}>
        <div className="flex min-w-0 items-center gap-2.5">
          <AvatarAlumno iniciales={fila.iniciales} estado={fila.estadoAlumno} />
          <span className="truncate text-sm font-semibold text-foreground">
            {fila.alumno}
          </span>
        </div>
        <span className="truncate text-sm text-body">{fila.rutina}</span>
        <Celda className="text-muted-foreground">{fila.desde}</Celda>
        <div className="flex items-center gap-2.5 pr-4">
          <Progress size="sm" value={progreso} className="flex-1" />
          <Celda className="text-xs whitespace-nowrap">{mesociclo}</Celda>
        </div>
        <span>{estado}</span>
        {acciones}
      </div>

      {/* Mobile */}
      <div className="px-4 py-3.5 lg:hidden">
        <div className="flex items-center gap-2.5">
          <AvatarAlumno iniciales={fila.iniciales} estado={fila.estadoAlumno} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-foreground">
              {fila.alumno}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {fila.rutina} · desde {fila.desde}
            </div>
          </div>
          {estado}
        </div>
        <div className="mt-2.5 flex items-center gap-2.5">
          <Progress size="sm" value={progreso} className="flex-1" />
          <Celda className="text-xs whitespace-nowrap">Sem {mesociclo}</Celda>
        </div>
        <div className="mt-1.5 flex justify-end">{acciones}</div>
      </div>
    </div>
  );
}

function EstadoAsignacionBadge({ fila }: { fila: FilaAsignacion }) {
  if (fila.estado === "activa") {
    return (
      <Badge variant="success" size="sm">
        Activa
      </Badge>
    );
  }

  return (
    <Badge variant={fila.estado === "cancelada" ? "warning" : "neutral"} size="sm">
      {fila.estado === "cancelada" ? "Cancelada" : "Finalizada"}
    </Badge>
  );
}
