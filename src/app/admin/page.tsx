import { AdminPropertyList } from "@/components/admin-property-list";
import { Button } from "@/components/ui/button";
import { Plus, Users, Megaphone, Settings, MessageCircle, Shield, ShieldAlert, Eye, BarChart3 } from "lucide-react";
import Link from "next/link";
import { getAll, getOne } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Painel Admin | MelhorMetro",
  description: "Gerenciar imóveis cadastrados",
};

interface Property {
  id: number;
  title: string;
  price: number;
  area: number;
  type: string;
  city: string;
  state: string;
  status: string;
  created_at: string;
}

async function getProperties() {
  return await getAll(
    "SELECT id, title, price, area, type, city, state, status, is_premium, approved, created_at FROM properties ORDER BY created_at DESC"
  ) as Property[];
}

async function getNewLeadsCount() {
  const row = await getOne("SELECT COUNT(*) as count FROM leads WHERE status = 'novo'") as { count: string };
  return parseInt(row.count, 10);
}

export default async function AdminPage() {
  const properties = await getProperties();
  const newLeadsCount = await getNewLeadsCount();

  return (
    <div className="pt-16 pb-16 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Painel Admin</h1>
              <p className="text-muted-foreground mt-1">
                {properties.length} imóveis cadastrados
              </p>
            </div>
            <Link href="/admin/cadastro">
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Novo Imóvel</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
            <Link href="/admin/configuracoes">
              <Button variant="outline" size="sm" className="w-full border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs px-2">
                <Settings className="w-4 h-4 sm:mr-1.5 shrink-0" />
                <span className="hidden sm:inline">Config</span>
              </Button>
            </Link>
            <Link href="/admin/usuarios">
              <Button variant="outline" size="sm" className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs px-2">
                <Shield className="w-4 h-4 sm:mr-1.5 shrink-0" />
                <span className="hidden sm:inline">Usuários</span>
              </Button>
            </Link>
            <Link href="/admin/violacoes">
              <Button variant="outline" size="sm" className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs px-2">
                <ShieldAlert className="w-4 h-4 sm:mr-1.5 shrink-0" />
                <span className="hidden sm:inline">Violações</span>
              </Button>
            </Link>
            <Link href="/admin/leads">
              <Button variant="outline" size="sm" className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs px-2 relative">
                <Users className="w-4 h-4 sm:mr-1.5 shrink-0" />
                <span className="hidden sm:inline">Leads</span>
                {newLeadsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-emerald-500 text-white leading-none">
                    {newLeadsCount}
                  </span>
                )}
              </Button>
            </Link>
            <Link href="/admin/conversas">
              <Button variant="outline" size="sm" className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-xs px-2">
                <MessageCircle className="w-4 h-4 sm:mr-1.5 shrink-0" />
                <span className="hidden sm:inline">Conversas</span>
              </Button>
            </Link>
            <Link href="/campanhas">
              <Button variant="outline" size="sm" className="w-full border-purple-500/30 text-purple-400 hover:bg-purple-500/10 text-xs px-2">
                <Megaphone className="w-4 h-4 sm:mr-1.5 shrink-0" />
                <span className="hidden sm:inline">Campanhas</span>
              </Button>
            </Link>
            <Link href="/admin/moderacao">
              <Button variant="outline" size="sm" className="w-full border-violet-500/30 text-violet-400 hover:bg-violet-500/10 text-xs px-2">
                <Eye className="w-4 h-4 sm:mr-1.5 shrink-0" />
                <span className="hidden sm:inline">Moderação</span>
              </Button>
            </Link>
            <Link href="/admin/analytics">
              <Button variant="outline" size="sm" className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 text-xs px-2">
                <BarChart3 className="w-4 h-4 sm:mr-1.5 shrink-0" />
                <span className="hidden sm:inline">Analytics</span>
              </Button>
            </Link>
          </div>
        </div>

        <AdminPropertyList
          properties={JSON.parse(JSON.stringify(properties))}
        />
      </div>
    </div>
  );
}
