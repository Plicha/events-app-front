import type { Event, Category } from '@/types'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

const NEXT_PUBLIC_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || ''
const BACKEND_API_URL = process.env.BACKEND_API_URL || ''
const BACKEND_URL = NEXT_PUBLIC_BACKEND_URL || (BACKEND_API_URL.endsWith('/api') ? BACKEND_API_URL.slice(0, -4) : BACKEND_API_URL) || 'http://localhost:3000'

export function formatEventDate(dateString: string, locale: string): string {
  const date = dayjs.utc(dateString)
  dayjs.locale(locale === 'pl' ? 'pl' : 'en')
  
  const localDate = date.tz('Europe/Warsaw')
  
  return localDate.format('DD.MM.YYYY, HH:mm')
}

export function buildMediaUrl(urlOrPath: string): string {
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    return urlOrPath
  }

  const backendBaseUrl = BACKEND_URL.replace(/\/+$/, '')
  const normalizedPath = urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`

  return `${backendBaseUrl}${normalizedPath}`
}

export function getEventCoverUrl(cover: Event['cover'], hostImageUrl?: string): string | null {
  if (!cover) {
    return hostImageUrl || null
  }

  if (typeof cover === 'string') {
    const isUrl = cover.startsWith('http://') || cover.startsWith('https://') || cover.startsWith('/')
    return isUrl ? cover : hostImageUrl || null
  }

  if (typeof cover !== 'object') {
    return hostImageUrl || null
  }

  const coverObj = cover as any

  return coverObj.url
    ? buildMediaUrl(coverObj.url)
    : coverObj.filename
    ? buildMediaUrl(`/api/media/file/${coverObj.filename}`)
    : coverObj.id
    ? buildMediaUrl(`/api/media/${coverObj.id}`)
    : hostImageUrl || null
}

export function getCategoryIconUrl(categories: Event['categories']): string | null {
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return null
  }

  const firstCategory = categories[0]
  if (!firstCategory || typeof firstCategory !== 'object') {
    return null
  }

  const icon = (firstCategory as any).icon
  if (!icon) {
    return null
  }

  if (typeof icon === 'string') {
    return buildMediaUrl(icon)
  }

  if (typeof icon === 'object') {
    const iconObj = icon as any
    return iconObj.url
      ? buildMediaUrl(iconObj.url)
      : iconObj.filename
      ? buildMediaUrl(`/api/media/file/${iconObj.filename}`)
      : iconObj.id
      ? buildMediaUrl(`/api/media/${iconObj.id}`)
      : null
  }

  return null
}

export function getCategoryName(category: Category, locale: string): string {
  if (typeof category.name === 'string') {
    return category.name
  }
  const localizedName = category.name[locale as 'pl' | 'en'] || category.name.pl || category.name.en
  return localizedName || ''
}

export function getCategoriesText(categories: Event['categories'], locale: string): string {
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return ''
  }

  const categoryNames = categories
    .filter((cat): cat is Category => typeof cat === 'object')
    .map(cat => getCategoryName(cat, locale))
    .filter(Boolean)

  return categoryNames.join(', ')
}

export function getCityName(city: Event['city'], locale: string): string {
  if (typeof city === 'string' || !city) {
    return ''
  }

  if (typeof city.name === 'string') {
    return city.name
  }

  const localizedName = city.name[locale as 'pl' | 'en'] || city.name.pl || city.name.en
  return localizedName || ''
}

export function getVenueName(venue: Event['venue'], locale: string): string {
  if (!venue || typeof venue === 'string') {
    return ''
  }

  if (typeof venue.name === 'string') {
    return venue.name
  }

  const localizedName = venue.name[locale as 'pl' | 'en'] || venue.name.pl || venue.name.en
  return localizedName || ''
}
