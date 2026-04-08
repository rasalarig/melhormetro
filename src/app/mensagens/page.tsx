"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { ArrowLeft, Send, MessageCircle, Check, CheckCheck } from "lucide-react";
import Link from "next/link";

interface OtherUser {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
}

interface Message {
  id: number;
  sender_id: number;
  content: string;
  read_at: string | null;
  created_at: string;
}

interface Conversation {
  id: number;
  property_id: number;
  property_title: string;
  property_city?: string;
  other_user: OtherUser;
  last_message: Message | null;
  unread_count: number;
  updated_at: string;
}

function getInitial(name: string) {
  return name.charAt(0).toUpperCase();
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } else if (days === 1) {
    return "Ontem";
  } else if (days < 7) {
    return date.toLocaleDateString("pt-BR", { weekday: "short" });
  }
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function formatMessageTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function MensagensContent() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initializedRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations);
        return data.conversations as Conversation[];
      }
    } catch {
      // ignore
    }
    return [];
  }, []);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (conversationId: number) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        setTimeout(scrollToBottom, 100);
      }
    } catch {
      // ignore
    }
  }, [scrollToBottom]);

  // Handle URL params to auto-open conversation
  useEffect(() => {
    if (loading || !user || initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      const convs = await fetchConversations();
      setLoadingConversations(false);

      const paramUser = searchParams.get("user");
      const paramProperty = searchParams.get("property");

      if (paramUser && paramProperty) {
        try {
          const res = await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              property_id: parseInt(paramProperty),
              other_user_id: parseInt(paramUser),
            }),
          });
          if (res.ok) {
            const data = await res.json();
            const conv = data.conversation;
            setActiveConversation(conv);
            setMobileShowChat(true);
            setLoadingMessages(true);
            await fetchMessages(conv.id);
            setLoadingMessages(false);
            // Refresh conversation list
            await fetchConversations();
          }
        } catch {
          // ignore
        }
      } else if (convs.length > 0) {
        // Auto-select first conversation on desktop
        // (mobile stays on list)
      }
    };

    init();
  }, [loading, user, searchParams, fetchConversations, fetchMessages]);

  // Load conversations on mount (no URL params case)
  useEffect(() => {
    if (loading || !user) return;
    if (!initializedRef.current) return;
    // Already loaded in init
  }, [loading, user]);

  // Poll messages when chat is open
  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    if (activeConversation) {
      pollRef.current = setInterval(() => {
        fetchMessages(activeConversation.id);
        fetchConversations();
      }, 5000);
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [activeConversation, fetchMessages, fetchConversations]);

  const openConversation = async (conv: Conversation) => {
    setActiveConversation(conv);
    setMobileShowChat(true);
    setLoadingMessages(true);
    await fetchMessages(conv.id);
    setLoadingMessages(false);
    // Clear unread for this conversation locally
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c))
    );
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    try {
      const res = await fetch(`/api/conversations/${activeConversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setTimeout(scrollToBottom, 100);
        // Refresh conversations to update last message
        fetchConversations();
      }
    } catch {
      // Restore message on error
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const goBackToList = () => {
    setMobileShowChat(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <MessageCircle className="w-12 h-12 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Faca login para ver suas mensagens</h1>
        <Link
          href="/login"
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Entrar
        </Link>
      </div>
    );
  }

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  return (
    <div className="min-h-screen bg-background pt-0 md:pt-28">
      <div className="h-[calc(100dvh-4rem)] md:h-[calc(100dvh-7rem)] flex flex-col md:flex-row max-w-6xl mx-auto md:border-x border-border/40">
        {/* Left Panel - Conversation List */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-border/40 flex flex-col ${
            mobileShowChat ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-border/40 flex items-center gap-2">
            <h1 className="text-lg font-semibold">Mensagens</h1>
            {totalUnread > 0 && (
              <span className="inline-flex items-center justify-center px-2 h-5 rounded-full bg-emerald-500 text-white text-xs font-bold">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <MessageCircle className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Nenhuma conversa ainda</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Inicie uma conversa a partir de um imovel
                </p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className={`w-full text-left p-4 border-b border-border/20 hover:bg-accent/30 transition-colors ${
                    activeConversation?.id === conv.id ? "bg-accent/40" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    {conv.other_user.avatar_url ? (
                      <img
                        src={conv.other_user.avatar_url}
                        alt={conv.other_user.name}
                        className="w-10 h-10 rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                        {getInitial(conv.other_user.name)}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">
                          {conv.other_user.name}
                        </span>
                        {conv.last_message && (
                          <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
                            {formatTime(conv.last_message.created_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-emerald-500/70 truncate">
                        {conv.property_title}
                      </p>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-muted-foreground truncate flex-1">
                          {conv.last_message?.content || "Nenhuma mensagem"}
                        </p>
                        {conv.unread_count > 0 && (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold ml-2 flex-shrink-0">
                            {conv.unread_count > 99 ? "99" : conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Chat */}
        <div
          className={`flex-1 flex flex-col ${
            !mobileShowChat ? "hidden md:flex" : "flex"
          }`}
        >
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border/40 flex items-center gap-3">
                <button
                  onClick={goBackToList}
                  className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                {activeConversation.other_user.avatar_url ? (
                  <img
                    src={activeConversation.other_user.avatar_url}
                    alt={activeConversation.other_user.name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-medium">
                    {getInitial(activeConversation.other_user.name)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {activeConversation.other_user.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {activeConversation.property_title}
                  </p>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Envie a primeira mensagem
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === user.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                            isMine
                              ? "bg-emerald-600 text-white rounded-br-md"
                              : "bg-card border border-border/40 text-foreground rounded-bl-md"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                          <div
                            className={`flex items-center gap-1 mt-1 ${
                              isMine ? "justify-end" : "justify-start"
                            }`}
                          >
                            <span
                              className={`text-[10px] ${
                                isMine ? "text-emerald-200" : "text-muted-foreground"
                              }`}
                            >
                              {formatMessageTime(msg.created_at)}
                            </span>
                            {isMine && (
                              msg.read_at ? (
                                <CheckCheck className="w-3 h-3 text-emerald-200" />
                              ) : (
                                <Check className="w-3 h-3 text-emerald-300/60" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 border-t border-border/40">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 bg-card border border-border/40 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                    disabled={sending}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <MessageCircle className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Selecione uma conversa para comecar
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MensagensPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
        </div>
      }
    >
      <MensagensContent />
    </Suspense>
  );
}
