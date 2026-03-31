/**
 * Corvi League - Script de datos iniciales
 *
 * INSTRUCCIONES:
 * 1. Ve a Supabase > Settings > API y copia tu service_role key
 * 2. Reemplaza SUPABASE_SERVICE_ROLE_KEY con tu clave real
 * 3. Ejecuta: node src/seed.js
 *
 * IMPORTANTE: Usa la service_role key (no la anon key) para poder
 * insertar datos con RLS activado.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ovurusroruzxylfkpzam.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92dXJ1c3JvcnV6eHlsZmtwemFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDcyNjM4NiwiZXhwIjoyMDkwMzAyMzg2fQ.Ivzj0pOQHGFBEqhbFmqjEdtQ2LoXUuDZHlKPmsjjkpI'

if (SUPABASE_SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('❌ Reemplaza SUPABASE_SERVICE_ROLE_KEY con tu clave real de Supabase')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function seed() {
  console.log('🌱 Iniciando seed...\n')

  // ─── Jugadores ───────────────────────────────────────────────────
  console.log('Insertando jugadores...')
  const { data: jugadores, error: jugErr } = await supabase
    .from('jugadores')
    .insert([
      { nombre: 'Juan Inés',      faccion: 'Necrones' },
      { nombre: 'David Aragonés', faccion: 'Space Marines' },
      { nombre: 'David Guerra',   faccion: 'Astra Militarum' },
      { nombre: 'Michi',          faccion: 'Blood Angels' },
      { nombre: 'Erik',           faccion: 'Chaos Space Marines' },
      { nombre: 'Jose Luis',      faccion: 'Necrones' },
    ])
    .select()

  if (jugErr) { console.error('❌ Error jugadores:', jugErr.message); return }
  console.log(`✓ ${jugadores.length} jugadores insertados`)

  // Map nombre → id para referencias
  const j = {}
  for (const jug of jugadores) j[jug.nombre] = jug.id

  // ─── Liga ─────────────────────────────────────────────────────────
  console.log('\nInsertando liga...')
  const { data: ligaArr, error: ligaErr } = await supabase
    .from('ligas')
    .insert([{
      nombre:       'III Liga 40K - 10th Edition',
      temporada:    '2025',
      fecha_inicio: '2025-01-01',
      estado:       'activa',
    }])
    .select()

  if (ligaErr) { console.error('❌ Error liga:', ligaErr.message); return }
  const liga = ligaArr[0]
  console.log(`✓ Liga "${liga.nombre}" creada (id: ${liga.id})`)

  // ─── Participaciones ──────────────────────────────────────────────
  console.log('\nInsertando participaciones...')
  const { error: partErr } = await supabase
    .from('participaciones')
    .insert(Object.values(j).map(jugador_id => ({
      liga_id: liga.id,
      jugador_id,
    })))

  if (partErr) { console.error('❌ Error participaciones:', partErr.message); return }
  console.log('✓ 6 participaciones insertadas')

  // ─── Rondas ───────────────────────────────────────────────────────
  console.log('\nInsertando rondas...')
  const { data: rondas, error: rondasErr } = await supabase
    .from('rondas')
    .insert([
      { liga_id: liga.id, numero: 1, mision: 'Purgar el Enemigo',       mision_url: 'https://gdmissions.app/primary-missions/purge-the-foe',   despliegue: 'Crisol de Batalla',      despliegue_url: 'https://gdmissions.app/deployment-zones/crucible-of-battle',  layout: 'Layout 2', layout_url: 'https://gdmissions.app/layouts/gw/layout-2' },
      { liga_id: liga.id, numero: 2, mision: 'Primordial',              mision_url: 'https://gdmissions.app/primary-missions/linchpin',          despliegue: 'Búsqueda y Destrucción', despliegue_url: 'https://gdmissions.app/deployment-zones/search-and-destroy',  layout: 'Layout 6', layout_url: 'https://gdmissions.app/layouts/gw/layout-6' },
      { liga_id: liga.id, numero: 3, mision: 'Terraformar',             mision_url: 'https://gdmissions.app/primary-missions/terraform',         despliegue: 'Choque Arrollador',      despliegue_url: 'https://gdmissions.app/deployment-zones/sweeping-engagement', layout: 'Layout 5', layout_url: 'https://gdmissions.app/layouts/gw/layout-5' },
      { liga_id: liga.id, numero: 4, mision: 'Lanzamiento de Suministros', mision_url: 'https://gdmissions.app/primary-missions/supply-drop',   despliegue: 'Punto Crítico',          despliegue_url: 'https://gdmissions.app/deployment-zones/tipping-point',       layout: 'Layout 1', layout_url: 'https://gdmissions.app/layouts/gw/layout-1' },
      { liga_id: liga.id, numero: 5, mision: 'El Peso de la Confianza', mision_url: 'https://gdmissions.app/primary-missions/burden-of-trust',   despliegue: 'Albor de la Guerra',     despliegue_url: 'https://gdmissions.app/deployment-zones/dawn-of-war',         layout: 'Layout 4', layout_url: 'https://gdmissions.app/layouts/gw/layout-4' },
    ])
    .select()

  if (rondasErr) { console.error('❌ Error rondas:', rondasErr.message); return }
  console.log(`✓ ${rondas.length} rondas insertadas`)

  const r = {}
  for (const ronda of rondas) r[ronda.numero] = ronda.id

  // ─── Enfrentamientos ──────────────────────────────────────────────
  console.log('\nInsertando enfrentamientos...')
  const enfrentamientos = [
    // Ronda 1
    { ronda_id: r[1], jugador1_id: j['Juan Inés'],      jugador2_id: j['Erik'] },
    { ronda_id: r[1], jugador1_id: j['David Aragonés'], jugador2_id: j['Jose Luis'] },
    { ronda_id: r[1], jugador1_id: j['David Guerra'],   jugador2_id: j['Michi'] },
    // Ronda 2
    { ronda_id: r[2], jugador1_id: j['Juan Inés'],      jugador2_id: j['David Aragonés'] },
    { ronda_id: r[2], jugador1_id: j['David Guerra'],   jugador2_id: j['Erik'] },
    { ronda_id: r[2], jugador1_id: j['Michi'],          jugador2_id: j['Jose Luis'] },
    // Ronda 3
    { ronda_id: r[3], jugador1_id: j['Juan Inés'],      jugador2_id: j['Michi'] },
    { ronda_id: r[3], jugador1_id: j['David Aragonés'], jugador2_id: j['Erik'] },
    { ronda_id: r[3], jugador1_id: j['David Guerra'],   jugador2_id: j['Jose Luis'] },
    // Ronda 4
    { ronda_id: r[4], jugador1_id: j['Juan Inés'],      jugador2_id: j['Jose Luis'] },
    { ronda_id: r[4], jugador1_id: j['David Aragonés'], jugador2_id: j['David Guerra'] },
    { ronda_id: r[4], jugador1_id: j['Michi'],          jugador2_id: j['Erik'] },
    // Ronda 5
    { ronda_id: r[5], jugador1_id: j['Juan Inés'],      jugador2_id: j['David Guerra'] },
    { ronda_id: r[5], jugador1_id: j['Michi'],          jugador2_id: j['David Aragonés'] },
    { ronda_id: r[5], jugador1_id: j['Erik'],           jugador2_id: j['Jose Luis'] },
  ]

  const { error: enfErr } = await supabase.from('enfrentamientos').insert(enfrentamientos)
  if (enfErr) { console.error('❌ Error enfrentamientos:', enfErr.message); return }
  console.log(`✓ ${enfrentamientos.length} enfrentamientos insertados`)

  console.log('\n✅ Seed completado exitosamente')
  console.log(`\nLiga activa ID: ${liga.id}`)
  console.log('Visita la app para ver la clasificación y rondas.')
}

seed().catch(err => {
  console.error('❌ Error inesperado:', err)
  process.exit(1)
})
