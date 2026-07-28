import { TypeView } from "@/components/TypeView";

export const dynamic = "force-dynamic";

export default async function AutrePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; since?: string; until?: string }>;
}) {
  const periodParams = await searchParams;
  return <TypeView type="other" label="Autre" periodParams={periodParams} />;
}
