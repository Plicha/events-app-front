'use client'

import { useState, useEffect } from 'react'
import { Menu, Button, Dropdown, Popover } from 'antd'
import type { MenuProps } from 'antd'
import { Link, usePathname, useRouter } from '@/lib/i18n/routing'
import { useLocale, useTranslations } from 'next-intl'
import { MenuOutlined, GlobalOutlined } from '@ant-design/icons'
import styles from './Header.module.css'

export function Header() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const menuItems: MenuProps['items'] = [
    {
      key: '/events',
      label: (
        <Link href="/events">
          {t('events')}
        </Link>
      ),
    },
    {
      key: '/about',
      label: (
        <Link href="/about">
          {t('about')}
        </Link>
      ),
    },
    {
      key: '/contact',
      label: (
        <Link href="/contact">
          {t('contact')}
        </Link>
      ),
    },
  ]

  const getSelectedKey = () => {
    if (pathname.startsWith('/wydarzenia') || pathname.startsWith('/events')) return '/events'
    if (pathname.startsWith('/o-nas') || pathname.startsWith('/about')) return '/about'
    if (pathname.startsWith('/kontakt') || pathname.startsWith('/contact')) return '/contact'
    return null
  }

  const getCanonicalPath = (localizedPath: string): '/' | '/events' | '/about' | '/contact' => {
    if (localizedPath.startsWith('/wydarzenia') || localizedPath.startsWith('/events')) return '/events'
    if (localizedPath.startsWith('/o-nas') || localizedPath.startsWith('/about')) return '/about'
    if (localizedPath.startsWith('/kontakt') || localizedPath.startsWith('/contact')) return '/contact'
    return '/'
  }

  const handleLocaleChange = (newLocale: string) => {
    const canonicalPath = getCanonicalPath(pathname)
    router.replace(canonicalPath, { locale: newLocale })
  }

  const localeMenuItems: MenuProps['items'] = [
    {
      key: 'pl',
      label: 'Polski',
      onClick: () => handleLocaleChange('pl'),
    },
    {
      key: 'en',
      label: 'English',
      onClick: () => handleLocaleChange('en'),
    },
  ]

  const mobileMenuContent = (
    <Menu
      mode="vertical"
      selectedKeys={getSelectedKey() ? [getSelectedKey()!] : []}
      items={menuItems}
      style={{ border: 'none', minWidth: 200 }}
    />
  )

  return (
    <header className={styles.header}>
      <nav className={styles.container}>
        <Link href="/" className={styles.logo}>
          Events List
        </Link>

        <div className={styles.navContainer}>
          {!isMobile && (
            <Menu
              mode="horizontal"
              selectedKeys={getSelectedKey() ? [getSelectedKey()!] : []}
              items={menuItems}
              style={{ border: 'none' }}
            />
          )}

          {/*<Dropdown menu={{ items: localeMenuItems }} placement="bottomRight">
            <Button 
              type="text" 
              icon={<GlobalOutlined />}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              {locale.toUpperCase()}
            </Button>
          </Dropdown>*/}

          {isMobile && (
            <Popover
              content={mobileMenuContent}
              trigger="click"
              placement="bottomRight"
            >
              <Button
                type="text"
                icon={<MenuOutlined />}
              />
            </Popover>
          )}
        </div>
      </nav>
    </header>
  )
}

