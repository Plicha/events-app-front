'use client'

import '@/lib/antd-patch'
import { Select } from 'antd'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface SortSelectorProps {
  locale: string
  currentSort?: string
}

export function SortSelector({ locale, currentSort = 'asc' }: SortSelectorProps) {
  const t = useTranslations('events')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', value)
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
    router.refresh()
  }

  return (
    <Select
      size="large"
      value={currentSort}
      onChange={handleChange}
      style={{ width: '100%' }}
      options={[
        { label: t('sortAsc'), value: 'asc' },
        { label: t('sortDesc'), value: 'desc' },
      ]}
    />
  )
}

