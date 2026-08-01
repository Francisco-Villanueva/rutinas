import Link from "next/link";
import { ChevronRight, History } from "lucide-react";

import { getHistorial } from "@/lib/data/historial";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default async function HistorialPage() {
  const sesiones = await getHistorial();

  return (
    <div className="flex flex-col gap-4 px-5 pt-4">
      <header>
        <h1 className="font-heading text-2xl leading-tight font-bold tracking-display text-foreground">
          Historial
        </h1>
        <p className="text-sm text-muted-foreground">
          {sesiones.length === 0
            ? "Todavía no registraste entrenamientos."
            : `${sesiones.length} ${sesiones.length === 1 ? "sesión registrada" : "sesiones registradas"}`}
        </p>
      </header>

      {sesiones.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2.5 py-10 text-center">
            <History aria-hidden className="size-7 text-faint" />
            <p className="text-sm text-muted-foreground">
              Cuando termines tu primer entrenamiento va a aparecer acá.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sesiones.map((sesion) => (
            <Link key={sesion.id} href={`/historial/${sesion.id}`} className="flex">
              <Card size="sm" interactive className="flex-1">
                <CardContent className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-md font-semibold text-foreground">
                        {sesion.dia}
                      </span>
                      {sesion.estado === "planificada" ? (
                        <Badge size="sm" variant="warning">
                          Sin finalizar
                        </Badge>
                      ) : sesion.estado === "omitida" ? (
                        <Badge size="sm">Omitida</Badge>
                      ) : null}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-2.5 font-mono text-sm text-muted-foreground">
                      <span>{sesion.cuando}</span>
                      {sesion.volumen ? <span>{sesion.volumen}</span> : null}
                      {sesion.series > 0 ? (
                        <span>
                          {sesion.series} {sesion.series === 1 ? "serie" : "series"}
                        </span>
                      ) : null}
                      {sesion.rpe != null ? <span>RPE {sesion.rpe}</span> : null}
                    </div>
                  </div>
                  <ChevronRight aria-hidden className="size-[18px] shrink-0 text-faint" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
