'use client'

import '@/lib/antd-patch'
import { Card, Badge, Typography, Button, Row, Col, Image, Space } from 'antd'
import { CalendarOutlined, EnvironmentOutlined, TagOutlined } from '@ant-design/icons'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { Event, Category } from '@/types'
import { extractTextFromRichText, truncateText, getLocalizedText } from '@/lib/utils/richText'
import dayjs from 'dayjs'
import 'dayjs/locale/pl'
import 'dayjs/locale/en'
import styles from './EventCard.module.scss'

const { Title, Text } = Typography

interface EventCardProps {
  event: Event
  locale: string
}

function formatEventDate(dateString: string, locale: string): string {
  const date = dayjs(dateString)
  dayjs.locale(locale === 'pl' ? 'pl' : 'en')
  
  return date.format('DD.MM.YYYY, HH:mm')
}

function buildMediaUrl(urlOrPath: string): string {
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    return urlOrPath
  }

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_API_URL?.replace('/api', '') || 'http://localhost:3000'
  const backendBaseUrl = backendUrl.replace(/\/+$/, '')
  const normalizedPath = urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`

  return `${backendBaseUrl}${normalizedPath}`
}

function getEventCoverUrl(cover: Event['cover'], hostImageUrl?: string): string | null {
  if (!cover) {
    return hostImageUrl || null
  }

  if (typeof cover === 'string') {
    const isUrl = cover.startsWith('http://') || cover.startsWith('https://') || cover.startsWith('/')
    return isUrl ? cover : hostImageUrl || null
  }

  if (typeof cover !== 'object') {
    return hostImageUrl || null
  }

  const coverObj = cover as any

  return coverObj.url
    ? buildMediaUrl(coverObj.url)
    : coverObj.filename
    ? buildMediaUrl(`/api/media/file/${coverObj.filename}`)
    : coverObj.id
    ? buildMediaUrl(`/api/media/${coverObj.id}`)
    : hostImageUrl || null
}

function getCategoryIconUrl(categories: Event['categories']): string | null {
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return null
  }

  const firstCategory = categories[0]
  if (!firstCategory || typeof firstCategory !== 'object') {
    return null
  }

  const icon = (firstCategory as any).icon
  if (!icon) {
    return null
  }

  if (typeof icon === 'string') {
    return buildMediaUrl(icon)
  }

  if (typeof icon === 'object') {
    const iconObj = icon as any
    return iconObj.url
      ? buildMediaUrl(iconObj.url)
      : iconObj.filename
      ? buildMediaUrl(`/api/media/file/${iconObj.filename}`)
      : iconObj.id
      ? buildMediaUrl(`/api/media/${iconObj.id}`)
      : null
  }

  return null
}

function getCategoryName(category: Category, locale: string): string {
  if (typeof category.name === 'string') {
    return category.name
  }
  const localizedName = category.name[locale as 'pl' | 'en'] || category.name.pl || category.name.en
  return localizedName || ''
}

function getCategoriesText(categories: Event['categories'], locale: string): string {
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return ''
  }

  const categoryNames = categories
    .filter((cat): cat is Category => typeof cat === 'object')
    .map(cat => getCategoryName(cat, locale))
    .filter(Boolean)

  return categoryNames.join(', ')
}

function getCityName(city: Event['city'], locale: string): string {
  if (typeof city === 'string' || !city) {
    return ''
  }

  if (typeof city.name === 'string') {
    return city.name
  }

  const localizedName = city.name[locale as 'pl' | 'en'] || city.name.pl || city.name.en
  return localizedName || ''
}

function getVenueName(venue: Event['venue'], locale: string): string {
  if (!venue || typeof venue === 'string') {
    return ''
  }

  if (typeof venue.name === 'string') {
    return venue.name
  }

  const localizedName = venue.name[locale as 'pl' | 'en'] || venue.name.pl || venue.name.en
  return localizedName || ''
}

function getEventSlug(event: Event): string {
  return event.slug || event.id
}

export function EventCard({ event, locale }: EventCardProps) {
  const t = useTranslations('events')
  const coverUrl = getEventCoverUrl(event.cover, event.hostImageUrl)
  const categoryIconUrl = getCategoryIconUrl(event.categories)
  const imageUrl = coverUrl || categoryIconUrl
  
  dayjs.locale(locale === 'pl' ? 'pl' : 'en')
  
  const title = getLocalizedText(event.title, locale)
  const summaryText = extractTextFromRichText(event.summaryAI)
  const truncatedSummary = truncateText(summaryText, 150)
  const formattedDate = formatEventDate(event.startsAt, locale)
  const cityName = getCityName(event.city, locale)
  const venueName = getVenueName(event.venue, locale)
  const categoriesText = getCategoriesText(event.categories, locale)
  const eventSlug = getEventSlug(event)
  const eventUrl = `/${locale}/events/${eventSlug}`

  const cardContent = (
    <Card>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={6} md={4}>
            {imageUrl ? (
              <div className={styles.imageContainer}>
                <Image
                  src={imageUrl}
                  alt={title}
                  fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5CcmFrIG9icmF6dTwvdGV4dD48L3N2Zz4="
                  preview={false}
                />
              </div>
            ) : (
              <div className={styles.placeholderContainer}>
                <TagOutlined className={styles.placeholderIcon} />
              </div>
            )}
          </Col>
          <Col xs={24} sm={18} md={20}>
            <Space direction="vertical" size="small" className={styles.contentSpace}>
              <Title level={4} className={styles.title}>
                {title}
              </Title>
              
              <Space direction="vertical" size={4}>
                <Text>
                  <CalendarOutlined /> {formattedDate}
                </Text>
                
                {[venueName, cityName].filter(Boolean).length > 0 && (
                  <Text>
                    <EnvironmentOutlined /> {[venueName, cityName].filter(Boolean).join(', ')}
                  </Text>
                )}
                
                {categoriesText && (
                  <Text type="secondary">
                    <TagOutlined /> {categoriesText}
                  </Text>
                )}
              </Space>
              
              {truncatedSummary && (
                <Text type="secondary" className={styles.summaryText}>
                  {truncatedSummary}
                </Text>
              )}
              <div className={styles.viewDetailsButtonWrapper}>
                <Link href={eventUrl}>
                  <Button type="primary">{t('viewDetails')}</Button>
                </Link>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>
  )

  if (event.isPromoted) {
    return (
      <Badge.Ribbon text={t('promoted')} color="red">
        {cardContent}
      </Badge.Ribbon>
    )
  }

  return cardContent
}

