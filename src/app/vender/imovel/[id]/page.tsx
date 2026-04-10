"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Plus,
  Star,
  CheckCircle,
  Home,
  ImageIcon,
  Upload,
  Link2,
  X,
  Play,
} from "lucide-react";
import Link from "next/link";

const PROPERTY_TYPES = [
  { value: "terreno", label: "Terreno" },
  { value: "casa", label: "Casa" },
  { value: "apartamento", label: "Apartamento" },
  { value: "comercial", label: "Comercial" },
  { value: "rural", label: "Rural" },
];

const ALL_CHARACTERISTICS = [
  "piscina",
  "churrasqueira",
  "condomínio fechado",
  "segurança 24h",
  "área gourmet",
  "cozinha planejada",
  "quintal",
  "varanda",
  "elevador",
  "academia",
  "playground",
  "salão de festas",
  "ar condicionado",
  "aquecimento",
  "energia solar",
  "poço artesiano",
  "plano",
  "murado",
  "asfalto",
  "iluminação",
  "próximo escola",
  "próximo comércio",
  "próximo hospital",
  "vista panorâmica",
  "área verde",
  "documentação ok",
];

const inputClass =
  "w-full rounded-lg border border-border/50 bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-colors";

const labelClass = "block text-sm font-medium text-foreground mb-1.5";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_FILE_SIZE_IMAGE = 10 * 1024 * 1024; // 10MB
const MAX_FILE_SIZE_VIDEO = 100 * 1024 * 1024; // 100MB

interface MediaEntry {
  url: string;
  file?: File;
  preview?: string;
  is_cover: boolean;
  type: "image" | "video";
  uploading?: boolean;
}

interface PropertyImage {
  id: number;
  filename: string;
  original_name: string;
  is_cover: number;
}

