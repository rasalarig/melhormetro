"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  X,
  Edit2,
  Trash2,
  Save,
  Loader2,
  ArrowLeft,
  Building2,
  MapPin,
  Check,
} from "lucide-react";

interface Condominium {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  city: string | null;
  state: string | null;
  neighborhood: string | null;
  amenities: string[] | null;
  lat: number | null;
  lng: number | null;
  cover_image_url: string | null;
  property_count: string;
  created_at: string;
}

const AMENITY_SUGGESTIONS = [
  "Piscina",
  "Academia",
  "Playground",
  "Portaria 24h",
  "Quadra",
  "Salão de Festas",
  "Área Verde",
  "Churrasqueira",
  "Espaço Gourmet",
  "Pet Space",
  "Câmeras de Segurança",
  "Gerador",
  "Espaço Coworking",
  "Court de Tênis",
];

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const emptyForm = {
  name: "",
  description: "",
  city: "",
  state: "",
  neighborhood: "",
  amenities: [] as string[],
  lat: "",
  lng: "",
  cover_image_url: "",
};

export default function AdminCondominiosPage() {
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newAmenity, setNewAmenity] = useState("");
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

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
    const uf = form.state;
    if (!uf) {
      setIbgeCities([]);
      return;
    }
    if (ibgeCitiesCache.current[uf]) {
      setIbgeCities(ibgeCitiesCache.current[uf]);
      return;
    }
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`)
      .then((r) => r.json())
      .then((data: { id: number; nome: string }[]) => {
        ibgeCitiesCache.current[uf] = data;
        setIbgeCities(data);
      })
      .catch(console.error);
  }, [form.state]);

  const fetchCondominiums = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/condominiums");
      const data = await res.json();
      setCondominiums(data.condominiums || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCondominiums();
  }, []);

  const openCreate = () => {
    setForm({ ...emptyForm });
    setEditingSlug(null);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEdit = (condo: Condominium) => {
    setForm({
      name: condo.name,
      description: condo.description || "",
      city: condo.city || "",
      state: condo.state || "",
      neighborhood: condo.neighborhood || "",
      amenities: condo.amenities || [],
      lat: condo.lat != null ? String(condo.lat) : "",
      lng: condo.lng != null ? String(condo.lng) : "",
      cover_image_url: condo.cover_image_url || "",
    });
    setEditingSlug(condo.slug);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Nome é obrigatório");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      neighborhood: form.neighborhood.trim() || null,
      amenities: form.amenities.length > 0 ? form.amenities : null,
      lat: form.lat ? parseFloat(form.lat) : null,
      lng: form.lng ? parseFloat(form.lng) : null,
      cover_image_url: form.cover_image_url.trim() || null,
    };

    try {
      let res: Response;
      if (editingSlug) {
        res = await fetch(`/api/condominiums/${editingSlug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/condominiums", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao salvar");
      }

      setSuccess(editingSlug ? "Condomínio atualizado!" : "Condomínio criado!");
      setShowForm(false);
      await fetchCondominiums();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (condo: Condominium) => {
    if (!confirm(`Excluir "${condo.name}"? Esta ação não pode ser desfeita.`)) return;
    setDeletingSlug(condo.slug);
    try {
      const res = await fetch(`/api/condominiums/${condo.slug}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao excluir");
        return;
      }
      await fetchCondominiums();
    } catch {
      alert("Erro ao excluir condomínio");
    } finally {
      setDeletingSlug(null);
    }
  };

  const addAmenity = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !form.amenities.includes(trimmed)) {
      setForm((f) => ({ ...f, amenities: [...f.amenities, trimmed] }));
    }
    setNewAmenity("");
  };

  const removeAmenity = (a: string) => {
    setForm((f) => ({ ...f, amenities: f.amenities.filter((x) => x !== a) }));
  };

  return (
    <div className="pt-16 pb-16 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Condomínios</h1>
              <p className="text-sm text-muted-foreground">{condominiums.length} cadastrados</p>
            </div>
          </div>
          <Button
            onClick={openCreate}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Novo Condomínio
          </Button>
        </div>

        {/* Success message */}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            {success}
          </div>
        )}

        {/* Create/Edit Form */}
        {showForm && (
          <Card className="p-6 bg-card border-border/50 mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingSlug ? "Editar Condomínio" : "Novo Condomínio"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm text-muted-foreground mb-1 block">
                  Nome *
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Condomínio Jardim das Flores"
                  className="bg-secondary/50 border-border/50"
                />
                {form.name && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Slug: <code className="text-emerald-400">{slugify(form.name)}</code>
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-muted-foreground mb-1 block">
                  Descrição
                </label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Descreva o condomínio, sua localização e diferenciais..."
                  rows={3}
                  className="bg-secondary/50 border-border/50"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Cidade</label>
                <input
                  list="ibge-cities-list-condo"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder={form.state ? "Digite para buscar..." : "Selecione o estado primeiro"}
                  disabled={!form.state}
                  className="w-full h-10 bg-secondary/50 border border-border/50 rounded-lg px-3 text-sm outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                />
                <datalist id="ibge-cities-list-condo">
                  {ibgeCities.map((c) => (
                    <option key={c.id} value={c.nome} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Estado (UF)</label>
                <select
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value, city: "" }))}
                  className="w-full h-10 bg-secondary/50 border border-border/50 rounded-lg px-3 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Selecione</option>
                  {ibgeStates.map((s) => (
                    <option key={s.sigla} value={s.sigla}>{s.sigla} - {s.nome}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-muted-foreground mb-1 block">Bairro</label>
                <Input
                  value={form.neighborhood}
                  onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
                  placeholder="Jardim Europa"
                  className="bg-secondary/50 border-border/50"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  <MapPin className="w-3.5 h-3.5 inline mr-1" />
                  Latitude
                </label>
                <Input
                  value={form.lat}
                  onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
                  placeholder="-23.5489"
                  type="number"
                  step="any"
                  className="bg-secondary/50 border-border/50"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  <MapPin className="w-3.5 h-3.5 inline mr-1" />
                  Longitude
                </label>
                <Input
                  value={form.lng}
                  onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
                  placeholder="-46.6388"
                  type="number"
                  step="any"
                  className="bg-secondary/50 border-border/50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-muted-foreground mb-1 block">URL da Imagem de Capa</label>
                <Input
                  value={form.cover_image_url}
                  onChange={(e) => setForm((f) => ({ ...f, cover_image_url: e.target.value }))}
                  placeholder="https://..."
                  className="bg-secondary/50 border-border/50"
                />
              </div>
            </div>

            {/* Amenities */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Amenidades / Infraestrutura</label>

              {form.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {form.amenities.map((a) => (
                    <Badge
                      key={a}
                      className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 pr-1 gap-1"
                    >
                      {a}
                      <button
                        type="button"
                        onClick={() => removeAmenity(a)}
                        className="ml-1 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex gap-2 mb-2">
                <Input
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAmenity(newAmenity);
                    }
                  }}
                  placeholder="Adicionar amenidade..."
                  className="bg-secondary/50 border-border/50"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addAmenity(newAmenity)}
                  className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {AMENITY_SUGGESTIONS.filter((a) => !form.amenities.includes(a)).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => addAmenity(a)}
                    className="text-xs px-2 py-0.5 rounded-full border border-border hover:border-emerald-500/50 hover:text-emerald-400 transition-colors text-muted-foreground"
                  >
                    + {a}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {editingSlug ? "Salvar Alterações" : "Criar Condomínio"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </Card>
        )}

        {/* Condominiums list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-secondary/40 animate-pulse" />
            ))}
          </div>
        ) : condominiums.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground border border-border/30 rounded-xl">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Nenhum condomínio cadastrado</p>
            <p className="text-sm mt-1">Clique em &quot;Novo Condomínio&quot; para começar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {condominiums.map((condo) => {
              const count = parseInt(condo.property_count, 10);
              return (
                <Card
                  key={condo.id}
                  className="p-4 bg-card border-border/50 hover:border-teal-500/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      {condo.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={condo.cover_image_url}
                          alt={condo.name}
                          className="w-14 h-14 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-6 h-6 text-teal-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{condo.name}</h3>
                        {(condo.city || condo.neighborhood) && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {[condo.neighborhood, condo.city, condo.state].filter(Boolean).join(", ")}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-emerald-400 font-medium">
                            {count} {count === 1 ? "imóvel" : "imóveis"}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">/condominios/{condo.slug}</span>
                        </div>
                        {condo.amenities && condo.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {condo.amenities.slice(0, 4).map((a) => (
                              <Badge key={a} variant="secondary" className="text-[10px] py-0 px-1.5">
                                {a}
                              </Badge>
                            ))}
                            {condo.amenities.length > 4 && (
                              <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                                +{condo.amenities.length - 4}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/condominios/${condo.slug}`} target="_blank">
                        <Button variant="outline" size="sm" className="text-xs px-2.5">
                          Ver
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(condo)}
                        className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-xs px-2.5"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(condo)}
                        disabled={deletingSlug === condo.slug || count > 0}
                        title={count > 0 ? "Não é possível excluir: há imóveis vinculados" : "Excluir"}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs px-2.5 disabled:opacity-40"
                      >
                        {deletingSlug === condo.slug ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
