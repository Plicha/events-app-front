'use client'

import '@/lib/antd-patch'
import { useState, useEffect, useMemo, Suspense } from 'react'
import { Select } from 'antd'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { City } from '@/types'

function CityFilterContent({ locale }: { locale: string }) {
  const t = useTranslations('events')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [value, setValue] = useState<string | undefined>(undefined)
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)

  const countyId = process.env.NEXT_PUBLIC_COUNTY_ID
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const cityParam = searchParams.get('city')

  const headers = useMemo(() => ({
    'x-locale': locale,
    ...(countyId && { 'x-county-id': countyId }),
  }), [locale, countyId])

  const citiesUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const queryString = params.toString()
    return `/api/public/cities${queryString ? `?${queryString}` : ''}`
  }, [from, to])

  useEffect(() => {
    async function fetchCities() {
      try {
        setLoading(true)
        const response = await fetch(citiesUrl, { headers })

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
  }, [citiesUrl, headers])

  useEffect(() => {
    if (loading || cities.length === 0) {
      setValue(undefined)
      return
    }

    if (!cityParam) {
      setValue(undefined)
      return
    }

    const cityExists = cities.some(city => String(city.id) === cityParam)
    setValue(cityExists ? cityParam : undefined)
  }, [cityParam, cities, loading])

  const handleChange = (cityId: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')

    if (cityId) {
      params.set('city', cityId)
      setValue(cityId)
    } else {
      params.delete('city')
      setValue(undefined)
    }

    router.push(`${pathname}?${params.toString()}`)
    router.refresh()
  }

  const options = useMemo(() => {
    const getCityName = (city: City): string => {
      if (typeof city.name === 'string') {
        return city.name
      }
      return city.name[locale as 'pl' | 'en'] || city.name.pl || city.name.en || ''
    }

    return cities.map((city) => ({
      label: getCityName(city),
      value: String(city.id),
    }))
  }, [cities, locale])

  const filterOption = (input: string, option?: { label: string; value: string }) => {
    return option?.label.toLowerCase().includes(input.toLowerCase()) ?? false
  }

  const displayValue = !loading && value && cities.some(city => String(city.id) === value) ? value : null

  return (
    <Select
      size="large"
      placeholder={t('cityPlaceholder')}
      value={displayValue}
      onChange={handleChange}
      showSearch
      allowClear
      loading={loading}
      filterOption={filterOption}
      style={{ width: '100%' }}
      options={options}
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

