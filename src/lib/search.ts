const LIKE_SPECIALS = /[\\%_]/g

export const MIN_SEARCH_LENGTH = 2

export const normaliseSearch = (term: string): string => term.trim()

export const isSearchable = (term: string): boolean =>
  normaliseSearch(term).length >= MIN_SEARCH_LENGTH

export const likePattern = (term: string): string =>
  `%${normaliseSearch(term).replace(LIKE_SPECIALS, (match) => `\\${match}`)}%`
