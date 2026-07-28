import { NextRequest, NextResponse } from "next/server";
import { metaGet } from "@/lib/meta/client";

export const dynamic = "force-dynamic";

interface PreviewResponse {
  data: { body: string }[];
}

export async function GET(request: NextRequest) {
  const adId = request.nextUrl.searchParams.get("adId");
  if (!adId) {
    return NextResponse.json({ error: "Missing adId" }, { status: 400 });
  }

  try {
    const body = await metaGet<PreviewResponse>(`/${adId}/previews`, {
      ad_format: "INSTAGRAM_STORY",
    });
    const html = body.data[0]?.body ?? "";
    const match = html.match(/src="([^"]+)"/);
    const src = match ? match[1].replace(/&amp;/g, "&") : null;

    if (!src) {
      return NextResponse.json({ error: "Aperçu indisponible" }, { status: 404 });
    }
    return NextResponse.json({ src });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Aperçu indisponible";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
