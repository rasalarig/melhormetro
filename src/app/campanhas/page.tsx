import { CampaignsPage } from "@/components/campaigns-page";

export const metadata = {
  title: "Campanhas | MelhorMetro",
};

export const dynamic = "force-dynamic";

export default function Campanhas() {
  return (
    <div className="container mx-auto px-4 py-8 pt-16 pb-24">
      <CampaignsPage />
    </div>
  );
}
