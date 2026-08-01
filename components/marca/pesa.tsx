/**
 * La marca de la app: una pesa, dibujada con cajas.
 *
 * La usan los iconos generados (app/icon.tsx y app/apple-icon.tsx), que se
 * renderizan con Satori vía ImageResponse. Satori entiende un subconjunto de
 * CSS —flexbox, colores, radios— y no ejecuta JavaScript, así que la figura se
 * arma con tres rectángulos y no con un SVG con paths ni con un ícono de
 * lucide.
 *
 * Todos los `display: "flex"` son necesarios: Satori no asume el display de un
 * div con hijos y falla si no está explícito.
 */
function Pesa({ lado }: { lado: number }) {
  const disco = { ancho: lado * 0.17, alto: lado * 0.44, radio: lado * 0.05 };
  const barra = { ancho: lado * 0.2, alto: lado * 0.11 };

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#16714c",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            width: disco.ancho,
            height: disco.alto,
            borderRadius: disco.radio,
            backgroundColor: "#ffffff",
          }}
        />
        <div
          style={{
            width: barra.ancho,
            height: barra.alto,
            backgroundColor: "#ffffff",
          }}
        />
        <div
          style={{
            width: disco.ancho,
            height: disco.alto,
            borderRadius: disco.radio,
            backgroundColor: "#ffffff",
          }}
        />
      </div>
    </div>
  );
}

export { Pesa };
