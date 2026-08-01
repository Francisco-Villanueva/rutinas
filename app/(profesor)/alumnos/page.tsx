import { getAlumnos } from "@/lib/data/alumnos";
import { AlumnosLista } from "@/components/coach/alumnos-lista";
import { BannerDemo } from "@/components/coach/piezas";

export default async function AlumnosPage() {
  const { alumnos, esDemo } = await getAlumnos();

  return (
    <div className="flex w-full max-w-app flex-col gap-4 p-4 lg:gap-6 lg:p-8">
      {esDemo ? (
        <BannerDemo>
          Todavía no tenés alumnos vinculados. Esto es el dataset del UI kit.
        </BannerDemo>
      ) : null}

      <AlumnosLista alumnos={alumnos} />
    </div>
  );
}
