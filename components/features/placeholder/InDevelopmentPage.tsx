import { getTranslations } from 'next-intl/server'
import { Result, Button, Row } from 'antd'
import { ToolOutlined } from '@ant-design/icons'
import { Link } from '@/lib/i18n/routing'

interface InDevelopmentPageProps {
  title: string
  locale: string
}

export async function InDevelopmentPage({ title, locale }: InDevelopmentPageProps) {
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const tEvents = await getTranslations({ locale, namespace: 'events' })

  return (
    <main className="default-padding-y">
      <div className="container">
        <h1>{title}</h1>
        <br />
        <Result
          icon={<ToolOutlined style={{ color: '#1890ff' }} />}
          title={tCommon('inDevelopment')}
          subTitle={tCommon('inDevelopmentDescription')}
          extra={
            <Row justify="center">
              <Link href="/events">
                <Button type="primary" size="large">
                  {tEvents('viewAllEvents')}
                </Button>
              </Link>
            </Row>
          }
        />
      </div>
    </main>
  )
}
