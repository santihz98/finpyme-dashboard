import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
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
      <body className="antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1A2A3A',
              color: '#E8EDF2',
              border: '1px solid #243447',
              fontSize: '13px',
            },
            success: { iconTheme: { primary: '#00C896', secondary: '#0F1923' } },
            error: { iconTheme: { primary: '#FF5C5C', secondary: '#0F1923' } },
          }}
        />
      </body>
    </html>
  );
}
