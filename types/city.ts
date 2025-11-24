export interface County {
  id: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
}

export interface City {
  id: string
  name: string | { pl: string; en: string }
  slug: string
  county?: string | County
  createdAt: string
  updatedAt: string
}

