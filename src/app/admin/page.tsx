import { AdminPropertyList } from "@/components/admin-property-list";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Painel Admin | PropView",
  description: "Gerenciar imoveis cadastrados",
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
  const { default: db } = await import("@/lib/db");
  return db
    .prepare(
      "SELECT id, title, price, area, type, city, state, status, created_at FROM properties ORDER BY created_at DESC"
    )
    .all() as Property[];
}

async function getNewLeadsCount() {
  const { default: db } = await import("@/lib/db");
  return (db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'novo'").get() as { count: number }).count;
}

export default async function AdminPage() {
  const properties = await getProperties();
  const newLeadsCount = await getNewLeadsCount();

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Painel Admin</h1>
            <p className="text-muted-foreground mt-1">
              {properties.length} imoveis cadastrados
            </p>
          </div>
          <div className="flex items-center gap-3">
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
            <Link href="/admin/cadastro">
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Novo Imovel
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
