import { TypeView } from "@/components/TypeView";

export const dynamic = "force-dynamic";

export default async function AutrePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period } = await searchParams;
  return <TypeView type="other" label="Autre" period={period} />;
}
