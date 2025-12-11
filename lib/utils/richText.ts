import type { RichText, LocalizedText } from '@/types'

export function extractTextFromRichText(
  content: LocalizedText | RichText | undefined,
  locale: string = 'pl'
): string {
  if (!content) {
    return ''
  }

  if (typeof content === 'string') {
    return content
  }

  if ('pl' in content || 'en' in content) {
    const localized = content as { pl?: RichText | string; en?: RichText | string }
    const selected = locale === 'pl' ? localized.pl : localized.en || localized.pl
    
    if (!selected) {
      return ''
    }

    if (typeof selected === 'string') {
      return selected
    }

    if ('root' in selected) {
      return extractTextFromRichTextNode(selected.root)
    }

    return ''
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

  const parts: string[] = []

  if (node.children && Array.isArray(node.children)) {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i]
      
      if (child.type === 'text' && child.text) {
        parts.push(child.text)
      }
      else if (child.type === 'paragraph') {
        const paragraphText = extractTextFromRichTextNode(child)
        if (paragraphText.trim()) {
          parts.push(paragraphText.trim())
        }
      }
      else if (child.type === 'heading') {
        const headingText = extractTextFromRichTextNode(child)
        if (headingText.trim()) {
          parts.push(headingText.trim())
        }
      }
      else if (child.type === 'list') {
        const listText = extractTextFromRichTextNode(child)
        if (listText.trim()) {
          parts.push(listText.trim())
        }
      }
      else if (child.type === 'listitem') {
        const itemText = extractTextFromRichTextNode(child)
        if (itemText.trim()) {
          parts.push(itemText.trim())
        }
      }
      else if (child.type === 'link') {
        const linkText = extractTextFromRichTextNode(child)
        if (linkText.trim()) {
          parts.push(linkText.trim())
        }
      }
      else if (child.children) {
        const childText = extractTextFromRichTextNode(child)
        if (childText.trim()) {
          parts.push(childText.trim())
        }
      }
    }
  }

  return parts
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
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

