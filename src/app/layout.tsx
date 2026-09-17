import type { Metadata } from "next";
import { Inter, Anta } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { AuthProvider } from "@/components/auth/AuthProvider";
import "./globals.css";

const actualFont = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const brandFont = Anta({
  variable: "--font-anta",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Provalyze",
  description: "PFC realizado para engenharia de software",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${actualFont.variable} ${brandFont.variable} antialiased font-sans`}
      >
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}