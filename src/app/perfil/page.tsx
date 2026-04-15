"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Home, Briefcase, Building2, CheckCircle, PlusCircle, Trash2, Loader2 } from "lucide-react";

interface UserProfile {
  profile_type: string;
  creci?: string | null;
  trade_name?: string | null;
  cnpj?: string | null;
  area_of_operation?: string | null;
}

const PROFILE_META: Record<string, { label: string; description: string; icon: React.ReactNode; color: string }> = {
  comprador: {
    label: "Comprador",
    description: "Explore imóveis, assista tours, receba alertas personalizados e entre em contato com vendedores.",
    icon: <User className="w-6 h-6" />,
    color: "text-emerald-400",
  },
  proprietario: {
    label: "Proprietário",
    description: "Cadastre seus imóveis para venda ou locação e gerencie seus leads diretamente na plataforma.",
    icon: <Home className="w-6 h-6" />,
    color: "text-blue-400",
  },
  autonomo: {
    label: "Autônomo",
    description: "Corretor autônomo com CRECI. Gerencie imóveis de terceiros e amplie sua carteira de clientes.",
    icon: <Briefcase className="w-6 h-6" />,
    color: "text-violet-400",
  },
  imobiliaria: {
    label: "Imobiliária",
    description: "Conta empresarial para imobiliárias. Gerencie equipes, portfólios e campanhas em um só lugar.",
    icon: <Building2 className="w-6 h-6" />,
    color: "text-amber-400",
  },
};

const PROFILE_ORDER = ["comprador", "proprietario", "autonomo", "imobiliaria"];

