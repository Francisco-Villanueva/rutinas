import { getEjercicios } from "@/lib/data/ejercicios";
import { EjerciciosLista } from "@/components/coach/ejercicios-lista";

// Única pantalla del panel que sale entera de la base: el seed carga el
// catálogo de ejercicios, así que acá no hay dataset de ejemplo.
export default async function EjerciciosPage() {
  const { ejercicios, grupos } = await getEjercicios();

  return (
    <div className="flex w-full max-w-app flex-col gap-4 p-4 lg:gap-6 lg:p-8">
      <EjerciciosLista ejercicios={ejercicios} grupos={grupos} />
    </div>
  );
}
