import { getRequestConfig, getLocale } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async () => {
  let locale: string;
  
  try {
    locale = await getLocale();
  } catch (error) {
    locale = routing.defaultLocale;
  }

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});

