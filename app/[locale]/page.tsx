import { getTranslations } from 'next-intl/server'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/lib/i18n/routing'
import { ApiClient } from '@/lib/api/client'
import { getApiBaseUrl, createApiHeaders } from '@/lib/api/config'
import { BackendError } from '@/lib/api/errors'
import type { ApiResponse, Event, Category } from '@/types'
import { Button } from 'antd'
import { Link } from '@/lib/i18n/routing'
import { getTodayDateString } from '@/lib/utils/date'
import { EventsList, CategoriesSection } from '@/components/features/events'
import { Row } from 'antd'
import { Suspense } from 'react'
import { IntroSection, RecommendedEventsSection, RecommendedEventsSectionSkeleton } from '@/components/features/homepage'
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
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const tEvents = await getTranslations({ locale, namespace: 'events' })

  const apiClient = new ApiClient(getApiBaseUrl())
  const headers = createApiHeaders(locale)
  const todayDateString = getTodayDateString()

  const [settingsResult, eventsResult, categoriesResult] = await Promise.allSettled([
    apiClient.get<{
      headline: string
      backgroundImage: { url: string; alt: string } | null
    }>('/public/homepage-settings', {
      headers,
      next: { revalidate: 300 },
    }),
    apiClient.get<ApiResponse<Event>>('/public/events', {
      params: {
        locale: locale,
        from: todayDateString,
        limit: '10',
        sort: 'asc',
      },
      headers,
      next: { revalidate: 60 },
    }),
    apiClient.get<{ docs: Category[] }>('/public/categories', {
      headers,
      next: { revalidate: 300 },
    }),
  ])

  let homepageSettings: {
    headline: string
    backgroundImage: { url: string; alt: string } | null
  } = {
    headline: '',
    backgroundImage: null,
  }
  if (settingsResult.status === 'fulfilled') {
    homepageSettings = settingsResult.value
  } else if (process.env.NODE_ENV === 'development') {
    console.warn('Failed to fetch homepage settings:', settingsResult.reason)
  }

  let events: Event[] = []
  if (eventsResult.status === 'fulfilled') {
    events = Array.isArray(eventsResult.value.docs) ? eventsResult.value.docs.slice(0, 2) : []
  } else {
    const error = eventsResult.reason
    const is404 = error instanceof BackendError && error.statusCode === 404
    if (is404 && process.env.NODE_ENV === 'production') {
      console.warn(`[HomePage] No events found (404) for date: ${todayDateString}`)
    }
    if (!is404) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[HomePage] Failed to fetch events:`, {
        error: errorMessage,
        date: todayDateString,
        locale,
      })
    }
  }

  let categories: Category[] = []
  if (categoriesResult.status === 'fulfilled') {
    categories = categoriesResult.value.docs || []
  } else if (process.env.NODE_ENV === 'development') {
    console.warn('[HomePage] Failed to fetch categories:', categoriesResult.reason)
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

          <CategoriesSection locale={locale} categories={categories} />
        </div>
      </main>
    </>
  )
}

