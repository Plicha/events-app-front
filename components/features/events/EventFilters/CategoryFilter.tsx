'use client'

import '@/lib/antd-patch'
import { useState, useEffect, Suspense } from 'react'
import { Select } from 'antd'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface Category {
  id: string | number
  name: string | { pl: string; en: string }
}

function CategoryFilterContent({ locale }: { locale: string }) {
  const t = useTranslations('events')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const categoryParam = searchParams.get('category')
  const [value, setValue] = useState<string | undefined>(undefined)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

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

  const handleChange = (categoryId: string | null) => {
    const params = new URLSearchParams(searchParams.toString())

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

  const filterOption = (input: string, option?: { label: string; value: string }) => {
    if (!option) return false
    return option.label.toLowerCase().includes(input.toLowerCase())
  }

  const selectedCategory = value ? categories.find(category => String(category.id) === String(value)) : null
  const displayValue = (!loading && selectedCategory && value) ? String(value) : null

  return (
    <Select
      placeholder={t('categoryPlaceholder')}
      value={displayValue}
      onChange={handleChange}
      showSearch
      allowClear
      loading={loading}
      filterOption={filterOption}
      style={{ width: '100%' }}
      options={categories.map((category) => ({
        label: getCategoryName(category),
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
    <Suspense fallback={<Select placeholder={t('categoryPlaceholder')} disabled style={{ width: '100%' }} />}>
      <CategoryFilterContent locale={locale} />
    </Suspense>
  )
}

