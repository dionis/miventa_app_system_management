import { BadRequestException } from '@nestjs/common';

export const MAX_PAGE_LIMIT = 100;
export const DEFAULT_PAGE_LIMIT = 20;

export function parsePagination(
  pageRaw?: string | number,
  limitRaw?: string | number,
  defaultLimit = DEFAULT_PAGE_LIMIT,
) {
  let page = Number(pageRaw ?? 1);
  let limit = Number(limitRaw ?? defaultLimit);

  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit) || limit < 1) limit = defaultLimit;
  if (limit > MAX_PAGE_LIMIT) {
    throw new BadRequestException(`limit must be <= ${MAX_PAGE_LIMIT}`);
  }
  page = Math.floor(page);
  limit = Math.floor(limit);
  return { page, limit };
}
