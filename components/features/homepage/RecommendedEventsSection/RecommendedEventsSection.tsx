import { getTranslations } from 'next-intl/server'
import { ApiClient } from '@/lib/api/client'
import { getApiBaseUrl, createApiHeaders } from '@/lib/api/config'
import type { ApiResponse, Event } from '@/types'
import { getTodayDateString } from '@/lib/utils/date'
import dynamic from 'next/dynamic'
import styles from './RecommendedEventsSection.module.scss'
import { Row } from 'antd'
import { Link } from '@/lib/i18n/routing'
import { ArrowRightOutlined } from '@ant-design/icons'

const RecommendedEventsCarousel = dynamic(
  () => import('./RecommendedEventsCarousel').then((mod) => ({ default: mod.RecommendedEventsCarousel })),
  { ssr: true }
)

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
    const apiClient = new ApiClient(getApiBaseUrl())
    const headers = createApiHeaders(locale)

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
    <section className={styles.section}>
      <Row justify="space-between" className={styles.viewAllRow}>
        <h2 className={styles.sectionTitle}>{t('recommendedEvents')}</h2>
        {allEvents.length  > 0 && (
          <Link href="/events" className={styles.viewAllLink}>
              <span className={styles.viewAllLinkText}>{t('viewAllEvents')}</span>
              <ArrowRightOutlined className={styles.viewAllLinkIcon} />
          </Link>
          )}
      </Row>
      <RecommendedEventsCarousel events={allEvents} locale={locale} />
      {allEvents.length  > 0 && (
        <Row justify="center" className={styles.viewAllRow}>
          <Link href="/events" className={styles.viewAllLinkMobile}>
              <span className={styles.viewAllLinkText}>{t('viewAllEvents')}</span>
              <ArrowRightOutlined className={styles.viewAllLinkIcon} />
          </Link> 
          </Row>
          )}
    </section>
  )
}

