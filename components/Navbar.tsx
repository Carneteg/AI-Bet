"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const links = [
  { href: "/", label: "Hem" },
  { href: "/live", label: "🟢 Live" },
  { href: "/matches", label: "Matcher" },
  { href: "/coupon", label: "Kupong" },
  { href: "/upload", label: "📸 Analysera foto" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-slate-700/50 bg-surface/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">⚽</span>
          <span className="font-extrabold text-lg text-gradient">
            StryktipsAI
          </span>
        </Link>

        <div className="flex gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "px-4 py-2 rounded-lg text-sm font-medium transition",
                pathname === link.href
                  ? "bg-brand/20 text-brand"
                  : link.href === "/upload"
                  ? "text-accent-yellow hover:text-accent-yellow/80 hover:bg-accent-yellow/5"
                  : "text-slate-400 hover:text-slate-200 hover:bg-surface-card"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
