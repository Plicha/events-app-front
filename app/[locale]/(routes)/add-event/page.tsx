import { getTranslations, setRequestLocale } from 'next-intl/server'
import { routing } from '@/lib/i18n/routing'
import { ApiClient } from '@/lib/api/client'
import { getApiBaseUrl, createApiHeaders } from '@/lib/api/config'
import type { Category } from '@/types'
import { AddEventForm } from '@/components/features/add-event'
import { StaticBreadcrumb } from '@/components/layout'
import { HomeOutlined, PlusOutlined } from '@ant-design/icons'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({
    locale
  }))
}

export default async function AddEventPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  
  const t = await getTranslations('addEvent')
  const tCommon = await getTranslations('common')

  const apiClient = new ApiClient(getApiBaseUrl())
  const headers = createApiHeaders(locale)

  let categories: Category[] = []
  try {
    const response = await apiClient.get<{ docs: Category[] }>('/public/categories', {
      params: { all: 'true' },
      headers,
      next: { revalidate: 300 },
    })
    categories = response.docs || []
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[AddEventPage] Failed to fetch categories:', error)
    }
  }

  const breadcrumbItems = [
    { title: tCommon('home'), href: '/', icon: <HomeOutlined /> },
    { title: t('title'), icon: <PlusOutlined /> },
  ]

  return (
    <main className="default-padding-y">
      <div className="container">
        <StaticBreadcrumb items={breadcrumbItems} />
        <h1>{t('title')}</h1>
        <AddEventForm categories={categories} locale={locale} />
      </div>
    </main>
  )
}
