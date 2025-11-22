import { getTranslations } from 'next-intl/server'
import { routing } from '@/lib/i18n/routing'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({
    locale
  }))
}

export default async function EventDetailsPage({
  params
}: {
  params: Promise<{ slug: string; locale: string }>
}) {
  const { slug, locale } = await params
  const t = await getTranslations({ locale, namespace: 'events' })

  return (
    <main>
      <h1>{t('details')}</h1>
      <p>Event slug: {slug}</p>
    </main>
  )
}

