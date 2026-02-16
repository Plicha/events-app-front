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

/** Builds media URL for browser (uses frontend /api proxy) */
export function buildFrontendMediaUrl(urlOrPath: string): string {
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    return urlOrPath
  }
  if (urlOrPath.startsWith('/api/')) {
    return urlOrPath
  }
  if (urlOrPath.startsWith('/')) {
    return `/api${urlOrPath}`
  }
  return `/api/${urlOrPath}`
}

export function getEventCoverUrl(cover: Event['cover'], hostImageUrl?: string, options?: { useFrontendProxy?: boolean }): string | null {
  const buildUrl = options?.useFrontendProxy ? buildFrontendMediaUrl : buildMediaUrl

  if (!cover) {
    return hostImageUrl || null
  }

  if (typeof cover === 'string') {
    const isUrl = cover.startsWith('http://') || cover.startsWith('https://') || cover.startsWith('/')
    if (isUrl) return options?.useFrontendProxy ? buildFrontendMediaUrl(cover) : cover
    return hostImageUrl || null
  }

  if (typeof cover !== 'object') {
    return hostImageUrl || null
  }

  const coverObj = cover as any

  return coverObj.url
    ? buildUrl(coverObj.url)
    : coverObj.filename
    ? buildUrl(`/api/media/file/${coverObj.filename}`)
    : coverObj.id
    ? buildUrl(`/api/media/${coverObj.id}`)
    : hostImageUrl || null
}

export function getCategoryIconUrl(categories: Event['categories'], options?: { useFrontendProxy?: boolean }): string | null {
  const buildUrl = options?.useFrontendProxy ? buildFrontendMediaUrl : buildMediaUrl

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
    return buildUrl(icon)
  }

  if (typeof icon === 'object') {
    const iconObj = icon as any
    return iconObj.url
      ? buildUrl(iconObj.url)
      : iconObj.filename
      ? buildUrl(`/api/media/file/${iconObj.filename}`)
      : iconObj.id
      ? buildUrl(`/api/media/${iconObj.id}`)
      : null
  }

  return null
}

export function isSvgIcon(category: Category): boolean {
  const icon = (category as any).icon
  if (!icon || typeof icon === 'string') return false
  if (typeof icon === 'object') {
    return icon.mimeType === 'image/svg+xml' || (icon.url?.toLowerCase().endsWith('.svg') ?? false)
  }
  return false
}

export function getSingleCategoryIconUrl(category: Category, options?: { useFrontendProxy?: boolean }): string | null {
  const buildUrl = options?.useFrontendProxy ? buildFrontendMediaUrl : buildMediaUrl
  const icon = (category as any).icon
  if (!icon) return null
  if (typeof icon === 'string') return buildUrl(icon)
  if (typeof icon === 'object') {
    const iconObj = icon as any
    return iconObj.url
      ? buildUrl(iconObj.url)
      : iconObj.filename
      ? buildUrl(`/api/media/file/${iconObj.filename}`)
      : iconObj.id
      ? buildUrl(`/api/media/${iconObj.id}`)
      : null
  }
  return null
}

export function getCategoryColorClass(category: Category): string {
  return category?.color ? `bg-${category.color}` : 'bg-grey'
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
