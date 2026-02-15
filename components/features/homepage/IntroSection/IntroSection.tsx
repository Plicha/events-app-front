import styles from './IntroSection.module.scss'
import { getPathname } from '@/lib/i18n/routing'
import { SearchBar } from '@/components/features/events'

interface IntroSectionProps {
  headline: string
  locale: string
  searchPlaceholder: string
  subheadline?: string
}

export function IntroSection({
  headline,
  locale,
  searchPlaceholder,
  subheadline,
}: IntroSectionProps) {
  return (
    <section className={styles.introSection}>
      <div className={styles.animatedGradient} aria-hidden="true" />
      <div className={styles.overlay} aria-hidden="true" />

      <div className={styles.content}>
        <div className={styles.textBlock}>
          {headline && <h1 className={styles.headline}>{headline}</h1>}
          {subheadline && <p className={styles.subheadline}>{subheadline}</p>}
        </div>

        <div className={styles.searchWrapper}>
          <SearchBar
            placeholder={searchPlaceholder}
            targetPathname={getPathname({ locale, href: '/events' })}
            behavior="submit"
          />
        </div>
      </div>

      <div className={styles.bottomWave} aria-hidden="true">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className={styles.waveSvg}>
          <path
            d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"
            className={styles.wavePath}
          />
        </svg>
      </div>
    </section>
  )
}

