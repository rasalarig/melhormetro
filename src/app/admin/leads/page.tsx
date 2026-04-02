import { AdminLeadsList } from "@/components/admin-leads-list";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Leads | PropView Admin",
  description: "Gerenciar leads de interesse",
};

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

async function getLeads() {
  const { default: db } = await import("@/lib/db");

  const leads = db.prepare(`
    SELECT l.*, p.title as property_title, p.city as property_city
    FROM leads l
    JOIN properties p ON l.property_id = p.id
    ORDER BY l.created_at DESC
  `).all() as Lead[];

  const stats = {
    total: (db.prepare("SELECT COUNT(*) as count FROM leads").get() as { count: number }).count,
    novo: (db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'novo'").get() as { count: number }).count,
    contatado: (db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'contatado'").get() as { count: number }).count,
    convertido: (db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'convertido'").get() as { count: number }).count,
  };

  return { leads, stats };
}

export default async function AdminLeadsPage() {
  const { leads, stats } = await getLeads();

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-5xl">
        <AdminLeadsList leads={JSON.parse(JSON.stringify(leads))} stats={stats} />
      </div>
    </div>
  );
}
