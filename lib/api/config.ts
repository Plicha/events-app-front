export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://backend:3000/api'
}

export function getCountyId(): string | undefined {
  return process.env.NEXT_PUBLIC_COUNTY_ID
}

export function createApiHeaders(locale: string): Record<string, string> {
  const countyId = getCountyId()
  return {
    'x-locale': locale,
    ...(countyId && { 'x-county-id': countyId }),
  }
}
