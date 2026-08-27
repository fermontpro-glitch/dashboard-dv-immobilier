import { TypeView } from "@/components/TypeView";
import { resolveAccount } from "@/lib/meta/accounts";

export const dynamic = "force-dynamic";

export default async function ChallengePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; since?: string; until?: string; account?: string }>;
}) {
  const { account, ...periodParams } = await searchParams;
  const { id: accountId } = resolveAccount(account);
  return <TypeView type="challenge" label="Challenge" periodParams={periodParams} accountId={accountId} />;
}
