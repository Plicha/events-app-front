'use client'

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

  const handlePageChange = (page: number, size: number) => {
    const params = new URLSearchParams(searchParams.toString())
    
    params.set('page', String(page))
    params.set('limit', String(size))
    
    router.push(`${pathname}?${params.toString()}`)
    router.refresh()
  }

  const handleSizeChange = (_current: number, size: number) => {
    const params = new URLSearchParams(searchParams.toString())
    
    params.set('page', '1')
    params.set('limit', String(size))
    
    router.push(`${pathname}?${params.toString()}`)
    router.refresh()
  }

  const showTotal = (total: number, range: [number, number]) => {
    return `${range[0]}-${range[1]} z ${total} wydarzeń`
  }

  if (total === 0) {
    return null
  }

  return (
    <Pagination
      current={current}
      total={total}
      pageSize={pageSize}
      showSizeChanger
      pageSizeOptions={['10', '20', '50']}
      showTotal={showTotal}
      onChange={handlePageChange}
      onShowSizeChange={handleSizeChange}
    />
  )
}

