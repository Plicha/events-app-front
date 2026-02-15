export async function getMessages(locale: string): Promise<Record<string, unknown>> {
  return (await import(`../../messages/${locale}.json`)).default
}
