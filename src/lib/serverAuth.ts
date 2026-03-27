import prisma from '@/lib/prisma';

/**
 * Extract the accountId from an incoming request.
 * The client sends it via the `x-account-id` header.
 * Returns null if not present or invalid.
 */
export function getAccountIdFromRequest(request: Request): string | null {
  return request.headers.get('x-account-id') || null;
}
