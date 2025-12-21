# Copilot Instructions for Farmers Direct

## Project Overview

Next.js 15.4 application connecting farmers with buyers. Uses MongoDB for data persistence, Next.js App Router with TypeScript, and inline CSS styling. Academic project (MCA Sem3) focusing on farmer registration and product listing/search.

## Architecture

### Database Layer

- **MongoDB Native Driver** (not Mongoose, despite dependency): See [src/app/db/mongodb.ts](../src/app/db/mongodb.ts)
  - Uses singleton pattern with global caching in dev (`global._mongoClientPromise`)
  - Always await `clientPromise` then call `.db()` for database access
  - No database name in code; uses URI default
  - Collections: `farmers`, `products`, `productDetails`

### API Routes Pattern

All APIs follow App Router conventions in `src/app/api/`:

- **Consistent error handling**: All endpoints return `{ success: boolean, message?: string, data?: any }`
- **Timestamps**: Add `createdAt` and `updatedAt` when creating records ([farmers/route.ts](../src/app/api/farmers/route.ts#L14-L17))
- **Dynamic routes**: Use async params - `const { productId } = await params;` ([product/[productId]/route.ts](../src/app/api/product/[productId]/route.ts#L4))
- Import from `@/app/db/mongodb` (not `@/db/mongodb`)

### Data Model

Products use **dual identifier pattern**:

- `productId`: String identifier for API/UI ("1", "2", etc.) - PRIMARY for queries
- `_id`: MongoDB ObjectId (internal only)
- When fetching by product: Query `productDetails` collection with `{ productId }` filter

See [\_JSON_product-details.ts](../src/app/api/product/_JSON_product-details.ts) for complete farmer data schema including nested fields like `availability`, `mapLocation`, and farmer-specific product details.

## UI/Component Patterns

### Styling Convention

**All components use inline styles** - no CSS modules, no external stylesheets (except [globals.css](../src/app/globals.css)):

- Green theme: `#388e3c` (primary), `#e8f5e9` (light bg), `#c8e6c9` (borders)
- Inline style objects with camelCase properties
- Responsive handled via state, not media queries

### Client Components

All interactive pages/components use `"use client"` directive:

- [page.tsx](../src/app/page.tsx): Main product search with router navigation
- [register-farmer/page.tsx](../src/app/register-farmer/page.tsx): Complex form with Leaflet map integration
- [FarmerFilter.tsx](../src/app/components/FarmerFilter.tsx): Advanced filtering with sticky behavior
- [ProductSelector.tsx](../src/app/components/ProductSelector.tsx): Multi-select with modal-based detailed entry

### Shared Components

- **ProductSelector**: Manages product selection with per-product details (cultivation area, yield, price, photos/videos)
  - Uses modal workflow: select product → open modal → fill details → confirm
  - Maintains details cache to preserve data when deselecting
- **FarmerFilter**: 13 filter types including district/state, price ranges, certifications
  - Sticky scroll behavior with compact/expanded states
  - "Show only selected" toggle when filters active
- **Snackbar**: Simple notification component (timeout-based)

### Leaflet Map Integration

[register-farmer/page.tsx](../src/app/register-farmer/page.tsx) uses CDN-loaded Leaflet (loaded via useEffect):

```tsx
window.L.map('mapDiv').setView([lat, lng], zoom);
window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(
  map
);
window.L.marker([lat, lng]).addTo(map);
```

Access via `window.L` after script loads, with TypeScript declarations for interfaces.

## Development Workflow

### Commands

- **Dev**: `pnpm dev --turbopack` (Turbopack enabled by default)
- **Build**: `pnpm build`
- **Lint**: `pnpm lint`

### Environment Setup

Create `.env.local` with:

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
```

Connection validated on startup; check terminal for "MongoDB connected" logs.

### Path Aliases

Use `@/` for `src/` directory imports:

- `import clientPromise from '@/app/db/mongodb'`
- `import ProductSelector from '@/app/components/ProductSelector'`

## Key Implementation Notes

1. **No Mongoose schemas**: Use plain objects matching MongoDB documents
2. **Product IDs are strings**: `productId: "1"`, not numbers
3. **Form state**: Complex forms (farmer registration) use single state object with nested structures
4. **Navigation**: `useRouter` from `next/navigation` with `.push()` for client-side routing
5. **Image/Video URLs**: Stored as string arrays, managed via input fields + add/remove buttons
6. **Collection names**: Always lowercase (`farmers`, `products`, `productDetails`)

## Testing Data

See [\_JSON_product-details.ts](../src/app/api/product/_JSON_product-details.ts) for example document structure showing:

- Nested farmer arrays within products
- Location data format (lat/lng objects)
- Availability patterns (boolean + expected date)
- Complete field naming conventions
