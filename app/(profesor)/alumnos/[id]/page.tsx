import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  Flame,
  History,
  MessageSquare,
  Trophy,
} from "lucide-react";

import { getAlumnoDetalle } from "@/lib/data/alumnos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Stat } from "@/components/stat";
import { Tag } from "@/components/tag";
import { BarChart, LineChart } from "@/components/coach/charts";
import { SectionHead } from "@/components/coach/section-head";
import {
  AvatarAlumno,
  BannerDemo,
  Celda,
  EmptyHint,
  Eyebrow,
} from "@/components/coach/piezas";
import { cn } from "@/lib/utils";

export default async function AlumnoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detalle = await getAlumnoDetalle(id);

  // null tanto si el alumno no existe como si existe pero no es de este
  // profesor: no distinguir los dos casos evita filtrar qué ids existen.
  if (!detalle) notFound();

  const { alumno, marcas, fuerza, volumenSemanal, historial, esDemo } = detalle;
  const etiquetas = [
    alumno.objetivo,
    alumno.plan,
    alumno.semana != null && alumno.semanas != null
      ? `Mesociclo ${alumno.semana}/${alumno.semanas}`
      : null,
  ].filter((v): v is string => v != null);

  return (
    <div className="flex w-full max-w-app flex-col gap-5 p-4 lg:gap-6 lg:p-8">
      {esDemo ? (
        <BannerDemo>
          Este alumno es del dataset del UI kit. Sus marcas, gráficos e historial
          son de ejemplo.
        </BannerDemo>
      ) : null}

      <Link
        href="/alumnos"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Volver
      </Link>

      {/* Cabecera */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-5">
        <div className="flex flex-1 items-center gap-3.5">
          <AvatarAlumno
            iniciales={alumno.iniciales}
            estado={alumno.estado}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-heading text-2xl leading-tight font-bold tracking-display text-foreground lg:text-3xl">
                {alumno.nombre}
              </h2>
              {alumno.racha != null && alumno.racha > 0 ? (
                <Badge variant="pr">
                  <Flame aria-hidden />
                  {alumno.racha} días
                </Badge>
              ) : null}
            </div>
            {etiquetas.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {etiquetas.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Sin rutina asignada.
              </p>
            )}
          </div>
        </div>

        {/* Ambas acciones esperan su Server Action. */}
        <div className="flex gap-2.5">
          <Button variant="outline" className="flex-1 lg:flex-none" disabled>
            <MessageSquare aria-hidden />
            Mensaje
          </Button>
          <Button className="flex-1 lg:flex-none" disabled>
            <ClipboardList aria-hidden />
            <span className="hidden sm:inline">Asignar rutina</span>
            <span className="sm:hidden">Rutina</span>
          </Button>
        </div>
      </div>

      {/* Marcas */}
      {marcas.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-4">
          {marcas.map((m) => (
            <Card key={m.label} size="sm">
              <CardContent>
                <Stat size="sm" {...m} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyHint icon={<Trophy aria-hidden />}>
            Todavía no hay récords personales cargados para este alumno.
          </EmptyHint>
        </Card>
      )}

      {/* Gráficos */}
      {fuerza || volumenSemanal.length > 0 ? (
        <div className="grid gap-3.5 lg:grid-cols-[1.6fr_1fr] lg:gap-4">
          {fuerza ? (
            <Card size="lg">
              <CardContent className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Eyebrow>Evolución de fuerza · {fuerza.ejercicio}</Eyebrow>
                  <div className="mt-1 flex flex-wrap items-baseline gap-2">
                    <span className="font-heading text-3xl leading-tight font-bold tracking-display text-foreground tabular-nums">
                      {fuerza.serie[fuerza.serie.length - 1]}
                      <span className="ml-1 font-mono text-md font-medium text-muted-foreground">
                        {fuerza.unidad}
                      </span>
                    </span>
                    <Badge variant="success" size="sm">
                      +{fuerza.serie[fuerza.serie.length - 1] - fuerza.serie[0]} kg
                      {" / "}
                      {fuerza.serie.length} sem
                    </Badge>
                  </div>
                </div>
                <Badge variant="pr">
                  <Trophy aria-hidden />
                  Nuevo PR
                </Badge>
              </CardContent>
              <CardContent>
                <LineChart
                  data={fuerza.serie}
                  label={`Evolución del 1RM estimado de ${fuerza.ejercicio}`}
                />
              </CardContent>
            </Card>
          ) : null}

          {volumenSemanal.length > 0 ? (
            <Card size="lg">
              <CardContent>
                <Eyebrow>Volumen semanal (toneladas)</Eyebrow>
              </CardContent>
              <CardContent>
                <BarChart data={volumenSemanal} />
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      {/* Historial */}
      <section>
        <SectionHead icon={<History aria-hidden />} title="Historial de sesiones" />
        <Card className="gap-0 py-0">
          {historial.length === 0 ? (
            <EmptyHint icon={<History aria-hidden />}>
              Este alumno todavía no registró sesiones.
            </EmptyHint>
          ) : (
            historial.map((s, i) => (
              <div
                key={s.id}
                className={cn(
                  "px-4 py-3 lg:grid lg:grid-cols-[140px_1fr_100px_80px_100px] lg:items-center lg:px-5 lg:py-3.5",
                  i < historial.length - 1 && "border-b border-border"
                )}
              >
                {/* Desktop: fecha primero; mobile: nombre + PR arriba */}
                <Celda className="hidden text-muted-foreground lg:inline">
                  {s.fecha}
                </Celda>
                <div className="flex items-center justify-between gap-2 lg:block">
                  <span className="text-sm font-semibold text-foreground">
                    {s.nombre}
                  </span>
                  {s.pr ? (
                    <Badge variant="pr" size="sm" className="lg:hidden">
                      PR
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-1 flex gap-3 lg:contents">
                  <Celda className="text-muted-foreground lg:hidden">{s.fecha}</Celda>
                  <Celda>{s.volumen}</Celda>
                  <Celda>{s.rpe != null ? `RPE ${s.rpe}` : "—"}</Celda>
                </div>
                <span className="hidden lg:inline">
                  {s.pr ? (
                    <Badge variant="pr" size="sm">
                      PR
                    </Badge>
                  ) : null}
                </span>
              </div>
            ))
          )}
        </Card>
      </section>
    </div>
  );
}
