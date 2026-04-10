"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Plus,
  Trash2,
  Star,
  CheckCircle,
  Home,
  ImageIcon,
  Upload,
  Link2,
  Video,
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

interface LinkEntry {
  url: string;
  is_cover: boolean;
}

export default function CadastrarImovelPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Media - tab toggle between upload and link
  const [mediaTab, setMediaTab] = useState<"upload" | "link">("upload");
  const [mediaEntries, setMediaEntries] = useState<MediaEntry[]>([]);
  const [linkEntries, setLinkEntries] = useState<LinkEntry[]>([
    { url: "", is_cover: true },
  ]);
  const [isDragOver, setIsDragOver] = useState(false);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ id: number } | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      mediaEntries.forEach((entry) => {
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

  // --- Link entries (paste URL mode) ---
  function addLinkField() {
    setLinkEntries((prev) => [...prev, { url: "", is_cover: false }]);
  }

  function removeLinkField(index: number) {
    setLinkEntries((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some((e) => e.is_cover)) {
        next[0].is_cover = true;
      }
      return next;
    });
  }

  function updateLinkUrl(index: number, url: string) {
    setLinkEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, url } : e))
    );
  }

  function setLinkCover(index: number) {
    setLinkEntries((prev) =>
      prev.map((e, i) => ({ ...e, is_cover: i === index }))
    );
  }

  // --- File upload entries ---
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

    setMediaEntries((prev) => {
      const combined = [...prev, ...newEntries];
      // If none is marked as cover, set the first image as cover
      if (combined.length > 0 && !combined.some((e) => e.is_cover)) {
        const firstImage = combined.findIndex((e) => e.type === "image");
        if (firstImage >= 0) {
          combined[firstImage].is_cover = true;
        } else {
          combined[0].is_cover = true;
        }
      }
      return combined;
    });
  }, []);

  function removeMediaEntry(index: number) {
    setMediaEntries((prev) => {
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
    setMediaEntries((prev) =>
      prev.map((e, i) => ({ ...e, is_cover: i === index }))
    );
  }

  // Drag and drop handlers
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
      // Reset input so same file can be selected again
      e.target.value = "";
    },
    [addFiles]
  );

  async function uploadFiles(): Promise<{ url: string; is_cover: boolean }[]> {
    const filesToUpload = mediaEntries.filter((e) => e.file);
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

    // Map uploaded URLs back to entries with is_cover info
    const results: { url: string; is_cover: boolean }[] = [];
    let uploadIndex = 0;
    for (const entry of mediaEntries) {
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
      // Separate link URLs (available now) from files (need background upload)
      let allImageUrls: { url: string; is_cover: boolean }[] = [];

      if (mediaTab === "link") {
        const validLinks = linkEntries.filter((e) => e.url.trim());
        allImageUrls = validLinks.map((e) => ({ url: e.url.trim(), is_cover: e.is_cover }));
      }

      const filesToUpload = mediaTab === "upload" ? mediaEntries.filter((e) => e.file) : [];
      const hasFilesToUpload = filesToUpload.length > 0;

      const details: Record<string, number> = {};
      if (showDetails) {
        if (bedrooms) details.bedrooms = Number(bedrooms);
        if (bathrooms) details.bathrooms = Number(bathrooms);
        if (suites) details.suites = Number(suites);
        if (parking) details.parking = Number(parking);
      }

      const res = await fetch("/api/properties/create", {
        method: "POST",
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
          media_status: hasFilesToUpload ? "processing" : "ready",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao cadastrar imóvel.");
        return;
      }

      // Fire background upload (don't await)
      if (hasFilesToUpload) {
        const bgFormData = new FormData();
        bgFormData.append("propertyId", String(data.property.id));
        for (const entry of filesToUpload) {
          bgFormData.append("files", entry.file!);
        }
        fetch("/api/upload/background", { method: "POST", body: bgFormData });
      }

      setSuccess({ id: data.property.id });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro de conexão. Tente novamente.";
      setError(message);
    } finally {
      setSubmitting(false);
      setUploadProgress("");
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
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
              Imóvel cadastrado com sucesso!
            </h2>
            <p className="text-muted-foreground text-sm">
              Seu imóvel já está visível para compradores na plataforma.
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <Link href={`/imoveis/${success.id}`}>
                <Button className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-xl">
                  Ver Imóvel
                </Button>
              </Link>
              <Link href="/vender/imovel">
                <Button
                  variant="outline"
                  className="w-full h-11 rounded-xl"
                >
                  Cadastrar Outro
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
            Cadastrar Imóvel
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Preencha as informações do seu imóvel para anunciá-lo na plataforma.
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
              Localização
            </h2>

            <div>
              <label className={labelClass}>
                Endereço <span className="text-red-400">*</span>
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

            {/* Tab toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMediaTab("upload")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mediaTab === "upload"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40"
                    : "bg-background/50 text-muted-foreground border border-border/30 hover:border-border/60"
                }`}
              >
                <Upload className="w-4 h-4" />
                Enviar Arquivos
              </button>
              <button
                type="button"
                onClick={() => setMediaTab("link")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mediaTab === "link"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40"
                    : "bg-background/50 text-muted-foreground border border-border/30 hover:border-border/60"
                }`}
              >
                <Link2 className="w-4 h-4" />
                Colar Link
              </button>
            </div>

            {/* Upload tab */}
            {mediaTab === "upload" && (
              <div className="space-y-4">
                {/* Drag and drop area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
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
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <ImageIcon className="w-8 h-8 text-emerald-500/60" />
                    <Video className="w-8 h-8 text-emerald-500/60" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="hidden md:inline">Arraste fotos e vídeos aqui ou{" "}
                      <span className="text-emerald-400 font-medium">
                        clique para selecionar
                      </span>
                    </span>
                    <span className="md:hidden">
                      <span className="text-emerald-400 font-medium">
                        Toque para selecionar fotos e vídeos da galeria
                      </span>
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    JPG, PNG, WebP, GIF, MP4, MOV, WebM - Máximo 10MB por arquivo
                  </p>
                </div>

                {/* Media preview grid */}
                {mediaEntries.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {mediaEntries.map((entry, index) => (
                      <div
                        key={index}
                        className="relative group rounded-lg overflow-hidden border border-border/30 bg-background aspect-square"
                      >
                        {entry.type === "image" && entry.preview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={entry.preview}
                            alt={entry.file?.name || `Media ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-background">
                            <div className="text-center">
                              <Play className="w-8 h-8 text-emerald-500/60 mx-auto mb-1" />
                              <span className="text-[10px] text-muted-foreground truncate block px-1">
                                {entry.file?.name || "Video"}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Cover badge */}
                        {entry.is_cover && (
                          <span className="absolute top-1 left-1 text-[9px] bg-yellow-500 text-black font-bold px-1.5 py-0.5 rounded">
                            CAPA
                          </span>
                        )}

                        {/* Type badge */}
                        {entry.type === "video" && (
                          <span className="absolute top-1 right-1 text-[9px] bg-blue-500 text-white font-bold px-1.5 py-0.5 rounded">
                            VIDEO
                          </span>
                        )}

                        {/* Hover overlay with actions - always visible on mobile */}
                        <div className="absolute inset-0 bg-black/30 md:bg-black/50 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMediaCover(index);
                            }}
                            title="Definir como capa"
                            className={`p-1.5 rounded-full transition-colors ${
                              entry.is_cover
                                ? "bg-yellow-500 text-black"
                                : "bg-white/20 text-white hover:bg-yellow-500/80 hover:text-black"
                            }`}
                          >
                            <Star
                              className="w-4 h-4"
                              fill={entry.is_cover ? "currentColor" : "none"}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeMediaEntry(index);
                            }}
                            title="Remover"
                            className="p-1.5 rounded-full bg-white/20 text-white hover:bg-red-500/80 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {mediaEntries.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {mediaEntries.length} arquivo(s) selecionado(s).{" "}
                    <span className="hidden md:inline">Passe o mouse sobre uma imagem para definir como capa ou remover.</span>
                    <span className="md:hidden">Toque nos botões sobre a imagem para definir capa ou remover.</span>
                  </p>
                )}
              </div>
            )}

            {/* Link tab */}
            {mediaTab === "link" && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Cole links de imagens (ex: Unsplash, Imgur). Clique na estrela
                  para definir a foto de capa.
                </p>

                {linkEntries.map((entry, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-1">
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={entry.url}
                          onChange={(e) => updateLinkUrl(index, e.target.value)}
                          placeholder="https://exemplo.com/foto.jpg"
                          className={inputClass}
                        />
                        <button
                          type="button"
                          onClick={() => setLinkCover(index)}
                          title={
                            entry.is_cover
                              ? "Foto de capa"
                              : "Definir como capa"
                          }
                          className={`flex-shrink-0 p-2.5 rounded-lg border transition-colors ${
                            entry.is_cover
                              ? "border-yellow-500/60 bg-yellow-500/10 text-yellow-400"
                              : "border-border/50 text-muted-foreground hover:text-yellow-400 hover:border-yellow-500/40"
                          }`}
                        >
                          <Star
                            className="w-4 h-4"
                            fill={entry.is_cover ? "currentColor" : "none"}
                          />
                        </button>
                        {linkEntries.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLinkField(index)}
                            className="flex-shrink-0 p-2.5 rounded-lg border border-border/50 text-muted-foreground hover:text-red-400 hover:border-red-500/40 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {/* Thumbnail preview */}
                      {entry.url.trim() && (
                        <div className="relative w-20 h-14 rounded-md overflow-hidden border border-border/30 bg-background">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={entry.url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                          {entry.is_cover && (
                            <span className="absolute top-0.5 left-0.5 text-[9px] bg-yellow-500 text-black font-bold px-1 rounded">
                              CAPA
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addLinkField}
                  className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar mais fotos
                </button>
              </div>
            )}
          </div>

          {/* Upload progress */}
          {uploadProgress && (
            <div className="flex items-center gap-2 justify-center text-sm text-emerald-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              {uploadProgress}
            </div>
          )}

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
              "Cadastrar Imóvel"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
