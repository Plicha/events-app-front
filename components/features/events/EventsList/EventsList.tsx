import { Empty, Space } from 'antd'
import { getTranslations } from 'next-intl/server'
import type { Event } from '@/types'
import { EventCard } from '../EventCard/EventCard'

interface EventsListProps {
  events: Event[]
  locale: string
}

export async function EventsList({ events, locale }: EventsListProps) {
  const t = await getTranslations({ locale, namespace: 'events' })

  if (events.length === 0) {
    return <Empty description={t('noEvents')} />
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {events.map((event) => (
        <EventCard key={event.id} event={event} locale={locale} />
      ))}
    </Space>
  )
}

