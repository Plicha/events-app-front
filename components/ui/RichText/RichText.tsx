'use client'

import React from 'react'
import type { RichText as RichTextType, LocalizedText } from '@/types'

type RichTextProps = {
  content: LocalizedText | RichTextType | undefined
  locale?: string
  className?: string
}

function renderNode(node: any): React.ReactNode {
  if (!node || typeof node !== 'object') {
    return null
  }

  if (node.type === 'text' && node.text) {
    return node.text
  }

  if (node.type === 'paragraph') {
    const children = node.children
      ? node.children.map((child: any, index: number) => (
          <React.Fragment key={index}>{renderNode(child)}</React.Fragment>
        ))
      : null

    if (!children || children.length === 0) {
      return null
    }

    return <p>{children}</p>
  }

  if (node.type === 'heading') {
    const tag = node.tag || 'h2'
    const children = node.children
      ? node.children.map((child: any, index: number) => (
          <React.Fragment key={index}>{renderNode(child)}</React.Fragment>
        ))
      : null

    if (!children || children.length === 0) {
      return null
    }

    switch (tag) {
      case 'h1':
        return <h1>{children}</h1>
      case 'h2':
        return <h2>{children}</h2>
      case 'h3':
        return <h3>{children}</h3>
      case 'h4':
        return <h4>{children}</h4>
      case 'h5':
        return <h5>{children}</h5>
      case 'h6':
        return <h6>{children}</h6>
      default:
        return <h2>{children}</h2>
    }
  }

  if (node.type === 'list') {
    const listType = node.listType || 'bullet'
    const children = node.children
      ? node.children.map((child: any, index: number) => (
          <React.Fragment key={index}>{renderNode(child)}</React.Fragment>
        ))
      : null

    if (!children || children.length === 0) {
      return null
    }

    return listType === 'number' ? (
      <ol>{children}</ol>
    ) : (
      <ul>{children}</ul>
    )
  }

  if (node.type === 'listitem') {
    const children = node.children
      ? node.children.map((child: any, index: number) => (
          <React.Fragment key={index}>{renderNode(child)}</React.Fragment>
        ))
      : null

    if (!children || children.length === 0) {
      return null
    }

    return <li>{children}</li>
  }

  if (node.type === 'link') {
    const url = node.url || node.fields?.url || '#'
    const children = node.children
      ? node.children.map((child: any, index: number) => (
          <React.Fragment key={index}>{renderNode(child)}</React.Fragment>
        ))
      : null

    if (!children || children.length === 0) {
      return null
    }

    return (
      <a href={url} target={node.newTab ? '_blank' : undefined} rel={node.newTab ? 'noopener noreferrer' : undefined}>
        {children}
      </a>
    )
  }

  if (node.children && Array.isArray(node.children)) {
    return (
      <>
        {node.children.map((child: any, index: number) => (
          <React.Fragment key={index}>{renderNode(child)}</React.Fragment>
        ))}
      </>
    )
  }

  return null
}

function getLocalizedRichText(
  content: LocalizedText | RichTextType | undefined,
  locale: string = 'pl'
): RichTextType | null {
  if (!content) {
    return null
  }

  if (typeof content === 'object' && 'root' in content) {
    return content as RichTextType
  }

  if (typeof content === 'object' && ('pl' in content || 'en' in content)) {
    const localized = content as { pl?: RichTextType | string; en?: RichTextType | string }
    const selected = locale === 'pl' ? localized.pl : localized.en || localized.pl

    if (!selected) {
      return null
    }

    if (typeof selected === 'string') {
      return null
    }

    return selected as RichTextType
  }

  return null
}
export const RichText: React.FC<RichTextProps> = ({ content, locale = 'pl', className }) => {
  const richTextContent = getLocalizedRichText(content, locale)

  if (!richTextContent || !richTextContent.root) {
    return null
  }

  const rendered = renderNode(richTextContent.root)

  if (!rendered) {
    return null
  }

  return <div className={className}>{rendered}</div>
}
