import { requireAlumno } from "@/lib/auth/guards";
import { AlumnoBottomNav } from "@/components/alumno/alumno-bottom-nav";
import { ProveedorDeAvisos } from "@/components/coach/avisos";

// Ídem (profesor): esto cubre la navegación, no las Server Actions.
// Ver el comentario de lib/auth/guards.ts.
export default async function AlumnoLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAlumno();

  return (
    <ProveedorDeAvisos>
      {/* max-w-md: la app del alumno se diseñó para 390px, así que en desktop se
          centra en vez de estirarse. pb-24 deja lugar a los tabs fijos. */}
      <div className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col pb-24">
        {children}
      </div>
      <AlumnoBottomNav />
    </ProveedorDeAvisos>
  );
}
