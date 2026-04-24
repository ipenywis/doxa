export type SiteUrlEnv = Record<string, string | undefined>;

export const DEFAULT_SITE_URL = "https://docs.doxa.so";
export const SITE_URL_ENV_KEYS = [
  "VITE_SITE_URL",
  "DOXA_SITE_URL",
  "SITE_URL",
  "PUBLIC_SITE_URL",
  "PUBLIC_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_URL",
  "VERCEL_BRANCH_URL",
  "CF_PAGES_URL",
  "URL",
  "DEPLOY_URL",
  "DEPLOY_PRIME_URL",
] as const;

export function normalizeSiteUrl(value: string, envKey: string): string {
  const rawValue = value.trim();
  const withProtocol = /^https?:\/\//i.test(rawValue)
    ? rawValue
    : `https://${rawValue}`;

  try {
    const url = new URL(withProtocol);
    url.hash = "";
    url.search = "";
    url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString().replace(/\/+$/, "");
  } catch (error) {
    throw new Error(`Invalid ${envKey} value for site URL: ${value}`, {
      cause: error,
    });
  }
}

export function resolveSiteUrl(env: SiteUrlEnv): string {
  for (const key of SITE_URL_ENV_KEYS) {
    const value = env[key];
    if (value?.trim()) {
      return normalizeSiteUrl(value, key);
    }
  }

  return normalizeSiteUrl(DEFAULT_SITE_URL, "DEFAULT_SITE_URL");
}
