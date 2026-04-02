import { ReelsFeed } from "@/components/reels-feed";

export const metadata = {
  title: "Reels | PropView",
  description: "Explore imóveis no estilo reels - navegue deslizando entre os melhores imóveis disponíveis.",
};

export default function ReelsPage() {
  return (
    <div className="pt-16 bg-black">
      <ReelsFeed />
    </div>
  );
}
