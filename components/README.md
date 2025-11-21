# Components

This directory contains all React components organized by their purpose.

## Structure

- `ui/` - Basic reusable UI components (Button, Card, etc.)
- `features/` - Feature-specific components (EventsList, ContactForm, etc.)
- `layout/` - Layout components (Header, Footer, Navigation)

## Guidelines

- Use Server Components by default
- Mark components with `'use client'` only when needed (interactivity, hooks, state)
- Keep components small and composable
- One component per file/folder

