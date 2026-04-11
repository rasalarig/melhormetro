"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShieldAlert, Loader2 } from "lucide-react";
import Link from "next/link";

interface Violation {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  conversation_id: number;
  property_title: string;
  attempted_message: string;
  violation_type: string;
  created_at: string;
}

export default function ViolacoesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [violations, setViolations] = useState<Violation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetch_data() {
      try {
        const res = await fetch("/api/admin/violations");
        if (res.ok) {
          const data = await res.json();
          setViolations(data.violations);
          setTotal(data.total);
        }
      } catch (err) {
        console.error("Erro ao carregar violações:", err);
      } finally {
        setLoading(false);
      }
    }
    if (user?.is_admin) fetch_data();
  }, [user]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

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
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Tentativas de Violação</h1>
              <p className="text-muted-foreground text-sm">
                {total} tentativa(s) de compartilhar contato registrada(s)
              </p>
            </div>
          </div>
        </div>

        {violations.length === 0 ? (
          <Card className="p-12 text-center bg-card border-border/50">
            <ShieldAlert className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma tentativa de violação registrada.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {violations.map((v) => (
              <Card key={v.id} className="p-4 bg-card border-border/50">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{v.user_name}</span>
                    <span className="text-xs text-muted-foreground">{v.user_email}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{formatDate(v.created_at)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Imóvel: <span className="text-foreground">{v.property_title}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                    <p className="text-sm text-red-300 break-words">&ldquo;{v.attempted_message}&rdquo;</p>
                  </div>
                  <Badge className="text-xs w-fit bg-red-500/10 text-red-400 border-red-500/20">
                    {v.violation_type}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
