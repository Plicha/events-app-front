'use client'

import '@/lib/antd-patch'
import { useState, useEffect, Suspense } from 'react'
import { Select, Space } from 'antd'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import styles from './CategoryFilter.module.scss'

interface Category {
  id: string | number
  name: string | { pl: string; en: string }
  icon?: string | { url?: string; mimeType?: string; filename?: string; alt?: string }
}

function CategoryFilterContent({ locale }: { locale: string }) {
  const t = useTranslations('events')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [value, setValue] = useState<string | undefined>(undefined)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [svgByUrl, setSvgByUrl] = useState<Record<string, string>>({})

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true)
        const headers: Record<string, string> = {
          'x-locale': locale,
        }

        const response = await fetch('/api/public/categories', {
          headers,
        })

        if (!response.ok) {
          throw new Error('Failed to fetch categories')
        }

        const data = await response.json()
        setCategories(data.docs || [])
      } catch (error) {
        console.error('Error fetching categories:', error)
        setCategories([])
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [locale])

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

  const getIconUrl = (category: Category): string | null => {
    const icon = category.icon
    if (!icon) return null
    if (typeof icon === 'string') return null
    if (typeof icon === 'object' && typeof icon.url === 'string') return icon.url
    return null
  }

  const isSvgIcon = (category: Category): boolean => {
    const icon = category.icon
    if (!icon || typeof icon === 'string') return false
    return icon.mimeType === 'image/svg+xml' || (icon.url?.toLowerCase().endsWith('.svg') ?? false)
  }

  const sanitizeSvg = (raw: string): string => {
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

  useEffect(() => {
    if (loading) return
    const svgCategories = categories.filter((c) => isSvgIcon(c))
    if (svgCategories.length === 0) return

    const controller = new AbortController()

    ;(async () => {
      const entries = await Promise.all(
        svgCategories.map(async (cat) => {
          const url = getIconUrl(cat)
          if (!url || svgByUrl[url]) return null
          try {
            const res = await fetch(url, { signal: controller.signal })
            if (!res.ok) return null
            const text = await res.text()
            const sanitized = sanitizeSvg(text)
            return sanitized ? ([url, sanitized] as const) : null
          } catch {
            return null
          }
        })
      )

      const next: Record<string, string> = {}
      for (const e of entries) {
        if (e) next[e[0]] = e[1]
      }
      if (Object.keys(next).length > 0) {
        setSvgByUrl((prev) => ({ ...prev, ...next }))
      }
    })()

    return () => controller.abort()
  }, [categories, loading])

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

  const getCategoryName = (category: Category): string => {
    if (typeof category.name === 'string') {
      return category.name
    }
    return category.name[locale as 'pl' | 'en'] || category.name.pl || category.name.en || ''
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
        title: getCategoryName(category),
        label: (
          <Space align="center" size={8} className={styles.spaceItem}>
            {(() => {
              const url = getIconUrl(category)
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
            <span>{getCategoryName(category)}</span>
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

