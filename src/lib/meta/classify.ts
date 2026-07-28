import type { CampaignType } from "./types";

const WEBEX_RE = /\b(webi|webex|webinaire)\b/i;
const CHALLENGE_RE = /\bchallenge\b/i;
const LEAD_MAGNET_RE = /\b(lm|lead ?magnet)\b/i;

// Campaigns run by a different agency (their own funnel) — kept fully out of
// every aggregate and view on this dashboard, per client instruction.
const EXCLUDED_RE = /\blc\b|leads closers/i;

export function isExcludedCampaign(name: string): boolean {
  return EXCLUDED_RE.test(name);
}

export function classifyCampaign(name: string): CampaignType {
  if (WEBEX_RE.test(name)) return "webex";
  if (CHALLENGE_RE.test(name)) return "challenge";
  if (LEAD_MAGNET_RE.test(name)) return "leadmagnet";
  return "other";
}
