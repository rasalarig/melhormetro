"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Users,
  Shield,
  ShieldOff,
  Loader2,
  Crown,
} from "lucide-react";
import Link from "next/link";

interface UserItem {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  provider: string;
  is_admin: boolean;
  is_premium: boolean;
  created_at: string;
}

export default function AdminUsuariosPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/admin/users");
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (err) {
        console.error("Erro ao carregar usuários:", err);
      } finally {
        setLoading(false);
      }
    }
    if (user?.is_admin) fetchUsers();
  }, [user]);

  const handleToggleAdmin = async (userId: number, currentIsAdmin: boolean) => {
    setTogglingId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, is_admin: !currentIsAdmin }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, is_admin: !currentIsAdmin } : u
          )
        );
      }
    } catch (err) {
      console.error("Erro ao alterar admin:", err);
    } finally {
      setTogglingId(null);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("pt-BR");

  if (authLoading || loading) {
    return (
      <div className="pt-16 pb-16 px-4 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user?.is_admin) return null;

  return (
    <div className="pt-16 pb-16 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
              <p className="text-muted-foreground text-sm">
                {users.length} usuários cadastrados
              </p>
            </div>
          </div>
        </div>

        {/* User list */}
        <div className="space-y-3">
          {users.map((u) => (
            <Card
              key={u.id}
              className="p-4 bg-card border-border/50 hover:border-emerald-500/20 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {u.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={u.avatar_url}
                      alt={u.name}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <span className="text-emerald-400 font-semibold text-sm">
                        {u.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">{u.name}</span>
                      {u.is_admin && (
                        <Badge className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          <Shield className="w-3 h-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      {u.is_premium && (
                        <Badge className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/20">
                          <Crown className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                      <span className="truncate">{u.email}</span>
                      <span className="hidden sm:inline">·</span>
                      <span>{u.provider}</span>
                      <span className="hidden sm:inline">·</span>
                      <span>{formatDate(u.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {u.id === user.id ? (
                    <Badge variant="secondary" className="text-xs">Você</Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                      disabled={togglingId === u.id}
                      className={
                        u.is_admin
                          ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                          : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                      }
                    >
                      {togglingId === u.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : u.is_admin ? (
                        <ShieldOff className="w-4 h-4 mr-1" />
                      ) : (
                        <Shield className="w-4 h-4 mr-1" />
                      )}
                      {u.is_admin ? "Remover Admin" : "Tornar Admin"}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
