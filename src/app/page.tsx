import { ReelsFeed } from "@/components/reels-feed";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="fixed inset-0 bg-black z-40">
      <ReelsFeed />
    </div>
  );
}
