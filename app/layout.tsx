import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinPyme Dashboard",
  description: "AI-powered financial dashboard for Latin American SMEs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
