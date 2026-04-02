"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Phone, Mail, MessageSquare, Home, Calendar, ChevronDown, Loader2 } from "lucide-react";
import Link from "next/link";

interface Lead {
  id: number;
  property_id: number;
  property_title: string;
  property_city: string;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  source: string;
  status: string;
  created_at: string;
}

interface Stats {
  total: number;
  novo: number;
  contatado: number;
  convertido: number;
}

interface AdminLeadsListProps {
  leads: Lead[];
  stats: Stats;
}

export function AdminLeadsList({ leads: initialLeads, stats }: AdminLeadsListProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [filter, setFilter] = useState<string>("todos");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const statusColors: Record<string, string> = {
    novo: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    contatado: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    convertido: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    descartado: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const statusLabels: Record<string, string> = {
    novo: "Novo",
    contatado: "Contatado",
    convertido: "Convertido",
    descartado: "Descartado",
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const updateStatus = async (leadId: number, newStatus: string) => {
    setUpdatingId(leadId);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      }
    } catch (err) {
      console.error("Error updating lead:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredLeads = filter === "todos" ? leads : leads.filter(l => l.status === filter);

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-400" />
            Leads de Interesse
          </h1>
          <p className="text-muted-foreground mt-1">{stats.total} leads no total</p>
        </div>
        <Link href="/admin">
          <Button variant="outline" size="sm">Voltar ao Painel</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="p-4 bg-card border-border/50 text-center cursor-pointer hover:border-blue-500/30" onClick={() => setFilter("novo")}>
          <p className="text-2xl font-bold text-blue-400">{stats.novo}</p>
          <p className="text-xs text-muted-foreground">Novos</p>
        </Card>
        <Card className="p-4 bg-card border-border/50 text-center cursor-pointer hover:border-yellow-500/30" onClick={() => setFilter("contatado")}>
          <p className="text-2xl font-bold text-yellow-400">{stats.contatado}</p>
          <p className="text-xs text-muted-foreground">Contatados</p>
        </Card>
        <Card className="p-4 bg-card border-border/50 text-center cursor-pointer hover:border-emerald-500/30" onClick={() => setFilter("convertido")}>
          <p className="text-2xl font-bold text-emerald-400">{stats.convertido}</p>
          <p className="text-xs text-muted-foreground">Convertidos</p>
        </Card>
        <Card className="p-4 bg-card border-border/50 text-center cursor-pointer hover:border-border" onClick={() => setFilter("todos")}>
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </Card>
      </div>

      {/* Filter indicator */}
      {filter !== "todos" && (
        <div className="flex items-center gap-2 mb-4">
          <Badge className={statusColors[filter]}>{statusLabels[filter]}</Badge>
          <button onClick={() => setFilter("todos")} className="text-xs text-muted-foreground hover:text-foreground">
            Limpar filtro
          </button>
        </div>
      )}

      {/* Leads List */}
      {filteredLeads.length === 0 ? (
        <Card className="p-12 text-center bg-card border-border/50">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {filter !== "todos" ? "Nenhum lead com este status." : "Nenhum lead registrado ainda."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLeads.map(lead => (
            <Card key={lead.id} className="p-4 bg-card border-border/50 hover:border-emerald-500/20 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{lead.name}</span>
                    <Badge className={`text-xs ${statusColors[lead.status]}`}>
                      {statusLabels[lead.status]}
                    </Badge>
                    {lead.source === "whatsapp" && (
                      <Badge variant="secondary" className="text-xs">WhatsApp</Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {lead.phone}
                    </span>
                    {lead.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {lead.email}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Home className="w-3 h-3" />
                      <Link href={`/imoveis/${lead.property_id}`} className="hover:text-emerald-400">
                        {lead.property_title}
                      </Link>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {formatDate(lead.created_at)}
                    </span>
                  </div>

                  {lead.message && (
                    <div className="mt-2 p-2 rounded bg-secondary/50 text-sm text-muted-foreground flex items-start gap-1">
                      <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                      {lead.message}
                    </div>
                  )}
                </div>

                {/* Status dropdown */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative">
                    <select
                      value={lead.status}
                      onChange={e => updateStatus(lead.id, e.target.value)}
                      disabled={updatingId === lead.id}
                      className="appearance-none bg-secondary/50 border border-border/50 rounded-lg px-3 py-1.5 pr-8 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="novo">Novo</option>
                      <option value="contatado">Contatado</option>
                      <option value="convertido">Convertido</option>
                      <option value="descartado">Descartado</option>
                    </select>
                    {updatingId === lead.id ? (
                      <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" />
                    )}
                  </div>

                  <a
                    href={`https://wa.me/${lead.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Ola ${lead.name}! Vi que voce demonstrou interesse no imovel "${lead.property_title}". Como posso ajudar?`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
