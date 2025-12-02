import { Row, Col } from 'antd'
import { getTranslations } from 'next-intl/server'
import { SearchBar } from './SearchBar'
import { DateRangeFilter } from './DateRangeFilter'
import { CityFilter } from './CityFilter'

interface EventFiltersProps {
  locale: string
}

export async function EventFilters({ locale }: EventFiltersProps) {
  const t = await getTranslations({ locale, namespace: 'events' })
  
  return (
    <Row gutter={16}>
      <Col xs={24} sm={24} md={6}>
        <SearchBar placeholder={t('searchPlaceholder')} />
      </Col>
      <Col xs={24} sm={24} md={6}>
        <DateRangeFilter locale={locale} />
      </Col>
      <Col xs={24} sm={24} md={6}>
        <CityFilter locale={locale} />
      </Col>
      <Col xs={24} sm={24} md={6}>
        Col 4
      </Col>
    </Row>
  )
}

