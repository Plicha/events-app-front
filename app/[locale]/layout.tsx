import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider } from 'antd'
import { notFound } from 'next/navigation'
import { routing } from '@/lib/i18n/routing'
import { Header } from '@/components/layout/Header/Header'
import '../globals.css'

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

  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <AntdRegistry>
          <NextIntlClientProvider messages={messages}>
            <ConfigProvider>
              <Header locale={locale} />
              {children}
            </ConfigProvider>
          </NextIntlClientProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}

