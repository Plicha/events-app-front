'use client'

import { Link } from '@/lib/i18n/routing'
import { getCategoryName, getCategoryColorClass } from '@/lib/utils/eventHelpers'
import { CategoryIconDisplay } from '@/components/ui/CategoryIconDisplay'
import type { Category } from '@/types'
import styles from './CategoriesSection.module.scss'

interface CategoryItemProps {
  category: Category
  locale: string
  iconUrl: string | null
  isSvg: boolean
  svgByUrl: Record<string, string>
  pendingSvg: Record<string, boolean>
  failedSvg: Record<string, boolean>
}

export function CategoryItem({
  category,
  locale,
  iconUrl,
  isSvg,
  svgByUrl,
  pendingSvg,
  failedSvg,
}: CategoryItemProps) {
  const href = { pathname: '/events' as const, query: { category: category.id } }
  const colorClass = getCategoryColorClass(category)

  return (
    <Link href={href} className={`${styles.categoryItem} ${colorClass}`}>
      <CategoryIconDisplay
        className={styles.icon}
        iconUrl={iconUrl}
        isSvg={isSvg}
        svgByUrl={svgByUrl}
        pendingSvg={pendingSvg}
        failedSvg={failedSvg}
        size={32}
      />
      <span className={styles.label}>{getCategoryName(category, locale)}</span>
    </Link>
  )
}
