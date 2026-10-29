import { ImageResponse } from "next/og";

/** Square app icon: a white "K" mark on the brand blue gradient. */
export function brandIcon(size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 55%, #0284c7 100%)",
          color: "white",
          fontSize: size * 0.56,
          fontWeight: 700,
          letterSpacing: -size * 0.02,
        }}
      >
        K
      </div>
    ),
    { width: size, height: size },
  );
}
