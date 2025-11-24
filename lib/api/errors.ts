export class RateLimitError extends Error {
  statusCode = 429
  retryAfter: number

  constructor(retryAfter: number) {
    super('Rate limit exceeded')
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter
  }
}

export class OriginNotAllowedError extends Error {
  statusCode = 403

  constructor() {
    super('Origin not allowed')
    this.name = 'OriginNotAllowedError'
  }
}

export class BackendError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number = 502) {
    super(message)
    this.name = 'BackendError'
    this.statusCode = statusCode
  }
}

export class NetworkError extends Error {
  statusCode = 503

  constructor(message: string = 'Network error') {
    super(message)
    this.name = 'NetworkError'
  }
}

