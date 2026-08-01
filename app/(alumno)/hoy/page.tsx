import { SignOutButton } from "@clerk/nextjs";

import { requireAlumno } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";

// Placeholder: existe solo para probar el login de punta a punta.
// La vista "hoy te toca" viene en el paso 4 del plan.
export default async function HoyPage() {
  const alumno = await requireAlumno();

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <p className="eyebrow">Alumno</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hola, {alumno.nombre}
        </h1>
        <p className="text-sm text-muted-foreground">
          {alumno.email} · rol <code className="font-mono">{alumno.rol}</code>
        </p>
      </div>

      <SignOutButton redirectUrl="/sign-in">
        <Button variant="outline" className="self-start">
          Cerrar sesión
        </Button>
      </SignOutButton>
    </main>
  );
}
