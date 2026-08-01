import Link from "next/link";

// Shell de las pantallas de auth. Mobile-first: a 375px la tarjeta ocupa el
// ancho completo con aire lateral; recién en sm se limita y se centra.
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-[400px]">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2.5"
        >
          <span
            aria-hidden
            className="size-9 rounded-md bg-primary shadow-accent"
          />
          <span className="text-xl font-semibold tracking-tight text-foreground">
            Rutinas
          </span>
        </Link>

        <div className="rounded-xl border border-border bg-card p-6 shadow-md sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
