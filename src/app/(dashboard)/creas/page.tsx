import { CreasGallery } from "@/components/CreasGallery";
import { getCreatives } from "@/lib/meta/queries";
import { resolvePeriod } from "@/lib/meta/period";
import { resolveAccount } from "@/lib/meta/accounts";

export const dynamic = "force-dynamic";

export default async function CreasPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; since?: string; until?: string; account?: string }>;
}) {
  const { account, ...periodParams } = await searchParams;
  const range = resolvePeriod(periodParams);
  const { id: accountId } = resolveAccount(account);

  const creatives = await getCreatives({ range, accountId });

  return <CreasGallery creatives={creatives} />;
}
