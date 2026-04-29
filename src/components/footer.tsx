"use client";

import Link from "next/link";
import Image from "next/image";
import { Crown } from "lucide-react";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/premium")) return null;
  return (
    <footer className="hidden md:block border-t border-border/40 bg-background/50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <div className="h-12 w-48 overflow-hidden relative">
              <Image
                src="/logo_novo.png"
                alt="MelhorMetro"
                width={1536}
                height={1024}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-auto"
              />
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/imoveis" className="hover:text-foreground transition-colors">Imóveis</Link>
            <Link href="/busca" className="hover:text-foreground transition-colors">Busca IA</Link>
            <Link href="/premium" className="hover:text-amber-400 transition-colors text-amber-500 flex items-center gap-1">
              <Crown className="w-3 h-3" />
              Premium
            </Link>
            <Link href="/admin" className="hover:text-foreground transition-colors">Admin</Link>
          </div>
          <div className="flex flex-col items-center md:items-end gap-1">
            <p className="text-xs text-muted-foreground">
              &copy; 2026 MelhorMetro. Powered by AI.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <Link href="/privacidade" className="hover:text-foreground transition-colors">Política de Privacidade</Link>
              <span className="text-border">|</span>
              <Link href="/termos" className="hover:text-foreground transition-colors">Termos de Uso</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
