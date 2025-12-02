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
  const [value, setValue] = useState<string | undefined>(undefined)
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
    if (loading) return
    
    const cityParam = searchParams.get('city')
    
    if (!cityParam || cities.length === 0) {
      setValue(undefined)
      return
    }
    
    const cityExists = cities.some(city => String(city.id) === String(cityParam))
    if (cityExists) {
      setValue(prevValue => {
        const currentValueStr = prevValue ? String(prevValue) : null
        const paramStr = String(cityParam)
        return currentValueStr !== paramStr ? String(cityParam) : prevValue
      })
    } else {
      setValue(undefined)
    }
  }, [searchParams, cities, loading])

  const handleChange = (cityId: string | null) => {
    const params = new URLSearchParams(searchParams.toString())

    if (cityId) {
      params.set('city', String(cityId))
      setValue(String(cityId))
    } else {
      params.delete('city')
      setValue(undefined)
    }

    router.push(`${pathname}?${params.toString()}`)
    router.refresh()
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

  const selectedCity = value ? cities.find(city => String(city.id) === String(value)) : null
  const displayValue = (!loading && selectedCity && value) ? String(value) : null

  return (
    <Select
      placeholder={t('cityPlaceholder')}
      value={displayValue}
      onChange={handleChange}
      showSearch
      allowClear
      loading={loading}
      filterOption={filterOption}
      style={{ width: '100%' }}
      options={cities.map((city) => ({
        label: getCityName(city),
        value: String(city.id),
      }))}
      notFoundContent={loading ? null : undefined}
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

