import { getTranslations } from 'next-intl/server'
import { routing } from '@/lib/i18n/routing'
import { ApiClient } from '@/lib/api/client'
import { BackendError, NetworkError } from '@/lib/api/errors'
import type { ApiResponse, Event } from '@/types'
import { notFound } from 'next/navigation'
import { Empty, Row, Col } from 'antd'
import { getTodayDateString } from '@/lib/utils/date'
import { EventFilters } from '@/components/features/events/EventFilters/EventFilters'
import { EventsPagination } from '@/components/features/events/EventsPagination/EventsPagination'
import { PageSizeSelector } from '@/components/features/events/EventFilters/PageSizeSelector'
import { Suspense } from 'react'

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
  searchParams: Promise<{ search?: string; from?: string; to?: string; city?: string; category?: string; page?: string; limit?: string }>
}) {
  const { locale } = await params
  const { search, from, to, city, category, page, limit } = await searchParams
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

  if (category) {
    apiParams.category = category
  }

  if (page) {
    apiParams.page = page
  }

  if (limit) {
    apiParams.limit = limit
  }

  let events: Event[] = []
  let paginationData: { current: number; total: number; pageSize: number } | null = null

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
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Frontend] API Response:', {
        docsCount: response.docs?.length || 0,
        totalDocs: response.totalDocs,
        page: response.page,
        totalPages: response.totalPages,
        limit: response.limit,
        hasNextPage: response.hasNextPage,
        hasPrevPage: response.hasPrevPage,
        responseKeys: Object.keys(response),
      })
    }
    
    events = Array.isArray(response.docs) ? response.docs : []
    
    if (response.totalDocs !== undefined && response.page !== undefined && response.limit !== undefined) {
      paginationData = {
        current: response.page,
        total: response.totalDocs,
        pageSize: response.limit,
      }
    } else if (process.env.NODE_ENV === 'development') {
      console.warn('[Frontend] Pagination data missing:', {
        totalDocs: response.totalDocs,
        page: response.page,
        limit: response.limit,
      })
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
            <PageSizeSelector locale={locale} currentPageSize={paginationData?.pageSize || 20} />
          </Col>
        </Row>
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

