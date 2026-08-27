export interface AdAccount {
  id: string;
  label: string;
}

const DEFAULT_ACCOUNTS: AdAccount[] = [{ id: "374669924967159", label: "DV Immobilier" }];

/**
 * META_ACCOUNTS env format: "Label One:1234567890,Label Two:0987654321"
 * All configured accounts share the single META_ACCESS_TOKEN.
 */
export function getConfiguredAccounts(): AdAccount[] {
  const raw = process.env.META_ACCOUNTS;
  if (!raw) return DEFAULT_ACCOUNTS;

  const parsed = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [label, id] = entry.split(":").map((s) => s.trim());
      return { label, id };
    })
    .filter((a): a is AdAccount => !!a.id && !!a.label);

  return parsed.length > 0 ? parsed : DEFAULT_ACCOUNTS;
}

export function resolveAccount(accountId?: string | null): AdAccount {
  const accounts = getConfiguredAccounts();
  const match = accountId ? accounts.find((a) => a.id === accountId) : undefined;
  return match ?? accounts[0];
}
