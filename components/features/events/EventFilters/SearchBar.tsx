'use client'

import '@/lib/antd-patch'
import { useState, useMemo, useEffect, Suspense } from 'react'
import { Input, Space, Button } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import debounce from 'lodash.debounce'
import { useTranslations } from 'next-intl'

function SearchBarContent({
  placeholder,
  targetPathname,
  behavior = 'live',
}: {
  placeholder?: string
  targetPathname?: string
  behavior?: 'live' | 'submit'
}) {
  const t = useTranslations('events')
  const searchParams = useSearchParams()
  const router = useRouter()
  const currentPathname = usePathname()
  const pathname = targetPathname || currentPathname
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')
  const effectivePlaceholder = placeholder || t('searchPlaceholder')

  const updateSearchInParams = (params: URLSearchParams, value: string) => {
    params.delete('page')
    value.trim() ? 
      params.set('search', value.trim()) :
      params.delete('search')
  }

  const updateSearchParam = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    updateSearchInParams(params, value)
    router.push(`${pathname}?${params.toString()}`)
  }

  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      updateSearchInParams(params, value)
      router.push(`${pathname}?${params.toString()}`)
    }, 300),
    [pathname, router, searchParams]
  )

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  useEffect(() => {
    const searchParam = searchParams.get('search') || ''
    if (searchParam !== searchValue) {
      setSearchValue(searchParam)
    }
  }, [searchParams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)
    if (behavior === 'live') {
      debouncedSearch(value)
    }
  }

  const handleSearch = () => {
    debouncedSearch.cancel()
    updateSearchParam(searchValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <Space.Compact style={{ width: '100%' }}>
      <Input
        id='search-bar'
        size="large"
        placeholder={effectivePlaceholder}
        value={searchValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        allowClear
      />
      <Button 
        size="large"
        type="primary" 
        icon={<SearchOutlined />}
        onClick={handleSearch}
      />
    </Space.Compact>
  )
}

interface SearchBarProps {
  placeholder: string
  targetPathname?: string
  behavior?: 'live' | 'submit'
}

export function SearchBar({ placeholder, targetPathname, behavior = 'live' }: SearchBarProps) {
  return (
    <Suspense fallback={
      <Space.Compact style={{ width: '100%' }}>
        <Input size="large" placeholder={placeholder} disabled />
        <Button size="large" type="primary" icon={<SearchOutlined />} disabled />
      </Space.Compact>
    }>
      <SearchBarContent placeholder={placeholder} targetPathname={targetPathname} behavior={behavior} />
    </Suspense>
  )
}

