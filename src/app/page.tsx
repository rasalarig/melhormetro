import { SearchHero } from "@/components/search-hero";
import { FeaturedProperties } from "@/components/featured-properties";
import { HowItWorks } from "@/components/how-it-works";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <SearchHero />
      <FeaturedProperties />
      <HowItWorks />
    </>
  );
}
