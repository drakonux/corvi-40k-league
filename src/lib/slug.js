// URLs amigables: /liga/iv-liga-40k-11th-edition, /jugador/michi.
// El slug se deriva del nombre (sin tocar la BBDD). El UUID sigue funcionando
// como respaldo, así que ningún enlace antiguo se rompe.

export function slugify(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // quita acentos
    .replace(/[^a-z0-9]+/g, '-')                       // no alfanumérico → guion
    .replace(/^-+|-+$/g, '')                           // sin guiones sobrantes
}

// liga?.slug permite migrar a una columna `slug` en el futuro sin cambiar esto.
export const ligaSlug = liga => liga?.slug || slugify(liga?.nombre)
export const jugadorSlug = jugador => slugify(jugador?.nombre)

// Slug único frente a homónimos: si dos jugadores tienen el MISMO nombre
// completo (p. ej. dos "David García"), a ambos se les añade un sufijo corto y
// estable derivado de su id, de modo que cada perfil conserve una URL propia.
// Si el nombre no se repite, devuelve el slug limpio de siempre (sin cambios).
// Generador y resolutor deben llamar a esta función con la MISMA lista global
// de jugadores para que los slugs coincidan.
export function jugadorSlugIn(jugador, jugadores) {
  const base = slugify(jugador?.nombre)
  const homonimos = (jugadores || []).filter(j => slugify(j?.nombre) === base)
  if (homonimos.length <= 1) return base
  return `${base}-${String(jugador?.id || '').slice(0, 4)}`
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const isUuid = v => UUID_RE.test(v || '')
