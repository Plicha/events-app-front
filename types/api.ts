export interface ApiResponse<T> {
  docs?: T[]
  totalDocs?: number
  limit?: number
  page?: number
  totalPages?: number
  offset?: number
  hasNextPage?: boolean
  hasPrevPage?: boolean
  nextPage?: number | null
  prevPage?: number | null
  [key: string]: unknown
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
}

export interface CacheOptions {
  ttl?: number
  key?: string
}

