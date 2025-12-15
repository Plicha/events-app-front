'use client'

import { Typography } from 'antd'
import styles from './EventsDateHeader.module.scss'

type Props = {
  children: React.ReactNode
}

export function EventsDateHeader({ children }: Props) {
  return (
    <Typography.Title level={4} className={styles.eventsGroupHeader}>
      {children}
    </Typography.Title>
  )
}

