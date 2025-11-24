import type { City } from './city'
import type { Category } from './category'
import type { Venue } from './venue'

export type LocalizedText = string | { pl: string; en: string }

export interface RichText {
  root: {
    type: string
    children: Array<{
      type: string
      children: Array<{
        text: string
        type?: string
        [key: string]: unknown
      }>
      [key: string]: unknown
    }>
    [key: string]: unknown
  }
}

export interface EventLink {
  id: string
  type: 'tickets' | 'organizer' | 'facebook' | 'other'
  url: string
}

export interface EventPrice {
  isFree: boolean
  from?: number
  to?: number
  currency: string
}

export interface ImageSource {
  label?: string
  url?: string
}

export interface Event {
  id: string
  title: LocalizedText
  slug: string
  summaryRaw?: LocalizedText | RichText
  summaryAI?: LocalizedText | RichText
  startsAt: string
  endsAt?: string
  city: string | City
  venue?: string | Venue
  organizer?: string | { id: string; name: string; website?: string; email?: string; phone?: string }
  categories?: string[] | Category[]
  tags?: string[] | Array<{ id: string; name: LocalizedText; slug: string }>
  price?: EventPrice
  links?: EventLink[]
  cover?: string | { id: string; url: string; alt?: string }
  hostImageUrl?: string
  imageSource?: ImageSource
  sourceUrl?: string
  sourceHash?: string
  htmlHash?: string
  dupGroupId?: string
  isPromoted: boolean
  promotedUntil?: string
  _status?: 'draft' | 'published'
  createdAt: string
  updatedAt: string
}

