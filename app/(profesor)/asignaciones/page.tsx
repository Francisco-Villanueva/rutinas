import { ClipboardCheck, Plus } from "lucide-react";

import { getAsignaciones } from "@/lib/data/asignaciones";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SectionHead } from "@/components/coach/section-head";
import { AsignacionesPlantillas } from "@/components/coach/asignaciones-plantillas";
import { AvatarAlumno, BannerDemo, Celda, EmptyHint } from "@/components/coach/piezas";
import { cn } from "@/lib/utils";
import type { FilaAsignacion } from "@/lib/data/tipos";

const COLUMNAS = "grid-cols-[1.8fr_1.5fr_100px_1.2fr_110px]";

export default async function AsignacionesPage() {
  const { plantillas, filas, esDemo } = await getAsignaciones();
  const activas = filas.filter((f) => !f.finalizada).length;

  return (
    <div className="flex w-full max-w-app flex-col gap-4 p-4 lg:gap-6 lg:p-8">
      {esDemo ? (
        <BannerDemo>
          Todavía no hay rutinas asignadas. Esto es el dataset del UI kit.
        </BannerDemo>
      ) : null}

      <div className="grid items-start gap-5 lg:grid-cols-[300px_1fr] lg:gap-6">
        <AsignacionesPlantillas plantillas={plantillas} />

        <section>
          <SectionHead
            icon={<ClipboardCheck aria-hidden />}
            title="Asignaciones activas"
            count={activas}
            action={
              <Button
                size="sm"
                variant="outline"
                className="shrink-0"
                disabled
                title="Próximamente"
              >
                <Plus aria-hidden />
                <span className="hidden sm:inline">Nueva asignación</span>
                <span className="sm:hidden">Nueva</span>
              </Button>
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
                </div>
                {filas.map((f, i) => (
                  <FilaAsignacionItem
                    key={f.id}
                    fila={f}
                    ultima={i === filas.length - 1}
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
}: {
  fila: FilaAsignacion;
  ultima: boolean;
}) {
  const progreso =
    fila.semana != null && fila.semanas ? Math.round((fila.semana / fila.semanas) * 100) : 0;
  const mesociclo =
    fila.semana != null && fila.semanas != null ? `${fila.semana}/${fila.semanas}` : "—";
  const estado = fila.finalizada ? (
    <Badge size="sm">Finalizada</Badge>
  ) : (
    <Badge variant="success" size="sm">
      Activa
    </Badge>
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
      </div>
    </div>
  );
}
