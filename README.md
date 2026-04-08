# Corvi 40K Leagues

App web para gestionar ligas de Warhammer 40K de la tienda **Corvi Juegos**.
Desplegada en → **https://drakonux.github.io/corvi-40k-league**

## Stack

- React 18 + Vite · React Router v6 · Tailwind CSS
- Supabase (PostgreSQL + GitHub OAuth)
- GitHub Pages (`gh-pages`)

## Imágenes de facción

Cada jugador puede tener una imagen de facción asociada que se muestra en los items de enfrentamiento con un efecto de degradado.

- Las imágenes se colocan en `public/factions/` (ej. `space-marines.png`)
- Se asignan por jugador mediante el campo `faction_image` en la tabla `jugadores` de Supabase:

```sql
ALTER TABLE jugadores ADD COLUMN faction_image TEXT;
UPDATE jugadores SET faction_image = 'space-marines.png' WHERE nombre = 'David Aragonés';
-- etc.
```

- Dos jugadores de la misma facción pueden tener imágenes distintas (el campo es por jugador, no por facción)

## Setup

Crea `.env.local` en la raíz con tus credenciales de Supabase:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_ADMIN_EMAIL=...
```

```bash
npm install
npm run dev      # desarrollo local → http://localhost:5173
npm run deploy   # build + publicar en gh-pages
```

## Estructura

```
src/
├── lib/           # Supabase client + algoritmo de clasificación
├── hooks/         # Auth context (GitHub OAuth)
├── pages/         # Home, LigaPage, JugadorPage, AdminPage
└── components/
    ├── layout/    # Header, Footer
    ├── liga/      # Clasificacion, Rondas, MiRonda
    └── admin/     # AdminLigas, AdminJugadores, AdminRondas, AdminResultados
```
