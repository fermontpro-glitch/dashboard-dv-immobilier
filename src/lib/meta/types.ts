export type CampaignType = "webinaire" | "challenge" | "leadmagnet" | "other";

export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  webinaire: "Webinaire",
  challenge: "Challenge",
  leadmagnet: "Lead Magnet",
  other: "Autre",
};

export interface ActionValue {
  action_type: string;
  value: string;
}

export interface RawInsightsRow {
  date_start?: string;
  date_stop?: string;
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  spend?: string;
  impressions?: string;
  reach?: string;
  frequency?: string;
  inline_link_clicks?: string;
  inline_link_click_ctr?: string;
  cost_per_inline_link_click?: string;
  actions?: ActionValue[];
  cost_per_action_type?: ActionValue[];
  video_play_actions?: ActionValue[];
  video_p25_watched_actions?: ActionValue[];
  video_p50_watched_actions?: ActionValue[];
  video_p75_watched_actions?: ActionValue[];
  video_p100_watched_actions?: ActionValue[];
}

export interface Metrics {
  spend: number;
  impressions: number;
  reach: number;
  frequency: number;
  linkClicks: number;
  ctr: number;
  cpc: number;
  leads: number;
  cpl: number;
}

export interface DailyPoint {
  date: string;
  spend: number;
  leads: number;
}

export interface AdSetRow {
  id: string;
  name: string;
  metrics: Metrics;
}

export interface CampaignRow {
  id: string;
  name: string;
  type: CampaignType;
  metrics: Metrics;
  adSets: AdSetRow[];
}

export interface TypeBreakdown {
  type: CampaignType;
  spend: number;
  spendShare: number;
  leads: number;
  cpl: number;
  ctr: number;
}

export interface Creative {
  id: string;
  name: string;
  campaignName: string;
  campaignType: CampaignType;
  format: "image" | "video";
  thumbnailUrl: string | null;
  videoDurationSec: number | null;
  adCount: number;
  sampleAdId: string;
  destinationUrl: string | null;
  metrics: Metrics;
  hookRate: number | null;
  holdRate: number | null;
}
