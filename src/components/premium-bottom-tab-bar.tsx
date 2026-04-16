"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, Home, Crown, User, ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

const publicTabs = [
  { href: "/", icon: ArrowLeft, label: "Site" },
  { href: "/premium", icon: Crown, label: "Premium" },
  { href: "/premium/imoveis", icon: Home, label: "Imóveis" },
  { href: "/premium/login", icon: User, label: "Entrar" },
];

const authedTabs = [
  { href: "/", icon: ArrowLeft, label: "Site" },
  { href: "/premium", icon: Crown, label: "Premium" },
  { href: "/premium/tours", icon: Film, label: "Tours" },
  { href: "/premium/imoveis", icon: Home, label: "Imóveis" },
];

export function PremiumBottomTabBar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const tabs = !loading && user ? authedTabs : publicTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[hsl(220,20%,4%)]/95 backdrop-blur-xl border-t border-amber-500/20 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.href !== "/" && (pathname === tab.href || (tab.href !== "/premium" && pathname.startsWith(tab.href)));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors ${
                isActive ? "text-amber-500" : "text-amber-100/40"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-amber-500" : ""}`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
