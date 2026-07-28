export type MetricKey =
  | "spend"
  | "linkClicks"
  | "cpc"
  | "ctr"
  | "leads"
  | "cpl"
  | "hookRate"
  | "holdRate";

export const METRIC_REGISTRY: Record<MetricKey, { label: string; bulletColor: string; emphasize?: boolean }> = {
  spend: { label: "Dépense", bulletColor: "#DC8C6F" },
  linkClicks: { label: "Clics lien", bulletColor: "#486D83" },
  cpc: { label: "CPC", bulletColor: "#DC8C6F" },
  ctr: { label: "CTR", bulletColor: "#4A8A6E" },
  leads: { label: "Leads", bulletColor: "#F4A384", emphasize: true },
  cpl: { label: "CPL", bulletColor: "#B85C5C" },
  hookRate: { label: "Hook rate", bulletColor: "#5E3D52" },
  holdRate: { label: "Hold rate", bulletColor: "#486D83" },
};

export const IMAGE_METRIC_OPTIONS: MetricKey[] = ["spend", "leads", "cpl", "linkClicks", "ctr", "cpc"];
export const VIDEO_METRIC_OPTIONS: MetricKey[] = ["spend", "leads", "cpl", "hookRate", "holdRate"];

export const IMAGE_DEFAULT_ACTIVE: MetricKey[] = ["spend", "leads", "cpl", "linkClicks", "ctr"];
export const VIDEO_DEFAULT_ACTIVE: MetricKey[] = ["spend", "leads", "cpl", "hookRate", "holdRate"];
