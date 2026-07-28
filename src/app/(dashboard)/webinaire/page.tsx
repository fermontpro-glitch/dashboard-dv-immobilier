import { TypeView } from "@/components/TypeView";

export const dynamic = "force-dynamic";

export default async function WebinairePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; since?: string; until?: string }>;
}) {
  const periodParams = await searchParams;
  return <TypeView type="webinaire" label="Webinaire" periodParams={periodParams} />;
}
