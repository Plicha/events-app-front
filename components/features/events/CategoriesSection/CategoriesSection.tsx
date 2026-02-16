'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { getSingleCategoryIconUrl, isSvgIcon } from '@/lib/utils/eventHelpers'
import { useCategories, useSvgIcons } from '@/hooks'
import { CategoryItem } from './CategoryItem'
import type { Category } from '@/types'
import styles from './CategoriesSection.module.scss'

const frontendMediaOptions = { useFrontendProxy: true } as const

interface CategoriesSectionProps {
  locale: string
  categories?: Category[]
}

export function CategoriesSection({ locale, categories: categoriesProp }: CategoriesSectionProps) {
  const t = useTranslations('events')
  const { categories: categoriesFromHook, loading } = useCategories(locale)

  const categories = categoriesProp ?? categoriesFromHook
  const isLoading = categoriesProp === undefined && loading

  const categoriesWithIconMeta = useMemo(
    () =>
      categories.map((category) => ({
        category,
        iconUrl: getSingleCategoryIconUrl(category, frontendMediaOptions),
        isSvg: isSvgIcon(category),
      })),
    [categories]
  )

  const svgUrls = useMemo(
    () =>
      categoriesWithIconMeta
        .filter((c) => c.isSvg && c.iconUrl)
        .map((c) => c.iconUrl!),
    [categoriesWithIconMeta]
  )

  const { svgByUrl, pendingSvg, failedSvg } = useSvgIcons(isLoading ? [] : svgUrls)

  if (isLoading || categories.length === 0) {
    return null
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{t('categoriesSectionTitle')}</h2>
      <div className={`${styles.grid} ${categories.length === 6 ? styles.gridSix : ''}`}>
        {categoriesWithIconMeta.map(({ category, iconUrl, isSvg }) => (
          <CategoryItem 
            key={category.id || category.slug}
            category={category}
            locale={locale}
            iconUrl={iconUrl}
            isSvg={isSvg}
            svgByUrl={svgByUrl}
            pendingSvg={pendingSvg}
            failedSvg={failedSvg}
          />
        ))}
      </div>
    </section>
  )
}
