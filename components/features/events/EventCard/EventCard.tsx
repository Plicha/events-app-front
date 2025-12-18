'use client'

import '@/lib/antd-patch'
import { Card, Badge, Typography, Button, Row, Col, Image, Space } from 'antd'
import { CalendarOutlined, EnvironmentOutlined, TagOutlined, LoadingOutlined } from '@ant-design/icons'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useState, useEffect, useRef, useMemo } from 'react'
import type { CSSProperties } from 'react'
import type { Event, Category } from '@/types'
import { extractTextFromRichText, truncateText, getLocalizedText } from '@/lib/utils/richText'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import 'dayjs/locale/pl'
import 'dayjs/locale/en'
import styles from './EventCard.module.scss'
import { useRouter } from 'next/navigation'

dayjs.extend(utc)
dayjs.extend(timezone)

const { Title, Text } = Typography

// Shared cross-card caches to avoid repeated fetches for the same 
const svgCache = new Map<string, string>()
const svgPending = new Map<string, Promise<string | null>>()

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

function buildMediaUrl(urlOrPath: string): string {
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    return urlOrPath
  }

  if (urlOrPath.startsWith('/api/')) {
    return urlOrPath
  }

  if (urlOrPath.startsWith('/')) {
    return `/api${urlOrPath}`
  }

  return `/api/${urlOrPath}`
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

function getSingleCategoryIconUrl(category: Category): string | null {
  const icon = (category as any).icon
  if (!icon) return null
  if (typeof icon === 'string') return buildMediaUrl(icon)
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

function isSvgIcon(category: Category): boolean {
  const icon = (category as any).icon
  if (!icon || typeof icon === 'string') return false
  if (typeof icon === 'object') {
    return icon.mimeType === 'image/svg+xml' || (icon.url?.toLowerCase().endsWith('.svg') ?? false)
  }
  return false
}

function sanitizeSvg(raw: string): string {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(raw, 'image/svg+xml')
    const svg = doc.documentElement

    svg.querySelectorAll('script, foreignObject').forEach((n) => n.remove())

    svg.querySelectorAll('*').forEach((el) => {
      Array.from(el.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase()
        const value = attr.value
        if (name.startsWith('on')) el.removeAttribute(attr.name)
        if ((name === 'href' || name === 'xlink:href' || name === 'src') && /^javascript:/i.test(value)) {
          el.removeAttribute(attr.name)
        }
      })
    })

    svg.setAttribute('width', '1em')
    svg.setAttribute('height', '1em')
    svg.setAttribute('focusable', 'false')
    svg.setAttribute('aria-hidden', 'true')

    return svg.outerHTML
  } catch {
    return ''
  }
}

