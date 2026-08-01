import { ClipboardList } from "lucide-react";

import { getRutinaBuilder } from "@/lib/data/rutinas";
import { Card } from "@/components/ui/card";
import { RutinaBuilder } from "@/components/coach/rutina-builder";
import { BannerDemo, EmptyHint } from "@/components/coach/piezas";

export default async function RutinasPage() {
  const rutina = await getRutinaBuilder();

  return (
    <div className="flex w-full max-w-app flex-col gap-4 p-4 lg:gap-6 lg:p-8">
      {rutina?.esDemo ? (
        <BannerDemo>
          Todavía no creaste ninguna rutina. Esto es la rutina de ejemplo del UI kit.
        </BannerDemo>
      ) : null}

      {rutina ? (
        <RutinaBuilder rutina={rutina} />
      ) : (
        <Card>
          <EmptyHint icon={<ClipboardList aria-hidden />}>
            Todavía no creaste ninguna rutina.
          </EmptyHint>
        </Card>
      )}
    </div>
  );
}
