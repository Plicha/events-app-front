# Frontend - Events List App

Frontend application for Events List App built with Next.js and Ant Design.

## 🚀 Quick Start

```bash
# Installation
npm install

# Development
npm run dev

# Build
npm run build

# Production
npm start
```

## 📋 Key Features

- **Next.js 16+** with **ISR** (Incremental Static Regeneration)
- **Ant Design** as UI library
- **Internationalization (i18n)**
  - Polish: `/pl/wydarzenia`, `/pl/o-nas`, `/pl/kontakt`
  - English: `/en/events`, `/en/about`, `/en/contact`
- **Proxy API** - local `/api/*` paths proxied to backend
- **Security**: Origin checking, CORS, Rate Limiting
- **Filtering**: Hybrid approach (client-side + server-side)

## 🔧 Environment Variables

Create a `.env` file in the frontend directory:

```env
# Backend API URL (used by server-side API proxy)
# The proxy at /api/* forwards requests to this backend URL
BACKEND_API_URL=http://localhost:3000/api

# Public API URL (used by server components for direct API calls)
# This should point to the frontend's proxy API, not the backend directly
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Redis URL for caching and rate limiting (optional)
# If not set, the app will use in-memory cache as fallback
# Format: redis://localhost:6379 or redis://user:password@host:port
REDIS_URL=redis://localhost:6379

# Allowed origins for CORS (comma-separated list)
# Used for origin checking in the API proxy
# In development, localhost origins are automatically allowed
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000

# Optional: County ID for filtering events to a specific county
# If set, the app will automatically filter events and cities to this county only
# This allows multiple frontend instances to serve different counties
# You can find the county ID in Payload CMS admin panel
NEXT_PUBLIC_COUNTY_ID=1
```

### Variable Descriptions

- **`BACKEND_API_URL`**: Internal URL used by the API proxy (`/app/api/[...path]/route.ts`) to forward requests to the Payload CMS backend. This should point to your backend server.

- **`NEXT_PUBLIC_API_URL`**: Public URL used by server components (like `EventsPage`) for direct API calls. Should point to your frontend's proxy API endpoint. The `NEXT_PUBLIC_` prefix makes it available in both server and client code.

- **`REDIS_URL`**: Optional Redis connection string for caching API responses and rate limiting. If not provided, the app falls back to in-memory cache (data lost on restart). Recommended for production.

- **`ALLOWED_ORIGINS`**: Comma-separated list of allowed origins for CORS. The API proxy checks requests against this list. In development mode, `localhost:3000` and `localhost:3001` are automatically allowed.

- **`NEXT_PUBLIC_COUNTY_ID`**: Optional county ID for multi-instance deployments. When set:
  - Events list automatically filters to cities in the specified county
  - City filter dropdown only shows cities from the specified county
  - Passed to backend via `x-county-id` header in API requests

### Production Notes

- **Redis**: Set `REDIS_URL` in production for persistent caching and proper rate limiting
- **CORS**: Update `ALLOWED_ORIGINS` with your production domain(s)
- **Multi-instance**: Use `NEXT_PUBLIC_COUNTY_ID` when deploying separate frontend instances for different counties

### Redis Cache

To clear the Redis cache manually:
```bash
redis-cli FLUSHDB
```