import type { RichText, LocalizedText } from '@/types'

export function extractTextFromRichText(content: LocalizedText | RichText | undefined): string {
  if (!content) {
    return ''
  }

  if (typeof content === 'string') {
    return content
  }

  if ('pl' in content || 'en' in content) {
    const localized = content as { pl?: string; en?: string }
    return localized.pl || localized.en || ''
  }

  if ('root' in content) {
    const richText = content as RichText
    return extractTextFromRichTextNode(richText.root)
  }

  return ''
}

function extractTextFromRichTextNode(node: any): string {
  if (!node || typeof node !== 'object') {
    return ''
  }

  let text = ''

  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      if (child.text) {
        text += child.text
      } else if (child.children) {
        text += extractTextFromRichTextNode(child)
      }
    }
  }

  return text
}

export function truncateText(text: string, maxLength: number = 150): string {
  if (!text || text.length <= maxLength) {
    return text
  }

  return text.substring(0, maxLength).trim() + '...'
}

export function getLocalizedText(
  content: LocalizedText | undefined,
  locale: string
): string {
  if (!content) {
    return ''
  }

  if (typeof content === 'string') {
    return content
  }

  const localized = content as { pl?: string; en?: string }
  return locale === 'pl' ? localized.pl || localized.en || '' : localized.en || localized.pl || ''
}

