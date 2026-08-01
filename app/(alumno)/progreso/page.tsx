import { Flame, TrendingUp, Trophy } from "lucide-react";

import { getProgreso } from "@/lib/data/progreso";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, LineChart } from "@/components/coach/charts";
import { Eyebrow } from "@/components/coach/piezas";

export default async function ProgresoPage() {
  const {
    racha,
    entrenamientos,
    adherencia,
    mesociclo,
    prs,
    fuerza,
    volumenSemanal,
  } = await getProgreso();

  const hayVolumen = volumenSemanal.some((s) => s.valor > 0);

  return (
    <div className="flex flex-col gap-4 px-5 pt-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl leading-tight font-bold tracking-display text-foreground">
            Tu progreso
          </h1>
          {mesociclo ? (
            <p className="text-sm text-muted-foreground">
              {mesociclo.rutina} · semana {mesociclo.semana}
              {mesociclo.semanas != null ? ` de ${mesociclo.semanas}` : ""}
            </p>
          ) : null}
        </div>
        {racha > 0 ? (
          <Badge variant="pr">
            <Flame aria-hidden />
            {racha} {racha === 1 ? "día" : "días"}
          </Badge>
        ) : null}
      </header>

      <div className="grid grid-cols-2 gap-2.5">
        <Card size="sm">
          <CardContent>
            <Eyebrow>Entrenamientos</Eyebrow>
            <div className="mt-1 font-heading text-2xl font-bold text-foreground tabular-nums">
              {entrenamientos}
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <Eyebrow>Adherencia</Eyebrow>
            {adherencia != null ? (
              <>
                <div className="mt-1 font-heading text-2xl font-bold text-foreground tabular-nums">
                  {adherencia}
                  <span className="ml-0.5 font-mono text-md font-medium text-muted-foreground">
                    %
                  </span>
                </div>
                <Progress
                  size="sm"
                  className="mt-1.5"
                  value={adherencia}
                  tone={
                    adherencia >= 80 ? "success" : adherencia >= 60 ? "accent" : "warning"
                  }
                />
              </>
            ) : (
              <div className="mt-1 text-sm text-muted-foreground">Sin datos</div>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <Trophy aria-hidden className="size-[18px] text-body" />
          <h2 className="font-heading text-lg leading-snug font-bold text-foreground">
            Récords personales
          </h2>
        </div>

        {prs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2.5 py-8 text-center">
              <Trophy aria-hidden className="size-7 text-faint" />
              <p className="text-sm text-muted-foreground">
                Todavía no tenés récords. Se calculan solos con cada serie que
                cargues.
              </p>
            </CardContent>
          </Card>
        ) : (
          prs.map((pr) => (
            <Card key={pr.id} size="sm" accent={pr.esReciente}>
              <CardContent className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-pr-soft">
                  <Trophy aria-hidden className="size-[18px] text-warning-strong" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-md font-semibold text-foreground">
                      {pr.ejercicio}
                    </span>
                    {pr.esReciente ? (
                      <Badge variant="pr" size="sm">
                        Nuevo
                      </Badge>
                    ) : null}
                  </div>
                  <div className="font-mono text-sm text-muted-foreground">
                    {pr.peso} kg × {pr.repeticiones} · {pr.cuando}
                  </div>
                </div>
                {pr.rmEstimado != null ? (
                  <div className="shrink-0 text-right">
                    <div className="font-mono text-md font-bold text-foreground tabular-nums">
                      {pr.rmEstimado}
                    </div>
                    <div className="text-2xs text-faint">1RM est.</div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </section>

      {fuerza ? (
        <Card size="lg">
          <CardContent>
            <Eyebrow>Evolución de fuerza · {fuerza.ejercicio}</Eyebrow>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-heading text-2xl font-bold text-foreground tabular-nums">
                {fuerza.serie[fuerza.serie.length - 1]}
                <span className="ml-1 font-mono text-sm font-medium text-muted-foreground">
                  kg 1RM
                </span>
              </span>
              {(() => {
                const progreso =
                  fuerza.serie[fuerza.serie.length - 1] - fuerza.serie[0];
                if (progreso === 0) return null;

                return (
                  <Badge variant={progreso > 0 ? "success" : "warning"} size="sm">
                    <TrendingUp aria-hidden />
                    {progreso > 0 ? "+" : ""}
                    {progreso} kg
                  </Badge>
                );
              })()}
            </div>
          </CardContent>
          <CardContent>
            <LineChart
              data={fuerza.serie}
              height={120}
              label={`Evolución de tu 1RM estimado en ${fuerza.ejercicio}`}
            />
          </CardContent>
        </Card>
      ) : null}

      {hayVolumen ? (
        <Card size="lg">
          <CardContent>
            <Eyebrow>Volumen semanal (toneladas)</Eyebrow>
          </CardContent>
          <CardContent>
            <BarChart data={volumenSemanal} height={120} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
