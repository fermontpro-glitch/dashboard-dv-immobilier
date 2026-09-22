import "server-only";

const API_VERSION = "v23.0";
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function toActId(accountId: string): string {
  return accountId.startsWith("act_") ? accountId : `act_${accountId}`;
}

interface MetaErrorBody {
  error?: { message?: string; type?: string; code?: number };
}

async function metaFetch<T>(
  path: string,
  params: Record<string, string>
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("access_token", getEnv("META_ACCESS_TOKEN"));

  const res = await fetch(url.toString(), { cache: "no-store" });
  const body = (await res.json()) as T & MetaErrorBody;

  if (!res.ok || body.error) {
    const message = body.error?.message ?? `Meta API error (HTTP ${res.status})`;
    throw new Error(message);
  }

  return body;
}

interface Paged<T> {
  data: T[];
  paging?: { next?: string; cursors?: { after?: string } };
}

/** Follows `paging.next` until exhausted or `maxPages` is hit. */
export async function metaFetchAll<T>(
  path: string,
  params: Record<string, string>,
  maxPages = 20
): Promise<T[]> {
  const results: T[] = [];
  let after: string | undefined;
  let page = 0;

  while (page < maxPages) {
    const pageParams = after ? { ...params, after } : params;
    const body = await metaFetch<Paged<T>>(path, pageParams);
    results.push(...body.data);

    after = body.paging?.cursors?.after;
    if (!after || body.data.length === 0) break;
    page += 1;
  }

  return results;
}

export async function metaGet<T>(
  path: string,
  params: Record<string, string>
): Promise<T> {
  return metaFetch<T>(path, params);
}

/** Batched multi-get via the `ids` param, chunked to stay within URL limits and fetched concurrently. */
export async function metaGetByIds<T>(
  ids: string[],
  fields: string[],
  chunkSize = 50
): Promise<Record<string, T>> {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    if (chunk.length > 0) chunks.push(chunk);
  }

  const bodies = await Promise.all(
    chunks.map((chunk) =>
      metaFetch<Record<string, T>>("/", { ids: chunk.join(","), fields: fields.join(",") })
    )
  );

  const out: Record<string, T> = {};
  for (const body of bodies) Object.assign(out, body);
  return out;
}
