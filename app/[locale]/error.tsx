'use client'

import { useEffect } from 'react'
import { Result, Button } from 'antd'
import { Link } from '@/lib/i18n/routing'

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Route error:', error)
  }, [error])

  return (
    <main className="default-padding-y">
      <div className="container">
        <Result
          status="error"
          title="Coś poszło nie tak"
          subTitle="Wystąpił nieoczekiwany błąd. Spróbuj ponownie lub wróć na stronę główną."
          extra={[
            <Button key="retry" type="primary" onClick={reset}>
              Spróbuj ponownie
            </Button>,
            <Link key="home" href="/">
              <Button>Strona główna</Button>
            </Link>
          ]}
        />
      </div>
    </main>
  )
}
