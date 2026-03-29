export const FACTION_COLORS = {
  'Necrones': '#39ff14',
  'Space Marines': '#facc15',
  'Astra Militarum': '#6b8e23',
  'Blood Angels': '#dc2626',
  'Chaos Space Marines': '#9d4edd',
}

export const FACTIONS = [
  'Necrones',
  'Space Marines',
  'Astra Militarum',
  'Blood Angels',
  'Chaos Space Marines',
  'Adeptus Custodes',
  'Adepta Sororitas',
  'Drukhari',
  'Eldar',
  'Orkos',
  'Tau',
  'Tiránidos',
  'Templarios Negros',
  'Death Guard',
  'World Eaters',
  'Thousand Sons',
]

/**
 * Computes standings from participations, matches and results.
 * Returns array sorted by Pts desc, PV desc.
 */
export function computeStandings(participaciones, enfrentamientos, resultados) {
  const stats = {}

  for (const p of participaciones) {
    const jugador = p.jugadores || { nombre: 'Desconocido', faccion: '' }
    stats[p.jugador_id] = {
      jugador,
      jugador_id: p.jugador_id,
      PJ: 0,
      PG: 0,
      PP: 0,
      PE: 0,
      PV: 0,
      Pts: 0,
    }
  }

  for (const enf of (enfrentamientos || [])) {
    const res = (resultados || []).find(r => r.enfrentamiento_id === enf.id)
    if (!res) continue

    const { pv1, pv2 } = res
    const s1 = stats[enf.jugador1_id]
    const s2 = stats[enf.jugador2_id]

    if (!s1 || !s2) continue

    s1.PJ++
    s2.PJ++
    s1.PV += pv1
    s2.PV += pv2

    if (pv1 > pv2) {
      s1.PG++
      s2.PP++
    } else if (pv2 > pv1) {
      s2.PG++
      s1.PP++
    } else {
      s1.PE++
      s2.PE++
    }
  }

  return Object.values(stats).sort((a, b) => {
    if (b.PG !== a.PG) return b.PG - a.PG
    if (b.PE !== a.PE) return b.PE - a.PE
    return b.PV - a.PV
  })
}

/**
 * Returns the "current round" — the first round with any pending result,
 * or the last round if all are complete.
 */
export function getCurrentRound(rondas, enfrentamientos, resultados) {
  if (!rondas || rondas.length === 0) return null

  for (const ronda of [...rondas].sort((a, b) => a.numero - b.numero)) {
    const rondasEnfs = enfrentamientos.filter(e => e.ronda_id === ronda.id)
    const allDone = rondasEnfs.length > 0 && rondasEnfs.every(e =>
      resultados.some(r => r.enfrentamiento_id === e.id)
    )
    if (!allDone) return ronda
  }

  return rondas[rondas.length - 1]
}
