import { requireAlumno } from "@/lib/auth/guards";

// Ídem (profesor): esto cubre la navegación, no las Server Actions.
// Ver el comentario de lib/auth/guards.ts.
export default async function AlumnoLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAlumno();

  return <>{children}</>;
}
