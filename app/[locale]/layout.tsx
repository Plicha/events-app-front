import '@/lib/antd-patch'
import { NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider } from 'antd'
import { notFound } from 'next/navigation'
import { routing } from '@/lib/i18n/routing'
import { getMessages } from '@/lib/i18n/messages'
import { Header } from '@/components/layout'
import plPL from 'antd/locale/pl_PL'
import enUS from 'antd/locale/en_US'
import '@/styles/globals.scss'
import '@/styles/antd-overrides.scss'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  setRequestLocale(locale)
  const messages = await getMessages(locale)

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <AntdRegistry>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <ConfigProvider
              locale={locale === 'pl' ? plPL : enUS}
              theme={{
                token: {
                  borderRadius: 16,
                  colorPrimary: '#262626',
                },
                components: {
                  Input: {
                    borderRadius: 16,
                  },
                  Select: {
                    borderRadius: 16,
                  },
                  DatePicker: {
                    borderRadius: 16,
                  },
                  Card: {
                    borderRadius: 8,
                  },
                  Badge: {
                    borderRadius: 16,
                  },
                },
              }}
            >
              <Header locale={locale} />
              {children}
            </ConfigProvider>
          </NextIntlClientProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}

