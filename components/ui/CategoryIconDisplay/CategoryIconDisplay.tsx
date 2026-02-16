'use client'

import { LoadingOutlined } from '@ant-design/icons'
import styles from './CategoryIconDisplay.module.scss'

interface CategoryIconDisplayProps {
  iconUrl: string | null
  isSvg: boolean
  svgByUrl: Record<string, string>
  pendingSvg: Record<string, boolean>
  failedSvg: Record<string, boolean>
  className?: string
  size?: number
}

export function CategoryIconDisplay({
  iconUrl,
  isSvg,
  svgByUrl,
  pendingSvg,
  failedSvg,
  className,
  size = 16,
}: CategoryIconDisplayProps) {
  if (!iconUrl) return null

  const sizeStyle = { width: size, height: size } as React.CSSProperties

  if (isSvg) {
    if (svgByUrl[iconUrl]) {
      return (
        <span
          className={`${styles.iconWrap} ${className ?? ''}`.trim()}
          style={sizeStyle}
          dangerouslySetInnerHTML={{ __html: svgByUrl[iconUrl] }}
        />
      )
    }
    if (pendingSvg[iconUrl]) {
      return (
        <LoadingOutlined
          className={`${styles.iconSpin} ${className ?? ''}`.trim()}
          style={sizeStyle}
        />
      )
    }
    if (failedSvg[iconUrl]) {
      return (
        <img
          src={iconUrl}
          alt=""
          className={`${styles.iconImg} ${className ?? ''}`.trim()}
          style={sizeStyle}
        />
      )
    }
    return null
  }

  return (
    <img
      src={iconUrl}
      alt=""
      className={`${styles.iconImg} ${className ?? ''}`.trim()}
      style={sizeStyle}
    />
  )
}
