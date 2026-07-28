import { TypeView } from "@/components/TypeView";

export const dynamic = "force-dynamic";

export default async function WebexPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period } = await searchParams;
  return <TypeView type="webex" label="Webex" period={period} />;
}
