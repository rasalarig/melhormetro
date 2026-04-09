"use client";

import { useState } from "react";
import { Paintbrush, Loader2, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ReimaginePanelProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

const STYLES = [
  { key: "moderno", label: "Moderno" },
  { key: "rustico", label: "Rústico" },
  { key: "minimalista", label: "Minimalista" },
  { key: "industrial", label: "Industrial" },
  { key: "classico", label: "Clássico" },
  { key: "tropical", label: "Tropical" },
  { key: "escandinavo", label: "Escandinavo" },
];

const COLORS = [
  { key: "branco", label: "Branco", hex: "#FFFFFF" },
  { key: "bege", label: "Bege", hex: "#D4B896" },
  { key: "cinza", label: "Cinza", hex: "#B0B0B0" },
  { key: "azul", label: "Azul", hex: "#7BA7C9" },
  { key: "verde", label: "Verde", hex: "#87A987" },
  { key: "terracota", label: "Terracota", hex: "#C2714F" },
  { key: "amarelo", label: "Amarelo", hex: "#E8C95A" },
  { key: "rosa", label: "Rosa", hex: "#E8A0BF" },
];

const FLOORS = [
  { key: "madeira", label: "Madeira" },
  { key: "porcelanato", label: "Porcelanato" },
  { key: "marmore", label: "Mármore" },
  { key: "cimento", label: "Cimento" },
  { key: "vinilico", label: "Vinílico" },
  { key: "ceramica", label: "Cerâmica" },
];

export function ReimaginePanelTrigger({
  onClick,
  variant = "reel",
}: {
  onClick: () => void;
  variant?: "reel" | "detail";
}) {
  if (variant === "detail") {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white text-xs hover:bg-black/80 transition-colors z-10"
        title="Reimaginar este ambiente"
      >
        <Paintbrush className="w-3.5 h-3.5" />
        <span>Reimaginar</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 group/reimagine"
      aria-label="Reimaginar ambiente"
    >
      <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
        <Paintbrush className="w-5 h-5 text-white" />
      </div>
      <span className="text-white/70 text-[10px]">Reimaginar</span>
    </button>
  );
}

export function ReimaginePanelDialog({
  imageUrl,
  isOpen,
  onClose,
}: ReimaginePanelProps) {
  const [style, setStyle] = useState("");
  const [wallColor, setWallColor] = useState("");
  const [floor, setFloor] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setGeneratedUrl("");

    try {
      const res = await fetch("/api/reimagine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          style,
          wall_color: wallColor,
          floor,
          custom_prompt: customPrompt,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao gerar imagem.");
        return;
      }

      setGeneratedUrl(data.generated_url);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setGeneratedUrl("");
    setError("");
  };

  const handleClose = () => {
    setGeneratedUrl("");
    setError("");
    setStyle("");
    setWallColor("");
    setFloor("");
    setCustomPrompt("");
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Paintbrush className="w-5 h-5 text-emerald-400" />
            Reimaginar Ambiente
          </DialogTitle>
          <DialogDescription>
            Transforme este ambiente com diferentes estilos, cores e pisos usando inteligência artificial.
          </DialogDescription>
        </DialogHeader>

        {/* Result view */}
        {generatedUrl ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground text-center">
                  Original
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Foto original"
                  className="w-full aspect-square object-cover rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-emerald-400 text-center">
                  Reimaginado
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={generatedUrl}
                  alt="Ambiente reimaginado"
                  className="w-full aspect-square object-cover rounded-lg"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button
                onClick={handleReset}
                variant="outline"
                className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Gerar novamente
              </Button>
              <Button
                onClick={handleClose}
                variant="outline"
              >
                <X className="w-4 h-4 mr-2" />
                Fechar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Original image thumbnail */}
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Foto original"
                className="w-32 h-32 object-cover rounded-lg border border-border/50"
              />
            </div>

            {/* Style selection */}
            <div>
              <p className="text-sm font-medium mb-2">Estilo de Decoração</p>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setStyle(style === s.key ? "" : s.key)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      style === s.key
                        ? "bg-emerald-500 text-white"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Wall color selection */}
            <div>
              <p className="text-sm font-medium mb-2">Cor das Paredes</p>
              <div className="flex flex-wrap gap-3">
                {COLORS.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setWallColor(wallColor === c.key ? "" : c.key)}
                    className={`flex flex-col items-center gap-1 group/color`}
                    title={c.label}
                  >
                    <div
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        wallColor === c.key
                          ? "border-emerald-400 scale-110 ring-2 ring-emerald-400/30"
                          : "border-border hover:border-foreground/30"
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {c.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Floor selection */}
            <div>
              <p className="text-sm font-medium mb-2">Tipo de Piso</p>
              <div className="flex flex-wrap gap-2">
                {FLOORS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFloor(floor === f.key ? "" : f.key)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      floor === f.key
                        ? "bg-emerald-500 text-white"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom prompt */}
            <div>
              <p className="text-sm font-medium mb-2">Prompt personalizado</p>
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Descreva outras mudanças..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}

            {/* Generate button */}
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium py-5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando sua versão... (10-30 segundos)
                </>
              ) : (
                <>
                  <Paintbrush className="w-4 h-4 mr-2" />
                  Gerar
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
