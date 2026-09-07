import { parsePagination, MAX_PAGE_LIMIT } from './pagination.helper';

describe('parsePagination', () => {
  it('defaults page=1 limit=20', () => {
    expect(parsePagination(undefined, undefined)).toEqual({ page: 1, limit: 20 });
  });

  it('sanea NaN y negativos', () => {
    expect(parsePagination('abc', '-5')).toEqual({ page: 1, limit: 20 });
  });

  it(`rechaza limit > ${MAX_PAGE_LIMIT}`, () => {
    expect(() => parsePagination('1', '1000')).toThrow();
  });
});
