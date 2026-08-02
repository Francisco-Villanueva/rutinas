# Rutinas

Plataforma para que un profesor de gimnasio arme rutinas, se las asigne a sus
alumnos y siga su progreso. El alumno entra desde el celular, ve qué le toca
entrenar hoy y carga lo que levantó.

El dominio y el modelo de datos están en `../contexto_proyecto.md`. Las reglas
de arquitectura, en `../CLAUDE.md`.

## Stack

Next.js (App Router) + TypeScript · Tailwind + shadcn/ui · Prisma · PostgreSQL
en Neon · Clerk · Vercel.

Las mutaciones son Server Actions: no hay route handlers en `/api`. La
autorización vive en `lib/auth/guards.ts` y se invoca al principio de cada
action — **no** hay RLS.

## Cómo está organizado

| Carpeta              | Qué hay                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `app/(profesor)`     | Panel, alumnos, constructor de rutinas, ejercicios, asignaciones.       |
| `app/(alumno)`       | Hoy te toca, carga de entrenamiento, progreso, historial, perfil.       |
| `lib/data`           | Queries de lectura. Todas empiezan por un guard.                        |
| `lib/actions`        | Server Actions. Todas devuelven `ResultadoAction`, nunca lanzan.        |
| `lib/validaciones`   | Schemas de zod de cada formulario.                                      |
| `lib/entrenamiento`  | Cálculo de 1RM, récords personales y métricas derivadas.                |
| `lib/auth/guards.ts` | El único lugar donde se decide quién puede tocar qué.                   |
| `lib/fechas.ts`      | Días en la zona del gimnasio. Una sesión es "el martes", no un instante. |

## Desarrollo

```bash
npm install
cp .env.example .env.local   # y completá los valores
npm run db:generate          # cliente de Prisma
npm run db:seed              # gimnasio + catálogo de ejercicios
npm run dev
```

Al primer profesor no lo invita nadie: creá la cuenta en el dashboard de Clerk y
después dale su fila en `usuarios`.

```bash
npx tsx scripts/crear-profesor.ts --email profe@gimnasio.com --clerk-id user_2abc... --nombre Franco
```

De ahí en adelante, cada alumno lo da de alta su profesor desde la app.

Conviene invocarlo con `npx` y no con `npm run`: npm se queda con los `--flag`
como config propia y al script le llegan solo los valores sueltos.

### Comandos

| Comando               | Qué hace                                        |
| --------------------- | ----------------------------------------------- |
| `npm run dev`         | Servidor de desarrollo.                         |
| `npm run build`       | Build de producción (corre typecheck y lint).   |
| `npm run lint`        | ESLint.                                         |
| `npm run db:pull`     | Trae el schema desde la base a `prisma/schema.prisma`. |
| `npm run db:generate` | Regenera el cliente de Prisma.                  |
| `npm run db:seed`     | Gimnasio hardcodeado + 60 ejercicios. Idempotente. |

## Deploy en Vercel

### 1. Neon

Usá **branches**: `main` para producción y `dev` para trabajar, con datos
separados y sin pagar dos bases.

De cada branch salen dos connection strings, y no son intercambiables:

- **`DATABASE_URL`** — el *pooled*, el host termina en `-pooler`. Lo usa la app.
- **`DIRECT_URL`** — el directo. Lo usa solo la CLI de Prisma.

Prisma en serverless abre una conexión por invocación: sin el pooler, Neon corta
por límite de conexiones. Anda en local y se rompe en Vercel.

Antes del primer deploy, corré contra el branch de producción:

1. El DDL de `../modelo_datos_gimnasio.sql`, **solo hasta las 14 tablas del MVP**
   (lo que sigue —`comentarios`, `mensajes`, `notificaciones`— es fase 2). Ese
   mismo archivo carga el catálogo de `tipos_metrica`.
2. `npm run db:seed`, para el gimnasio y los ejercicios.

El DDL no es idempotente: sus `CREATE TABLE` no llevan `IF NOT EXISTS`, así que
correrlo dos veces falla con "already exists" sin tocar los datos. El seed sí es
idempotente y se puede repetir.

### 2. Clerk

Creá la **instancia de producción** (las claves `pk_live_` / `sk_live_`). Ojo:
es una instancia distinta de la de desarrollo y **no comparte usuarios**, así que
hay que volver a dar de alta al profesor con `scripts/crear-profesor.ts` y
reinvitar a los alumnos.

En Clerk, habilitá el ingreso por **código al email**: las cuentas de alumno se
crean sin contraseña (ver `lib/actions/alumnos.ts`). Si tu instancia solo acepta
contraseña, la invitación va a fallar con el error de Clerk en pantalla.

### 3. Vercel

1. Importá el repo. Next.js se autodetecta; no hace falta tocar el build command
   (`postinstall` ya corre `prisma generate`).
2. Cargá todas las variables de `.env.example` en Settings → Environment
   Variables, apuntando al branch `main` de Neon y a las claves `live` de Clerk.
3. Deploy.

Después del primer deploy, agregá el dominio de Vercel a los dominios permitidos
de Clerk.

### Sobre el plan

El plan Hobby de Vercel es de **uso no comercial**. Para una prueba con un coach
y sus alumnos no es un problema inmediato, pero si el gimnasio lo usa para su
negocio corresponde el plan Pro.

## Instalación en el celular

La app se puede agregar a la pantalla de inicio (`app/manifest.ts`): se abre sin
la barra del navegador y cae directo en la pantalla que corresponde al rol. No
hay service worker ni modo offline.

## Lo que todavía no está

- Métricas corporales: el catálogo `tipos_metrica` viene cargado por el DDL
  (peso, % de grasa y siete medidas), pero no hay CRUD ni pantalla de carga.
- Fotos de progreso: la tabla está creada, sin UI (necesita Vercel Blob).
- Videos de ejercicios: `ejercicio_media` existe, sin UI.
- Multi-gimnasio: el gimnasio está hardcodeado en el seed.
- Comunicación profesor-alumno (comentarios, chat, notificaciones): fase 2.
- Recuperar una rutina archivada o un ejercicio dado de baja: la baja es lógica,
  pero no hay pantalla para revertirla.
