import { AdminPropertyList } from "@/components/admin-property-list";
import { Button } from "@/components/ui/button";
import { Plus, Users, Megaphone, Settings, MessageCircle } from "lucide-react";
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
    "SELECT id, title, price, area, type, city, state, status, is_premium, created_at FROM properties ORDER BY created_at DESC"
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Painel Admin</h1>
            <p className="text-muted-foreground mt-1">
              {properties.length} imóveis cadastrados
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/configuracoes">
              <Button variant="outline" size="sm" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </Button>
            </Link>
            <Link href="/admin/leads">
              <Button variant="outline" size="sm" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                <Users className="w-4 h-4 mr-2" />
                Leads
                {newLeadsCount > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-emerald-500 text-white">
                    {newLeadsCount}
                  </span>
                )}
              </Button>
            </Link>
            <Link href="/admin/conversas">
              <Button variant="outline" size="sm" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                <MessageCircle className="w-4 h-4 mr-2" />
                Conversas
              </Button>
            </Link>
            <Link href="/campanhas">
              <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
                <Megaphone className="w-4 h-4 mr-2" />
                Campanhas
              </Button>
            </Link>
            <Link href="/admin/cadastro">
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Novo Imóvel
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
