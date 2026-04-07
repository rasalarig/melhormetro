"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, Search, Heart, DollarSign, User } from "lucide-react";

const tabs = [
  { href: "/", icon: Film, label: "Reels" },
  { href: "/busca", icon: Search, label: "Busca IA" },
  { href: "/vender", icon: DollarSign, label: "Vender" },
  { href: "/favoritos", icon: Heart, label: "Favoritos" },
  { href: "/login", icon: User, label: "Perfil" },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-xl border-t border-border/40 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors ${
                isActive ? "text-emerald-500" : "text-muted-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-emerald-500" : ""}`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
