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
    }
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`)

    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options?.headers,
    }

    try {
      const fullUrl = url.toString()
      
      // Log request details in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ApiClient] Fetching: ${fullUrl}`)
      }

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers,
      })

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
        ? `${error.message} (URL: ${url.toString()})`
        : `Unknown network error (URL: ${url.toString()})`
      
      if (process.env.NODE_ENV === 'development') {
        console.error(`[ApiClient] Network error:`, errorMessage, error)
      }

      throw new NetworkError(errorMessage)
    }
  }
}

