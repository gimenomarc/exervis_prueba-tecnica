import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Exervis Mail Triage | Gestión Inteligente de Correo",
  description:
    "Sistema de triaje y gestión automática de correos electrónicos potenciado por IA. Clasifica, analiza y redirige tu bandeja de entrada de forma inteligente.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="noise-bg min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
