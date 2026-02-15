import { getTranslations } from 'next-intl/server'
import { setRequestLocale } from 'next-intl/server'
import { ApiClient } from '@/lib/api/client'
import { getApiBaseUrl, createApiHeaders } from '@/lib/api/config'
import { BackendError } from '@/lib/api/errors'
import type { Event, ApiResponse } from '@/types'
import { Row, Col, Image, Button, Space } from 'antd'
import { CalendarOutlined, EnvironmentOutlined, TagOutlined, LinkOutlined, HomeOutlined } from '@ant-design/icons'
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
import { RichText } from '@/components/ui/RichText'
import styles from './page.module.scss'
import { StaticBreadcrumb } from '@/components/layout/Breadcrumb/StaticBreadcrumb'
import { routing } from '@/lib/i18n/routing'

export const revalidate = 300

export async function generateStaticParams() {
  const params: Array<{ locale: string; slug: string }> = []

  try {
    const apiClient = new ApiClient(getApiBaseUrl())

    for (const locale of routing.locales) {
      try {
        const headers = createApiHeaders(locale)
        const response = await apiClient.get<ApiResponse<Event>>('/public/events', {
          params: {
            locale,
            limit: '1000',
          },
          headers,
          next: { revalidate: 300 },
        })

        if (response.docs && Array.isArray(response.docs)) {
          for (const event of response.docs) {
            if (event.slug) {
              params.push({ locale, slug: event.slug })
            }
          }
        }
      } catch (error) {
        console.error(`[generateStaticParams] Failed to fetch events for locale ${locale}:`, error)
      }
    }
  } catch (error) {
    console.error('[generateStaticParams] Error:', error)
  }

  return params
}

async function fetchEvent(slug: string, locale: string): Promise<Event | null> {
  const apiClient = new ApiClient(getApiBaseUrl())
  const headers = createApiHeaders(locale)

  try {
    const response = await apiClient.get<{ doc: Event }>(`/public/events/${slug}`, {
      headers,
      next: { revalidate: 300 },
    })
    return response.doc || null
  } catch (error) {
    if (error instanceof BackendError && error.statusCode === 404) {
      return null
    }
    throw error
  }
}

export default async function EventDetailsPage({
  params
}: {
  params: Promise<{ slug: string; locale: string }>
}) {
  const { slug, locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'events' })

  const event = await fetchEvent(slug, locale)

  if (!event) {
    notFound()
  }

  const coverUrl = getEventCoverUrl(event.cover, event.hostImageUrl, { useFrontendProxy: true })
  const categoryIconUrl = getCategoryIconUrl(event.categories, { useFrontendProxy: true })
  const imageUrl = coverUrl || categoryIconUrl
  
  const title = getLocalizedText(event.title, locale)
  const formattedDate = formatEventDate(event.startsAt, locale)
  const cityName = getCityName(event.city, locale)
  const venueName = getVenueName(event.venue, locale)
  const venue = event.venue && typeof event.venue === 'object' ? event.venue : null
  const venueAddress = venue?.address || ''
  const categoriesText = getCategoriesText(event.categories, locale)

  const breadcrumbItems = [
    {
      href: '/',
      title: t('breadcrumb.home'),
      icon: <HomeOutlined />
    },
    {
      href: '/events',
      title: t('breadcrumb.events'),
      icon: <CalendarOutlined />
    },
    {
      title: title
    }
  ]

  return (
    <main className="default-padding-y">
      <div className="container">
        <StaticBreadcrumb items={breadcrumbItems} />
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
                <div className={styles.sourceButtonContainer}>
                    <Button
                      type="primary"
                      icon={<LinkOutlined />}
                      href={event.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.sourceButton}
                    >
                      {t('source')}
                    </Button>
                </div>
              )}
            </Space>
          </Col>
        </Row>
      </div>
    </main>
  )
}
