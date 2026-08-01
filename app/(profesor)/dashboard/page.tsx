import Link from "next/link";
import {
  Activity,
  Bell,
  Check,
  ChevronRight,
  Plus,
  Ruler,
  Trophy,
  Users,
} from "lucide-react";

import { getPanelProfesor } from "@/lib/data/panel";
import type { EventoActividad } from "@/lib/data/tipos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Stat } from "@/components/stat";
import { SectionHead } from "@/components/coach/section-head";
import {
  Adherencia,
  AvatarAlumno,
  BannerDemo,
  EmptyHint,
} from "@/components/coach/piezas";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const { alumnos, actividad, prsSemana, esDemo } = await getPanelProfesor();

  const activos = alumnos.filter((a) => a.estado === "activo").length;
  const conAdherencia = alumnos
    .map((a) => a.adherencia)
    .filter((v): v is number => v != null);
  const adherenciaMedia = conAdherencia.length
    ? Math.round(conAdherencia.reduce((s, v) => s + v, 0) / conAdherencia.length)
    : null;
  const alertas = alumnos.filter((a) => a.alerta != null);

  return (
    <div className="flex w-full max-w-app flex-col gap-5 p-4 lg:gap-6 lg:p-8">
      {esDemo ? (
        <BannerDemo>
          Todavía no tenés alumnos vinculados. Esto es el dataset del UI kit para
          poder revisar la pantalla.
        </BannerDemo>
      ) : null}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-4">
        <Card size="sm">
          <CardContent>
            <Stat
              size="sm"
              icon={<Users aria-hidden className="size-[15px]" />}
              label="Alumnos activos"
              value={activos}
              unit={`/ ${alumnos.length}`}
            />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <Stat
              size="sm"
              icon={<Activity aria-hidden className="size-[15px]" />}
              label="Adherencia media"
              value={adherenciaMedia ?? "—"}
              unit={adherenciaMedia != null ? "%" : undefined}
            />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <Stat
              size="sm"
              icon={<Trophy aria-hidden className="size-[15px]" />}
              label="PRs esta semana"
              value={prsSemana ?? "—"}
            />
          </CardContent>
        </Card>
        <Card size="sm" accent>
          <CardContent>
            <Stat
              size="sm"
              icon={<Bell aria-hidden className="size-[15px]" />}
              label="Necesitan atención"
              value={alertas.length}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1.15fr_1fr] lg:gap-6">
        {/* Necesitan atención */}
        <section>
          <SectionHead
            icon={<Bell aria-hidden />}
            title="Necesitan atención"
            count={alertas.length}
          />
          <Card className="gap-0 py-0">
            {alertas.length === 0 ? (
              <EmptyHint icon={<Check aria-hidden />}>
                Nadie necesita atención ahora mismo.
              </EmptyHint>
            ) : (
              alertas.map((a, i) => (
                <Link
                  key={a.id}
                  href={`/alumnos/${a.id}`}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5 transition-colors duration-[var(--dur-fast)] ease-out hover:bg-muted lg:px-[18px]",
                    i < alertas.length - 1 && "border-b border-border"
                  )}
                >
                  <AvatarAlumno iniciales={a.iniciales} estado={a.estado} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-foreground">
                      {a.nombre}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {[a.ultimaSesion, a.plan].filter(Boolean).join(" · ") ||
                        "Sin rutina asignada"}
                    </div>
                  </div>
                  <Badge variant={a.alerta!.tono} size="sm">
                    {a.alerta!.texto}
                  </Badge>
                  <ChevronRight aria-hidden className="size-4 shrink-0 text-faint" />
                </Link>
              ))
            )}
          </Card>
        </section>

        {/* Actividad reciente */}
        <section>
          <SectionHead icon={<Activity aria-hidden />} title="Actividad reciente" />
          <Card className="gap-0 py-0">
            {actividad.length === 0 ? (
              <EmptyHint icon={<Activity aria-hidden />}>
                Todavía no hay actividad para mostrar.
              </EmptyHint>
            ) : (
              actividad.map((ev, i) => (
                <FilaActividad
                  key={ev.id}
                  evento={ev}
                  ultima={i === actividad.length - 1}
                />
              ))
            )}
          </Card>
        </section>
      </div>

      {/* Todos los alumnos */}
      <section>
        <SectionHead
          icon={<Users aria-hidden />}
          title="Todos los alumnos"
          count={alumnos.length}
          action={
            <Button size="sm" variant="outline" className="shrink-0" asChild>
              <Link href="/alumnos">
                <Plus aria-hidden />
                <span className="hidden sm:inline">Invitar alumno</span>
                <span className="sm:hidden">Invitar</span>
              </Link>
            </Button>
          }
        />
        <Card className="gap-0 py-0">
          {alumnos.length === 0 ? (
            <EmptyHint icon={<Users aria-hidden />}>
              Todavía no invitaste a ningún alumno. El alumno no se registra solo:
              la invitación la mandás vos.
            </EmptyHint>
          ) : (
            <>
              {/* Desktop: tabla */}
              <div className="hidden grid-cols-[2.2fr_1.1fr_1.4fr_1.1fr_40px] border-b border-border px-5 py-3 text-xs font-semibold tracking-caps text-muted-foreground uppercase lg:grid">
                <span>Alumno</span>
                <span>Objetivo</span>
                <span>Adherencia</span>
                <span>Mesociclo</span>
                <span />
              </div>
              {alumnos.map((a, i) => (
                <Link
                  key={a.id}
                  href={`/alumnos/${a.id}`}
                  className={cn(
                    "hidden grid-cols-[2.2fr_1.1fr_1.4fr_1.1fr_40px] items-center px-5 py-3.5 transition-colors duration-[var(--dur-fast)] ease-out hover:bg-muted lg:grid",
                    i < alumnos.length - 1 && "border-b border-border"
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <AvatarAlumno iniciales={a.iniciales} estado={a.estado} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">
                        {a.nombre}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {[a.plan, a.ultimaSesion].filter(Boolean).join(" · ") ||
                          "Sin rutina asignada"}
                      </div>
                    </div>
                  </div>
                  <span>
                    {a.objetivo ? (
                      <Badge size="sm">{a.objetivo}</Badge>
                    ) : (
                      <span className="text-sm text-faint">—</span>
                    )}
                  </span>
                  <div className="flex items-center gap-2.5 pr-5">
                    <Adherencia valor={a.adherencia} />
                  </div>
                  <span className="text-sm text-body">
                    {a.semana != null && a.semanas != null
                      ? `Sem ${a.semana}/${a.semanas}`
                      : "—"}
                  </span>
                  <ChevronRight aria-hidden className="size-4 text-faint" />
                </Link>
              ))}

              {/* Mobile: una tarjeta por alumno */}
              {alumnos.map((a, i) => (
                <Link
                  key={a.id}
                  href={`/alumnos/${a.id}`}
                  className={cn(
                    "flex flex-col gap-2.5 px-4 py-3.5 lg:hidden",
                    i < alumnos.length - 1 && "border-b border-border"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <AvatarAlumno iniciales={a.iniciales} estado={a.estado} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-foreground">
                        {a.nombre}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {a.plan ?? "Sin rutina asignada"}
                        {a.semana != null && a.semanas != null
                          ? ` · Sem ${a.semana}/${a.semanas}`
                          : ""}
                      </div>
                    </div>
                    {a.objetivo ? <Badge size="sm">{a.objetivo}</Badge> : null}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Adherencia valor={a.adherencia} />
                  </div>
                </Link>
              ))}
            </>
          )}
        </Card>
      </section>
    </div>
  );
}

const ESTILO_ACTIVIDAD = {
  pr: { Icon: Trophy, className: "bg-pr-soft text-warning-strong" },
  sesion: { Icon: Check, className: "bg-success-soft text-success-strong" },
  metrica: { Icon: Ruler, className: "bg-info-soft text-info-strong" },
} as const;

function FilaActividad({
  evento,
  ultima,
}: {
  evento: EventoActividad;
  ultima: boolean;
}) {
  const { Icon, className } = ESTILO_ACTIVIDAD[evento.tipo];

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3.5 lg:px-[18px]",
        !ultima && "border-b border-border"
      )}
    >
      <span
        className={cn(
          "flex size-[34px] shrink-0 items-center justify-center rounded-sm",
          className
        )}
      >
        <Icon aria-hidden className="size-[17px]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm text-foreground">
          <span className="font-semibold">{evento.alumno}</span> · {evento.texto}
        </div>
        <div className="truncate font-mono text-xs text-muted-foreground">
          {evento.detalle}
        </div>
      </div>
      <span className="shrink-0 text-xs whitespace-nowrap text-faint">
        {evento.cuando}
      </span>
    </div>
  );
}
