"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import {
  MessageCircle, ArrowLeft, Flame, Sun, Snowflake, CheckCircle2,
  Shield, Eye, ChevronDown, ChevronUp, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface UserInfo {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
}

interface LastMessage {
  content: string;
  created_at: string;
  sender_name: string;
}

interface AdminMessage {
  id: number;
  sender_id: number;
  content: string;
  read_at: string | null;
  created_at: string;
  sender_name: string;
  sender_avatar: string | null;
}

interface ConversationDetail {
  id: number;
  property_title: string;
  property_price: number;
  seller_name: string;
  seller_user_id: number;
  buyer_name: string;
  buyer_user_id: number;
  intermediation_status: string;
}

interface AdminConversation {
  id: number;
  property_id: number;
  property_title: string;
  property_price: number;
  property_city: string;
  seller: UserInfo;
  buyer: UserInfo;
  total_messages: number;
  last_message: LastMessage | null;
  engagement_score: number;
  temperature: string;
  intermediation_status: string;
  updated_at: string;
}

const temperatureConfig: Record<string, { icon: typeof Flame; color: string; bg: string; label: string }> = {
  convertido: { icon: CheckCircle2, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", label: "Convertido" },
  quente: { icon: Flame, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", label: "Quente" },
  morno: { icon: Sun, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", label: "Morno" },
  frio: { icon: Snowflake, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20", label: "Frio" },
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(price);
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return "Ontem";
  if (days < 7) return date.toLocaleDateString("pt-BR", { weekday: "short" });
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function formatMessageTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function AdminConversasPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filter, setFilter] = useState<string>("todos");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<AdminMessage[]>([]);
  const [expandedConvDetail, setExpandedConvDetail] = useState<ConversationDetail | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    if (!loading && user && !user.is_admin) {
      router.replace("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user?.is_admin) {
      fetchConversations();
    }
  }, [loading, user]);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/admin/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations);
      }
    } catch {
      // ignore
    } finally {
      setLoadingData(false);
    }
  };

  const toggleExpand = async (convId: number) => {
    if (expandedId === convId) {
      setExpandedId(null);
      setExpandedMessages([]);
      setExpandedConvDetail(null);
      return;
    }

    setExpandedId(convId);
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/admin/conversations/${convId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setExpandedMessages(data.messages);
        setExpandedConvDetail(data.conversation);
      }
    } catch {
      // ignore
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleIntermediationUpdate = async (convId: number, status: string) => {
    try {
      const res = await fetch(`/api/admin/conversations/${convId}/intermediation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) => c.id === convId ? { ...c, intermediation_status: status } : c)
        );
      }
    } catch {
      // ignore
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (!user?.is_admin) return null;

  const filtered = filter === "todos"
    ? conversations
    : conversations.filter((c) => c.temperature === filter);

  const stats = {
    total: conversations.length,
    quente: conversations.filter((c) => c.temperature === "quente").length,
    convertido: conversations.filter((c) => c.temperature === "convertido").length,
    needsIntermediation: conversations.filter((c) =>
      (c.temperature === "quente" || c.temperature === "convertido") && c.intermediation_status === "none"
    ).length,
  };

  return (
    <div className="pt-16 pb-16 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Admin
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-emerald-500" />
              Conversas da Plataforma
            </h1>
            <p className="text-sm text-muted-foreground">{stats.total} conversas ativas</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-4 rounded-xl border border-border/40 bg-card">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
            <p className="text-2xl font-bold text-red-400">{stats.quente}</p>
            <p className="text-xs text-red-400/70">Quentes</p>
          </div>
          <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
            <p className="text-2xl font-bold text-blue-400">{stats.convertido}</p>
            <p className="text-xs text-blue-400/70">Convertidos</p>
          </div>
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
            <p className="text-2xl font-bold text-amber-400">{stats.needsIntermediation}</p>
            <p className="text-xs text-amber-400/70">Aguardando Intermediação</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {["todos", "convertido", "quente", "morno", "frio"].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                filter === t
                  ? "bg-emerald-500 text-white"
                  : "bg-card border border-border/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "todos" ? "Todos" : temperatureConfig[t]?.label || t}
            </button>
          ))}
        </div>

        {/* Conversations List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma conversa encontrada
            </div>
          ) : (
            filtered.map((conv) => {
              const tempConfig = temperatureConfig[conv.temperature] || temperatureConfig.frio;
              const TempIcon = tempConfig.icon;
              const isExpanded = expandedId === conv.id;
              const needsAction = (conv.temperature === "quente" || conv.temperature === "convertido") && conv.intermediation_status === "none";

              return (
                <div key={conv.id} className={`rounded-xl border ${needsAction ? "border-amber-500/30 bg-amber-500/5" : "border-border/40 bg-card"} overflow-hidden`}>
                  {/* Conversation Header */}
                  <button
                    onClick={() => toggleExpand(conv.id)}
                    className="w-full text-left p-4 hover:bg-accent/20 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Property info */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${tempConfig.bg} ${tempConfig.color}`}>
                            <TempIcon className="w-3 h-3" />
                            {tempConfig.label}
                          </span>
                          {needsAction && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400">
                              <AlertTriangle className="w-3 h-3" />
                              Requer Intermediação
                            </span>
                          )}
                          {conv.intermediation_status === "active" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                              <Shield className="w-3 h-3" />
                              Em Intermediação
                            </span>
                          )}
                          {conv.intermediation_status === "closed" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-blue-400">
                              <CheckCircle2 className="w-3 h-3" />
                              Fechado
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-semibold truncate">{conv.property_title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(conv.property_price)} — {conv.property_city}
                        </p>

                        {/* Participants */}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Vendedor: <strong className="text-foreground">{conv.seller.name}</strong></span>
                          <span>Comprador: <strong className="text-foreground">{conv.buyer.name}</strong></span>
                        </div>

                        {/* Last message */}
                        {conv.last_message && (
                          <p className="text-xs text-muted-foreground mt-2 truncate">
                            <strong>{conv.last_message.sender_name}:</strong> {conv.last_message.content}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MessageCircle className="w-3 h-3" />
                          {conv.total_messages}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {conv.last_message ? formatTime(conv.last_message.created_at) : "—"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Score: {conv.engagement_score}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Messages */}
                  {isExpanded && (
                    <div className="border-t border-border/40">
                      {/* Intermediation Controls */}
                      <div className="p-3 bg-accent/10 flex items-center gap-2 flex-wrap">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground mr-2">Intermediação:</span>
                        {["none", "active", "closed"].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleIntermediationUpdate(conv.id, status)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              conv.intermediation_status === status
                                ? status === "active" ? "bg-emerald-500 text-white" : status === "closed" ? "bg-blue-500 text-white" : "bg-muted text-foreground"
                                : "bg-card border border-border/40 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {status === "none" ? "Nenhuma" : status === "active" ? "Ativa" : "Fechada"}
                          </button>
                        ))}
                      </div>

                      {/* Messages */}
                      <div className="max-h-96 overflow-y-auto p-4 space-y-3">
                        {loadingMessages ? (
                          <div className="flex justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
                          </div>
                        ) : expandedMessages.length === 0 ? (
                          <p className="text-center text-sm text-muted-foreground py-4">Nenhuma mensagem</p>
                        ) : (
                          expandedMessages.map((msg) => {
                            const isSeller = expandedConvDetail && msg.sender_id === expandedConvDetail.seller_user_id;
                            return (
                              <div key={msg.id} className={`flex ${isSeller ? "justify-start" : "justify-end"}`}>
                                <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                                  isSeller
                                    ? "bg-card border border-border/40 rounded-bl-md"
                                    : "bg-emerald-600/20 border border-emerald-500/20 rounded-br-md"
                                }`}>
                                  <p className="text-[10px] font-medium text-muted-foreground mb-1">
                                    {msg.sender_name} ({isSeller ? "Vendedor" : "Comprador"})
                                  </p>
                                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                  <span className="text-[10px] text-muted-foreground">{formatMessageTime(msg.created_at)}</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
