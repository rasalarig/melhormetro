"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  Plus,
  X,
  Upload,
  Loader2,
  CheckCircle,
  Tag,
  Sparkles,
  GripVertical,
} from "lucide-react";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("./map-picker"), { ssr: false });

interface PropertyFormProps {
  initialData?: {
    id: number;
    title: string;
    description: string;
    price: number;
    area: number;
    type: string;
    address: string;
    city: string;
    state: string;
    neighborhood: string;
    characteristics: string[];
    details: Record<string, unknown>;
    latitude?: number | null;
    longitude?: number | null;
    address_privacy?: "exact" | "approximate";
    approximate_radius_km?: number | null;
    allow_resale?: boolean;
    resale_commission_percent?: number | null;
    resale_terms?: string | null;
    facade_orientation?: string | null;
    condominium_name?: string | null;
  };
}

export function PropertyForm({ initialData }: PropertyFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Form fields
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [price, setPrice] = useState(initialData?.price?.toString() || "");
  const [area, setArea] = useState(initialData?.area?.toString() || "");
  const [type, setType] = useState(initialData?.type || "terreno");
  const [address, setAddress] = useState(initialData?.address || "");
  const [city, setCity] = useState(initialData?.city || "");
  const [state, setState] = useState(initialData?.state || "SP");
  const [neighborhood, setNeighborhood] = useState(
    initialData?.neighborhood || ""
  );
  const [latitude, setLatitude] = useState<number | null>(
    initialData?.latitude ?? null
  );
  const [longitude, setLongitude] = useState<number | null>(
    initialData?.longitude ?? null
  );
  const [addressPrivacy, setAddressPrivacy] = useState<"exact" | "approximate">(
    initialData?.address_privacy ?? "exact"
  );
  const [approximateRadiusKm, setApproximateRadiusKm] = useState<number>(
    initialData?.approximate_radius_km ?? 1.0
  );

  const [facadeOrientation, setFacadeOrientation] = useState<string>(
    initialData?.facade_orientation ?? ""
  );

  // Resale / recomercialização
  const [allowResale, setAllowResale] = useState<boolean>(initialData?.allow_resale ?? false);
  const [resaleCommissionPercent, setResaleCommissionPercent] = useState<string>(
    initialData?.resale_commission_percent != null ? String(initialData.resale_commission_percent) : ""
  );
  const [resaleTerms, setResaleTerms] = useState<string>(initialData?.resale_terms ?? "");

  // Characteristics (tags)
  const [characteristics, setCharacteristics] = useState<string[]>(
    initialData?.characteristics || []
  );
  const [newTag, setNewTag] = useState("");

  // Details
  const [bedrooms, setBedrooms] = useState(
    ((initialData?.details?.bedrooms as number) ?? 0).toString()
  );
  const [bathrooms, setBathrooms] = useState(
    ((initialData?.details?.bathrooms as number) ?? 0).toString()
  );
  const [garage, setGarage] = useState(
    ((initialData?.details?.garage as number) ?? 0).toString()
  );
  const [pool, setPool] = useState(
    (initialData?.details?.pool as boolean) || false
  );
  const [gatedCommunity, setGatedCommunity] = useState(
    (initialData?.details?.gated_community as boolean) || false
  );
  const [pavedStreet, setPavedStreet] = useState(
    (initialData?.details?.paved_street as boolean) || false
  );

  // IBGE location data
  const [ibgeStates, setIbgeStates] = useState<{ sigla: string; nome: string }[]>([]);
  const [ibgeCities, setIbgeCities] = useState<{ id: number; nome: string }[]>([]);
  const ibgeCitiesCache = useRef<Record<string, { id: number; nome: string }[]>>({});

  useEffect(() => {
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome")
      .then((r) => r.json())
      .then((data: { sigla: string; nome: string }[]) => setIbgeStates(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!state) {
      setIbgeCities([]);
      return;
    }
    if (ibgeCitiesCache.current[state]) {
      setIbgeCities(ibgeCitiesCache.current[state]);
      return;
    }
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios?orderBy=nome`)
      .then((r) => r.json())
      .then((data: { id: number; nome: string }[]) => {
        ibgeCitiesCache.current[state] = data;
        setIbgeCities(data);
      })
      .catch(console.error);
  }, [state]);

  // Condominium (free text)
  const [condominiumName, setCondominiumName] = useState<string>(
    initialData?.condominium_name ?? ""
  );

  // Images
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [aiGenerating, setAiGenerating] = useState(false);
  // Drag-to-reorder state
  const [imgDragIndex, setImgDragIndex] = useState<number | null>(null);
  const [imgOverIndex, setImgOverIndex] = useState<number | null>(null);
  const imgDragRef = useRef<number | null>(null);

  const addTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !characteristics.includes(tag)) {
      setCharacteristics([...characteristics, tag]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setCharacteristics(characteristics.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImgDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = "move";
    imgDragRef.current = index;
    setImgDragIndex(index);
  }, []);

  const handleImgDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setImgOverIndex(index);
  }, []);

  const handleImgDrop = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    const from = imgDragRef.current;
    setImgDragIndex(null);
    setImgOverIndex(null);
    imgDragRef.current = null;
    if (from === null || from === index) return;
    setImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setImagePreviews((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      return next;
    });
  }, []);

  const handleImgDragEnd = useCallback(() => {
    setImgDragIndex(null);
    setImgOverIndex(null);
    imgDragRef.current = null;
  }, []);

  const generateWithAI = async () => {
    setAiGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/ai/generate-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          area,
          price,
          city,
          state,
          neighborhood,
          address,
          characteristics,
          bedrooms,
          bathrooms,
          garage,
          pool,
          gatedCommunity,
          pavedStreet,
          currentTitle: title,
          currentDescription: description,
        }),
      });

      if (!res.ok) {
        throw new Error("Erro ao gerar com IA");
      }

      const data = await res.json();
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
    } catch {
      setError("Não foi possível gerar o texto com IA. Tente novamente.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const body = {
        title,
        description,
        price: parseFloat(price),
        area: parseFloat(area),
        type,
        address,
        city,
        state,
        neighborhood,
        latitude,
        longitude,
        address_privacy: addressPrivacy,
        approximate_radius_km: approximateRadiusKm,
        characteristics,
        details: {
          bedrooms: parseInt(bedrooms),
          bathrooms: parseInt(bathrooms),
          garage: parseInt(garage),
          pool,
          gated_community: gatedCommunity,
          paved_street: pavedStreet,
        },
        allow_resale: allowResale,
        resale_commission_percent: allowResale && resaleCommissionPercent ? parseFloat(resaleCommissionPercent) : null,
        resale_terms: allowResale && resaleTerms.trim() ? resaleTerms.trim() : null,
        facade_orientation: facadeOrientation || null,
        condominium_name: (type === "casa_condominio" || type === "terreno_condominio") && condominiumName.trim() ? condominiumName.trim() : null,
      };

      const url = isEditing
        ? `/api/properties/${initialData.id}`
        : "/api/properties";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao salvar imóvel");
      }

      const data = await res.json();

      // Upload images if any
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach((img) => formData.append("images", img));

        await fetch(`/api/properties/${data.id || initialData?.id}/images`, {
          method: "POST",
          body: formData,
        });
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin");
      }, 1500);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao salvar imóvel";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Suggested characteristics for quick-add
  const suggestedTags = [
    "plano",
    "leve aclive",
    "acentuado aclive",
    "leve declive",
    "acentuado declive",
    "esquina",
    "condomínio fechado",
    "segurança 24h",
    "árvores",
    "árvores frutíferas",
    "área verde",
    "vista panorâmica",
    "próximo escola",
    "próximo comércio",
    "próximo hospital",
    "asfalto",
    "água",
    "luz",
    "esgoto",
    "internet",
    "documentação ok",
    "escritura",
    "financiável",
    "tranquilo",
    "residencial",
    "rua sem saída",
  ].filter((t) => !characteristics.includes(t));

  if (success) {
    return (
      <Card className="p-12 text-center bg-card border-border/50">
        <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">
          Imóvel {isEditing ? "atualizado" : "cadastrado"} com sucesso!
        </h2>
        <p className="text-muted-foreground">Redirecionando para a lista...</p>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <Card className="p-6 bg-card border-border/50 space-y-4">
        <h2 className="text-lg font-semibold">Informações Básicas</h2>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">
            Título *
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Terreno 300m2 em Condomínio Fechado - Itapetininga"
            required
            className="bg-secondary/50 border-border/50"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm text-muted-foreground">
              Descrição Detalhada *
            </label>
            <Button
              type="button"
              onClick={generateWithAI}
              disabled={aiGenerating}
              variant="outline"
              size="sm"
              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 gap-1.5 text-xs"
            >
              {aiGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              {aiGenerating ? "Gerando..." : "Gerar com IA"}
            </Button>
          </div>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o imóvel em detalhes. Mencione tudo que for relevante: vizinhança, infraestrutura, vegetação, vista, proximidades... Quanto mais detalhes, melhor a busca por IA encontrará este imóvel."
            required
            rows={6}
            className="bg-secondary/50 border-border/50"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Dica: Preencha os campos acima (tipo, área, preço, localização) e clique em &quot;Gerar com IA&quot; para criar título e descrição automaticamente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              Preço (R$) *
            </label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="180000"
              required
              min="0"
              step="0.01"
              className="bg-secondary/50 border-border/50"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              Área (m2) *
            </label>
            <Input
              type="number"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="300"
              required
              min="0"
              step="0.01"
              className="bg-secondary/50 border-border/50"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              Tipo *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
              className="w-full h-10 bg-secondary/50 border border-border/50 rounded-lg px-3 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="terreno">Terreno</option>
              <option value="terreno_condominio">Terreno em Condomínio</option>
              <option value="casa">Casa</option>
              <option value="casa_condominio">Casa em Condomínio</option>
              <option value="apartamento">Apartamento</option>
              <option value="comercial">Comercial</option>
              <option value="rural">Rural</option>
            </select>
          </div>
        </div>

        {/* Condominium name (free text) */}
        {(type === "casa_condominio" || type === "terreno_condominio") && (
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              Nome do condomínio (opcional)
            </label>
            <input
              type="text"
              value={condominiumName}
              onChange={(e) => setCondominiumName(e.target.value)}
              placeholder="Ex: Residencial das Flores"
              className="w-full h-10 bg-secondary/50 border border-border/50 rounded-lg px-3 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        )}
      </Card>

      {/* Location */}
      <Card className="p-6 bg-card border-border/50 space-y-4">
        <h2 className="text-lg font-semibold">Localização</h2>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">
            Endereço *
          </label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Rua das Palmeiras, Lote 15"
            required
            className="bg-secondary/50 border-border/50"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              Cidade *
            </label>
            <input
              list="ibge-cities-list-form"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={state ? "Digite para buscar..." : "Selecione o estado primeiro"}
              disabled={!state}
              required
              className="w-full h-10 bg-secondary/50 border border-border/50 rounded-lg px-3 text-sm outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
            />
            <datalist id="ibge-cities-list-form">
              {ibgeCities.map((c) => (
                <option key={c.id} value={c.nome} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              Estado *
            </label>
            <select
              value={state}
              onChange={(e) => { setState(e.target.value); setCity(""); }}
              required
              className="w-full h-10 bg-secondary/50 border border-border/50 rounded-lg px-3 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Selecione</option>
              {ibgeStates.map((s) => (
                <option key={s.sigla} value={s.sigla}>{s.sigla} - {s.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              Bairro
            </label>
            <Input
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Jardim Europa"
              className="bg-secondary/50 border-border/50"
            />
          </div>
        </div>

        {/* Map Picker */}
        <MapPicker
          latitude={latitude}
          longitude={longitude}
          onChange={({ lat, lng }) => {
            setLatitude(lat);
            setLongitude(lng);
          }}
        />

        {/* Address Privacy */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground block font-medium">
            Exibição do endereço
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAddressPrivacy("exact")}
              className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                addressPrivacy === "exact"
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                  : "border-border/50 bg-background text-muted-foreground hover:border-emerald-500/50"
              }`}
            >
              Endereço exato
            </button>
            <button
              type="button"
              onClick={() => setAddressPrivacy("approximate")}
              className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                addressPrivacy === "approximate"
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                  : "border-border/50 bg-background text-muted-foreground hover:border-emerald-500/50"
              }`}
            >
              Localização aproximada
            </button>
          </div>
          {addressPrivacy === "approximate" && (
            <div className="space-y-2 mt-2">
              <p className="text-xs text-muted-foreground">
                O mapa mostrará apenas uma área aproximada. O endereço exato não será exibido.
              </p>
              <div className="flex items-center gap-3">
                <label className="text-xs text-muted-foreground whitespace-nowrap">
                  Raio: {approximateRadiusKm.toFixed(1)} km
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={approximateRadiusKm}
                  onChange={(e) => setApproximateRadiusKm(Number(e.target.value))}
                  className="flex-1 accent-emerald-500"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0,5 km</span>
                <span>5 km</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Facade Orientation */}
      <Card className="p-6 bg-card border-border/50 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Orientação Solar</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Indica para qual direção a fachada principal do imóvel está voltada. Ajuda compradores a entender a incidência de sol.
          </p>
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">
            Orientação da fachada
          </label>
          <select
            value={facadeOrientation}
            onChange={(e) => setFacadeOrientation(e.target.value)}
            className="w-full h-10 bg-secondary/50 border border-border/50 rounded-lg px-3 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Não informado</option>
            <option value="norte">Norte</option>
            <option value="nordeste">Nordeste</option>
            <option value="leste">Leste</option>
            <option value="sudeste">Sudeste</option>
            <option value="sul">Sul</option>
            <option value="sudoeste">Sudoeste</option>
            <option value="oeste">Oeste</option>
            <option value="noroeste">Noroeste</option>
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Opcional. No hemisfério sul, fachadas voltadas para o Norte recebem mais sol ao longo do ano.
          </p>
        </div>
      </Card>

      {/* Characteristics / Tags */}
      <Card className="p-6 bg-card border-border/50 space-y-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-400" />
            Características
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Adicione tags que descrevam o imóvel. Essas tags alimentam a busca
            por IA.
          </p>
        </div>

        {/* Tag input */}
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Digite uma característica e pressione Enter"
            className="bg-secondary/50 border-border/50"
          />
          <Button
            type="button"
            onClick={addTag}
            variant="outline"
            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 shrink-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Current tags */}
        {characteristics.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {characteristics.map((tag) => (
              <Badge
                key={tag}
                className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 pr-1 gap-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Suggested tags */}
        {suggestedTags.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              Sugestões (clique para adicionar):
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestedTags.slice(0, 12).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    setCharacteristics([...characteristics, tag])
                  }
                  className="text-xs px-2 py-0.5 rounded-full border border-border hover:border-emerald-500/50 hover:text-emerald-400 transition-colors text-muted-foreground"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Details */}
      <Card className="p-6 bg-card border-border/50 space-y-4">
        <h2 className="text-lg font-semibold">Detalhes do Imóvel</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              Quartos
            </label>
            <Input
              type="number"
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              min="0"
              className="bg-secondary/50 border-border/50"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              Banheiros
            </label>
            <Input
              type="number"
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
              min="0"
              className="bg-secondary/50 border-border/50"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              Vagas Garagem
            </label>
            <Input
              type="number"
              value={garage}
              onChange={(e) => setGarage(e.target.value)}
              min="0"
              className="bg-secondary/50 border-border/50"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={pool}
              onChange={(e) => setPool(e.target.checked)}
              className="w-4 h-4 rounded border-border accent-emerald-500"
            />
            <span className="text-sm">Piscina</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={gatedCommunity}
              onChange={(e) => setGatedCommunity(e.target.checked)}
              className="w-4 h-4 rounded border-border accent-emerald-500"
            />
            <span className="text-sm">Condomínio Fechado</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={pavedStreet}
              onChange={(e) => setPavedStreet(e.target.checked)}
              className="w-4 h-4 rounded border-border accent-emerald-500"
            />
            <span className="text-sm">Rua Asfaltada</span>
          </label>
        </div>
      </Card>

      {/* Recomercialização */}
      <Card className="p-6 bg-card border-border/50 space-y-4">
        <h2 className="text-lg font-semibold">Recomercialização</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              Permitir que autônomos comercializem este imóvel
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Agentes autônomos poderão ver e divulgar este imóvel mediante comissão
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAllowResale(!allowResale)}
            className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
              allowResale ? "bg-emerald-500" : "bg-border/60"
            }`}
            aria-checked={allowResale}
            role="switch"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                allowResale ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {allowResale && (
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Comissão oferecida ao autônomo (%) *
              </label>
              <Input
                type="number"
                value={resaleCommissionPercent}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (e.target.value === "" || isNaN(v)) { setResaleCommissionPercent(e.target.value); return; }
                  setResaleCommissionPercent(v > 100 ? "100" : v < 0 ? "0" : e.target.value);
                }}
                placeholder="Ex: 3.0"
                min="0"
                max="100"
                step="0.5"
                className="bg-secondary/50 border-border/50"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Percentual do valor de venda que será pago ao autônomo como comissão.
              </p>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Termos e condições (opcional)
              </label>
              <Textarea
                value={resaleTerms}
                onChange={(e) => setResaleTerms(e.target.value)}
                placeholder="Ex: Comissão paga após assinatura do contrato. Exclusividade de 30 dias."
                rows={3}
                className="bg-secondary/50 border-border/50"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Images */}
      <Card className="p-6 bg-card border-border/50 space-y-4">
        <h2 className="text-lg font-semibold">Imagens</h2>

        <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center hover:border-emerald-500/30 transition-colors">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Clique para selecionar imagens
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG ou WebP
            </p>
          </label>
        </div>

        {imagePreviews.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {imagePreviews.map((preview, i) => (
                <div
                  key={i}
                  draggable
                  onDragStart={(e) => handleImgDragStart(e, i)}
                  onDragOver={(e) => handleImgDragOver(e, i)}
                  onDrop={(e) => handleImgDrop(e, i)}
                  onDragEnd={handleImgDragEnd}
                  className={`relative group rounded-lg overflow-hidden aspect-square bg-secondary cursor-grab active:cursor-grabbing transition-opacity ${
                    imgDragIndex === i
                      ? "opacity-40"
                      : imgOverIndex === i && imgDragIndex !== null
                      ? "ring-2 ring-emerald-500"
                      : ""
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt=""
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  {/* Order number */}
                  <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white font-bold px-1.5 py-0.5 rounded">
                    {i + 1}
                  </span>
                  {/* Drag handle */}
                  <div className="absolute top-1 left-1 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Arraste as imagens para reordenar. O número indica a posição na galeria.
            </p>
          </>
        )}
      </Card>

      {/* Submit */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {isEditing ? "Atualizar Imóvel" : "Cadastrar Imóvel"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
