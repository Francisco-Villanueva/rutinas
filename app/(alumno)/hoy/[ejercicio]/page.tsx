import { redirect } from "next/navigation";

import { getCargaDeEjercicio } from "@/lib/data/hoy";
import { LogEjercicio } from "@/components/alumno/log-ejercicio";

export default async function CargarEjercicioPage({
  params,
}: {
  params: Promise<{ ejercicio: string }>;
}) {
  const { ejercicio: rutinaEjercicioId } = await params;
  const carga = await getCargaDeEjercicio(rutinaEjercicioId);

  // Puede no haber nada por dos motivos: el ejercicio no es del día de hoy, o
  // todavía no se empezó la sesión. En los dos casos el lugar es "hoy", que
  // muestra el estado real en vez de un 404 que no explica nada.
  if (!carga) redirect("/hoy");

  return (
    <LogEjercicio
      ejercicio={carga.ejercicio}
      sesionId={carga.sesionId}
      dia={carga.dia}
      siguienteId={carga.siguienteId}
    />
  );
}
