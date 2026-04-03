import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "Stryktips Analys",
  description: "Professionell analys och rekommendationer för Stryktips",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv">
      <body className="min-h-screen bg-surface text-slate-200 antialiased">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
        <footer className="border-t border-slate-700 mt-16 py-8 text-center text-slate-500 text-sm">
          © {new Date().getFullYear()} Stryktips Analys — Spela ansvarsfullt
        </footer>
      </body>
    </html>
  );
}
