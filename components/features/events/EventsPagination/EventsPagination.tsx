'use client'

import '@/lib/antd-patch'
import { Pagination } from 'antd'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface EventsPaginationProps {
  current: number
  total: number
  pageSize: number
  locale: string
}

export function EventsPagination({ current, total, pageSize, locale }: EventsPaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations('events')

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    router.push(`${pathname}?${params.toString()}`)
    router.refresh()
  }

  const showTotal = (_total: number, range: [number, number]) => {
    return t('pagination.showTotal', { from: range[0], to: range[1], total: _total })
  }

  if (total === 0) {
    return null
  }

  return (
    <Pagination
      align="center"
      current={current}
      total={total}
      pageSize={pageSize}
      showSizeChanger={false}
      showTotal={showTotal}
      onChange={handlePageChange}
    />
  )
}

