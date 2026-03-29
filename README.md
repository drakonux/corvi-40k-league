# Corvi 40K Leagues

App web para gestionar ligas de Warhammer 40K de la tienda **Corvi Juegos**.
Desplegada en → **https://drakonux.github.io/corvi-40k-league**

## Stack

- React 18 + Vite · React Router v6 · Tailwind CSS
- Supabase (PostgreSQL + GitHub OAuth)
- GitHub Pages (`gh-pages`)

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
