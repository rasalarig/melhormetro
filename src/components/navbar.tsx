"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, Plus, Menu, X, Users, LogIn, LogOut, Heart, Bell, Film } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import Image from "next/image";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) {
      setAlertCount(0);
      return;
    }
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/alerts/notifications");
        if (res.ok) {
          const data = await res.json();
          setAlertCount(data.unseen_count || 0);
        }
      } catch {
        // ignore
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    setMobileOpen(false);
  };

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center group">
          <Image src="/logo.png" alt="PropView" width={96} height={32} className="h-8 w-auto" priority />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/imoveis" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Imoveis
          </Link>
          <Link href="/busca" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <Search className="w-3.5 h-3.5" />
            Busca IA
          </Link>
          <Link href="/admin/leads" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            Leads
          </Link>

          {!loading && user && (
            <>
              <Link href="/reels" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <Film className="w-3.5 h-3.5" />
                Reels
              </Link>
              <Link href="/favoritos" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <Heart className="w-3.5 h-3.5" />
                Favoritos
              </Link>
              <Link href="/alertas" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 relative">
                <Bell className="w-3.5 h-3.5" />
                Alertas
                {alertCount > 0 && (
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold leading-none">
                    {alertCount > 99 ? "99" : alertCount}
                  </span>
                )}
              </Link>
            </>
          )}

          <Link href="/admin">
            <Button variant="outline" size="sm" className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Cadastrar
            </Button>
          </Link>

          {/* Auth section */}
          {!loading && (
            <>
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-medium">
                        {getInitial(user.name)}
                      </div>
                    )}
                    <span className="text-sm font-medium max-w-[100px] truncate">
                      {user.name}
                    </span>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-border/50 bg-card/95 backdrop-blur-sm shadow-lg py-1">
                      <div className="px-3 py-2 border-b border-border/50">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-accent/50 transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sair
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login">
                  <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
                    <LogIn className="w-3.5 h-3.5 mr-1" />
                    Entrar
                  </Button>
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Mobile Toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-3">
            <Link href="/imoveis" className="text-sm py-2" onClick={() => setMobileOpen(false)}>Imoveis</Link>
            <Link href="/busca" className="text-sm py-2" onClick={() => setMobileOpen(false)}>Busca IA</Link>
            <Link href="/admin/leads" className="text-sm py-2" onClick={() => setMobileOpen(false)}>Leads</Link>
            <Link href="/admin" className="text-sm py-2" onClick={() => setMobileOpen(false)}>Cadastrar Imovel</Link>

            {!loading && user && (
              <>
                <div className="border-t border-border/40 my-1" />
                <Link href="/reels" className="text-sm py-2 flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                  <Film className="w-3.5 h-3.5" /> Reels
                </Link>
                <Link href="/favoritos" className="text-sm py-2 flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                  <Heart className="w-3.5 h-3.5" /> Favoritos
                </Link>
                <Link href="/alertas" className="text-sm py-2 flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                  <Bell className="w-3.5 h-3.5" /> Alertas
                  {alertCount > 0 && (
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold leading-none">
                      {alertCount > 99 ? "99" : alertCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            <div className="border-t border-border/40 my-1" />

            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-medium">
                        {getInitial(user.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button size="sm" className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
                      <LogIn className="w-3.5 h-3.5 mr-1" />
                      Entrar
                    </Button>
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