export default function PerfilPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [fetchingProfiles, setFetchingProfiles] = useState(true);
  const [activatingType, setActivatingType] = useState<string | null>(null);
  const [removingType, setRemovingType] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  const fetchProfiles = async () => {
    setFetchingProfiles(true);
    try {
      const res = await fetch("/api/user/profiles");
      if (res.ok) {
        const data = await res.json();
        setProfiles(data.profiles || []);
      }
    } catch {
      // ignore
    } finally {
      setFetchingProfiles(false);
    }
  };

  const hasProfile = (type: string) => profiles.some((p) => p.profile_type === type);

  const getProfile = (type: string) => profiles.find((p) => p.profile_type === type);

  const handleActivate = async (type: string) => {
    // comprador never needs activation form (handled at registration)
    // proprietario goes to seller terms flow
    if (type === "proprietario") {
      router.push("/vender");
      return;
    }

    setActivatingType(type);
    setFormErrors({});
  };

  const handleFormSubmit = async (type: string) => {
    const errors: Record<string, string> = {};

    if (type === "autonomo") {
      if (!formData.creci?.trim()) errors.creci = "CRECI é obrigatório";
    }
    if (type === "imobiliaria") {
      if (!formData.creci?.trim()) errors.creci = "CRECI é obrigatório";
      if (!formData.trade_name?.trim()) errors.trade_name = "Nome fantasia é obrigatório";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const res = await fetch("/api/user/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_type: type,
          creci: formData.creci || undefined,
          trade_name: formData.trade_name || undefined,
          cnpj: formData.cnpj || undefined,
          area_of_operation: formData.area_of_operation || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormErrors({ _general: data.error || "Erro ao ativar perfil" });
        return;
      }

      setActivatingType(null);
      setFormData({});
      setFormErrors({});
      await fetchProfiles();
    } catch {
      setFormErrors({ _general: "Erro ao ativar perfil. Tente novamente." });
    }
  };

  const handleRemove = async (type: string) => {
    if (type === "comprador") return;
    setRemovingType(type);
    try {
      await fetch("/api/user/profiles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_type: type }),
      });
      await fetchProfiles();
    } finally {
      setRemovingType(null);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <main className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Meu Perfil</h1>
          <p className="text-muted-foreground text-sm">
            Gerencie os perfis associados à sua conta. Você pode ter mais de um perfil ativo ao mesmo tempo.
          </p>
        </div>

        {/* User info card */}
        <Card className="mb-6 border-border/50 bg-card/80">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-lg font-semibold shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate">{user.name}</p>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {profiles.map((p) => (
                    <Badge
                      key={p.profile_type}
                      variant="outline"
                      className="text-[11px] px-1.5 py-0 border-emerald-500/40 text-emerald-400"
                    >
                      {PROFILE_META[p.profile_type]?.label || p.profile_type}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile cards */}
        {fetchingProfiles ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {PROFILE_ORDER.map((type) => {
              const meta = PROFILE_META[type];
              const active = hasProfile(type);
              const profile = getProfile(type);
              const isActivating = activatingType === type;
              const isRemoving = removingType === type;
              const isComprador = type === "comprador";

              return (
                <Card
                  key={type}
                  className={`border-border/50 bg-card/80 transition-all ${active ? "border-emerald-500/30" : ""}`}
                >
                  <CardHeader className="pb-3 pt-4 px-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`${meta.color} shrink-0`}>{meta.icon}</div>
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {meta.label}
                            {active && (
                              <CheckCircle className="w-4 h-4 text-emerald-500 inline" />
                            )}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            {meta.description}
                          </p>
                        </div>
                      </div>

                      {/* Action button */}
                      {!active && !isActivating && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs"
                          onClick={() => handleActivate(type)}
                        >
                          <PlusCircle className="w-3.5 h-3.5 mr-1" />
                          Ativar
                        </Button>
                      )}

                      {active && !isComprador && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="shrink-0 text-muted-foreground hover:text-red-400 text-xs"
                          onClick={() => handleRemove(type)}
                          disabled={isRemoving}
                        >
                          {isRemoving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      )}

                      {isComprador && (
                        <Badge variant="outline" className="shrink-0 text-[11px] px-2 border-emerald-500/30 text-emerald-500">
                          Padrão
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  {/* Show profile details when active (non-comprador) */}
                  {active && profile && (profile.creci || profile.trade_name || profile.area_of_operation) && (
                    <CardContent className="pt-0 pb-4 px-5">
                      <div className="bg-background/40 rounded-md px-3 py-2 text-xs text-muted-foreground space-y-1 border border-border/30">
                        {profile.creci && <p><span className="text-foreground/60">CRECI:</span> {profile.creci}</p>}
                        {profile.trade_name && <p><span className="text-foreground/60">Nome fantasia:</span> {profile.trade_name}</p>}
                        {profile.cnpj && <p><span className="text-foreground/60">CNPJ:</span> {profile.cnpj}</p>}
                        {profile.area_of_operation && <p><span className="text-foreground/60">Área de atuação:</span> {profile.area_of_operation}</p>}
                      </div>
                    </CardContent>
                  )}

                  {/* Inline activation form */}
                  {isActivating && (
                    <CardContent className="pt-0 pb-4 px-5">
                      <div className="border-t border-border/40 pt-4 space-y-3">
                        {formErrors._general && (
                          <p className="text-xs text-red-400">{formErrors._general}</p>
                        )}

                        {(type === "autonomo" || type === "imobiliaria") && (
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">
                              CRECI <span className="text-red-400">*</span>
                            </label>
                            <Input
                              placeholder="Número do CRECI"
                              value={formData.creci || ""}
                              onChange={(e) => setFormData((prev) => ({ ...prev, creci: e.target.value }))}
                              className={`h-8 text-sm ${formErrors.creci ? "border-red-500" : ""}`}
                            />
                            {formErrors.creci && (
                              <p className="text-[11px] text-red-400 mt-0.5">{formErrors.creci}</p>
                            )}
                          </div>
                        )}

                        {type === "autonomo" && (
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">
                              Área de atuação
                            </label>
                            <Input
                              placeholder="Ex: São Paulo - SP, Zona Oeste"
                              value={formData.area_of_operation || ""}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, area_of_operation: e.target.value }))
                              }
                              className="h-8 text-sm"
                            />
                          </div>
                        )}

                        {type === "imobiliaria" && (
                          <>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">
                                Nome fantasia <span className="text-red-400">*</span>
                              </label>
                              <Input
                                placeholder="Nome da imobiliária"
                                value={formData.trade_name || ""}
                                onChange={(e) =>
                                  setFormData((prev) => ({ ...prev, trade_name: e.target.value }))
                                }
                                className={`h-8 text-sm ${formErrors.trade_name ? "border-red-500" : ""}`}
                              />
                              {formErrors.trade_name && (
                                <p className="text-[11px] text-red-400 mt-0.5">{formErrors.trade_name}</p>
                              )}
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">CNPJ</label>
                              <Input
                                placeholder="00.000.000/0001-00"
                                value={formData.cnpj || ""}
                                onChange={(e) =>
                                  setFormData((prev) => ({ ...prev, cnpj: e.target.value }))
                                }
                                className="h-8 text-sm"
                              />
                            </div>
                          </>
                        )}

                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs h-8"
                            onClick={() => handleFormSubmit(type)}
                          >
                            Confirmar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-8"
                            onClick={() => {
                              setActivatingType(null);
                              setFormData({});
                              setFormErrors({});
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
