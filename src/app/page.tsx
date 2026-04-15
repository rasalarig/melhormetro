import { HomepageHero, HomepageCategories, HomepageHighlights, HomepageFeaturedProperties } from "@/components/homepage-client";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <HomepageHero />
      <HomepageCategories />
      <HomepageHighlights />
      <HomepageFeaturedProperties />
    </>
  );
}
