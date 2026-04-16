"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Heart, Film, Home, ArrowLeft } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";

export function PremiumNavbar() {
  const { user, loading, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
  };

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  return (
    <>
    {/* Mobile Header */}
    <header className="md:hidden fixed top-0 left-0 right-0 z-50 border-b border-amber-500/20 bg-[hsl(220,20%,4%)]/90 backdrop-blur-xl">
      <div className="flex items-center justify-between h-14 px-4">
        <Link
          href="/"
          className="flex items-center gap-1 text-amber-100/50 hover:text-amber-100 transition-colors"
          aria-label="Voltar ao site"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[10px] font-medium">Site</span>
        </Link>
        <Link href="/" className="flex items-center gap-2">
          <div className="h-12 overflow-hidden flex items-center">
            <img src="/logo_novo.png" alt="MelhorMetro" className="h-36 w-auto" />
          </div>
          <span className="text-[10px] font-semibold text-amber-500/70 tracking-[0.2em] uppercase">
            Premium
          </span>
        </Link>
        <div className="w-12" />
      </div>
    </header>

    {/* Desktop Header */}
    <header className="hidden md:block fixed top-0 left-0 right-0 z-50 border-b border-amber-500/20 bg-[hsl(220,20%,4%)]/90 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-12 overflow-hidden flex items-center">
            <img src="/logo_novo.png" alt="MelhorMetro" className="h-36 w-auto" />
          </div>
          <span className="text-xs font-semibold text-amber-500/70 tracking-[0.2em] uppercase">
            Premium
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm text-amber-100/40 hover:text-amber-100/80 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar ao site
          </Link>
          <Link href="/premium/imoveis" className="text-sm text-amber-100/60 hover:text-amber-100 transition-colors flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
            Imóveis
          </Link>
          <Link href="/premium/tours" className="text-sm text-amber-100/60 hover:text-amber-100 transition-colors flex items-center gap-1">
            <Film className="w-3.5 h-3.5" />
            Tours
          </Link>

          {!loading && user && user.is_premium && (
            <Link href="/premium/favoritos" className="text-sm text-amber-100/60 hover:text-amber-100 transition-colors flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" />
              Favoritos
            </Link>
          )}

          {!loading && (
            <>
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full ring-2 ring-amber-500/30" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-black text-sm font-bold">
                        {getInitial(user.name)}
                      </div>
                    )}
                    <span className="text-sm font-medium text-amber-100/80 max-w-[100px] truncate">
                      {user.name}
                    </span>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-amber-500/20 bg-[hsl(220,20%,7%)]/95 backdrop-blur-sm shadow-lg shadow-amber-500/5 py-1">
                      <div className="px-3 py-2 border-b border-amber-500/10">
                        <p className="text-sm font-medium text-amber-100 truncate">{user.name}</p>
                        <p className="text-xs text-amber-100/40 truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sair
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/premium/login">
                  <Button size="sm" className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-semibold">
                    <LogIn className="w-3.5 h-3.5 mr-1" />
                    Entrar
                  </Button>
                </Link>
              )}
            </>
          )}
        </nav>

      </div>
    </header>
    </>
  );
}
