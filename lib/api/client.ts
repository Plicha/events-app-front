import { BackendError, NetworkError } from './errors'

export class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
  }

  async get<T>(
    endpoint: string,
    options?: {
      params?: Record<string, string>
      headers?: Record<string, string>
      cache?: RequestCache
      next?: { revalidate?: number }
    }
  ): Promise<T> {
    let fullUrl = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`

    if (options?.params) {
      const searchParams = new URLSearchParams()
      Object.entries(options.params).forEach(([key, value]) => {
        searchParams.append(key, value)
      })
      const queryString = searchParams.toString()
      if (queryString) {
        fullUrl += `?${queryString}`
      }
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options?.headers,
    }

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ApiClient] Fetching: ${fullUrl}`)
      }

      const fetchOptions: RequestInit = {
        method: 'GET',
        headers,
        cache: options?.cache || 'force-cache',
        ...(options?.next && { next: options.next }),
      }

      const response = await fetch(fullUrl, fetchOptions)

      if (!response.ok) {
        const errorMessage = `Backend error: ${response.status} ${response.statusText} (${fullUrl})`
        if (process.env.NODE_ENV === 'development') {
          console.error(`[ApiClient] ${errorMessage}`)
        }
        throw new BackendError(
          errorMessage,
          response.status
        )
      }

      return await response.json()
    } catch (error) {
      if (error instanceof BackendError) {
        throw error
      }

      const errorMessage = error instanceof Error 
        ? `${error.message} (URL: ${fullUrl})`
        : `Unknown network error (URL: ${fullUrl})`
      
      if (process.env.NODE_ENV === 'development') {
        console.error(`[ApiClient] Network error:`, errorMessage, error)
      }

      throw new NetworkError(errorMessage)
    }
  }
}
