import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, RotateCcw } from "lucide-react";

import { getSesion } from "@/lib/data/historial";
import { reabrirSesion } from "@/lib/actions/sesiones";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AccionSimple } from "@/components/coach/avisos";

export default async function DetalleDeSesionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sesion = await getSesion(id);

  // null tanto si no existe como si es de otro alumno: no distinguirlos evita
  // filtrar qué ids existen.
  if (!sesion) notFound();

  return (
    <div className="flex flex-col gap-4 px-5 pt-3">
      <header className="flex items-center gap-2.5">
        <Button variant="ghost" size="icon-sm" aria-label="Volver" asChild>
          <Link href="/historial">
            <ArrowLeft aria-hidden />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-heading text-lg leading-tight font-bold text-foreground">
            {sesion.dia}
          </h1>
          <p className="truncate text-sm text-muted-foreground">
            {sesion.cuando}
            {sesion.rutina ? ` · ${sesion.rutina}` : ""}
          </p>
        </div>
        {sesion.estado === "completada" ? (
          <Badge variant="success" size="sm">
            Completada
          </Badge>
        ) : sesion.estado === "omitida" ? (
          <Badge size="sm">Omitida</Badge>
        ) : (
          <Badge variant="warning" size="sm">
            Sin finalizar
          </Badge>
        )}
      </header>

      <Card>
        <CardContent className="grid grid-cols-3 gap-3 text-center">
          <Resumen label="Volumen" valor={sesion.volumen ?? "—"} />
          <Resumen
            label="Duración"
            valor={sesion.duracionMinutos != null ? `${sesion.duracionMinutos} min` : "—"}
          />
          <Resumen
            label="RPE"
            valor={sesion.rpeGeneral != null ? String(sesion.rpeGeneral) : "—"}
          />
        </CardContent>
      </Card>

      {sesion.notas ? (
        <Card className="border-transparent bg-muted">
          <CardContent className="text-sm text-body">{sesion.notas}</CardContent>
        </Card>
      ) : null}

      {sesion.ejercicios.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No se cargó ninguna serie en esta sesión.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sesion.ejercicios.map((ejercicio) => (
            <Card key={ejercicio.ejercicio} className="gap-0 py-0">
              <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                <span className="truncate text-md font-semibold text-foreground">
                  {ejercicio.ejercicio}
                </span>
                {ejercicio.volumen > 0 ? (
                  <span className="shrink-0 font-mono text-sm text-muted-foreground">
                    {Math.round(ejercicio.volumen)} kg
                  </span>
                ) : null}
              </div>
              <div className="flex flex-col divide-y divide-border">
                {ejercicio.series.map((serie, i) => (
                  <div
                    key={serie.numeroSerie}
                    className="flex items-center gap-3 px-4 py-2.5"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-muted font-mono text-xs font-bold text-body">
                      {i + 1}
                    </span>
                    <span className="flex-1 font-mono text-sm text-body">
                      {serie.peso != null ? `${serie.peso} kg` : "—"} ×{" "}
                      {serie.repeticiones ?? "—"}
                    </span>
                    {serie.rpe != null ? (
                      <span className="font-mono text-xs text-muted-foreground">
                        RPE {serie.rpe}
                      </span>
                    ) : null}
                    {!serie.completado ? (
                      <Badge size="sm" variant="warning">
                        No hecha
                      </Badge>
                    ) : null}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {sesion.estado === "completada" ? (
        <AccionSimple
          action={reabrirSesion}
          campos={{ id: sesion.id }}
          confirmar="¿Reabrir esta sesión para seguir cargando series?"
          variant="ghost"
          size="sm"
          className="w-fit"
        >
          <RotateCcw aria-hidden />
          Reabrir sesión
        </AccionSimple>
      ) : null}
    </div>
  );
}

function Resumen({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <div className="text-2xs tracking-caps text-faint uppercase">{label}</div>
      <div className="mt-0.5 font-mono text-md font-semibold text-foreground">
        {valor}
      </div>
    </div>
  );
}
