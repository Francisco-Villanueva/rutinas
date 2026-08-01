import Link from "next/link";
import {
  CalendarOff,
  Check,
  ChevronRight,
  Dumbbell,
  Flame,
  MessageSquare,
  Play,
  Timer,
  Trophy,
} from "lucide-react";

import { getHoy } from "@/lib/data/hoy";
import { empezarSesion } from "@/lib/actions/sesiones";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AccionSimple } from "@/components/coach/avisos";
import { DatoDeSesion, TiraDeLaSemana } from "@/components/alumno/piezas";
import { FinalizarSesion } from "@/components/alumno/finalizar-sesion";
import { cn } from "@/lib/utils";
import type { EjercicioDeHoy } from "@/lib/data/alumno-tipos";

export default async function HoyPage() {
  const { nombre, racha, semana, plan, dia, ejercicios, sesion, hechos, estimadoMinutos } =
    await getHoy();

  const enCurso = sesion != null && sesion.estado === "planificada";
  const completada = sesion?.estado === "completada";
  const siguiente = ejercicios.find((e) => !e.hecho) ?? ejercicios[0];

  return (
    <div className="flex flex-col gap-4 px-5 pt-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Hola, {nombre} 👋</p>
          <h1 className="font-heading text-2xl leading-tight font-bold tracking-display text-foreground">
            Hoy te toca
          </h1>
        </div>
        {racha > 0 ? (
          <Badge variant="pr">
            <Flame aria-hidden />
            {racha} {racha === 1 ? "día" : "días"}
          </Badge>
        ) : null}
      </header>

      <TiraDeLaSemana dias={semana} />

      {!plan ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2.5 py-10 text-center">
            <CalendarOff aria-hidden className="size-7 text-faint" />
            <p className="text-sm text-muted-foreground">
              Todavía no tenés una rutina asignada. En cuanto tu profe te asigne
              una, la vas a ver acá.
            </p>
          </CardContent>
        </Card>
      ) : !dia ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2.5 py-10 text-center">
            <Dumbbell aria-hidden className="size-7 text-faint" />
            <p className="text-sm text-muted-foreground">
              Tu rutina <strong className="text-body">{plan.rutina}</strong> todavía
              no tiene días cargados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card accent size="lg">
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="accent" size="sm">
                  Día {dia.numeroDia}
                </Badge>
                {plan.semana != null ? (
                  <Badge size="sm">
                    Semana {plan.semana}
                    {plan.semanas != null ? `/${plan.semanas}` : ""}
                  </Badge>
                ) : null}
              </div>
              <h2 className="mt-2 font-heading text-xl leading-tight font-bold text-foreground">
                {dia.nombre}
              </h2>
              <div className="mt-1.5 flex flex-wrap gap-3.5">
                <DatoDeSesion icono={<Dumbbell aria-hidden />}>
                  {ejercicios.length} {ejercicios.length === 1 ? "ejercicio" : "ejercicios"}
                </DatoDeSesion>
                {estimadoMinutos != null ? (
                  <DatoDeSesion icono={<Timer aria-hidden />}>
                    ~{estimadoMinutos} min
                  </DatoDeSesion>
                ) : null}
              </div>

              {ejercicios.length > 0 ? (
                <div className="mt-4 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="eyebrow">Progreso de hoy</span>
                    <span className="font-mono font-semibold text-body">
                      {hechos}/{ejercicios.length}
                    </span>
                  </div>
                  <Progress
                    value={(hechos / ejercicios.length) * 100}
                    tone="success"
                    aria-label="Progreso del entrenamiento de hoy"
                  />
                </div>
              ) : null}
            </CardContent>

            <CardContent>
              {completada ? (
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-center gap-2 rounded-md bg-success-soft px-3 py-2.5 text-sm font-semibold text-success-strong">
                    <Trophy aria-hidden className="size-4" />
                    Entrenamiento completado
                  </div>
                  <Button variant="outline" size="lg" className="w-full" asChild>
                    <Link href={`/historial/${sesion.id}`}>Ver el resumen</Link>
                  </Button>
                </div>
              ) : enCurso ? (
                <div className="flex flex-col gap-2.5">
                  {siguiente ? (
                    <Button size="lg" className="w-full" asChild>
                      <Link href={`/hoy/${siguiente.rutinaEjercicioId}`}>
                        <Play aria-hidden />
                        Continuar entrenamiento
                      </Link>
                    </Button>
                  ) : null}
                  <FinalizarSesion sesion={sesion} hechos={hechos} total={ejercicios.length} />
                </div>
              ) : (
                <AccionSimple
                  action={empezarSesion}
                  campos={{ asignacionId: plan.asignacionId, rutinaDiaId: dia.id }}
                  size="lg"
                  className="w-full"
                  disabled={ejercicios.length === 0}
                >
                  <Play aria-hidden />
                  Empezar entrenamiento
                </AccionSimple>
              )}
            </CardContent>
          </Card>

          {plan.notasDelProfesor || dia.notas ? (
            <Card className="border-transparent bg-info-soft">
              <CardContent className="flex gap-3">
                <MessageSquare aria-hidden className="mt-0.5 size-[18px] shrink-0 text-info-strong" />
                <div>
                  <div className="text-2xs font-bold tracking-caps text-info-strong uppercase">
                    Nota del coach
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-body">
                    {[dia.notas, plan.notasDelProfesor].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <div className="flex flex-col gap-2.5">
            {ejercicios.map((ejercicio) => (
              <TarjetaEjercicio
                key={ejercicio.rutinaEjercicioId}
                ejercicio={ejercicio}
                interactivo={enCurso || completada}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TarjetaEjercicio({
  ejercicio,
  interactivo,
}: {
  ejercicio: EjercicioDeHoy;
  /** Sin sesión abierta las tarjetas son solo la previa del día. */
  interactivo: boolean;
}) {
  const contenido = (
    <>
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-md",
          ejercicio.hecho ? "bg-success-soft" : "bg-accent-soft",
        )}
      >
        {ejercicio.hecho ? (
          <Check aria-hidden className="size-[19px] text-success-strong" />
        ) : (
          <Dumbbell aria-hidden className="size-[19px] text-accent-soft-strong" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "truncate text-md font-semibold text-foreground",
            ejercicio.hecho && "line-through",
          )}
        >
          {ejercicio.nombre}
        </div>
        <div className="truncate font-mono text-sm text-muted-foreground">
          {ejercicio.series} × {ejercicio.reps} · {ejercicio.peso} · {ejercicio.descanso}
        </div>
      </div>
      {interactivo ? (
        <ChevronRight aria-hidden className="size-[18px] shrink-0 text-faint" />
      ) : null}
    </>
  );

  if (!interactivo) {
    return (
      <Card size="sm" className={cn(ejercicio.hecho && "opacity-60")}>
        <CardContent className="flex items-center gap-3">{contenido}</CardContent>
      </Card>
    );
  }

  return (
    <Link href={`/hoy/${ejercicio.rutinaEjercicioId}`} className="flex">
      <Card
        size="sm"
        interactive
        className={cn("flex-1", ejercicio.hecho && "opacity-60")}
      >
        <CardContent className="flex items-center gap-3">{contenido}</CardContent>
      </Card>
    </Link>
  );
}
