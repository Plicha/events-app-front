import { getTranslations } from 'next-intl/server'
import { routing } from '@/lib/i18n/routing'
import { ApiClient } from '@/lib/api/client'
import { BackendError } from '@/lib/api/errors'
import type { Event } from '@/types'
import { Row, Col, Image, Button, Space } from 'antd'
import { CalendarOutlined, EnvironmentOutlined, TagOutlined, LinkOutlined } from '@ant-design/icons'
import { notFound } from 'next/navigation'
import {
  formatEventDate,
  getEventCoverUrl,
  getCategoryIconUrl,
  getCityName,
  getVenueName,
  getCategoriesText,
} from '@/lib/utils/eventHelpers'
import { getLocalizedText } from '@/lib/utils/richText'
import dynamic from 'next/dynamic'
import styles from './page.module.scss'

const RichText = dynamic(() => import('@/components/ui/RichText').then(mod => ({ default: mod.RichText })), {
  ssr: true,
})

export const revalidate = 300

export function generateStaticParams() {
  return routing.locales.map((locale) => ({
    locale
  }))
}

export default async function EventDetailsPage({
  params
}: {
  params: Promise<{ slug: string; locale: string }>
}) {
  const { slug, locale } = await params
  const t = await getTranslations({ locale, namespace: 'events' })
  
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://backend:3000/api'
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[EventDetailsPage] Using API URL: ${apiBaseUrl}`)
  }

  let event: Event | null = null

  try {
    const apiClient = new ApiClient(apiBaseUrl)
    const countyId = process.env.NEXT_PUBLIC_COUNTY_ID
    const headers: Record<string, string> = {
      'x-locale': locale,
      ...(countyId && { 'x-county-id': countyId }),
    }

    const response = await apiClient.get<{ doc: Event }>(`/public/events/${slug}`, {
      headers,
    })
    
    event = response.doc
  } catch (error) {
    if (error instanceof BackendError && error.statusCode === 404) {
      notFound()
    }
    throw error
  }

  if (!event) {
    notFound()
  }

  const coverUrl = getEventCoverUrl(event.cover, event.hostImageUrl)
  const categoryIconUrl = getCategoryIconUrl(event.categories)
  const imageUrl = coverUrl || categoryIconUrl
  
  const title = getLocalizedText(event.title, locale)
  const formattedDate = formatEventDate(event.startsAt, locale)
  const cityName = getCityName(event.city, locale)
  const venueName = getVenueName(event.venue, locale)
  const venue = event.venue && typeof event.venue === 'object' ? event.venue : null
  const venueAddress = venue?.address || ''
  const categoriesText = getCategoriesText(event.categories, locale)

  return (
    <main className="default-padding-y">
      <div className="container">
        <Row gutter={[32, 32]}>
          <Col xs={24} md={6}>
            {imageUrl ? (
              <div className={styles.eventImageContainer}>
                <Image
                  src={imageUrl}
                  alt={title}
                  className={styles.eventImage}
                  fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5CcmFrIG9icmF6dDwvdGV4dD48L3N2Zz4="
                  preview={false}
                />
              </div>
            ) : (
              <div className={styles.placeholderContainer}>
                <TagOutlined className={styles.placeholderIcon} />
              </div>
            )}
          </Col>
          <Col xs={24} md={18}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <h1>{title}</h1>
              
              {(event.summaryAI || event.summaryRaw) && (
                <RichText 
                  content={event.summaryAI || event.summaryRaw} 
                  locale={locale}
                  className={styles.eventSummary}
                />
              )}
              
              <Space direction="vertical" size="middle">
                <div>
                  <CalendarOutlined /> {formattedDate}
                </div>
                
                {venueName && (
                  <div>
                    <EnvironmentOutlined /> {venueName}
                    {venueAddress && `, ${venueAddress}`}
                    {cityName && ( 
                      <span>, {cityName}</span>
                    )}
                  </div>
                )}
                
                {categoriesText && (
                  <div>
                    <TagOutlined /> {categoriesText}
                  </div>
                )}
              </Space>
              
              {event.sourceUrl && (
                <Button
                  type="primary"
                  icon={<LinkOutlined />}
                  href={event.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('source')}
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </div>
    </main>
  )
}

