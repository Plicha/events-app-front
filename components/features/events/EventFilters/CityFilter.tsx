'use client'

import { useState, useEffect, Suspense } from 'react'
import { Select } from 'antd'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { City } from '@/types'

function CityFilterContent({ locale }: { locale: string }) {
  const t = useTranslations('events')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const cityParam = searchParams.get('city')
  const [value, setValue] = useState<string | undefined>(cityParam || undefined)
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)

  const countyId = process.env.NEXT_PUBLIC_COUNTY_ID

  useEffect(() => {
    async function fetchCities() {
      try {
        setLoading(true)
        const headers: Record<string, string> = {
          'x-locale': locale,
        }

        if (countyId) {
          headers['x-county-id'] = countyId
        }

        const response = await fetch('/api/public/cities', {
          headers,
        })

        if (!response.ok) {
          throw new Error('Failed to fetch cities')
        }

        const data = await response.json()
        setCities(data.docs || [])
      } catch (error) {
        console.error('Error fetching cities:', error)
        setCities([])
      } finally {
        setLoading(false)
      }
    }

    fetchCities()
  }, [locale, countyId])

  useEffect(() => {
    const cityParam = searchParams.get('city')
    if (cityParam !== value) {
      setValue(cityParam || undefined)
    }
  }, [searchParams, value])

  const handleChange = (cityId: string | undefined) => {
    setValue(cityId)
    const params = new URLSearchParams(searchParams.toString())

    if (cityId) {
      params.set('city', cityId)
    } else {
      params.delete('city')
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  const getCityName = (city: City): string => {
    if (typeof city.name === 'string') {
      return city.name
    }
    return city.name[locale as 'pl' | 'en'] || city.name.pl || city.name.en || ''
  }

  const filterOption = (input: string, option?: { label: string; value: string }) => {
    if (!option) return false
    return option.label.toLowerCase().includes(input.toLowerCase())
  }

  return (
    <Select
      placeholder={t('cityPlaceholder')}
      value={value}
      onChange={handleChange}
      showSearch
      allowClear
      loading={loading}
      filterOption={filterOption}
      style={{ width: '100%' }}
      options={cities.map((city) => ({
        label: getCityName(city),
        value: city.id,
      }))}
    />
  )
}

interface CityFilterProps {
  locale: string
}

export function CityFilter({ locale }: CityFilterProps) {
  const t = useTranslations('events')

  return (
    <Suspense fallback={<Select placeholder={t('cityPlaceholder')} disabled style={{ width: '100%' }} />}>
      <CityFilterContent locale={locale} />
    </Suspense>
  )
}

