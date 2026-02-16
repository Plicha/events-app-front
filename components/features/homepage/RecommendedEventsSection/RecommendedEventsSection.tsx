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

async function fetchPromotedEvents(
  apiClient: ApiClient,
  locale: string,
  todayDateString: string
): Promise<Event[]> {
  const response = await apiClient.get<ApiResponse<Event>>('/public/events', {
    params: { isPromoted: 'true', from: todayDateString, sort: 'asc', limit: '100' },
    headers: createApiHeaders(locale),
    next: { revalidate: 60 },
  })
  const docs = Array.isArray(response.docs) ? response.docs : []
  const today = new Date().toISOString()
  return docs.filter(
    (event) => !event.promotedUntil || new Date(event.promotedUntil) >= new Date(today)
  )
}

async function fetchUpcomingEvents(
  apiClient: ApiClient,
  locale: string,
  todayDateString: string
): Promise<Event[]> {
  const response = await apiClient.get<ApiResponse<Event>>('/public/events', {
    params: { from: todayDateString, sort: 'asc', limit: '50' },
    headers: createApiHeaders(locale),
    next: { revalidate: 60 },
  })
  return Array.isArray(response.docs) ? response.docs : []
}

function unwrapSettled<T>(result: PromiseSettledResult<T>, fallback: T, label: string): T {
  if (result.status === 'fulfilled') return result.value
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[RecommendedEventsSection] ${label}:`, result.reason)
  }
  return fallback
}

export async function RecommendedEventsSection({ locale }: RecommendedEventsSectionProps) {
  const t = await getTranslations({ locale, namespace: 'events' })
  const todayDateString = getTodayDateString()
  const apiClient = new ApiClient(getApiBaseUrl())

  const [promotedResult, upcomingResult] = await Promise.allSettled([
    fetchPromotedEvents(apiClient, locale, todayDateString),
    fetchUpcomingEvents(apiClient, locale, todayDateString),
  ])

  const promotedEvents = unwrapSettled(promotedResult, [], 'Failed to fetch promoted events')
  const allUpcomingEvents = unwrapSettled(upcomingResult, [], 'Failed to fetch upcoming events')

  const promotedEventIds = new Set(promotedEvents.map((e) => e.id))
  const nonPromotedUpcoming = allUpcomingEvents.filter((e) => !promotedEventIds.has(e.id))
  const randomEvents = shuffleArray(nonPromotedUpcoming).slice(0, 5)
  const allEvents = [...promotedEvents, ...randomEvents]

  if (allEvents.length === 0) {
    return null
  }

  return (
    <section className={styles.section}>
      <Row justify="space-between" className={styles.viewAllRow}>
        <h2 className={styles.sectionTitle}>{t('recommendedEvents')}</h2>
        <Link href="/events" className={styles.viewAllLink}>
            <span className={styles.viewAllLinkText}>{t('viewAllEvents')}</span>
            <ArrowRightOutlined className={styles.viewAllLinkIcon} />
        </Link>
      </Row>
      <RecommendedEventsCarousel events={allEvents} locale={locale} />
      <Row justify="center" className={styles.viewAllRow}>
        <Link href="/events" className={styles.viewAllLinkMobile}>
            <span className={styles.viewAllLinkText}>{t('viewAllEvents')}</span>
            <ArrowRightOutlined className={styles.viewAllLinkIcon} />
        </Link> 
      </Row>
    </section>
  )
}

