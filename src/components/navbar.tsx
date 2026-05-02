"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  SlidersHorizontal, Menu, X, LogIn, LogOut, Heart, Bell, Film,
  DollarSign, Home, Plus, MessageCircle, Users, Crown, Settings,
  UserCircle, Handshake, Building2, ChevronDown, Search, Map, House,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

// Reusable dropdown hook
function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  return { open, setOpen, ref };
}

// Icon button with optional badge
function IconLink({ href, icon: Icon, badge, label, onClick }: {
  href: string; icon: React.ElementType; badge?: number; label: string; onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
      title={label}
      onClick={onClick}
    >
      <Icon className="w-4 h-4" />
      {badge != null && badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-rose-500 text-white text-[8px] font-bold leading-none">
          {badge > 99 ? "99" : badge}
        </span>
      )}
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  if (pathname.startsWith("/premium")) return null;

  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const [alertCount, setAlertCount] = useState(0);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  const userDd = useDropdown();
  const exploreDd = useDropdown();
  const sellerDd = useDropdown();

  const isAutonomo = user?.profiles?.some((p) => p.profile_type === "autonomo") ?? false;
  const isAdmin = user?.is_admin ?? false;

  // Fetch notifications
  useEffect(() => {
    if (!user) { setAlertCount(0); setUnreadMsgCount(0); return; }
    const fetchAll = async () => {
      try {
        const [alertRes, msgRes] = await Promise.all([
          fetch("/api/alerts/notifications"),
          fetch("/api/conversations/unread"),
        ]);
        if (alertRes.ok) { const d = await alertRes.json(); setAlertCount(d.unseen_count || 0); }
        if (msgRes.ok) { const d = await msgRes.json(); setUnreadMsgCount(d.unread_count || 0); }
      } catch {}
    };
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    userDd.setOpen(false);
    setMobileOpen(false);
  };

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  return (
    <>
      {/* ───────── Mobile Header ───────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between h-14 px-4">
          <Link href="/" className="h-12 overflow-hidden flex items-center">
            <img src="/logo_novo.png" alt="MelhorMetro" className="h-36 w-auto" />
          </Link>

          <div className="flex items-center gap-1">
            {!loading && user && (
              <>
                <IconLink href="/mensagens" icon={MessageCircle} badge={unreadMsgCount} label="Mensagens" />
                <IconLink href="/alertas" icon={Bell} badge={alertCount} label="Alertas" />
              </>
            )}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-border/40 bg-background/95 backdrop-blur-xl max-h-[70vh] overflow-y-auto">
            <nav className="px-4 py-4 flex flex-col gap-1">
              {/* Explorar */}
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 px-2 pt-2">Explorar</p>
              <Link href="/" className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-accent/50 text-sm" onClick={() => setMobileOpen(false)}>
                <House className="w-4 h-4 text-muted-foreground" /> Início
              </Link>
              <Link href="/imoveis" className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-accent/50 text-sm" onClick={() => setMobileOpen(false)}>
                <Home className="w-4 h-4 text-muted-foreground" /> Imóveis
              </Link>
              <Link href="/busca" className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-accent/50 text-sm" onClick={() => setMobileOpen(false)}>
                <Search className="w-4 h-4 text-muted-foreground" /> Busca Inteligente
              </Link>
              <Link href="/tours" className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-accent/50 text-sm" onClick={() => setMobileOpen(false)}>
                <Film className="w-4 h-4 text-muted-foreground" /> Tours
              </Link>

              {!loading && user && (
                <>
                  {/* Minha conta */}
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 px-2 pt-4">Minha conta</p>
                  <Link href="/favoritos" className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-accent/50 text-sm" onClick={() => setMobileOpen(false)}>
                    <Heart className="w-4 h-4 text-muted-foreground" /> Favoritos
                  </Link>
                  <Link href="/alertas" className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-accent/50 text-sm" onClick={() => setMobileOpen(false)}>
                    <Bell className="w-4 h-4 text-muted-foreground" /> Alertas
                    {alertCount > 0 && <span className="ml-auto inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-white text-[9px] font-bold">{alertCount > 99 ? "99" : alertCount}</span>}
                  </Link>
                  <Link href="/mensagens" className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-accent/50 text-sm" onClick={() => setMobileOpen(false)}>
                    <MessageCircle className="w-4 h-4 text-muted-foreground" /> Mensagens
                    {unreadMsgCount > 0 && <span className="ml-auto inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white text-[9px] font-bold">{unreadMsgCount > 99 ? "99" : unreadMsgCount}</span>}
                  </Link>
                  <Link href="/perfil" className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-accent/50 text-sm" onClick={() => setMobileOpen(false)}>
                    <UserCircle className="w-4 h-4 text-muted-foreground" /> Meu Perfil
                  </Link>

                  {/* Vender */}
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 px-2 pt-4">Vender</p>
                  <Link href="/vender/imovel" className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-accent/50 text-sm text-emerald-400 font-medium" onClick={() => setMobileOpen(false)}>
                    <Plus className="w-4 h-4" /> Cadastrar Imóvel
                  </Link>
                  <Link href="/vender/meus-imoveis" className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-accent/50 text-sm" onClick={() => setMobileOpen(false)}>
                    <Home className="w-4 h-4 text-muted-foreground" /> Meus Imóveis
                  </Link>
                  <Link href="/vender/leads" className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-accent/50 text-sm" onClick={() => setMobileOpen(false)}>
                    <Users className="w-4 h-4 text-muted-foreground" /> Leads
                  </Link>

                  {isAutonomo && (
                    <Link href="/autonomo" className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-accent/50 text-sm text-teal-400 font-medium" onClick={() => setMobileOpen(false)}>
                      <Handshake className="w-4 h-4" /> Comercializar
                    </Link>
                  )}
                </>
              )}

              {/* Extras */}
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 px-2 pt-4">Extras</p>
              <Link href="/premium" className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-accent/50 text-sm text-amber-500 font-medium" onClick={() => setMobileOpen(false)}>
                <Crown className="w-4 h-4" /> Premium
              </Link>
              {!loading && !user && (
                <Link href="/para-voce" className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-accent/50 text-sm" onClick={() => setMobileOpen(false)}>
                  <DollarSign className="w-4 h-4 text-muted-foreground" /> Planos
                </Link>
              )}
              {isAdmin && (
                <Link href="/admin" className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-accent/50 text-sm text-rose-400 font-medium" onClick={() => setMobileOpen(false)}>
                  <Settings className="w-4 h-4" /> Admin
                </Link>
              )}

              {/* Auth */}
              <div className="border-t border-border/40 mt-3 pt-3">
                {!loading && user ? (
                  <div className="flex items-center justify-between px-2 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-medium">
                        {getInitial(user.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <button onClick={handleLogout} className="text-red-400 hover:text-red-300 transition-colors">
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : !loading ? (
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button size="sm" className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
                      <LogIn className="w-3.5 h-3.5 mr-1" /> Entrar
                    </Button>
                  </Link>
                ) : null}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ───────── Desktop Header ───────── */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">

          {/* Left: Logo */}
          <Link href="/" className="flex items-center flex-shrink-0 h-12 overflow-hidden">
            <img src="/logo_novo.png" alt="MelhorMetro" className="h-36 w-auto" />
          </Link>

          {/* Center: Nav groups */}
          <nav className="flex items-center gap-1 flex-1 justify-center">

            {/* Explorar dropdown */}
            <div className="relative" ref={exploreDd.ref}>
              <button
                onClick={() => exploreDd.setOpen(!exploreDd.open)}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-all ${exploreDd.open ? "bg-accent/60 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/30"}`}
              >
                <Map className="w-3.5 h-3.5" />
                Explorar
                <ChevronDown className={`w-3 h-3 transition-transform ${exploreDd.open ? "rotate-180" : ""}`} />
              </button>
              {exploreDd.open && (
                <div className="absolute left-0 top-full mt-1 w-56 rounded-xl border border-border/50 bg-card/95 backdrop-blur-lg shadow-xl py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  <Link href="/" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent/50 transition-colors" onClick={() => exploreDd.setOpen(false)}>
                    <House className="w-4 h-4 text-emerald-400" />
                    <div><p className="font-medium">Início</p><p className="text-[11px] text-muted-foreground">Página inicial</p></div>
                  </Link>
                  <div className="border-t border-border/30 my-1" />
                  <Link href="/imoveis" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent/50 transition-colors" onClick={() => exploreDd.setOpen(false)}>
                    <Home className="w-4 h-4 text-emerald-400" />
                    <div><p className="font-medium">Imóveis</p><p className="text-[11px] text-muted-foreground">Todos os imóveis</p></div>
                  </Link>
                  <Link href="/tours" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent/50 transition-colors" onClick={() => exploreDd.setOpen(false)}>
                    <Film className="w-4 h-4 text-violet-400" />
                    <div><p className="font-medium">Tours</p><p className="text-[11px] text-muted-foreground">Vídeos dos imóveis</p></div>
                  </Link>
                  <div className="border-t border-border/30 my-1" />
                  <Link href="/premium" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent/50 transition-colors" onClick={() => exploreDd.setOpen(false)}>
                    <Crown className="w-4 h-4 text-amber-400" />
                    <div><p className="font-medium text-amber-400">Premium</p><p className="text-[11px] text-muted-foreground">Área exclusiva</p></div>
                  </Link>
                </div>
              )}
            </div>

            {/* Busca - direct link */}
            <Link href="/busca" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-all">
              <Search className="w-3.5 h-3.5" />
              Busca IA
            </Link>

            {/* Vender dropdown (authenticated) */}
            {!loading && user && (
              <div className="relative" ref={sellerDd.ref}>
                <button
                  onClick={() => sellerDd.setOpen(!sellerDd.open)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-all ${sellerDd.open ? "bg-emerald-500/15 text-emerald-400" : "text-emerald-400 hover:bg-emerald-500/10"} font-medium`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Vender
                  <ChevronDown className={`w-3 h-3 transition-transform ${sellerDd.open ? "rotate-180" : ""}`} />
                </button>
                {sellerDd.open && (
                  <div className="absolute left-0 top-full mt-1 w-56 rounded-xl border border-border/50 bg-card/95 backdrop-blur-lg shadow-xl py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    <Link href="/vender/imovel" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent/50 transition-colors" onClick={() => sellerDd.setOpen(false)}>
                      <Plus className="w-4 h-4 text-emerald-400" />
                      <div><p className="font-medium text-emerald-400">Cadastrar Imóvel</p><p className="text-[11px] text-muted-foreground">Novo anúncio</p></div>
                    </Link>
                    <Link href="/vender/meus-imoveis" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent/50 transition-colors" onClick={() => sellerDd.setOpen(false)}>
                      <Home className="w-4 h-4 text-muted-foreground" />
                      <div><p className="font-medium">Meus Imóveis</p><p className="text-[11px] text-muted-foreground">Gerenciar anúncios</p></div>
                    </Link>
                    <Link href="/vender/leads" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent/50 transition-colors" onClick={() => sellerDd.setOpen(false)}>
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <div><p className="font-medium">Leads</p><p className="text-[11px] text-muted-foreground">Contatos interessados</p></div>
                    </Link>
                    {isAutonomo && (
                      <>
                        <div className="border-t border-border/30 my-1" />
                        <Link href="/autonomo" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent/50 transition-colors" onClick={() => sellerDd.setOpen(false)}>
                          <Handshake className="w-4 h-4 text-teal-400" />
                          <div><p className="font-medium text-teal-400">Comercializar</p><p className="text-[11px] text-muted-foreground">Imóveis para revenda</p></div>
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Quero Vender (unauthenticated) */}
            {!loading && !user && (
              <>
                <Link href="/para-voce" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-all">
                  <DollarSign className="w-3.5 h-3.5" />
                  Planos
                </Link>
                <Link href="/vender">
                  <Button size="sm" variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-sm">
                    <DollarSign className="w-3.5 h-3.5 mr-1" />
                    Quero Vender
                  </Button>
                </Link>
              </>
            )}
          </nav>

          {/* Right: Icons + User */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {!loading && user && (
              <>
                <IconLink href="/favoritos" icon={Heart} label="Favoritos" />
                <IconLink href="/alertas" icon={Bell} badge={alertCount} label="Alertas" />
                <IconLink href="/mensagens" icon={MessageCircle} badge={unreadMsgCount} label="Mensagens" />

                {isAdmin && (
                  <Link href="/admin" className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all" title="Admin">
                    <Settings className="w-4 h-4" />
                  </Link>
                )}

                <div className="w-px h-6 bg-border/40 mx-1.5" />

                {/* User dropdown */}
                <div className="relative" ref={userDd.ref}>
                  <button
                    onClick={() => userDd.setOpen(!userDd.open)}
                    className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-accent/30 transition-all"
                  >
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.name} className="w-7 h-7 rounded-full" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-medium">
                        {getInitial(user.name)}
                      </div>
                    )}
                    <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${userDd.open ? "rotate-180" : ""}`} />
                  </button>

                  {userDd.open && (
                    <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-border/50 bg-card/95 backdrop-blur-lg shadow-xl py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="px-4 py-3 border-b border-border/40">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <Link href="/perfil" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-accent/50 transition-colors" onClick={() => userDd.setOpen(false)}>
                        <UserCircle className="w-4 h-4 text-muted-foreground" /> Meu Perfil
                      </Link>
                      <Link href="/vender/meus-imoveis" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-accent/50 transition-colors" onClick={() => userDd.setOpen(false)}>
                        <Home className="w-4 h-4 text-muted-foreground" /> Meus Imóveis
                      </Link>
                      <div className="border-t border-border/40 my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-accent/50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sair
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {!loading && !user && (
              <Link href="/login">
                <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm">
                  <LogIn className="w-3.5 h-3.5 mr-1.5" />
                  Entrar
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
