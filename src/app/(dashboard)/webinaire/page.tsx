import { TypeView } from "@/components/TypeView";
import { resolveAccount } from "@/lib/meta/accounts";

export const dynamic = "force-dynamic";

export default async function WebinairePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; since?: string; until?: string; account?: string }>;
}) {
  const { account, ...periodParams } = await searchParams;
  const { id: accountId } = resolveAccount(account);
  return <TypeView type="webinaire" label="Webinaire" periodParams={periodParams} accountId={accountId} />;
}
