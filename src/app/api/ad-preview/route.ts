import { NextRequest, NextResponse } from "next/server";
import { metaGet } from "@/lib/meta/client";

export const dynamic = "force-dynamic";

interface PreviewResponse {
  data: { body: string }[];
}

const ALLOWED_FORMATS = new Set([
  "MOBILE_FEED_STANDARD",
  "DESKTOP_FEED_STANDARD",
  "INSTAGRAM_STANDARD",
  "INSTAGRAM_STORY",
  "FACEBOOK_STORY_MOBILE",
]);

export async function GET(request: NextRequest) {
  const adId = request.nextUrl.searchParams.get("adId");
  if (!adId) {
    return NextResponse.json({ error: "Missing adId" }, { status: 400 });
  }

  const requestedFormat = request.nextUrl.searchParams.get("format") ?? "MOBILE_FEED_STANDARD";
  const format = ALLOWED_FORMATS.has(requestedFormat) ? requestedFormat : "MOBILE_FEED_STANDARD";

  try {
    const body = await metaGet<PreviewResponse>(`/${adId}/previews`, {
      ad_format: format,
    });
    const html = body.data[0]?.body ?? "";
    const match = html.match(/src="([^"]+)"/);
    const src = match ? match[1].replace(/&amp;/g, "&") : null;

    if (!src) {
      return NextResponse.json({ error: "Aperçu indisponible" }, { status: 404 });
    }
    return NextResponse.json({ src, format });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Aperçu indisponible";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
