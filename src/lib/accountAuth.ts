/**
 * accountAuth.ts
 * Helper for resolving and validating an Account from an API key.
 * The n8n / external API always passes the account's apiKey (UUID stored in Account.apiKey).
 * Usage: pass the `x-api-key` header value, or the `apiKey` body/query param.
 */

import prisma from '@/lib/prisma';

export async function getAccountByApiKey(apiKey: string | null | undefined) {
  if (!apiKey) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const account = await (prisma as any).account.findUnique({ where: { apiKey } });
    return account;
  } catch {
    return null;
  }
}

/**
 * Extract the API key from a Request object.
 * Priority: x-api-key header → x-account-key header → query param apiKey
 */
export function extractApiKey(request: Request): string | null {
  const url = new URL(request.url);
  return (
    request.headers.get('x-api-key') ||
    request.headers.get('x-account-key') ||
    url.searchParams.get('apiKey') ||
    null
  );
}
