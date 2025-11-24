import type { City } from './city'

export interface Venue {
  id: string
  name: string | { pl: string; en: string }
  address?: string
  lat?: number
  lng?: number
  city: string | City
  createdAt: string
  updatedAt: string
}

