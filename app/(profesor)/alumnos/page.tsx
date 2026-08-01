import { getAlumnos } from "@/lib/data/alumnos";
import { AlumnosLista } from "@/components/coach/alumnos-lista";

export default async function AlumnosPage() {
  const { alumnos } = await getAlumnos();

  return (
    <div className="flex w-full max-w-app flex-col gap-4 p-4 lg:gap-6 lg:p-8">
      <AlumnosLista alumnos={alumnos} />
    </div>
  );
}
