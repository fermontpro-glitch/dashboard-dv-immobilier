export type PeriodPreset =
  | "this_month"
  | "last_month"
  | "last_7d"
  | "last_30d";

export const PERIOD_LABELS: Record<PeriodPreset, string> = {
  this_month: "Mois en cours",
  last_month: "Mois précédent",
  last_7d: "7 derniers jours",
  last_30d: "30 derniers jours",
};

export const DEFAULT_PERIOD: PeriodPreset = "this_month";

export interface DateRange {
  since: string;
  until: string;
  label: string;
}

/** Equal-length window immediately preceding `range`, for period-over-period deltas. */
export function previousPeriod(range: DateRange): DateRange {
  const since = new Date(`${range.since}T00:00:00Z`);
  const until = new Date(`${range.until}T00:00:00Z`);
  const days = Math.round((until.getTime() - since.getTime()) / 86_400_000) + 1;

  const prevUntil = new Date(since);
  prevUntil.setUTCDate(prevUntil.getUTCDate() - 1);
  const prevSince = new Date(prevUntil);
  prevSince.setUTCDate(prevSince.getUTCDate() - (days - 1));

  return {
    since: fmt(prevSince),
    until: fmt(prevUntil),
    label: formatRangeLabel(prevSince, prevUntil),
  };
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function resolvePeriod(searchParam?: string | null): DateRange {
  const preset = isPeriodPreset(searchParam) ? searchParam : DEFAULT_PERIOD;
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  switch (preset) {
    case "last_month": {
      const since = new Date(Date.UTC(year, month - 1, 1));
      const until = new Date(Date.UTC(year, month, 0));
      return { since: fmt(since), until: fmt(until), label: formatRangeLabel(since, until) };
    }
    case "last_7d": {
      const until = new Date(Date.UTC(year, month, now.getUTCDate()));
      const since = new Date(until);
      since.setUTCDate(since.getUTCDate() - 6);
      return { since: fmt(since), until: fmt(until), label: formatRangeLabel(since, until) };
    }
    case "last_30d": {
      const until = new Date(Date.UTC(year, month, now.getUTCDate()));
      const since = new Date(until);
      since.setUTCDate(since.getUTCDate() - 29);
      return { since: fmt(since), until: fmt(until), label: formatRangeLabel(since, until) };
    }
    case "this_month":
    default: {
      const since = new Date(Date.UTC(year, month, 1));
      const until = new Date(Date.UTC(year, month, now.getUTCDate()));
      return { since: fmt(since), until: fmt(until), label: formatRangeLabel(since, until) };
    }
  }
}

function isPeriodPreset(value?: string | null): value is PeriodPreset {
  return !!value && value in PERIOD_LABELS;
}

const MONTHS_FR = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

function formatRangeLabel(since: Date, until: Date): string {
  const sameMonth = since.getUTCMonth() === until.getUTCMonth() && since.getUTCFullYear() === until.getUTCFullYear();
  const day = (d: Date) => d.getUTCDate();
  const monthYear = (d: Date) => `${MONTHS_FR[d.getUTCMonth()]} ${d.getUTCFullYear()}`;

  if (sameMonth) {
    return `${day(since)}–${day(until)} ${monthYear(until)}`;
  }
  return `${day(since)} ${monthYear(since)} – ${day(until)} ${monthYear(until)}`;
}
