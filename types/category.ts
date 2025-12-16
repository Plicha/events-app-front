export interface Category {
  id: string
  name: string | { pl: string; en: string }
  slug: string
  icon?: string | { id: string; url: string; alt?: string }
  createdAt: string
  updatedAt: string
  color?: string
}

