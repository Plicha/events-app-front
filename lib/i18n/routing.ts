import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['pl', 'en'],
  defaultLocale: 'pl',
  pathnames: {
    '/': '/',
    '/events': {
      pl: '/wydarzenia',
      en: '/events'
    },
    '/events/[slug]': {
      pl: '/wydarzenia/[slug]',
      en: '/events/[slug]'
    },
    '/about': {
      pl: '/o-nas',
      en: '/about'
    },
    '/contact': {
      pl: '/kontakt',
      en: '/contact'
    }
  }
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);

