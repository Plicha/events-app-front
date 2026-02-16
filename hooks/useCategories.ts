'use client'

import { useState, useEffect } from 'react'
import type { Category } from '@/types'

export function useCategories(locale: string) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/public/categories', {
          headers: { 'x-locale': locale },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch categories')
        }

        const data = await response.json()
        setCategories(data.docs || [])
      } catch (err) {
        console.error('Error fetching categories:', err)
        setError(err instanceof Error ? err : new Error('Unknown error'))
        setCategories([])
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [locale])

  return { categories, loading, error }
}
