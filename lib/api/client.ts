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
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        throw new BackendError(
          `Backend error: ${response.statusText}`,
          response.status
        )
      }

      return await response.json()
    } catch (error) {
      if (error instanceof BackendError) {
        throw error
      }

      throw new NetworkError(
        error instanceof Error ? error.message : 'Unknown network error'
      )
    }
  }
}

