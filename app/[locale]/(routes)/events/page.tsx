import { getTranslations } from 'next-intl/server'
import { routing } from '@/lib/i18n/routing'
import { ApiClient } from '@/lib/api/client'
import { BackendError, NetworkError } from '@/lib/api/errors'
import type { ApiResponse, Event } from '@/types'
import { notFound } from 'next/navigation'
import { Empty } from 'antd'

export const revalidate = 300

export function generateStaticParams() {
  return routing.locales.map((locale) => ({
    locale
  }))
}

export default async function EventsPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'events' })
  
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

  let events: Event[] = []

  try {
    const apiClient = new ApiClient(apiBaseUrl)
    const response = await apiClient.get<ApiResponse<Event>>('/public/events', {
      headers: {
        'x-locale': locale
      }
    })
    events = response.docs || []
  } catch (error) {
    if (error instanceof BackendError && error.statusCode === 404) {
      notFound()
    }
    throw error
  }

  return (
    <main>
      <h1>{t('title')}</h1>
      {events.length === 0 ? (
        <Empty description={t('noEvents')} />
      ) : (
        <>
          <p>{t('listPlaceholder')}</p>
        </>
      )}
    </main>
  )
}

