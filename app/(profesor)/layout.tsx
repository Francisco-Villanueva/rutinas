import { requireProfesor } from "@/lib/auth/guards";
import { iniciales, nombreCompleto } from "@/lib/utils";
import { CoachBottomNav } from "@/components/coach/coach-bottom-nav";
import { CoachSidebar } from "@/components/coach/coach-sidebar";
import { CoachTopbar } from "@/components/coach/coach-topbar";

// El guard acá protege la navegación: un alumno que entra a mano a /dashboard
// se va a /hoy. NO protege las Server Actions que se invoquen desde adentro:
// cada una repite su propio guard. Ver el comentario de lib/auth/guards.ts.
export default async function ProfesorLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profesor = await requireProfesor();

  return (
    <div className="flex min-h-full flex-1">
      <CoachSidebar
        nombre={nombreCompleto(profesor.nombre, profesor.apellido)}
        iniciales={iniciales(profesor.nombre, profesor.apellido)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <CoachTopbar />
        {/* pb-20 deja lugar para la barra inferior fija de mobile. */}
        <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      </div>

      <CoachBottomNav />
    </div>
  );
}
