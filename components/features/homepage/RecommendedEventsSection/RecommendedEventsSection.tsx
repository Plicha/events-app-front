import { getTranslations } from 'next-intl/server'
import { ApiClient } from '@/lib/api/client'
import type { ApiResponse, Event } from '@/types'
import { getTodayDateString } from '@/lib/utils/date'
import dynamic from 'next/dynamic'

const RecommendedEventsCarousel = dynamic(
  () => import('./RecommendedEventsCarousel').then((mod) => ({ default: mod.RecommendedEventsCarousel })),
  { ssr: true }
)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend:3000/api'
const COUNTY_ID = process.env.NEXT_PUBLIC_COUNTY_ID

interface RecommendedEventsSectionProps {
  locale: string
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export async function RecommendedEventsSection({ locale }: RecommendedEventsSectionProps) {
  const t = await getTranslations({ locale, namespace: 'events' })
  const todayDateString = getTodayDateString()
  
  let promotedEvents: Event[] = []
  let randomEvents: Event[] = []

  try {
    const apiClient = new ApiClient(API_BASE_URL)
    const headers: Record<string, string> = {
      'x-locale': locale,
      ...(COUNTY_ID && { 'x-county-id': COUNTY_ID }),
    }

    try {
      const promotedResponse = await apiClient.get<ApiResponse<Event>>('/public/events', {
        params: {
          isPromoted: 'true',
          from: todayDateString,
          sort: 'asc',
          limit: '100',
        },
        headers,
        next: { revalidate: 60 },
      })
      const allPromoted = Array.isArray(promotedResponse.docs) ? promotedResponse.docs : []
      const today = new Date().toISOString()
      promotedEvents = allPromoted.filter(event => {
        if (!event.promotedUntil) return true
        return new Date(event.promotedUntil) >= new Date(today)
      })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[RecommendedEventsSection] Failed to fetch promoted events:', error)
      }
    }

    try {
      const upcomingResponse = await apiClient.get<ApiResponse<Event>>('/public/events', {
        params: {
          from: todayDateString,
          sort: 'asc',
          limit: '50',
        },
        headers,
        next: { revalidate: 60 },
      })
      
      const allUpcomingEvents = Array.isArray(upcomingResponse.docs) ? upcomingResponse.docs : []
      
      const promotedEventIds = new Set(promotedEvents.map(e => e.id))
      const nonPromotedUpcoming = allUpcomingEvents.filter(e => !promotedEventIds.has(e.id))
      const shuffled = shuffleArray(nonPromotedUpcoming)
      randomEvents = shuffled.slice(0, 5)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[RecommendedEventsSection] Failed to fetch upcoming events:', error)
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[RecommendedEventsSection] Error:', error)
    }
  }

  const allEvents = [...promotedEvents, ...randomEvents]

  if (allEvents.length === 0) {
    return null
  }

  return (
    <section style={{ marginBottom: '48px', minHeight: '550px' }}>
      <h2 style={{ marginBottom: '24px', fontSize: '2rem', fontWeight: 'bold' }}>
        {t('recommendedEvents')}
      </h2>
      <RecommendedEventsCarousel events={allEvents} locale={locale} />
    </section>
  )
}

