import { getTranslations } from 'next-intl/server'
import { routing } from '@/lib/i18n/routing'
import { InDevelopmentPage } from '@/components/features/placeholder'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({
    locale
  }))
}

export default async function ContactPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const tContact = await getTranslations({ locale, namespace: 'contact' })

  return <InDevelopmentPage title={tContact('title')} locale={locale} />
}

