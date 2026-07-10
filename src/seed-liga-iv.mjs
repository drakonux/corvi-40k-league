/**
 * Corvi League — Alta de la IV Liga 40K (11th Edition)
 *
 * Script ADITIVO y de un solo uso. NO re-ejecutar seed.js (duplicaría todo).
 * Requisitos previos (ver plan):
 *   1. Proyecto Supabase restaurado (Restore desde el dashboard).
 *   2. DDL + backfill ya ejecutados en el SQL Editor:
 *        ALTER TABLE participaciones ADD COLUMN faccion text, ADD COLUMN faction_image text;
 *        UPDATE participaciones p SET faccion = j.faccion, faction_image = j.faction_image
 *          FROM jugadores j WHERE p.jugador_id = j.id AND p.faccion IS NULL;
 *      (El backfill DEBE correr ANTES que este script: aquí cambiamos el army
 *       global de David Guerra a Votann.)
 *
 * Ejecutar:  node src/seed-liga-iv.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ovurusroruzxylfkpzam.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92dXJ1c3JvcnV6eHlsZmtwemFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDcyNjM4NiwiZXhwIjoyMDkwMzAyMzg2fQ.Ivzj0pOQHGFBEqhbFmqjEdtQ2LoXUuDZHlKPmsjjkpI'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const LIGA_NOMBRE = 'IV Liga 40K - 11th Edition'

// ─── Datos de jugadores para ESTA liga (facción + imagen por liga) ──────────
// `nuevo: true` → se inserta en la tabla jugadores. Si no, se busca por nombre.
const PLAYERS = [
  { nombre: 'Michi',          faccion: 'Blood Angels',        img: 'blood-angels-michi.png',       nuevo: false },
  { nombre: 'Ruby',           faccion: 'Imperial Knights',    img: 'imperial-knights-ruby.png',    nuevo: true  },
  { nombre: 'David Aragonés', faccion: 'Space Marines',       img: 'space-marines.png',            nuevo: false },
  { nombre: 'Juan Inés',      faccion: 'Necrones',            img: 'necrons-juan-ines.png',        nuevo: false },
  { nombre: 'David Guerra',   faccion: 'Leagues of Votann',   img: 'votann-guerra.png',            nuevo: false }, // cambia de army
  { nombre: 'Fran',           faccion: "Emperor's Children",  img: 'emperors-children-fran.png',   nuevo: true  },
  { nombre: 'Danny M.',       faccion: 'Thousand Sons',       img: 'thousand-sons-danny.png',      nuevo: true  },
  { nombre: 'Erik',           faccion: 'Chaos Space Marines', img: 'chaos-space-marine-erik.png',  nuevo: false },
  { nombre: 'Jose María',     faccion: 'Tiránidos',           img: 'tiranidos-josemaria.png',      nuevo: true  },
  { nombre: 'David Grande',   faccion: 'Space Marines',       img: 'space-marines-grande.png',     nuevo: true  },
  { nombre: 'Eduardo',        faccion: 'Tiránidos',           img: 'tiranidos-eduardo.png',        nuevo: true  },
  { nombre: 'Jorge',          faccion: 'Tiránidos',           img: 'tiranidos-jorge.png',          nuevo: true  },
  { nombre: 'Jose Luis',      faccion: 'Necrones',            img: 'necrons-jose-luis.png',        nuevo: false },
  { nombre: 'Angel',          faccion: 'Imperial Knights',    img: 'imperial-knights-angel.png',   nuevo: true  },
]

// ─── Emparejamientos por ronda (nombres canónicos de DB) ────────────────────
const ROUNDS = [
  [ // Ronda 1
    ['Michi', 'Jorge'], ['Ruby', 'Eduardo'], ['David Aragonés', 'Jose María'],
    ['Juan Inés', 'Angel'], ['David Guerra', 'David Grande'], ['Fran', 'Jose Luis'],
    ['Danny M.', 'Erik'],
  ],
  [ // Ronda 2
    ['Michi', 'Erik'], ['Ruby', 'Danny M.'], ['David Aragonés', 'David Guerra'],
    ['Juan Inés', 'Fran'], ['Jose María', 'Jose Luis'], ['David Grande', 'Eduardo'],
    ['Jorge', 'Angel'],
  ],
  [ // Ronda 3
    ['Danny M.', 'Michi'], ['Erik', 'Ruby'], ['Eduardo', 'David Aragonés'],
    ['Juan Inés', 'Jorge'], ['David Guerra', 'Jose Luis'], ['Fran', 'Angel'],
    ['Jose María', 'David Grande'],
  ],
  [ // Ronda 4
    ['Eduardo', 'Michi'], ['Angel', 'David Aragonés'], ['Juan Inés', 'Jose María'],
    ['Erik', 'Jose Luis'], ['Jorge', 'Fran'], ['David Guerra', 'Danny M.'],
    ['David Grande', 'Ruby'],
  ],
]

function fail(msg) { console.error(`❌ ${msg}`); process.exit(1) }

async function main() {
  console.log(`🌱 Alta de "${LIGA_NOMBRE}"\n`)

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
  const { data: insertados, error: insErr } = await supabase
    .from('jugadores')
    .insert(nuevos.map(p => ({ nombre: p.nombre, faccion: p.faccion, faction_image: p.img })))
    .select('id, nombre')
  if (insErr) fail(`Insertando jugadores nuevos: ${insErr.message}`)
  for (const j of insertados) id[j.nombre] = j.id
  console.log(`✓ ${insertados.length} jugadores nuevos insertados`)

  // ─── David Guerra cambia de army: actualizar su perfil global ─────────────
  const guerra = PLAYERS.find(p => p.nombre === 'David Guerra')
  const { error: updErr } = await supabase
    .from('jugadores')
    .update({ faccion: guerra.faccion, faction_image: guerra.img })
    .eq('id', id['David Guerra'])
  if (updErr) fail(`Actualizando David Guerra: ${updErr.message}`)
  console.log(`✓ David Guerra → ${guerra.faccion}`)

  // ─── Finalizar ligas activas y crear la nueva ─────────────────────────────
  const { error: finErr } = await supabase
    .from('ligas').update({ estado: 'finalizada' }).eq('estado', 'activa')
  if (finErr) fail(`Finalizando ligas activas: ${finErr.message}`)

  const { data: ligaArr, error: ligaErr } = await supabase
    .from('ligas')
    .insert([{ nombre: LIGA_NOMBRE, temporada: '2026', fecha_inicio: '2026-07-01', estado: 'activa' }])
    .select()
  if (ligaErr) fail(`Creando liga: ${ligaErr.message}`)
  const ligaId = ligaArr[0].id
  console.log(`✓ Liga creada (id ${ligaId}) y ligas anteriores marcadas finalizadas`)

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

  // ─── Rondas (nueva edición: sin misión/despliegue/layout) ─────────────────
  const { data: rondas, error: rondasErr } = await supabase
    .from('rondas')
    .insert(ROUNDS.map((_, i) => ({ liga_id: ligaId, numero: i + 1 })))
    .select('id, numero')
  if (rondasErr) fail(`Insertando rondas: ${rondasErr.message}`)
  const rondaId = {}
  for (const r of rondas) rondaId[r.numero] = r.id
  console.log(`✓ ${rondas.length} rondas insertadas`)

  // ─── Enfrentamientos ──────────────────────────────────────────────────────
  const enfrentamientos = []
  ROUNDS.forEach((pairs, i) => {
    for (const [a, b] of pairs) {
      enfrentamientos.push({ ronda_id: rondaId[i + 1], jugador1_id: id[a], jugador2_id: id[b] })
    }
  })
  const { error: enfErr } = await supabase.from('enfrentamientos').insert(enfrentamientos)
  if (enfErr) fail(`Insertando enfrentamientos: ${enfErr.message}`)
  console.log(`✓ ${enfrentamientos.length} enfrentamientos insertados`)

  console.log(`\n✅ "${LIGA_NOMBRE}" creada correctamente (liga id ${ligaId}).`)
}

main().catch(err => { console.error('❌ Error inesperado:', err); process.exit(1) })
