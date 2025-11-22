import { getTranslations } from 'next-intl/server'
import { routing } from '@/lib/i18n/routing'

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
  const t = await getTranslations({ locale, namespace: 'contact' })

  return (
    <main>
      <h1>{t('title')}</h1>
      <p>Contact form will be here</p>
    </main>
  )
}

