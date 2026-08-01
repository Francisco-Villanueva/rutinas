// En Next 16 el middleware pasó a llamarse "proxy" y vive en proxy.ts, en la
// raíz del proyecto (al mismo nivel que app/). Es el mismo mecanismo: solo
// cambió el nombre del archivo y el de la función exportada.
//
// Acá NO se protege nada ni se chequean roles. Dos motivos:
//
//  1. Es lo que recomienda Clerk desde Core 3: los chequeos de auth van lo más
//     cerca posible del dato que leen o mutan, no en el borde de la red.
//     `createRouteMatcher()` quedó deprecado y tira un warning en runtime.
//  2. Un proxy que redirige no protege una Server Action invocada directamente,
//     que es el vector que importa. La protección real está en
//     lib/auth/guards.ts, llamada desde cada layout y cada Server Action.
//
// clerkMiddleware() sin argumentos hace una sola cosa: hidrata la sesión para
// que auth() funcione río abajo. Es lo único que necesitamos de esta capa.
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Todo menos los estáticos de Next y los archivos con extensión conocida.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Rutas internas de Clerk (handshake, satellite domains).
    "/__clerk/(.*)",
  ],
};
