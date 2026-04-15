"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Loader2, Handshake, MapPin, Maximize } from "lucide-react";
import Link from "next/link";

interface ResaleProperty {
  id: number;
  title: string;
  description: string;
  price: number;
  area: number;
  type: string;
  city: string;
  state: string;
  neighborhood: string | null;
  allow_resale: boolean;
  resale_commission_percent: number | null;
  images: { id: number; filename: string; is_cover: number }[];
  seller_user_id?: number | null;
}

export default function AutonomoPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [properties, setProperties] = useState<ResaleProperty[]>([]);
  const [loadingProps, setLoadingProps] = useState(true);
  const [contactingId, setContactingId] = useState<number | null>(null);
  const [contactedIds, setContactedIds] = useState<Set<number>>(new Set());

  const isAutonomo = user?.profiles?.some((p) => p.profile_type === "autonomo") ?? false;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!isAutonomo) {
      router.replace("/perfil");
      return;
    }
    fetchProperties();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, isAutonomo]);

  async function fetchProperties() {
    setLoadingProps(true);
    try {
      const res = await fetch("/api/properties?allow_resale=true");
      if (res.ok) {
        const data = await res.json();
        setProperties(data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingProps(false);
    }
  }

  async function handleContact(property: ResaleProperty) {
    if (!user || !property.seller_user_id) return;
    setContactingId(property.id);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: property.id,
          other_user_id: property.seller_user_id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setContactedIds((prev) => { const next = new Set(Array.from(prev)); next.add(property.id); return next; });
        router.push(`/mensagens?conversation=${data.conversation?.id ?? ""}`);
      }
    } catch {
      // ignore
    } finally {
      setContactingId(null);
    }
  }

  function formatPrice(value: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(value);
  }

  function getCoverImage(property: ResaleProperty): string | null {
    const cover = property.images?.find((img) => img.is_cover === 1);
    const img = cover || property.images?.[0];
    if (!img) return null;
    const filename = img.filename;
    if (!filename) return null;
    if (filename.startsWith("http")) return filename;
    return `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? ""}/${filename}`;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="container mx-auto px-4 pt-20 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Handshake className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Imóveis disponíveis para comercialização
            </h1>
          </div>
          <p className="text-muted-foreground text-sm ml-13">
            Estes imóveis estão disponíveis para você comercializar como autônomo e receber comissão pela venda.
          </p>
        </div>

        {loadingProps ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Handshake className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-base font-medium">Nenhum imóvel disponível para comercialização no momento.</p>
            <p className="text-sm mt-1">Volte mais tarde para verificar novas oportunidades.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => {
              const coverUrl = getCoverImage(property);
              const contacted = contactedIds.has(property.id);
              return (
                <div
                  key={property.id}
                  className="rounded-xl border border-border/50 bg-card overflow-hidden flex flex-col"
                >
                  {/* Thumbnail */}
                  <Link href={`/imoveis/${property.id}`} className="block relative aspect-video bg-gradient-to-br from-emerald-900/30 to-teal-900/30">
                    {coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverUrl}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Maximize className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                    {/* Commission badge */}
                    {property.resale_commission_percent != null && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-lg">
                          <Handshake className="w-3 h-3" />
                          {property.resale_commission_percent}% comissão
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* Content */}
                  <div className="p-4 flex flex-col flex-1 gap-3">
                    <div>
                      <Link
                        href={`/imoveis/${property.id}`}
                        className="font-semibold text-foreground hover:text-emerald-400 transition-colors line-clamp-2 leading-snug"
                      >
                        {property.title}
                      </Link>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        {property.neighborhood ? `${property.neighborhood}, ` : ""}{property.city}, {property.state}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-emerald-400 font-bold text-lg">
                        {formatPrice(property.price)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {property.area}m²
                      </p>
                    </div>

                    <button
                      onClick={() => handleContact(property)}
                      disabled={contactingId === property.id || contacted || !property.seller_user_id}
                      className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {contactingId === property.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : contacted ? (
                        "Mensagem enviada!"
                      ) : (
                        <>
                          <Handshake className="w-4 h-4" />
                          Quero comercializar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
