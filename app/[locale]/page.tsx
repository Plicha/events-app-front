import { createTranslator } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/lib/i18n/routing'
import { getMessages } from '@/lib/i18n/messages'
import { ApiClient } from '@/lib/api/client'
import { getApiBaseUrl, createApiHeaders } from '@/lib/api/config'
import { BackendError } from '@/lib/api/errors'
import type { ApiResponse, Event } from '@/types'
import { Button } from 'antd'
import { Link } from '@/lib/i18n/routing'
import { getTodayDateString } from '@/lib/utils/date'
import { EventsList } from '@/components/features/events/EventsList/EventsList'
import { Row } from 'antd'
import { Suspense } from 'react'
import { IntroSection } from '@/components/features/homepage/IntroSection/IntroSection'
import { RecommendedEventsSection } from '@/components/features/homepage/RecommendedEventsSection/RecommendedEventsSection'
import { RecommendedEventsSectionSkeleton } from '@/components/features/homepage/RecommendedEventsSection/RecommendedEventsSectionSkeleton'
import styles from './page.module.scss'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export function generateStaticParams() {
  return routing.locales.map((locale) => ({
    locale
  }))
}

export default async function Home({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const messages = await getMessages(locale)
  const tCommon = createTranslator({ locale, messages, namespace: 'common' })
  const tEvents = createTranslator({ locale, messages, namespace: 'events' })


  let homepageSettings: {
    headline: string
    backgroundImage: { url: string; alt: string } | null
  } = {
    headline: '',
    backgroundImage: null,
  }

  try {
    const apiClient = new ApiClient(getApiBaseUrl())
    const headers = createApiHeaders(locale)

    const settings = await apiClient.get<{
      headline: string
      backgroundImage: { url: string; alt: string } | null
    }>('/public/homepage-settings', {
      headers,
      next: { revalidate: 300 },
    })

    homepageSettings = settings
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to fetch homepage settings:', error)
    }
  }

  let events: Event[] = []
  const todayDateString = getTodayDateString()

  try {
    const apiClient = new ApiClient(getApiBaseUrl())
    const headers = createApiHeaders(locale)

    const response = await apiClient.get<ApiResponse<Event>>('/public/events', {
      params: {
        locale: locale,
        from: todayDateString,
        limit: '10',
        sort: 'asc',
      },
      headers,
      next: { revalidate: 60 },
    })
    
    events = Array.isArray(response.docs) ? response.docs.slice(0, 2) : []
  } catch (error) {
    if (error instanceof BackendError && error.statusCode === 404) {
      if (process.env.NODE_ENV === 'production') {
        console.warn(`[HomePage] No events found (404) for date: ${todayDateString}`)
      }
    } else {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[HomePage] Failed to fetch events:`, {
        error: errorMessage,
        date: todayDateString,
        locale,
      })
    }
  }

  return (
    <>
      <main className={`default-padding-y ${styles.main}`}>
          {(homepageSettings.headline || homepageSettings.backgroundImage) && (
            <IntroSection
              headline={homepageSettings.headline}
              locale={locale}
              searchPlaceholder={tEvents('searchPlaceholder')}
            />
          )}
        <div className="container">
          {!homepageSettings.headline && <h1>{tCommon('title')}</h1>}
          {homepageSettings.headline && <br />}
          <Suspense fallback={<RecommendedEventsSectionSkeleton />}>
            <RecommendedEventsSection locale={locale} />
          </Suspense>
          {events.length > 0 && (
            <Row justify="center" className={styles.viewAllRow}>
              <Link href="/events">
                <Button type="primary" size="large">
                  {tEvents('viewAllEvents')}
                </Button>
              </Link>
            </Row>
          )}
        </div>
      </main>
    </>
  )
}

