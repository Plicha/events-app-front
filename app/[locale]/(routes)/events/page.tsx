import { getTranslations, setRequestLocale } from 'next-intl/server'
import { routing } from '@/lib/i18n/routing'
import { ApiClient } from '@/lib/api/client'
import { getApiBaseUrl, createApiHeaders } from '@/lib/api/config'
import { BackendError } from '@/lib/api/errors'
import type { ApiResponse, Event } from '@/types'
import { notFound } from 'next/navigation'
import { Row, Col } from 'antd'
import { HomeOutlined, CalendarOutlined } from '@ant-design/icons'
import { getTodayDateString } from '@/lib/utils/date'
import { EventFilters, EventsPagination, PageSizeSelector, SortSelector, EventsList } from '@/components/features/events'
import { Suspense } from 'react'
import { StaticBreadcrumb } from '@/components/layout'
import styles from './page.module.scss'

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
  setRequestLocale(locale)
  const { search, from, to, city, category, page, limit, sort } = await searchParams
  const t = await getTranslations('events')

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
    const apiClient = new ApiClient(getApiBaseUrl())
    const headers = createApiHeaders(locale)

    const response = await apiClient.get<ApiResponse<Event>>('/public/events', {
      params: apiParams,
      headers,
      next: { revalidate: 300 },
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
    console.error('Failed to fetch events:', error)
  }

  const breadcrumbItems = [
    {
      href: '/',
      title: t('breadcrumb.home'),
      icon: <HomeOutlined />
    },
    {
      title: t('breadcrumb.events'),
      icon: <CalendarOutlined />
    }
  ]

  return (
    <main className="default-padding-y">
      <div className="container">
        <StaticBreadcrumb items={breadcrumbItems} />
        <h1 className="title">{t('title')}</h1>
        <br />
        <EventFilters locale={locale} />
        <Row className={styles.filtersRow} justify="space-between" gutter={[16, 8]}>
          <Col xs={12} sm={12} md={4}>
            <PageSizeSelector locale={locale} currentPageSize={paginationData?.pageSize || 20} />
          </Col>
          <Col xs={12} sm={12} md={4}>
            <SortSelector locale={locale} currentSort={sort || 'asc'} />
            </Col>
        </Row>
        <br />
        <EventsList events={events} locale={locale} />
        <br />
        {paginationData && events.length > 0 && (
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
      </div>
    </main>
  )
}

