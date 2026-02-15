export function sanitizeSvg(raw: string): string {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(raw, 'image/svg+xml')
    const svg = doc.documentElement

    svg.querySelectorAll('script, foreignObject').forEach((n) => n.remove())

    svg.querySelectorAll('*').forEach((el) => {
      Array.from(el.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase()
        const value = attr.value
        if (name.startsWith('on')) el.removeAttribute(attr.name)
        if ((name === 'href' || name === 'xlink:href' || name === 'src') && /^javascript:/i.test(value)) {
          el.removeAttribute(attr.name)
        }
      })
    })

    svg.setAttribute('width', '1em')
    svg.setAttribute('height', '1em')
    svg.setAttribute('focusable', 'false')
    svg.setAttribute('aria-hidden', 'true')

    return svg.outerHTML
  } catch {
    return ''
  }
}
