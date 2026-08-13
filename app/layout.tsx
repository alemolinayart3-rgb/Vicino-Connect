import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vicino Connect — Tu bienestar, acompañado",
  description: "Tu proceso de salud mental, tu equipo y tus próximos pasos en un espacio seguro.",
  icons: { icon: "/vicino-mark.png", apple: "/vicino-mark.png" },
  openGraph: {
    title: "Vicino Connect",
    description: "Tu bienestar, acompañado",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vicino Connect",
    description: "Tu bienestar, acompañado",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
