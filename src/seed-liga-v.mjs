/**
 * Corvi League — Alta de la V Liga 40K (11th Edition)
 *
 * Script ADITIVO y de un solo uso. La IV Liga sigue abierta: NO se finaliza
 * ninguna liga, conviven las dos como activas.
 *
 * La clave service_role NO va en el código: se lee de .env.local
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *
 * Ejecutar:  node --env-file=.env.local src/seed-liga-v.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function fail(msg) { console.error(`❌ ${msg}`); process.exit(1) }

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) fail('Faltan VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en .env.local')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const LIGA_NOMBRE = 'V Liga 40K - 11th Edition'
const FECHA_INICIO = '2026-09-28'

// ─── Datos de jugadores para ESTA liga (facción + imagen por liga) ──────────
// `nuevo: true` → se inserta en la tabla jugadores. Si no, se busca por nombre.
const PLAYERS = [
  { nombre: 'Michi',          faccion: 'Blood Angels',      img: 'blood-angels-michi.png',     nuevo: false },
  { nombre: 'Jose María',     faccion: 'Tiránidos',         img: 'tiranidos-josemaria.png',    nuevo: false }, // "Chema" en el sheet
  { nombre: 'Luis Fernando',  faccion: 'Death Guard',       img: 'death-guard-luis-fernando.png', nuevo: true }, // "Luis" en el sheet
  { nombre: 'David Grande',   faccion: 'Space Marines',     img: 'space-marines-grande.png',   nuevo: false },
  { nombre: 'Emilio',         faccion: 'Dark Angels',       img: 'dark-angels-emilio.png',     nuevo: true  },
  { nombre: 'Danny M.',       faccion: 'Thousand Sons',     img: 'thousand-sons-danny.png',    nuevo: false },
  { nombre: 'Juan Inés',      faccion: 'Necrones',          img: 'necrons-juan-ines.png',      nuevo: false },
  { nombre: 'Angel',          faccion: 'Imperial Knights',  img: 'imperial-knights-angel.png', nuevo: false },
  { nombre: 'Alex',           faccion: 'Leagues of Votann', img: 'votann-guerra.png',          nuevo: true  },
  { nombre: 'Mariano',        faccion: 'Imperial Knights',  img: 'imperial-knights-ruby.png',  nuevo: true  },
  { nombre: 'David Diaz',     faccion: 'Aeldari',           img: 'aeldari-david-diaz.png',     nuevo: true  },
  { nombre: 'David Aragonés', faccion: 'Space Marines',     img: 'space-marines.png',          nuevo: false },
]

// ─── Rondas: misión prefijada + emparejamientos (nombres canónicos de DB) ───
const ROUNDS = [
  { mision: 'Albor de Guerra', pairs: [
    ['Michi', 'Jose María'], ['Luis Fernando', 'David Grande'], ['Emilio', 'Danny M.'],
    ['Juan Inés', 'Angel'], ['Alex', 'Mariano'], ['David Diaz', 'David Aragonés'],
  ] },
  { mision: 'Búsqueda y Destrucción', pairs: [
    ['Juan Inés', 'Michi'], ['Angel', 'Luis Fernando'], ['Mariano', 'Emilio'],
    ['David Grande', 'David Diaz'], ['David Aragonés', 'Danny M.'], ['Jose María', 'Alex'],
  ] },
  { mision: 'Choque Arrollador', pairs: [
    ['Michi', 'David Aragonés'], ['David Diaz', 'Luis Fernando'], ['Emilio', 'Alex'],
    ['Juan Inés', 'David Grande'], ['Danny M.', 'Mariano'], ['Angel', 'Jose María'],
  ] },
  { mision: 'Punto Crítico', pairs: [
    ['David Aragonés', 'Alex'], ['David Diaz', 'Juan Inés'], ['David Grande', 'Mariano'],
    ['Michi', 'Luis Fernando'], ['Jose María', 'Danny M.'], ['Angel', 'Emilio'],
  ] },
]

async function main() {
  console.log(`🌱 Alta de "${LIGA_NOMBRE}"\n`)

  // ─── Guards: datos completos y coherentes ─────────────────────────────────
  const nombres = new Set(PLAYERS.map(p => p.nombre))
  ROUNDS.forEach((r, i) => {
    const enRonda = r.pairs.flat()
    if (enRonda.length !== nombres.size || enRonda.some(n => !nombres.has(n)) || new Set(enRonda).size !== enRonda.length) {
      fail(`Ronda ${i + 1}: los emparejamientos no cubren a cada jugador exactamente una vez`)
    }
  })

  // ─── Guard: no duplicar la liga ───────────────────────────────────────────
  const { data: existing, error: exErr } = await supabase
    .from('ligas').select('id').eq('nombre', LIGA_NOMBRE)
  if (exErr) fail(`Consultando ligas: ${exErr.message}`)
  if (existing && existing.length > 0) fail(`La liga "${LIGA_NOMBRE}" ya existe (id ${existing[0].id}). Abortado para no duplicar.`)

  const id = {} // nombre → jugador_id

  // ─── Jugadores existentes: lookup por nombre ──────────────────────────────
  const existentes = PLAYERS.filter(p => !p.nuevo)
  const { data: encontrados, error: jErr } = await supabase
    .from('jugadores').select('id, nombre').in('nombre', existentes.map(p => p.nombre))
  if (jErr) fail(`Buscando jugadores existentes: ${jErr.message}`)
  for (const j of encontrados) id[j.nombre] = j.id
  const faltan = existentes.filter(p => !id[p.nombre]).map(p => p.nombre)
  if (faltan.length) fail(`No se encontraron en DB (revisa nombres): ${faltan.join(', ')}`)
  console.log(`✓ ${encontrados.length} jugadores existentes localizados`)

  // ─── Jugadores nuevos: insert ─────────────────────────────────────────────
  const nuevos = PLAYERS.filter(p => p.nuevo)
  const { data: yaEstan, error: dupErr } = await supabase
    .from('jugadores').select('nombre').in('nombre', nuevos.map(p => p.nombre))
  if (dupErr) fail(`Comprobando jugadores nuevos: ${dupErr.message}`)
  if (yaEstan.length) fail(`Marcados como nuevos pero ya existen: ${yaEstan.map(j => j.nombre).join(', ')}`)
  const { data: insertados, error: insErr } = await supabase
    .from('jugadores')
    .insert(nuevos.map(p => ({ nombre: p.nombre, faccion: p.faccion, faction_image: p.img })))
    .select('id, nombre')
  if (insErr) fail(`Insertando jugadores nuevos: ${insErr.message}`)
  for (const j of insertados) id[j.nombre] = j.id
  console.log(`✓ ${insertados.length} jugadores nuevos insertados`)

  // ─── Crear la liga (sin tocar las demás activas) ──────────────────────────
  const { data: ligaArr, error: ligaErr } = await supabase
    .from('ligas')
    .insert([{ nombre: LIGA_NOMBRE, temporada: '2026', fecha_inicio: FECHA_INICIO, estado: 'activa' }])
    .select()
  if (ligaErr) fail(`Creando liga: ${ligaErr.message}`)
  const ligaId = ligaArr[0].id
  console.log(`✓ Liga creada (id ${ligaId})`)

  // ─── Participaciones (facción + imagen por liga) ──────────────────────────
  const { error: partErr } = await supabase.from('participaciones').insert(
    PLAYERS.map(p => ({
      liga_id: ligaId,
      jugador_id: id[p.nombre],
      faccion: p.faccion,
      faction_image: p.img,
    }))
  )
  if (partErr) fail(`Insertando participaciones: ${partErr.message}`)
  console.log(`✓ ${PLAYERS.length} participaciones insertadas`)

  // ─── Rondas (misión prefijada) ────────────────────────────────────────────
  const { data: rondas, error: rondasErr } = await supabase
    .from('rondas')
    .insert(ROUNDS.map((r, i) => ({ liga_id: ligaId, numero: i + 1, mision: r.mision })))
    .select('id, numero')
  if (rondasErr) fail(`Insertando rondas: ${rondasErr.message}`)
  const rondaId = {}
  for (const r of rondas) rondaId[r.numero] = r.id
  console.log(`✓ ${rondas.length} rondas insertadas`)

  // ─── Enfrentamientos ──────────────────────────────────────────────────────
  const enfrentamientos = []
  ROUNDS.forEach((r, i) => {
    for (const [a, b] of r.pairs) {
      enfrentamientos.push({ ronda_id: rondaId[i + 1], jugador1_id: id[a], jugador2_id: id[b] })
    }
  })
  const { error: enfErr } = await supabase.from('enfrentamientos').insert(enfrentamientos)
  if (enfErr) fail(`Insertando enfrentamientos: ${enfErr.message}`)
  console.log(`✓ ${enfrentamientos.length} enfrentamientos insertados`)

  console.log(`\n✅ "${LIGA_NOMBRE}" creada correctamente (liga id ${ligaId}).`)
}

main().catch(err => { console.error('❌ Error inesperado:', err); process.exit(1) })
