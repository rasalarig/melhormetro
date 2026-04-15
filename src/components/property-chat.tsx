"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface PropertyChatProps {
  propertyId: number;
  propertyTitle: string;
  propertyType: string;
}

const MAX_MESSAGES = 20;

const BASE_SUGGESTIONS = [
  "Quais as características deste imóvel?",
  "Aceita financiamento?",
  "Como é a vizinhança?",
  "Qual o valor do condomínio?",
  "O imóvel está disponível para visita?",
];

const TERRENO_SUGGESTIONS = [
  "O terreno tem declive?",
  "Dá para construir?",
];

export function PropertyChat({ propertyId, propertyTitle, propertyType }: PropertyChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isTerreno =
    propertyType === "terreno" || propertyType === "terreno_condominio";

  const suggestions = isTerreno
    ? [...BASE_SUGGESTIONS.slice(0, 3), ...TERRENO_SUGGESTIONS]
    : BASE_SUGGESTIONS;

  const isLimitReached = messageCount >= MAX_MESSAGES;

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current && !isLoading) {
      inputRef.current.focus();
    }
  }, [isOpen, isLoading]);

  const sendMessage = async (question: string) => {
    if (!question.trim() || isLoading || isLimitReached) return;

    const userMessage: Message = { role: "user", content: question.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setMessageCount((c) => c + 1);

    try {
      const res = await fetch("/api/ai/property-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          question: question.trim(),
          history: messages, // send previous history for context
        }),
      });

      if (!res.ok) {
        throw new Error("Erro na resposta do servidor");
      }

      const data = await res.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.answer || "Não foi possível obter uma resposta no momento.",
      };
      setMessages([...newMessages, assistantMessage]);
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            "Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente em instantes.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestion = (suggestion: string) => {
    sendMessage(suggestion);
  };

  return (
    <>
      {/* Floating button (collapsed state) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-full shadow-lg px-4 py-3 transition-all duration-200 hover:shadow-xl hover:scale-105"
          aria-label="Abrir chat sobre o imóvel"
        >
          <MessageCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium whitespace-nowrap">
            Perguntar sobre este imóvel
          </span>
        </button>
      )}

      {/* Chat panel (expanded state) */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col w-[350px] max-w-[calc(100vw-24px)] h-[500px] max-h-[calc(100vh-100px)] rounded-2xl shadow-2xl border border-border/50 bg-background overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Bot className="w-5 h-5 text-white shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white leading-tight">
                  Assistente IA
                </p>
                <p className="text-xs text-emerald-100 truncate leading-tight">
                  {propertyTitle}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors shrink-0 ml-2"
              aria-label="Fechar chat"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {/* Welcome + suggestions when no messages yet */}
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex-1 bg-secondary/60 rounded-2xl rounded-tl-sm px-3 py-2 text-sm text-foreground leading-relaxed">
                    Olá! Sou o assistente do MelhorMetro. Posso responder suas
                    perguntas sobre este imóvel com base nas informações do
                    anúncio. O que você gostaria de saber?
                  </div>
                </div>

                {/* Suggestion chips */}
                <div className="flex flex-wrap gap-2 pl-9">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSuggestion(s)}
                      disabled={isLoading}
                      className="text-xs px-3 py-1.5 rounded-full border border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message list */}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 ${
                  msg.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    msg.role === "user"
                      ? "bg-emerald-500/20"
                      : "bg-secondary"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Bot className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div
                  className={`flex-1 rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-tr-sm"
                      : "bg-secondary/60 text-foreground rounded-tl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="bg-secondary/60 rounded-2xl rounded-tl-sm px-3 py-2">
                  <div className="flex items-center gap-1">
                    <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                    <span className="text-xs text-muted-foreground">
                      Digitando...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Limit reached message */}
            {isLimitReached && (
              <div className="text-center text-xs text-muted-foreground bg-secondary/40 rounded-xl px-3 py-2">
                Limite de perguntas atingido. Entre em contato com o vendedor
                para mais informações.
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message count indicator */}
          {messages.length > 0 && !isLimitReached && (
            <div className="px-4 py-1 shrink-0">
              <p className="text-xs text-muted-foreground text-right">
                {messageCount}/{MAX_MESSAGES} perguntas
              </p>
            </div>
          )}

          {/* Input area */}
          <div className="p-3 border-t border-border/50 bg-background shrink-0">
            {isLimitReached ? (
              <p className="text-xs text-muted-foreground text-center py-1">
                Limite atingido
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Digite sua pergunta..."
                  disabled={isLoading}
                  className="flex-1 text-sm bg-secondary/50 border border-border/50 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 placeholder:text-muted-foreground disabled:opacity-50 min-w-0"
                  maxLength={500}
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  size="sm"
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl shrink-0 px-3"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
