import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BachePro — Stores Dublanc",
  description: "Patronage et chiffrage de baches sur mesure",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 px-2 rounded-md bg-slate-800 flex items-center">
                <img src="/dublanc_logo_2018.png" alt="Stores Dublanc" className="h-6 w-auto" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight leading-none">BachePro</h1>
                <span className="text-[10px] text-muted-foreground leading-none">ALS Confort — Stores Dublanc — Aire-sur-l&apos;Adour</span>
              </div>
            </div>
          </div>
        </header>
        <main className="min-h-[calc(100vh-57px)]">
          {children}
        </main>
      </body>
    </html>
  );
}
