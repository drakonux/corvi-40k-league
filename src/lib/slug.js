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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const isUuid = v => UUID_RE.test(v || '')
