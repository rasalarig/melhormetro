"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { X, CheckCircle, Loader2, Phone, Mail, User, MessageSquare } from "lucide-react";

interface InterestModalProps {
  propertyId: number;
  propertyTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function InterestModal({ propertyId, propertyTitle, isOpen, onClose }: InterestModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: propertyId,
          name,
          phone,
          email: email || undefined,
          message: message || undefined,
          source: "form",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao enviar");
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao enviar interesse");
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <Card className="w-full max-w-md p-8 bg-card border-border/50 text-center" onClick={e => e.stopPropagation()}>
          <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Interesse registrado!</h3>
          <p className="text-muted-foreground mb-4">
            Entraremos em contato em breve sobre o imovel <strong>{propertyTitle}</strong>.
          </p>
          <Button onClick={onClose} className="bg-emerald-500 hover:bg-emerald-600 text-white">Fechar</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-full max-w-md p-6 bg-card border-border/50" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Tenho Interesse</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Preencha seus dados para demonstrar interesse no imovel <strong className="text-foreground">{propertyTitle}</strong>
        </p>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> Nome *
            </label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Seu nome completo"
              required
              className="bg-secondary/50 border-border/50"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> Telefone *
            </label>
            <Input
              value={phone}
              onChange={e => setPhone(formatPhone(e.target.value))}
              placeholder="(11) 99999-9999"
              required
              className="bg-secondary/50 border-border/50"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="bg-secondary/50 border-border/50"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" /> Mensagem
            </label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Gostaria de mais informacoes sobre..."
              rows={3}
              className="bg-secondary/50 border-border/50"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Phone className="w-4 h-4 mr-2" />}
            Enviar Interesse
          </Button>
        </form>
      </Card>
    </div>
  );
}