function getCategoryName(category: Category, locale: string): string {
  if (typeof category.name === 'string') {
    return category.name
  }
  const localizedName = category.name[locale as 'pl' | 'en'] || category.name.pl || category.name.en
  return localizedName || ''
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

function useCategoryIcons(categories: CategoryIconMeta[]) {
  const [svgByUrl, setSvgByUrl] = useState<Record<string, string>>({})
  const [pendingSvg, setPendingSvg] = useState<Record<string, boolean>>({})
  const [failedSvg, setFailedSvg] = useState<Record<string, boolean>>({})
  const svgByUrlRef = useRef<Record<string, string>>({})
  const failedSvgRef = useRef<Record<string, boolean>>({})

  useEffect(() => {
    svgByUrlRef.current = svgByUrl
  }, [svgByUrl])

  useEffect(() => {
    failedSvgRef.current = failedSvg
  }, [failedSvg])

  useEffect(() => {
    if (categories.length === 0) return

    const ensureSvg = (iconUrl: string) => {
      if (svgCache.has(iconUrl)) {
        if (!svgByUrlRef.current[iconUrl]) {
          const svg = svgCache.get(iconUrl)!
          setSvgByUrl((prev) => {
            const merged = { ...prev, [iconUrl]: svg }
            svgByUrlRef.current = merged
            return merged
          })
        }
        return
      }

      if (svgPending.has(iconUrl)) {
        setPendingSvg((prev) => ({ ...prev, [iconUrl]: true }))
        svgPending.get(iconUrl)!.then((result) => {
          if (result) {
            setSvgByUrl((prev) => {
              const merged = { ...prev, [iconUrl]: result }
              svgByUrlRef.current = merged
              return merged
            })
          } else {
            setFailedSvg((prev) => ({ ...prev, [iconUrl]: true }))
          }
          setPendingSvg((prev) => {
            const next = { ...prev }
            delete next[iconUrl]
            return next
          })
        })
        return
      }

      if (failedSvgRef.current[iconUrl]) return

      setPendingSvg((prev) => ({ ...prev, [iconUrl]: true }))
      const promise = fetch(iconUrl)
        .then(async (res) => {
          if (!res.ok) return null
          const text = await res.text()
          const sanitized = sanitizeSvg(text)
          return sanitized
        })
        .then((result) => {
          if (result) {
            svgCache.set(iconUrl, result)
            setSvgByUrl((prev) => {
              const merged = { ...prev, [iconUrl]: result }
              svgByUrlRef.current = merged
              return merged
            })
          } else {
            setFailedSvg((prev) => ({ ...prev, [iconUrl]: true }))
          }
          return result
        })
        .finally(() => {
          svgPending.delete(iconUrl)
          setPendingSvg((prev) => {
            const next = { ...prev }
            delete next[iconUrl]
            return next
          })
        })

      svgPending.set(iconUrl, promise)
    }

    categories
      .filter(({ iconUrl, isSvg }) => iconUrl && isSvg)
      .forEach(({ iconUrl }) => ensureSvg(iconUrl!))
  }, [categories])

  return { svgByUrl, pendingSvg, failedSvg }
}

export function EventCard({ event, locale, layout = 'horizontal' }: EventCardProps) {
  const t = useTranslations('events')
  const coverUrl = getEventCoverUrl(event.cover, event.hostImageUrl)
  const categoryIconUrl = getCategoryIconUrl(event.categories)
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
        iconUrl: getSingleCategoryIconUrl(category),
        isSvg: isSvgIcon(category),
        name: getCategoryName(category, locale)
      })),
    [categories, locale]
  )

  const { svgByUrl, pendingSvg, failedSvg } = useCategoryIcons(
    categoriesWithIconMeta
  )

  const title = getLocalizedText(event.title, locale)
  const summaryText = extractTextFromRichText(event.summaryAI || event.summaryRaw, locale)
  const truncatedSummary = truncateText(summaryText, 150)
  const formattedDate = formatEventDate(event.startsAt, locale)
  const cityName = getCityName(event.city, locale)
  const venueName = getVenueName(event.venue, locale)
  const eventSlug = getEventSlug(event)
  const eventUrl = `/${locale}/events/${eventSlug}`
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
              const colorClass = category.color ? `bg-${category.color}` : ''
              const badgeClasses = [styles.categoryBadge, colorClass].filter(Boolean).join(' ')
              
              return (
                <Space 
                  key={category.id || category.slug} 
                  size={4} 
                  align="center"
                  className={badgeClasses}
                >
                  {iconUrl && (
                    <>
                      {isSvg
                        ? svgByUrl[iconUrl]
                          ? (
                            <span
                              className={styles.categoryIconWrap}
                              dangerouslySetInnerHTML={{ __html: svgByUrl[iconUrl] }}
                            />
                          )
                          : pendingSvg[iconUrl]
                            ? <LoadingOutlined className={styles.categoryIconSpin} />
                            : failedSvg[iconUrl]
                            ? (
                              <img
                                src={iconUrl}
                                alt="icon"
                                className={styles.categoryIcon}
                              />
                            )
                            : null
                        : (
                          <img
                            src={iconUrl}
                            alt="icon"
                            className={styles.categoryIcon}
                          />
                        )}
                    </>
                  )}
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
          <Text>
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
        <Link href={eventUrl}>
          <Button type="primary">{t('viewDetails')}</Button>
        </Link>
      </div>
    </Space>
  )

  const cardClassName = layout === 'vertical' 
    ? `${styles.card} ${styles.verticalLayout}`
    : styles.card

  const cardContent = (
    <Card className={cardClassName} onClick={() => router.push(eventUrl)}>
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
      <Badge.Ribbon text={t('promoted')} color="red">
        {cardContent}
      </Badge.Ribbon>
    )
  }

  return cardContent
}

