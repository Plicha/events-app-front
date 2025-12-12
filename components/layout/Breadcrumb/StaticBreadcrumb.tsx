import { ReactNode } from 'react'
import styles from './Breadcrumb.module.scss'
import { Link } from '@/lib/i18n/routing'

export interface BreadcrumbItem {
  title: ReactNode
  href?: string | { pathname: string }
  icon?: ReactNode
}

interface StaticBreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function StaticBreadcrumb({ items, className }: StaticBreadcrumbProps) {
  if (!items.length) return null

  return (
    <nav className={`${styles.breadcrumb} ${className || ''}`} aria-label="Breadcrumb">
      <ol className={styles.breadcrumbList}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const content = (
            <>
              {item.icon && <span className={styles.icon}>{item.icon}</span>}
              <span>{item.title}</span>
            </>
          )

          return (
            <li key={index} className={styles.breadcrumbItem}>
              {isLast || !item.href ? (
                <span className={styles.breadcrumbCurrent}>{content}</span>
              ) : (
                <Link 
                  href={typeof item.href === 'string' ? item.href as any : item.href} 
                  className={styles.breadcrumbLink}
                >
                  {content}
                </Link>
              )}
              {!isLast && <span className={styles.separator}>/</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

