'use client'

import { useEffect } from 'react'
import { Result, Button } from 'antd'
import { Link } from '@/lib/i18n/routing'

export default function EventsError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Events route error:', error)
  }, [error])

  return (
    <main className="default-padding-y">
      <div className="container">
        <Result
          status="error"
          title="Nie udało się załadować wydarzeń"
          subTitle="Wystąpił błąd podczas pobierania listy wydarzeń. Spróbuj ponownie."
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
