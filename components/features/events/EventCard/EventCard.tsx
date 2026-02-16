'use client'

import '@/lib/antd-patch'
import { Card, Badge, Typography, Button, Row, Col, Image, Space } from 'antd'
import { CalendarOutlined, EnvironmentOutlined, TagOutlined } from '@ant-design/icons'
import { Link } from '@/lib/i18n/routing'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import type { Event, Category } from '@/types'
import { extractTextFromRichText, truncateText, getLocalizedText } from '@/lib/utils/richText'
import {
  getEventCoverUrl,
  getCategoryIconUrl,
  getSingleCategoryIconUrl,
  getCategoryName,
  getCategoryColorClass,
  getCityName,
  getVenueName,
  isSvgIcon,
} from '@/lib/utils/eventHelpers'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import 'dayjs/locale/pl'
import 'dayjs/locale/en'
import styles from './EventCard.module.scss'
import { useRouter } from '@/lib/i18n/routing'
import { useSvgIcons } from '@/hooks/useSvgIcons'
import { CategoryIconDisplay } from '@/components/ui/CategoryIconDisplay'

dayjs.extend(utc)
dayjs.extend(timezone)

const { Title, Text } = Typography

interface EventCardProps {
  event: Event
  locale: string
  layout?: 'horizontal' | 'vertical'
}

type CategoryIconMeta = {
  category: Category
  iconUrl: string | null
  isSvg: boolean
  name: string
}

function formatEventDate(dateString: string, locale: string): string {
  const normalizedLocale = locale === 'pl' ? 'pl' : 'en'

  const date = dayjs
    .utc(dateString)
    .tz('Europe/Warsaw')
    .locale(normalizedLocale)

  if (date.hour() === 0 && date.minute() === 0) {
    return date.format('DD.MM.YYYY')
  }

  return date.format('DD.MM.YYYY, HH:mm')
}

const frontendMediaOptions = { useFrontendProxy: true } as const

function getEventSlug(event: Event): string {
  return event.slug || event.id
}

export function EventCard({ event, locale, layout = 'horizontal' }: EventCardProps) {
  const t = useTranslations('events')
  const coverUrl = getEventCoverUrl(event.cover, event.hostImageUrl, frontendMediaOptions)
  const categoryIconUrl = getCategoryIconUrl(event.categories, frontendMediaOptions)
  const imageUrl = coverUrl || categoryIconUrl
  const categories = useMemo(
    () =>
      (event.categories || []).filter(
        (cat): cat is Category => typeof cat === 'object'
      ),
    [event.categories]
  )

  const categoriesWithIconMeta: CategoryIconMeta[] = useMemo(
    () =>
      categories.map((category) => ({
        category,
        iconUrl: getSingleCategoryIconUrl(category, frontendMediaOptions),
        isSvg: isSvgIcon(category),
        name: getCategoryName(category, locale)
      })),
    [categories, locale]
  )

  const svgUrls = useMemo(
    () =>
      categoriesWithIconMeta
        .filter((c) => c.isSvg && c.iconUrl)
        .map((c) => c.iconUrl!),
    [categoriesWithIconMeta]
  )
  const { svgByUrl, pendingSvg, failedSvg } = useSvgIcons(svgUrls)

  const title = getLocalizedText(event.title, locale)
  const summaryText = extractTextFromRichText(event.summaryAI || event.summaryRaw, locale)
  const truncatedSummary = truncateText(summaryText, 150)
  const formattedDate = formatEventDate(event.startsAt, locale)
  const cityName = getCityName(event.city, locale)
  const venueName = getVenueName(event.venue, locale)
  const eventSlug = getEventSlug(event)
  const eventHref = { pathname: '/events/[slug]' as const, params: { slug: eventSlug } }
  const router = useRouter()

  const imageSection = imageUrl ? (
    <div
      className={styles.imageContainer}
      style={{ ['--bg-image' as any]: `url("${imageUrl}")` } as CSSProperties}
    >
      <div className={styles.foregroundImage}>
        <Image
          src={imageUrl}
          alt={title}
          fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5CcmFrIG9icmF6dTwvdGV4dD48L3N2Zz4="
          preview={false}
        />
      </div>
    </div>
  ) : (
    <div className={styles.placeholderContainer}>
      <TagOutlined className={styles.placeholderIcon} />
    </div>
  )

  const contentSection = (
    <Space direction="vertical" size="small" className={styles.contentSpace}>
      <Space direction="horizontal" size={8}>
        {categories.length > 0 && (
          <Space size={8} wrap className={styles.categoryBadgeWrapper}> 
            {categoriesWithIconMeta.map(({ category, iconUrl, isSvg, name }) => {
              const badgeClasses = [styles.categoryBadge, getCategoryColorClass(category)].join(' ')
              
              return (
                <Space 
                  key={category.id || category.slug} 
                  size={4} 
                  align="center"
                  className={badgeClasses}
                >
                  <CategoryIconDisplay
                    iconUrl={iconUrl}
                    isSvg={isSvg}
                    svgByUrl={svgByUrl}
                    pendingSvg={pendingSvg}
                    failedSvg={failedSvg}
                    size={16}
                  />
                  <span>{name}</span>
                </Space>
              )
            })}
          </Space>
        )}
      </Space>
      <Title level={2} className={styles.title}>
        {title}
      </Title>
      
      <Space direction="vertical" size={4}>
        <Text suppressHydrationWarning>
          <CalendarOutlined /> {formattedDate}
        </Text>
        
        {[venueName, cityName].filter(Boolean).length > 0 && (
          <Text className={styles.venueText}>
            <EnvironmentOutlined /> {[venueName, cityName].filter(Boolean).join(', ')}
          </Text>
        )}
      </Space>
      
      {truncatedSummary && (
        <Text type="secondary" className={styles.summaryText}>
          {truncatedSummary}
        </Text>
      )}
      <div className={styles.viewDetailsButtonWrapper}>
        <Link href={eventHref}>
          <Button type="primary">{t('viewDetails')}</Button>
        </Link>
      </div>
    </Space>
  )

  const cardClassName = layout === 'vertical' 
    ? `${styles.card} ${styles.verticalLayout}`
    : styles.card

  const cardContent = (
    <Card className={cardClassName} onClick={() => router.push(eventHref)}>
      {layout === 'vertical' ? (
        <>
          {imageSection}
          <div className={styles.verticalContentWrapper}>
            {contentSection}
          </div>
        </>
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={10} sm={6} md={4}>
            {imageSection}
          </Col>
          <Col xs={14} sm={18} md={20}>
            {contentSection}
          </Col>
        </Row>
      )}
    </Card>
  )

  if (event.isPromoted) {
    return (
      <Badge.Ribbon text={t('promoted')} color="red" className={styles.promotedRibbon}>
        {cardContent}
      </Badge.Ribbon>
    )
  }

  return cardContent
}

