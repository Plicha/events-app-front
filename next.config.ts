import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import path from 'path'

const withNextIntl = createNextIntlPlugin('./lib/i18n/config.ts')

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['antd'],
  },
  sassOptions: {
    additionalData: `@use "${path.resolve(process.cwd(), 'styles/variables.scss')}" as *;`,
  },
}

export default withNextIntl(nextConfig)

