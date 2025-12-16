'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Input, Button, Card, Space } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import styles from './IntroSection.module.scss'

interface IntroSectionProps {
  headline: string
  backgroundImageUrl: string | null
  backgroundImageAlt: string
  locale: string
}

export function IntroSection({
  headline,
  backgroundImageUrl,
  backgroundImageAlt,
  locale,
}: IntroSectionProps) {
  const router = useRouter()
  const t = useTranslations('events')
  const [searchValue, setSearchValue] = useState('')

  const handleSearch = (e?: FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLInputElement>) => {
    if (e) {
      e.preventDefault()
    }
    if (searchValue.trim()) {
      router.push(`/${locale}/events?search=${encodeURIComponent(searchValue.trim())}`)
    } else {
      router.push(`/${locale}/events`)
    }
  }

  return (
    <section className={styles.introSection}>
        {backgroundImageUrl && (
            <img
              src={backgroundImageUrl}
              alt={backgroundImageAlt}
              className={styles.backgroundImage}
            />
          )}
          <div className={styles.content}>
            {headline && <h1 className={styles.headline}>{headline}</h1>}
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <Space.Compact style={{ width: '100%', maxWidth: '400px' }}>
                <Input
                  size="large"
                  placeholder={t('searchPlaceholder')}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch(e)
                    }
                  }}
                  allowClear
                />
                <Button
                  size="large"
                  type="primary"
                  htmlType="submit"
                  icon={<SearchOutlined />}
                />
              </Space.Compact>
            </form>
          </div>
    </section>
  )
}

