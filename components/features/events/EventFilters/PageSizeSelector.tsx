'use client'

import { Select } from 'antd'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface PageSizeSelectorProps {
  locale: string
  currentPageSize?: number
}

export function PageSizeSelector({ locale, currentPageSize = 20 }: PageSizeSelectorProps) {
  const t = useTranslations('events')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const handleChange = (value: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('limit', String(value))
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
    router.refresh()
  }

  return (
    <Select
      value={currentPageSize}
      onChange={handleChange}
      style={{ width: '100%' }}
      options={[
        { label: '10 na stronie', value: 10 },
        { label: '20 na stronie', value: 20 },
        { label: '50 na stronie', value: 50 },
      ]}
    />
  )
}

