import { TypeView } from "@/components/TypeView";

export const dynamic = "force-dynamic";

export default async function ChallengePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period } = await searchParams;
  return <TypeView type="challenge" label="Challenge" period={period} />;
}
