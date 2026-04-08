import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { FACTION_COLORS, computeStandings } from '../lib/standings'

export default function JugadorPage() {
  const { id } = useParams()
  const [jugador, setJugador] = useState(null)
  const [ligas, setLigas] = useState([])
  const [globalStats, setGlobalStats] = useState({ PJ: 0, PG: 0, PP: 0, PE: 0, PV: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: jugadorData, error: jugErr } = await supabase
        .from('jugadores')
        .select('*')
        .eq('id', id)
        .single()

      if (jugErr || !jugadorData) {
        setError('Jugador no encontrado')
        setLoading(false)
        return
      }
      setJugador(jugadorData)

      // Get ligas the player participated in
      const { data: parts } = await supabase
        .from('participaciones')
        .select('liga_id, ligas(*)')
        .eq('jugador_id', id)

      if (!parts || parts.length === 0) {
        setLigas([])
        setLoading(false)
        return
      }

      // For each liga, compute standings and find player's stats
      const ligaStats = []
      let totals = { PJ: 0, PG: 0, PP: 0, PE: 0, PV: 0 }

      for (const p of parts) {
        const liga = p.ligas
        if (!liga) continue

        // Load data for this liga
        const { data: allParts } = await supabase
          .from('participaciones')
          .select('jugador_id, jugadores(nombre, faccion)')
          .eq('liga_id', liga.id)

        const { data: rondas } = await supabase
          .from('rondas')
          .select('id')
          .eq('liga_id', liga.id)

        let standings = []
        if (rondas && rondas.length > 0) {
          const { data: enfs } = await supabase
            .from('enfrentamientos')
            .select('*')
            .in('ronda_id', rondas.map(r => r.id))

          if (enfs && enfs.length > 0) {
            const { data: ress } = await supabase
              .from('resultados')
              .select('*')
              .in('enfrentamiento_id', enfs.map(e => e.id))

            standings = computeStandings(allParts || [], enfs, ress || [])
          }
        }

        const myStats = standings.find(s => s.jugador_id === id)
        const pos = standings.findIndex(s => s.jugador_id === id) + 1

        if (myStats) {
          totals.PJ += myStats.PJ
          totals.PG += myStats.PG
          totals.PP += myStats.PP
          totals.PE += myStats.PE
          totals.PV += myStats.PV
        }

        ligaStats.push({
          liga,
          pos: pos || null,
          total: standings.length,
          stats: myStats || null,
        })
      }

      setLigas(ligaStats.sort((a, b) => new Date(b.liga.created_at) - new Date(a.liga.created_at)))
      setGlobalStats(totals)
      setLoading(false)
    }

    load()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-wh-muted font-cinzel">{error}</p>
        <Link to="/" className="btn-outline mt-4 inline-block">Volver al inicio</Link>
      </div>
    )
  }

  const factionColor = FACTION_COLORS[jugador.faccion] || '#c9a84c'
  const winRate = globalStats.PJ > 0
    ? Math.round((globalStats.PG / globalStats.PJ) * 100)
    : 0

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 fade-in">
      <Link to="/" className="text-wh-muted text-sm hover:text-gold transition-colors flex items-center gap-1 mb-6">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Inicio
      </Link>

      {/* Profile card */}
      <div className="card mb-6" style={{ borderColor: `${factionColor}30` }}>
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 flex-shrink-0"
            style={{
              WebkitMaskImage: 'radial-gradient(circle, black 45%, transparent 75%)',
              maskImage: 'radial-gradient(circle, black 45%, transparent 75%)',
            }}
          >
            {jugador.faction_image ? (
              <img
                src={`${import.meta.env.BASE_URL}factions/${jugador.faction_image}`}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full" style={{ backgroundColor: `${factionColor}20` }} />
            )}
          </div>
          <div>
            <h1 className="font-cinzel text-2xl font-bold text-wh-text">{jugador.nombre}</h1>
            <span
              className="text-sm font-medium px-2 py-0.5 rounded-full mt-1 inline-block"
              style={{
                color: factionColor,
                backgroundColor: `${factionColor}15`,
                border: `1px solid ${factionColor}40`,
              }}
            >
              {jugador.faccion || 'Sin facción'}
            </span>
          </div>
        </div>
      </div>

      {/* Global stats */}
      <div className="card mb-6">
        <h2 className="section-title">Estadísticas globales</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {[
            { label: 'Partidas', value: globalStats.PJ, color: 'text-wh-text' },
            { label: 'Victorias', value: globalStats.PG, color: 'text-green-400' },
            { label: 'Derrotas', value: globalStats.PP, color: 'text-red-400' },
            { label: 'Empates', value: globalStats.PE, color: 'text-yellow-400' },
            { label: '% Victoria', value: `${winRate}%`, color: 'text-gold' },
          ].map(stat => (
            <div key={stat.label} className="bg-wh-surface rounded-lg p-3 text-center">
              <p className={`font-cinzel text-xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-wh-muted mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Liga history */}
      {ligas.length > 0 && (
        <div className="card">
          <h2 className="section-title">Historial de ligas</h2>
          <div className="space-y-3">
            {ligas.map(({ liga, pos, total, stats }) => (
              <div
                key={liga.id}
                className="flex items-center justify-between bg-wh-surface/50 rounded-lg px-4 py-3"
              >
                <div>
                  <Link
                    to={`/liga/${liga.id}`}
                    className="font-cinzel text-sm font-semibold text-gold hover:text-gold-light transition-colors hover:underline"
                  >
                    {liga.nombre}
                  </Link>
                  {liga.temporada && (
                    <p className="text-xs text-wh-muted">Temporada {liga.temporada}</p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  {stats && (
                    <div className="text-right">
                      <p className="text-gold font-cinzel font-bold">{stats.PG} {stats.PG === 1 ? 'Victoria' : 'Victorias'}</p>
                      <p className="text-xs text-wh-muted">{stats.PV} PV</p>
                    </div>
                  )}
                  {pos && (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-cinzel font-bold flex-shrink-0"
                      style={{ backgroundColor: `${factionColor}20`, color: factionColor, border: `1px solid ${factionColor}40` }}
                    >
                      {pos}º
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