export default function EditarImovelPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading property data
  const [loadingProperty, setLoadingProperty] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Form state - basic info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [price, setPrice] = useState("");
  const [area, setArea] = useState("");

  // Location
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("SP");
  const [neighborhood, setNeighborhood] = useState("");

  // Details (casa/apartamento only)
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [suites, setSuítes] = useState("");
  const [parking, setParking] = useState("");

  // Characteristics
  const [selectedChars, setSelectedChars] = useState<string[]>([]);

  // Media - unified list of all media (existing + new uploads)
  const [mediaItems, setMediaItems] = useState<MediaEntry[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  // Load property data
  useEffect(() => {
    if (authLoading || !user || !propertyId) return;

    async function loadProperty() {
      try {
        const res = await fetch(`/api/properties/${propertyId}`);
        if (res.status === 404) {
          setLoadError("Imóvel não encontrado.");
          setLoadingProperty(false);
          return;
        }
        if (!res.ok) {
          setLoadError("Erro ao carregar imóvel.");
          setLoadingProperty(false);
          return;
        }

        const data = await res.json();

        // Check ownership by verifying seller_id matches
        // We'll let the PUT endpoint handle the actual ownership check
        // but we pre-fill the form regardless

        setTitle(data.title || "");
        setDescription(data.description || "");
        setPropertyType(data.type || "");
        setPrice(data.price ? String(data.price) : "");
        setArea(data.area ? String(data.area) : "");
        setAddress(data.address || "");
        setCity(data.city || "");
        setState(data.state || "SP");
        setNeighborhood(data.neighborhood || "");

        // Details
        const details = data.details || {};
        setBedrooms(details.bedrooms ? String(details.bedrooms) : "");
        setBathrooms(details.bathrooms ? String(details.bathrooms) : "");
        setSuítes(details.suites ? String(details.suites) : "");
        setParking(details.parking ? String(details.parking) : "");

        // Characteristics
        const chars = data.characteristics || [];
        setSelectedChars(Array.isArray(chars) ? chars : []);

        // Images - load existing into unified media list
        const images: PropertyImage[] = data.images || [];
        if (images.length > 0) {
          const existing: MediaEntry[] = images.map((img) => ({
            url: img.filename,
            is_cover: img.is_cover === 1,
            type: /\.(mp4|mov|webm|avi|mkv)$/i.test(img.filename) || /youtube|tiktok|instagram|vimeo/i.test(img.filename) ? "video" : "image",
          }));
          setMediaItems(existing);
        }

        setLoadingProperty(false);
      } catch {
        setLoadError("Erro de conexão ao carregar imóvel.");
        setLoadingProperty(false);
      }
    }

    loadProperty();
  }, [authLoading, user, propertyId]);

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      mediaItems.forEach((entry) => {
        if (entry.preview) URL.revokeObjectURL(entry.preview);
      });
    };
  }, []);

  const showDetails =
    propertyType === "casa" || propertyType === "apartamento";

  function toggleCharacteristic(char: string) {
    setSelectedChars((prev) =>
      prev.includes(char) ? prev.filter((c) => c !== char) : [...prev, char]
    );
  }

  // --- Unified media management ---
  const addFiles = useCallback((files: FileList | File[]) => {
    const newEntries: MediaEntry[] = [];

    for (const file of Array.from(files)) {
      const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
      const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);

      if (!isImage && !isVideo) {
        setError(`Tipo de arquivo não permitido: ${file.name}`);
        continue;
      }

      const maxSize = isVideo ? MAX_FILE_SIZE_VIDEO : MAX_FILE_SIZE_IMAGE;
      if (file.size > maxSize) {
        setError(`Arquivo ${file.name} excede o limite de ${isVideo ? "100MB" : "10MB"}`);
        continue;
      }

      const preview = isImage ? URL.createObjectURL(file) : undefined;
      newEntries.push({
        url: "",
        file,
        preview,
        is_cover: false,
        type: isImage ? "image" : "video",
      });
    }

    setMediaItems((prev) => {
      const combined = [...prev, ...newEntries];
      if (combined.length > 0 && !combined.some((e) => e.is_cover)) {
        combined[0].is_cover = true;
      }
      return combined;
    });
  }, []);

  function removeMediaItem(index: number) {
    setMediaItems((prev) => {
      const removed = prev[index];
      if (removed.preview) URL.revokeObjectURL(removed.preview);
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some((e) => e.is_cover)) {
        next[0].is_cover = true;
      }
      return next;
    });
  }

  function setMediaCover(index: number) {
    setMediaItems((prev) =>
      prev.map((e, i) => ({ ...e, is_cover: i === index }))
    );
  }

  function addLinkMedia() {
    if (!linkUrl.trim()) return;
    const url = linkUrl.trim();
    const isVideo = /\.(mp4|mov|webm|avi|mkv)$/i.test(url) || /youtube|tiktok|instagram|vimeo/i.test(url);
    setMediaItems((prev) => {
      const combined = [...prev, { url, is_cover: false, type: (isVideo ? "video" : "image") as "video" | "image" }];
      if (combined.length === 1) combined[0].is_cover = true;
      return combined;
    });
    setLinkUrl("");
    setShowLinkInput(false);
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (e.dataTransfer.files?.length) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        addFiles(e.target.files);
      }
      e.target.value = "";
    },
    [addFiles]
  );

  async function uploadFiles(): Promise<{ url: string; is_cover: boolean }[]> {
    const filesToUpload = mediaItems.filter((e) => e.file);
    if (filesToUpload.length === 0) return [];

    setUploadProgress("Enviando arquivos...");

    const formData = new FormData();
    for (const entry of filesToUpload) {
      formData.append("files", entry.file!);
    }

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Falha no upload dos arquivos");
    }

    const data = await res.json();
    const uploadedFiles = data.files as {
      url: string;
      originalName: string;
      type: string;
    }[];

    // Map uploaded URLs back with is_cover info
    const results: { url: string; is_cover: boolean }[] = [];
    let uploadIndex = 0;
    for (const entry of mediaItems) {
      if (entry.file) {
        results.push({
          url: uploadedFiles[uploadIndex].url,
          is_cover: entry.is_cover,
        });
        uploadIndex++;
      }
    }

    setUploadProgress("");
    return results;
  }

  function formatPriceDisplay(value: string): string {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";
    const num = parseInt(digits, 10);
    return num.toLocaleString("pt-BR");
  }

  function handlePriceChange(raw: string) {
    const digits = raw.replace(/\D/g, "");
    setPrice(digits);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (
      !title.trim() ||
      !description.trim() ||
      !propertyType ||
      !price ||
      !area ||
      !address.trim() ||
      !city.trim()
    ) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    setSubmitting(true);

    try {
      // Separate existing URLs from new files
      const existingItems = mediaItems.filter((e) => e.url && !e.file);
      const allImageUrls = existingItems.map((e) => ({ url: e.url, is_cover: e.is_cover }));

      const filesToUpload = mediaItems.filter((e) => e.file);
      const hasFilesToUpload = filesToUpload.length > 0;

      const details: Record<string, number> = {};
      if (showDetails) {
        if (bedrooms) details.bedrooms = Number(bedrooms);
        if (bathrooms) details.bathrooms = Number(bathrooms);
        if (suites) details.suites = Number(suites);
        if (parking) details.parking = Number(parking);
      }

      const res = await fetch(`/api/properties/${propertyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          type: propertyType,
          price: Number(price),
          area: Number(area),
          address: address.trim(),
          city: city.trim(),
          state: state.trim() || "SP",
          neighborhood: neighborhood.trim() || null,
          characteristics: selectedChars.length > 0 ? selectedChars : null,
          details: Object.keys(details).length > 0 ? details : null,
          imageUrls: allImageUrls,
          media_status: hasFilesToUpload ? "processing" : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao salvar alterações.");
        return;
      }

      // Fire background upload (don't await)
      if (hasFilesToUpload) {
        const bgFormData = new FormData();
        bgFormData.append("propertyId", propertyId);
        for (const entry of filesToUpload) {
          bgFormData.append("files", entry.file!);
        }
        fetch("/api/upload/background", { method: "POST", body: bgFormData });
      }

      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro de conexão. Tente novamente.";
      setError(message);
    } finally {
      setSubmitting(false);
      setUploadProgress("");
    }
  }

  if (authLoading || loadingProperty) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <div className="container mx-auto px-4 pt-16 max-w-lg">
          <div className="rounded-xl border border-border/50 bg-card p-8 text-center space-y-4">
            <h2 className="text-xl font-bold text-foreground">{loadError}</h2>
            <Link href="/vender/meus-imoveis">
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl mt-4"
              >
                Voltar para Meus Imóveis
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <div className="container mx-auto px-4 pt-16 max-w-lg">
          <div className="rounded-xl border border-border/50 bg-card p-8 text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
            <h2 className="text-xl font-bold text-foreground">
              Alterações salvas com sucesso!
            </h2>
            <p className="text-muted-foreground text-sm">
              Seu imóvel foi atualizado na plataforma.
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <Link href={`/imoveis/${propertyId}`}>
                <Button className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-xl">
                  Ver Imóvel
                </Button>
              </Link>
              <Link href="/vender/meus-imoveis">
                <Button
                  variant="outline"
                  className="w-full h-11 rounded-xl"
                >
                  Meus Imóveis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="container mx-auto px-4 pt-16 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-4">
            <Home className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Editar Imóvel
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Atualize as informações do seu imóvel.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Informações Básicas */}
          <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border/30 pb-2">
              Informações Básicas
            </h2>

            <div>
              <label className={labelClass}>
                Título <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Casa moderna com piscina no centro"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Descrição <span className="text-red-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o imóvel em detalhes..."
                rows={4}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Tipo <span className="text-red-400">*</span>
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className={inputClass}
              >
                <option value="">Selecione o tipo</option>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Preço R$ <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatPriceDisplay(price)}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder="500.000"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Área m2 <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="150"
                  min="0"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Section: Localização */}
          <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border/30 pb-2">
              Localizacao
            </h2>

            <div>
              <label className={labelClass}>
                Endereco <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Cidade <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: São Paulo"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Estado</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="SP"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Bairro</label>
              <input
                type="text"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Ex: Centro"
                className={inputClass}
              />
            </div>
          </div>

          {/* Section: Detalhes (only for casa/apartamento) */}
          {showDetails && (
            <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
              <h2 className="text-base font-semibold text-foreground border-b border-border/30 pb-2">
                Detalhes
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Quartos</label>
                  <input
                    type="number"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    placeholder="0"
                    min="0"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Banheiros</label>
                  <input
                    type="number"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    placeholder="0"
                    min="0"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Suítes</label>
                  <input
                    type="number"
                    value={suites}
                    onChange={(e) => setSuítes(e.target.value)}
                    placeholder="0"
                    min="0"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Vagas de Garagem</label>
                  <input
                    type="number"
                    value={parking}
                    onChange={(e) => setParking(e.target.value)}
                    placeholder="0"
                    min="0"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section: Características */}
          <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border/30 pb-2">
              Características
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALL_CHARACTERISTICS.map((char) => (
                <label
                  key={char}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                    selectedChars.includes(char)
                      ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400"
                      : "border-border/30 bg-background/50 text-muted-foreground hover:border-border/60"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedChars.includes(char)}
                    onChange={() => toggleCharacteristic(char)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                      selectedChars.includes(char)
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-border/50"
                    }`}
                  >
                    {selectedChars.includes(char) && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="capitalize leading-tight">{char}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section: Fotos e Vídeos */}
          <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border/30 pb-2 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Fotos e Vídeos
            </h2>

            {/* Unified media grid */}
            {mediaItems.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {mediaItems.map((entry, index) => {
                  const isVideo = entry.type === "video";
                  const displayUrl = entry.preview || (entry.url ? (entry.url.startsWith("http") || entry.url.startsWith("/") ? entry.url : `/uploads/${entry.url}`) : "");

                  return (
                    <div
                      key={index}
                      className={`relative group rounded-lg overflow-hidden border-2 bg-background aspect-square ${
                        entry.is_cover ? "border-emerald-500" : "border-border/30"
                      }`}
                    >
                      {isVideo ? (
                        displayUrl && !entry.file ? (
                          <div className="w-full h-full relative bg-zinc-900">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <video
                              src={displayUrl}
                              className="w-full h-full object-cover"
                              preload="metadata"
                              muted
                              playsInline
                              crossOrigin="anonymous"
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <Play className="w-8 h-8 text-white/70" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                            <Play className="w-8 h-8 text-emerald-500/60" />
                            <p className="absolute bottom-1 left-1 right-1 text-[9px] text-muted-foreground truncate text-center">
                              {entry.file?.name || "Vídeo"}
                            </p>
                          </div>
                        )
                      ) : displayUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={displayUrl}
                          alt={`Media ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                      )}

                      {/* Delete button - always visible on mobile, hover on desktop */}
                      <button
                        type="button"
                        onClick={() => removeMediaItem(index)}
                        className="absolute top-1 right-1 w-7 h-7 rounded-full bg-red-500/90 text-white flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      {/* Cover badge / Set cover button */}
                      {entry.is_cover ? (
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-bold">
                          CAPA
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setMediaCover(index)}
                          className="absolute top-1 left-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                        >
                          <Star className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add media buttons */}
            <div className="flex flex-col gap-3">
              {/* Upload area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  isDragOver
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-border/50 hover:border-emerald-500/40 hover:bg-emerald-500/5"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Upload className="w-5 h-5 text-emerald-500/60" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Arraste ou{" "}
                  <span className="text-emerald-400 font-medium">clique para enviar</span>
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Fotos até 10MB · Vídeos até 100MB
                </p>
              </div>

              {/* Link input */}
              {showLinkInput ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLinkMedia())}
                    placeholder="Cole o link da imagem ou vídeo..."
                    className={inputClass}
                    autoFocus
                  />
                  <Button type="button" onClick={addLinkMedia} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white shrink-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button type="button" onClick={() => { setShowLinkInput(false); setLinkUrl(""); }} size="sm" variant="outline" className="shrink-0">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowLinkInput(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm text-muted-foreground border border-border/30 hover:border-border/60 transition-colors"
                >
                  <Link2 className="w-4 h-4" />
                  Colar link de mídia
                </button>
              )}
            </div>

            {uploadProgress && (
              <p className="text-sm text-emerald-400 text-center animate-pulse">
                {uploadProgress}
              </p>
            )}
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-xl text-base"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Salvar Alterações"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
