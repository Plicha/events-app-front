'use client'

import '@/lib/antd-patch'
import { useState, useEffect, Suspense } from 'react'
import { DatePicker } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import 'dayjs/locale/pl'
import 'dayjs/locale/en'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import styles from './DateRangeFilter.module.scss'

const { RangePicker } = DatePicker

function getThisWeekendRange(): [Dayjs, Dayjs] {
  const today = dayjs()
  const dayOfWeek = today.day()
  
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    const saturday = today.day(6)
    const sunday = today.day(0).add(1, 'week')
    return [saturday, sunday]
  } else if (dayOfWeek === 6) {
    return [today, today.add(1, 'day')]
  } else {
    return [today, today]
  }
}

function DateRangeFilterContent({ locale }: { locale: string }) {
  const t = useTranslations('events')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')
  
  const [value, setValue] = useState<[Dayjs | null, Dayjs | null] | null>(() => {
    if (fromParam && toParam) {
      const from = dayjs(fromParam)
      const to = dayjs(toParam)
      if (from.isValid() && to.isValid()) {
        return [from, to]
      }
    }
    return null
  })

  useEffect(() => {
    dayjs.locale(locale === 'pl' ? 'pl' : 'en')
  }, [locale])

  useEffect(() => {
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')
    
    if (fromParam && toParam) {
      const from = dayjs(fromParam)
      const to = dayjs(toParam)
      if (from.isValid() && to.isValid()) {
        setValue((prevValue) => {
          const newValue: [Dayjs, Dayjs] = [from, to]
          if (!prevValue || !prevValue[0]?.isSame(newValue[0], 'day') || !prevValue[1]?.isSame(newValue[1], 'day')) {
            return newValue
          }
          return prevValue
        })
      }
    } else {
      setValue((prevValue) => {
        if (prevValue !== null) {
          return null
        }
        return prevValue
      })
    }
  }, [searchParams])

  const getPresetRanges = () => {
    return [
      {
        label: t('dateRangePresets.today'),
        value: () => [dayjs(), dayjs()] as [Dayjs, Dayjs],
      },
      {
        label: t('dateRangePresets.tomorrow'),
        value: () => [dayjs().add(1, 'day'), dayjs().add(1, 'day')] as [Dayjs, Dayjs],
      },
      {
        label: t('dateRangePresets.thisWeekend'),
        value: () => getThisWeekendRange(),
      },
      {
        label: t('dateRangePresets.next7Days'),
        value: () => [dayjs(), dayjs().add(6, 'day')] as [Dayjs, Dayjs],
      },
      {
        label: t('dateRangePresets.next30Days'),
        value: () => [dayjs(), dayjs().add(29, 'day')] as [Dayjs, Dayjs],
      },
    ]
  }

  const handleChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setValue(dates)
    
    const params = new URLSearchParams(searchParams.toString())
    
    if (dates && dates[0] && dates[1]) {
      const fromDate = dates[0].startOf('day')
      const toDate = dates[1].startOf('day')
      
      const previousFrom = params.get('from')
      const previousTo = params.get('to')
      
      params.set('from', fromDate.format('YYYY-MM-DD'))
      params.set('to', toDate.format('YYYY-MM-DD'))
      
      const newFrom = params.get('from')
      const newTo = params.get('to')
      
      if (previousFrom !== newFrom || previousTo !== newTo) {
        params.delete('city')
      }
    } else {
      params.delete('from')
      params.delete('to')
      params.delete('city')
    }
    
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className={styles.dateRangeFilter}>
      <RangePicker
        value={value}
        onChange={handleChange}
        presets={getPresetRanges()}
        format="YYYY-MM-DD"
        style={{ width: '100%' }}
        classNames={{
          popup: {
            root: styles.dateRangeFilterDropdown,
          },
        }}
      />
    </div>
  )
}

interface DateRangeFilterProps {
  locale: string
}

export function DateRangeFilter({ locale }: DateRangeFilterProps) {
  return (
    <Suspense fallback={
      <RangePicker disabled style={{ width: '100%' }} />
    }>
      <DateRangeFilterContent locale={locale} />
    </Suspense>
  )
}

