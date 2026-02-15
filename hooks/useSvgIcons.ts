'use client'

import { useState, useEffect, useRef } from 'react'
import { sanitizeSvg } from '@/lib/utils/svgUtils'

const svgCache = new Map<string, string>()
const svgPending = new Map<string, Promise<string | null>>()

export function useSvgIcons(urls: string[]) {
  const [svgByUrl, setSvgByUrl] = useState<Record<string, string>>({})
  const [pendingSvg, setPendingSvg] = useState<Record<string, boolean>>({})
  const [failedSvg, setFailedSvg] = useState<Record<string, boolean>>({})
  const svgByUrlRef = useRef<Record<string, string>>({})
  const failedSvgRef = useRef<Record<string, boolean>>({})

  useEffect(() => {
    svgByUrlRef.current = svgByUrl
  }, [svgByUrl])

  useEffect(() => {
    failedSvgRef.current = failedSvg
  }, [failedSvg])

  useEffect(() => {
    if (urls.length === 0) return

    const ensureSvg = (iconUrl: string) => {
      if (svgCache.has(iconUrl)) {
        if (!svgByUrlRef.current[iconUrl]) {
          const svg = svgCache.get(iconUrl)!
          setSvgByUrl((prev) => {
            const merged = { ...prev, [iconUrl]: svg }
            svgByUrlRef.current = merged
            return merged
          })
        }
        return
      }

      if (svgPending.has(iconUrl)) {
        setPendingSvg((prev) => ({ ...prev, [iconUrl]: true }))
        svgPending.get(iconUrl)!.then((result) => {
          if (result) {
            setSvgByUrl((prev) => {
              const merged = { ...prev, [iconUrl]: result }
              svgByUrlRef.current = merged
              return merged
            })
          } else {
            setFailedSvg((prev) => ({ ...prev, [iconUrl]: true }))
          }
          setPendingSvg((prev) => {
            const next = { ...prev }
            delete next[iconUrl]
            return next
          })
        })
        return
      }

      if (failedSvgRef.current[iconUrl]) return

      setPendingSvg((prev) => ({ ...prev, [iconUrl]: true }))
      const promise = fetch(iconUrl)
        .then(async (res) => {
          if (!res.ok) return null
          const text = await res.text()
          const sanitized = sanitizeSvg(text)
          return sanitized
        })
        .then((result) => {
          if (result) {
            svgCache.set(iconUrl, result)
            setSvgByUrl((prev) => {
              const merged = { ...prev, [iconUrl]: result }
              svgByUrlRef.current = merged
              return merged
            })
          } else {
            setFailedSvg((prev) => ({ ...prev, [iconUrl]: true }))
          }
          return result
        })
        .finally(() => {
          svgPending.delete(iconUrl)
          setPendingSvg((prev) => {
            const next = { ...prev }
            delete next[iconUrl]
            return next
          })
        })

      svgPending.set(iconUrl, promise)
    }

    urls.forEach((url) => ensureSvg(url))
  }, [urls])

  return { svgByUrl, pendingSvg, failedSvg }
}
