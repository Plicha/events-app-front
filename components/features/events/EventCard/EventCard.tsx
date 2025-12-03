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

function getEventCoverUrl(cover: Event['cover']): string | null {
  if (!cover) return null
  
  if (typeof cover === 'string') {
    return cover
  }
  
  if (typeof cover === 'object' && cover.url) {
    return cover.url
  }
  
  return null
}

function getCategoryIconUrl(categories: Event['categories']): string | null {
  if (!categories || categories.length === 0) return null
  
  const firstCategory = Array.isArray(categories) ? categories[0] : null
  if (!firstCategory) return null
  
  const category = typeof firstCategory === 'object' ? firstCategory : null
  if (!category || !category.icon) return null
  
  if (typeof category.icon === 'string') {
    return category.icon
  }
  
  if (typeof category.icon === 'object' && category.icon.url) {
    return category.icon.url
  }
  
  return null
}

function getCategoryName(category: Category, locale: string): string {
  if (typeof category.name === 'string') {
    return category.name
  }
  return category.name[locale as 'pl' | 'en'] || category.name.pl || category.name.en || ''
}

function getCategoriesText(categories: Event['categories'], locale: string): string {
  if (!categories || categories.length === 0) return ''
  
  const categoryNames = Array.isArray(categories)
    ? categories
        .filter((cat): cat is Category => typeof cat === 'object')
        .map(cat => getCategoryName(cat, locale))
    : []
  
  return categoryNames.join(', ')
}

function getCityName(city: Event['city'], locale: string): string {
  if (typeof city === 'string') return ''
  
  if (typeof city.name === 'string') {
    return city.name
  }
  return city.name[locale as 'pl' | 'en'] || city.name.pl || city.name.en || ''
}

function getVenueName(venue: Event['venue'], locale: string): string {
  if (!venue || typeof venue === 'string') return ''
  
  if (typeof venue.name === 'string') {
    return venue.name
  }
  return venue.name[locale as 'pl' | 'en'] || venue.name.pl || venue.name.en || ''
}

function getEventSlug(event: Event): string {
  return event.slug || event.id
}

export function EventCard({ event, locale }: EventCardProps) {
  const t = useTranslations('events')
  const coverUrl = getEventCoverUrl(event.cover)
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

  return (
    <Badge.Ribbon text={event.isPromoted ? t('promoted') : null} color="red">
      <Card>
        <Row gutter={16}>
          <Col xs={24} sm={8} md={6}>
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={title}
                style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5CcmFrIG9icmF6dTwvdGV4dD48L3N2Zz4="
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '200px',
                  backgroundColor: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                }}
              >
                <TagOutlined style={{ fontSize: 48 }} />
              </div>
            )}
          </Col>
          <Col xs={24} sm={16} md={18}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Title level={4} style={{ margin: 0 }}>
                {title}
              </Title>
              
              <Space direction="vertical" size={4}>
                <Text>
                  <CalendarOutlined /> {formattedDate}
                </Text>
                
                {(venueName || cityName) && (
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
                <Text type="secondary" style={{ display: 'block' }}>
                  {truncatedSummary}
                </Text>
              )}
              
              <Link href={eventUrl}>
                <Button type="primary">{t('viewDetails')}</Button>
              </Link>
            </Space>
          </Col>
        </Row>
      </Card>
    </Badge.Ribbon>
  )
}

