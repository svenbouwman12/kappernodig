# Kapper Nodig

Moderne React app (Vite + TailwindCSS) met Supabase backend.

## Vereisten
- Node.js 18+

## Installatie
- `npm install`

## Env
Maak `.env` op basis van `.env.example`:
- `VITE_SUPABASE_URL=...`
- `VITE_SUPABASE_ANON_KEY=...`
 - `SUPABASE_SERVICE_ROLE_KEY=...` (alleen lokaal/script)
 - `OPENCAGE_API_KEY=...` (geocode)

## Ontwikkelen
- `npm run dev`

## Build
- `npm run build && npm run preview`

## Geocode script
- Vul adressen in `barbers.address`
- Zet env (zie boven)
- Run: `npm run geocode`

## Structuur
- `src/components` UI componenten
- `src/pages` pagina's en routing
- `src/context` auth-context
- `src/hooks` data hooks (Supabase + fallback dummy data)

## Supabase tabellen
- `barbers(id, name, description, location, price_range, image_url, created_at)`
- `services(id, barber_id, name, price)`
- `users(id, email, favorites)` – login via Supabase Auth
