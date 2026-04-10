import { LeadsThermometer } from "@/components/leads-thermometer";

export const metadata = {
  title: "Leads | MelhorMetro",
};

export const dynamic = "force-dynamic";

export default function LeadsPage() {
  return (
    <div className="container mx-auto px-4 py-8 pt-16">
      <LeadsThermometer />
    </div>
  );
}
