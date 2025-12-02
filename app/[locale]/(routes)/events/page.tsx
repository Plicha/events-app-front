import { getTranslations } from 'next-intl/server'
import { routing } from '@/lib/i18n/routing'
import { ApiClient } from '@/lib/api/client'
import { BackendError, NetworkError } from '@/lib/api/errors'
import type { ApiResponse, Event } from '@/types'
import { notFound } from 'next/navigation'
import { Empty } from 'antd'
import { getTodayDateString } from '@/lib/utils/date'
import { EventFilters } from '@/components/features/events/EventFilters/EventFilters'

export const revalidate = 300

export function generateStaticParams() {
  return routing.locales.map((locale) => ({
    locale
  }))
}

export default async function EventsPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ search?: string; from?: string; to?: string; city?: string }>
}) {
  const { locale } = await params
  const { search, from, to, city } = await searchParams
  const t = await getTranslations({ locale, namespace: 'events' })
  
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

  const apiParams: Record<string, string> = {
    locale: locale
  }

  if (from) {
    apiParams.from = from
  } else {
    apiParams.from = getTodayDateString()
  }

  if (to) {
    apiParams.to = to
  }

  if (search) {
    apiParams.search = search
  }

  if (city) {
    apiParams.city = city
  }

  let events: Event[] = []

  try {
    const apiClient = new ApiClient(apiBaseUrl)
    const headers: Record<string, string> = {
      'x-locale': locale,
    }

    const countyId = process.env.NEXT_PUBLIC_COUNTY_ID
    if (countyId) {
      headers['x-county-id'] = countyId
    }

    const response = await apiClient.get<ApiResponse<Event>>('/public/events', {
      params: apiParams,
      headers,
    })
    events = response.docs || []
  } catch (error) {
    if (error instanceof BackendError && error.statusCode === 404) {
      notFound()
    }
    throw error
  }

  return (
    <main className="default-padding-y">
      <div className="container">
        <h1>{t('title')}</h1>
        <br />
        <EventFilters locale={locale} />
        {events.length === 0 ? (
          <Empty description={t('noEvents')} />
        ) : (
          <>
          <br />
            <pre>{events.map(event => {
              const title = typeof event.title === 'string' 
                ? event.title 
                : event.title[locale as 'pl' | 'en'] || event.title.pl || ''
              return <div key={event.id}> {event.id}. {title} - {event.startsAt}</div>
            })}</pre>
          </>
        )}
      </div>
    </main>
  )
}

