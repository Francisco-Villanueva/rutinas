import { ClipboardList, Plus } from "lucide-react";

import { getPantallaRutinas } from "@/lib/data/rutinas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RutinaBuilder } from "@/components/coach/rutina-builder";
import { RutinaDialog } from "@/components/coach/rutina-dialogs";
import { EmptyHint } from "@/components/coach/piezas";

export default async function RutinasPage({
  searchParams,
}: {
  // `?rutina=<id>` elige qué rutina abre el constructor. Es un id sin validar:
  // la query filtra por profesor y cae en la más reciente si no matchea.
  searchParams: Promise<{ rutina?: string }>;
}) {
  const { rutina: rutinaId } = await searchParams;
  const { rutina, rutinas, ejercicios } = await getPantallaRutinas(rutinaId);

  return (
    <div className="flex w-full max-w-app flex-col gap-4 p-4 lg:gap-6 lg:p-8">
      {rutina ? (
        <RutinaBuilder rutina={rutina} rutinas={rutinas} ejercicios={ejercicios} />
      ) : (
        <Card>
          <EmptyHint icon={<ClipboardList aria-hidden />}>
            <span>Todavía no creaste ninguna rutina.</span>
            <RutinaDialog>
              <Button className="mt-2">
                <Plus aria-hidden />
                Crear la primera rutina
              </Button>
            </RutinaDialog>
          </EmptyHint>
        </Card>
      )}
    </div>
  );
}
