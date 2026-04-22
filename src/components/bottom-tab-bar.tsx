"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, SlidersHorizontal, Heart, Home, User, MessageCircle, LogOut, Users } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useState, useEffect, useRef } from "react";

const publicTabs = [
  { href: "/tours", icon: Film, label: "Tours" },
  { href: "/busca", icon: SlidersHorizontal, label: "Filtro" },
  { href: "/login", icon: User, label: "Entrar" },
];

const authedTabs = [
  { href: "/tours", icon: Film, label: "Tours" },
  { href: "/busca", icon: SlidersHorizontal, label: "Filtro" },
  { href: "/favoritos", icon: Heart, label: "Favoritos" },
  { href: "/vender/meus-imoveis", icon: Home, label: "Imóveis" },
  { href: "#profile", icon: User, label: "Perfil" },
];

export function BottomTabBar() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  if (pathname.startsWith("/premium")) return null;
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setUnreadMsgCount(0);
      return;
    }
    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/conversations/unread");
        if (res.ok) {
          const data = await res.json();
          setUnreadMsgCount(data.unread_count || 0);
        }
      } catch {
        // ignore
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Close profile popup when clicking outside
  useEffect(() => {
    if (!showProfile) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfile]);

  const tabs = !loading && user ? authedTabs : publicTabs;

  return (
    <>
      {showProfile && user && (
        <div className="fixed bottom-16 left-0 right-0 z-50 md:hidden touch-none">
          <div
            ref={profileRef}
            className="p-4 bg-card/95 backdrop-blur-xl border-t border-border/40"
          >
            <div className="flex items-center gap-3 mb-4">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-medium">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-medium text-sm text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Link
              href="/mensagens"
              onClick={() => setShowProfile(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-sm font-medium mb-2"
            >
              <MessageCircle className="w-4 h-4" />
              Mensagens
              {unreadMsgCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {unreadMsgCount > 99 ? "99" : unreadMsgCount}
                </span>
              )}
            </Link>
            <Link
              href="/vender/leads"
              onClick={() => setShowProfile(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-sm font-medium mb-2"
            >
              <Users className="w-4 h-4" />
              Leads
            </Link>
            <button
              onClick={async () => {
                await logout();
                setShowProfile(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      )}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-xl border-t border-border/40 safe-area-bottom touch-none">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          if (tab.href === "#profile") {
            return (
              <button
                key="profile"
                onClick={() => setShowProfile(!showProfile)}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors ${
                  showProfile ? "text-emerald-500" : "text-muted-foreground"
                }`}
              >
                <span className="relative">
                  <Icon className={`w-5 h-5 ${showProfile ? "text-emerald-500" : ""}`} />
                  {unreadMsgCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold leading-none">
                      {unreadMsgCount > 99 ? "99" : unreadMsgCount}
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          }

          const isActive = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
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
    </>
  );
}
