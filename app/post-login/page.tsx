import { redirect } from "next/navigation";

import { RUTA_INICIAL, requireUsuario } from "@/lib/auth/guards";

// Clerk manda acá después de un login o un registro exitoso (ver las env vars
// NEXT_PUBLIC_CLERK_*_FALLBACK_REDIRECT_URL en .env.local).
//
// El rol vive en la tabla `usuarios`, no en el JWT, así que la bifurcación por
// rol no puede hacerse ni en el proxy ni en la config de Clerk: hace falta un
// punto del lado del servidor que consulte la base. Es esta página.
//
// No renderiza nada: siempre redirige.
export default async function PostLoginPage() {
  const usuario = await requireUsuario();

  redirect(RUTA_INICIAL[usuario.rol]);
}
