import { Empty, Space } from 'antd'
import { getTranslations } from 'next-intl/server'
import type { Event } from '@/types'
import { EventCard } from '../EventCard/EventCard'
import { EventsDateHeader } from './EventsDateHeader'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import 'dayjs/locale/pl'
import 'dayjs/locale/en'
import styles from './EventsList.module.scss'

dayjs.extend(utc)
dayjs.extend(timezone)

interface EventsListProps {
  events: Event[]
  locale: string
}

type TFunction = Awaited<ReturnType<typeof getTranslations>>

function groupEventsByDate(events: Event[], locale: string): Map<string, Event[]> {
  const groups = new Map<string, Event[]>()
  const normalizedLocale = locale === 'pl' ? 'pl' : 'en'

  for (const event of events) {
    const dateKey = dayjs
      .utc(event.startsAt)
      .tz('Europe/Warsaw')
      .locale(normalizedLocale)
      .format('YYYY-MM-DD')

    const dayEvents = groups.get(dateKey)
    if (dayEvents) {
      dayEvents.push(event)
    } else {
      groups.set(dateKey, [event])
    }
  }

  return groups
}

function formatDateHeader(dateKey: string, locale: string, t: TFunction): string {
  const normalizedLocale = locale === 'pl' ? 'pl' : 'en'
  const date = dayjs(dateKey).tz('Europe/Warsaw').locale(normalizedLocale)
  const today = dayjs().tz('Europe/Warsaw').locale(normalizedLocale)
  const tomorrow = today.add(1, 'day')

  if (date.isSame(today, 'day')) {
    return t('dateRangePresets.today')
  }

  if (date.isSame(tomorrow, 'day')) {
    return t('dateRangePresets.tomorrow')
  }

  if (locale === 'pl') {
    return date.format('dddd, D MMMM YYYY')
  }

  return date.format('dddd, MMMM D, YYYY')
}

export async function EventsList({ events, locale }: EventsListProps) {
  const t = await getTranslations({ locale, namespace: 'events' })

  if (events.length === 0) {
    return <Empty description={t('noEvents')} />
  }

  const groupedEvents = groupEventsByDate(events, locale)
  const sortedDateKeys = Array.from(groupedEvents.keys()).sort()

  return (
    <Space direction="vertical" size="large" className={styles.container}>
      {sortedDateKeys.map((dateKey, idx) => {
        const dayEvents = groupedEvents.get(dateKey)!
        const dateHeader = formatDateHeader(dateKey, locale, t)

        return (
          <div key={dateKey} className={styles.dateGroup}>
            <EventsDateHeader>
              {dateHeader}
            </EventsDateHeader>
            <Space direction="vertical" size="large" className={styles.eventsSpace}>
              {dayEvents.map((event) => (
                <EventCard key={event.id} event={event} locale={locale} />
              ))}
            </Space>
          </div>
        )
      })}
    </Space>
  )
}


