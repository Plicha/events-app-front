# App Directory

Next.js App Router directory structure.

## Structure

- `(routes)/` - Route groups (don't affect URL)
  - `events/` - Events pages
  - `about/` - Static pages
  - `contact/` - Contact page
- `api/` - API Routes (proxy endpoints)
- `layout.tsx` - Root layout
- `globals.css` - Global styles

## Guidelines

- Use Server Components by default
- Add `loading.tsx` for loading states
- Add `error.tsx` for error boundaries
- Use route groups `(routes)` for organization

