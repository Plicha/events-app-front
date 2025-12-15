'use client'

import '@/lib/antd-patch'
import { useState, useMemo, useEffect, Suspense } from 'react'
import { Input, Space, Button } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import debounce from 'lodash.debounce'
import { useTranslations } from 'next-intl'

function SearchBarContent() {
  const t = useTranslations('events')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')

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
      const params = new URLSearchParams(window.location.search)
      updateSearchInParams(params, value)
      router.push(`${pathname}?${params.toString()}`)
    }, 300),
    [pathname, router]
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
    debouncedSearch(value)
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
        placeholder={t('searchPlaceholder')}
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
}

export function SearchBar({ placeholder }: SearchBarProps) {
  return (
    <Suspense fallback={
      <Space.Compact style={{ width: '100%' }}>
        <Input size="large" placeholder={placeholder} disabled />
        <Button size="large" type="primary" icon={<SearchOutlined />} disabled />
      </Space.Compact>
    }>
      <SearchBarContent />
    </Suspense>
  )
}

