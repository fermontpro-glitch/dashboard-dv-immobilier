import { TypeView } from "@/components/TypeView";

export const dynamic = "force-dynamic";

export default async function WebinairePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period } = await searchParams;
  return <TypeView type="webinaire" label="Webinaire" period={period} />;
}
