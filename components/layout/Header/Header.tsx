import '@/lib/antd-patch'
import { getTranslations } from 'next-intl/server'
import { Menu } from 'antd'
import type { MenuProps } from 'antd'
import { Link } from '@/lib/i18n/routing'
import { MobileMenuButton } from './MobileMenuButton'
import styles from './Header.module.scss'

interface HeaderProps {
  locale: string
}

export async function Header({ locale }: HeaderProps) {
  const t = await getTranslations({ locale, namespace: 'nav' })

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

  const selectedKey: string | null = null

  return (
    <header className={styles.header}>
      <nav className={styles.container}>
        <Link href="/" className={styles.logo}>
          Events List
        </Link>

        <div className={styles.navContainer}>
          <Menu
            mode="horizontal"
            selectedKeys={selectedKey ? [selectedKey] : []}
            items={menuItems}
            className={styles.desktopMenu}
            style={{ border: 'none' }}
          />

          <div className={styles.mobileMenuButton}>
            <MobileMenuButton menuItems={menuItems} selectedKey={selectedKey} />
          </div>
        </div>
      </nav>
    </header>
  )
}

