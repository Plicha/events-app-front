import { ReactNode } from 'react'
import styles from './Breadcrumb.module.scss'
import { Link } from '@/lib/i18n/routing'

type LinkHref = React.ComponentProps<typeof Link>['href']

export interface BreadcrumbItem {
  title: ReactNode
  /** Use pathnames from routing: '/', '/events', '/about', '/contact', or { pathname: '/events/[slug]', params: { slug } } */
  href?: LinkHref | string | { pathname: string; params?: Record<string, string> }
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
                  href={item.href as LinkHref}
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

