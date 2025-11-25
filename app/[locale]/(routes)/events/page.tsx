import { getTranslations } from 'next-intl/server'
import { routing } from '@/lib/i18n/routing'
import { ApiClient } from '@/lib/api/client'
import type { ApiResponse, Event } from '@/types'

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

  const apiClient = new ApiClient('/api')
  const response = await apiClient.get<ApiResponse<Event>>('/public/events', {
    headers: {
      'x-locale': locale
    }
  })

  const events = response.docs || []

  return (
    <main>
      <h1>{t('title')}</h1>
      <p>Events list will be here</p>
    </main>
  )
}

