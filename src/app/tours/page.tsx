import { ReelsFeed } from "@/components/reels-feed";

export const metadata = {
  title: "Tours | MelhorMetro",
  description: "Explore imóveis em tours em vídeo - navegue deslizando entre os melhores imóveis disponíveis.",
};

export default function ReelsPage() {
  return (
    <div className="bg-gradient-to-br from-zinc-800 to-zinc-900">
      <ReelsFeed />
    </div>
  );
}
