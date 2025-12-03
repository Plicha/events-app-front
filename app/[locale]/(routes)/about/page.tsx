import { getTranslations } from 'next-intl/server'
import { routing } from '@/lib/i18n/routing'
import { Result, Button, Row } from 'antd'
import { ToolOutlined } from '@ant-design/icons'
import Link from 'next/link'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({
    locale
  }))
}

export default async function AboutPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const tAbout = await getTranslations({ locale, namespace: 'about' })
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const tEvents = await getTranslations({ locale, namespace: 'events' })

  return (
    <main className="default-padding-y">
      <div className="container">
        <h1>{tAbout('title')}</h1>
        <br />
        <Result
          icon={<ToolOutlined style={{ color: '#1890ff' }} />}
          title={tCommon('inDevelopment')}
          subTitle={tCommon('inDevelopmentDescription')}
          extra={
            <Row justify="center">
              <Link href={`/${locale}/events`}>
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

