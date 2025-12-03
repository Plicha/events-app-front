import { getTranslations } from 'next-intl/server'
import { routing } from '@/lib/i18n/routing'
import { ApiClient } from '@/lib/api/client'
import { BackendError } from '@/lib/api/errors'
import type { ApiResponse, Event } from '@/types'
import { notFound } from 'next/navigation'
import { Empty, Row, Col } from 'antd'
import { getTodayDateString } from '@/lib/utils/date'
import { EventFilters } from '@/components/features/events/EventFilters/EventFilters'
import { EventsPagination } from '@/components/features/events/EventsPagination/EventsPagination'
import { PageSizeSelector } from '@/components/features/events/EventFilters/PageSizeSelector'
import { SortSelector } from '@/components/features/events/EventFilters/SortSelector'
import { Suspense } from 'react'

export const revalidate = 300

type EventsPageSearchParams = {
  search?: string
  from?: string
  to?: string
  city?: string
  category?: string
  page?: string
  limit?: string
  sort?: string
}

function getEventTitle(event: Event, locale: string): string {
  if (typeof event.title === 'string') {
    return event.title
  }
  return event.title[locale as 'pl' | 'en'] || event.title.pl || ''
}

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
  searchParams: Promise<EventsPageSearchParams>
}) {
  const { locale } = await params
  const { search, from, to, city, category, page, limit, sort } = await searchParams
  const t = await getTranslations({ locale, namespace: 'events' })
  
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

  const apiParams: Record<string, string> = {
    locale: locale,
    from: from || getTodayDateString(),
  }

  const optionalParams: Record<string, string | undefined> = {
    to,
    search,
    city,
    category,
    page,
    limit,
    sort,
  }

  Object.entries(optionalParams).forEach(([key, value]) => {
    if (value) {
      apiParams[key] = value
    }
  })

  let events: Event[] = []
  let paginationData: { current: number; total: number; pageSize: number } | null = null

  try {
    const apiClient = new ApiClient(apiBaseUrl)
    const countyId = process.env.NEXT_PUBLIC_COUNTY_ID
    const headers: Record<string, string> = {
      'x-locale': locale,
      ...(countyId && { 'x-county-id': countyId }),
    }

    const response = await apiClient.get<ApiResponse<Event>>('/public/events', {
      params: apiParams,
      headers,
    })
    
    events = Array.isArray(response.docs) ? response.docs : []
    
    if (response.totalDocs !== undefined && response.page !== undefined && response.limit !== undefined) {
      paginationData = {
        current: response.page,
        total: response.totalDocs,
        pageSize: response.limit,
      }
    }
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
        <Row style={{ marginTop: 16 }} justify="end" gutter={16}>
          <Col xs={24} sm={24} md={6}>
            <SortSelector locale={locale} currentSort={sort || 'asc'} />
          </Col>
          <Col xs={24} sm={24} md={6}>
            <PageSizeSelector locale={locale} currentPageSize={paginationData?.pageSize || 20} />
          </Col>
        </Row>
        {events.length === 0 ? (
          <Empty description={t('noEvents')} />
        ) : (
          <>
          <br />
            <pre>{events.map(event => {
              const title = getEventTitle(event, locale)
              return <div key={event.id}> {event.id}. {title} - {event.startsAt}</div>
            })}</pre>
            {paginationData && (
              <Suspense fallback={null}>
                <br />
                <EventsPagination
                  current={paginationData.current}
                  total={paginationData.total}
                  pageSize={paginationData.pageSize}
                  locale={locale}
                />
              </Suspense>
            )}
          </>
        )}
      </div>
    </main>
  )
}

