import { TypeView } from "@/components/TypeView";

export const dynamic = "force-dynamic";

export default async function LeadMagnetPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; since?: string; until?: string }>;
}) {
  const periodParams = await searchParams;
  return <TypeView type="leadmagnet" label="Lead Magnet" periodParams={periodParams} />;
}
