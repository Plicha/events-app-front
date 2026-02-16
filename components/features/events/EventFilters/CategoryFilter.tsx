'use client'

import '@/lib/antd-patch'
import { useState, useEffect, useMemo, Suspense } from 'react'
import { Select, Space } from 'antd'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { getSingleCategoryIconUrl, getCategoryName, isSvgIcon } from '@/lib/utils/eventHelpers'
import { useSvgIcons, useCategories } from '@/hooks'
import styles from './CategoryFilter.module.scss'

const frontendMediaOptions = { useFrontendProxy: true } as const

function CategoryFilterContent({ locale }: { locale: string }) {
  const t = useTranslations('events')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { categories, loading } = useCategories(locale)

  const [value, setValue] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (loading) return
    
    const categoryParam = searchParams.get('category')
    
    if (!categoryParam || categories.length === 0) {
      setValue(undefined)
      return
    }
    
    const categoryExists = categories.some(category => String(category.id) === String(categoryParam))
    if (categoryExists) {
      setValue(prevValue => {
        const currentValueStr = prevValue ? String(prevValue) : null
        const paramStr = String(categoryParam)
        return currentValueStr !== paramStr ? String(categoryParam) : prevValue
      })
    } else {
      setValue(undefined)
    }
  }, [searchParams, categories, loading])

  const svgUrls = useMemo(
    () =>
      categories
        .filter((c) => isSvgIcon(c))
        .map((c) => getSingleCategoryIconUrl(c, frontendMediaOptions))
        .filter((url): url is string => Boolean(url)),
    [categories]
  )
  const { svgByUrl } = useSvgIcons(loading ? [] : svgUrls)

  const handleChange = (categoryId: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')

    if (categoryId) {
      params.set('category', String(categoryId))
      setValue(String(categoryId))
    } else {
      params.delete('category')
      setValue(undefined)
    }

    router.push(`${pathname}?${params.toString()}`)
    router.refresh()
  }

  const selectedCategory = value ? categories.find(category => String(category.id) === String(value)) : null
  const displayValue = (!loading && selectedCategory && value) ? String(value) : null

  return (
    <Select
      size="large"
      placeholder={t('categoryPlaceholder')}
      value={displayValue}
      onChange={handleChange}
      showSearch
      allowClear
      loading={loading}
      optionFilterProp="title"
      className={styles.select}
      options={categories.map((category) => ({
        title: getCategoryName(category, locale),
        label: (
          <Space align="center" size={8} className={styles.spaceItem}>
            {(() => {
              const url = getSingleCategoryIconUrl(category, frontendMediaOptions)
              if (!url) return null
              if (isSvgIcon(category) && svgByUrl[url]) {
                return (
                  <span
                    className={styles.iconWrap}
                    dangerouslySetInnerHTML={{ __html: svgByUrl[url] }}
                  />
                )
              }
              return (
                <img
                  src={url}
                  alt="icon"
                  className={styles.iconImg}
                />
              )
            })()}
            <span>{getCategoryName(category, locale)}</span>
          </Space>
        ),
        value: String(category.id),
      }))}
      notFoundContent={loading ? null : undefined}
    />
  )
}

interface CategoryFilterProps {
  locale: string
}

export function CategoryFilter({ locale }: CategoryFilterProps) {
  const t = useTranslations('events')

  return (
    <Suspense fallback={<Select placeholder={t('categoryPlaceholder')} disabled className={styles.select} />}>
      <CategoryFilterContent locale={locale} />
    </Suspense>
  )
}

