import { CreasGallery } from "@/components/CreasGallery";
import { getCreatives } from "@/lib/meta/queries";
import { resolvePeriod } from "@/lib/meta/period";

export const dynamic = "force-dynamic";

export default async function CreasPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; since?: string; until?: string }>;
}) {
  const params = await searchParams;
  const range = resolvePeriod(params);

  const creatives = await getCreatives({ range });

  return <CreasGallery creatives={creatives} />;
}
