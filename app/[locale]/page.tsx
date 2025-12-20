import { createTranslator } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/lib/i18n/routing'
import { ApiClient } from '@/lib/api/client'
import { BackendError } from '@/lib/api/errors'
import type { ApiResponse, Event } from '@/types'
import { Button } from 'antd'
import Link from 'next/link'
import { getTodayDateString } from '@/lib/utils/date'
import { EventsList } from '@/components/features/events/EventsList/EventsList'
import { Row } from 'antd'
import { Suspense } from 'react'
import { IntroSection } from '@/components/features/homepage/IntroSection/IntroSection'
import { RecommendedEventsSection } from '@/components/features/homepage/RecommendedEventsSection/RecommendedEventsSection'
import { RecommendedEventsSectionSkeleton } from '@/components/features/homepage/RecommendedEventsSection/RecommendedEventsSectionSkeleton'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export function generateStaticParams() {
  return routing.locales.map((locale) => ({
    locale
  }))
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend:3000/api'
const COUNTY_ID = process.env.NEXT_PUBLIC_COUNTY_ID

export default async function Home({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const messages = (await import(`../../messages/${locale}.json`)).default
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
    const apiClient = new ApiClient(API_BASE_URL)
    const headers: Record<string, string> = {
      'x-locale': locale,
      ...(COUNTY_ID && { 'x-county-id': COUNTY_ID }),
    }

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
    const apiClient = new ApiClient(API_BASE_URL)
    const headers: Record<string, string> = {
      'x-locale': locale,
      ...(COUNTY_ID && { 'x-county-id': COUNTY_ID }),
    }

    const apiUrl = `${API_BASE_URL}/public/events?locale=${locale}&from=${todayDateString}&limit=10&sort=asc`
    
    if (process.env.NODE_ENV === 'production') {
      console.log(`[HomePage] Fetching events from: ${apiUrl}`)
      console.log(`[HomePage] Using date filter: from=${todayDateString}`)
    }

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
    
    if (process.env.NODE_ENV === 'production') {
      console.log(`[HomePage] Fetched ${events.length} events (from ${response.docs?.length || 0} total)`)
    }
  } catch (error) {
    if (error instanceof BackendError && error.statusCode === 404) {
      if (process.env.NODE_ENV === 'production') {
        console.warn(`[HomePage] No events found (404) for date: ${todayDateString}`)
      }
    } else {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[HomePage] Failed to fetch events:`, {
        error: errorMessage,
        apiUrl: API_BASE_URL,
        date: todayDateString,
        locale,
        countyId: COUNTY_ID,
      })
    }
  }

  return (
    <>
      <main className="default-padding-y" style={{ paddingTop: '0' }}>
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
            <Row justify="center" style={{ marginTop: 16 }}>
              <Link href={`/${locale}/events`}>
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

