import { getTranslations } from 'next-intl/server'
import { routing } from '@/lib/i18n/routing'
import { ApiClient } from '@/lib/api/client'
import { BackendError } from '@/lib/api/errors'
import type { ApiResponse, Event } from '@/types'
import { Button, Col } from 'antd'
import Link from 'next/link'
import { getTodayDateString } from '@/lib/utils/date'
import { EventsList } from '@/components/features/events/EventsList/EventsList'
import { Row } from 'antd'

export const revalidate = 300

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
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const tEvents = await getTranslations({ locale, namespace: 'events' })
  
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

  let events: Event[] = []

  try {
    const apiClient = new ApiClient(apiBaseUrl)
    const countyId = process.env.NEXT_PUBLIC_COUNTY_ID
    const headers: Record<string, string> = {
      'x-locale': locale,
      ...(countyId && { 'x-county-id': countyId }),
    }

    const response = await apiClient.get<ApiResponse<Event>>('/public/events', {
      params: {
        locale: locale,
        from: getTodayDateString(),
        limit: '10',
        sort: 'asc',
      },
      headers,
    })
    
    events = Array.isArray(response.docs) ? response.docs.slice(0, 2) : []
  } catch (error) {
    if (!(error instanceof BackendError && error.statusCode === 404)) {
      console.error('Failed to fetch events:', error)
    }
  }

  return (
    <main className="default-padding-y">
      <div className="container">
        <h1>{tCommon('title')}</h1>
        <br />
        <EventsList events={events} locale={locale} />
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
  )
}

