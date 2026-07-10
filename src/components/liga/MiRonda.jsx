import { useState } from 'react'
import { FACTION_COLORS } from '../../lib/standings'

export default function MiRonda({ participaciones, rondas, enfrentamientos, resultados }) {
  const [selectedJugador, setSelectedJugador] = useState(null)

  // Build jugadores list
  const jugadores = (participaciones || []).map(p => ({
    id: p.jugador_id,
    ...p.jugadores,
  }))

  // Build lookup maps
  const jugadorNombre = {}
  const jugadorFaccion = {}
  for (const j of jugadores) {
    jugadorNombre[j.id] = j.nombre
    jugadorFaccion[j.id] = j.faccion
  }

  function getRondaInfo(rondaId) {
    return (rondas || []).find(r => r.id === rondaId) || {}
  }

  function getResult(enfId) {
    return (resultados || []).find(r => r.enfrentamiento_id === enfId)
  }

  // Get all matches for selected jugador
  function getMatchesForJugador(jugadorId) {
    const matches = []
    for (const enf of (enfrentamientos || [])) {
      let isPlayer1 = enf.jugador1_id === jugadorId
      let isPlayer2 = enf.jugador2_id === jugadorId
      if (!isPlayer1 && !isPlayer2) continue

      const ronda = getRondaInfo(enf.ronda_id)
      const res = getResult(enf.id)
      const rivalId = isPlayer1 ? enf.jugador2_id : enf.jugador1_id
      const myPV = res ? (isPlayer1 ? res.pv1 : res.pv2) : null
      const rivalPV = res ? (isPlayer1 ? res.pv2 : res.pv1) : null

      let outcome = null
      if (res) {
        if (myPV > rivalPV) outcome = 'win'
        else if (myPV < rivalPV) outcome = 'loss'
        else outcome = 'draw'
      }

      matches.push({
        enfId: enf.id,
        ronda,
        rival: jugadorNombre[rivalId] || 'Desconocido',
        rivalFaccion: jugadorFaccion[rivalId] || '',
        myPV,
        rivalPV,
        outcome,
        suspendida: res?.estado === 'suspendido',
      })
    }

    return matches.sort((a, b) => (a.ronda?.numero || 0) - (b.ronda?.numero || 0))
  }

  const outcomeStyles = {
    win: { label: 'Victoria', class: 'text-green-400 bg-green-400/10 border-green-400/30' },
    loss: { label: 'Derrota', class: 'text-red-400 bg-red-400/10 border-red-400/30' },
    draw: { label: 'Empate', class: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' },
  }

  const matches = selectedJugador ? getMatchesForJugador(selectedJugador) : []

  return (
    <div className="fade-in">
      {/* Player selector */}
      <div className="card mb-4">
        <p className="text-wh-muted text-sm mb-3">Selecciona un jugador para ver sus partidas:</p>
        <div className="flex flex-wrap gap-2">
          {jugadores.map(j => {
            const color = FACTION_COLORS[j.faccion] || '#c9a84c'
            const isSelected = selectedJugador === j.id
            return (
              <button
                key={j.id}
                onClick={() => setSelectedJugador(isSelected ? null : j.id)}
                className="px-3 py-2 rounded-lg text-sm font-semibold border transition-all"
                style={{
                  borderColor: isSelected ? color : `${color}40`,
                  backgroundColor: isSelected ? `${color}25` : `${color}08`,
                  color: isSelected ? color : `${color}99`,
                }}
              >
                {j.nombre}
              </button>
            )
          })}
        </div>
      </div>

      {/* Matches */}
      {selectedJugador && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-cinzel text-gold font-bold">
              {jugadorNombre[selectedJugador]}
            </h3>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                color: FACTION_COLORS[jugadorFaccion[selectedJugador]] || '#c9a84c',
                backgroundColor: `${FACTION_COLORS[jugadorFaccion[selectedJugador]] || '#c9a84c'}15`,
                border: `1px solid ${FACTION_COLORS[jugadorFaccion[selectedJugador]] || '#c9a84c'}40`,
              }}
            >
              {jugadorFaccion[selectedJugador]}
            </span>
          </div>

          <div className="space-y-3">
            {matches.map(m => {
              const rivalColor = FACTION_COLORS[m.rivalFaccion] || '#c9a84c'
              return (
                <div key={m.enfId} className="card py-3 px-4">
                  <div className="flex items-center justify-between gap-4">
                    {/* Left: Round number + rival */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-wh-muted font-medium uppercase tracking-wide whitespace-nowrap">
                          Ronda {m.ronda?.numero}
                        </span>
                        <span className="text-xs text-wh-muted mx-1">·</span>
                        {m.outcome ? (
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded border ${outcomeStyles[m.outcome].class}`}>
                            {outcomeStyles[m.outcome].label}
                          </span>
                        ) : (
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded border text-wh-muted border-wh-border">
                            Pendiente
                          </span>
                        )}
                        {m.suspendida && (
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded border text-yellow-400 bg-yellow-400/10 border-yellow-400/30">
                            Suspendido
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-base text-wh-text truncate mt-0.5">{m.rival}</p>
                      <span
                        className="inline-block text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap mt-1 -ml-0.5"
                        style={{
                          color: rivalColor,
                          backgroundColor: `${rivalColor}15`,
                          border: `1px solid ${rivalColor}40`,
                        }}
                      >
                        {m.rivalFaccion}
                      </span>
                    </div>

                    {/* Right: Mission + layout/despliegue + score */}
                    <div className="text-right flex-shrink-0">
                      {m.ronda?.mision && (
                        <p className="font-cinzel text-wh-text font-semibold text-sm leading-tight">{m.ronda.mision}</p>
                      )}
                      {(m.ronda?.layout || m.ronda?.despliegue) && (
                      <div className="text-xs text-wh-muted flex flex-wrap items-center justify-end gap-x-1 gap-y-0.5 mt-0.5">
                        {m.ronda?.layout && (
                          <span className="text-wh-text">{m.ronda.layout}</span>
                        )}
                        {m.ronda?.despliegue && (
                          <>
                            {m.ronda?.layout && <span className="mx-0.5">·</span>}
                            <span className="text-wh-text">{m.ronda.despliegue}</span>
                          </>
                        )}
                      </div>
                      )}
                      {m.myPV !== null && (
                        <span className="font-cinzel font-bold text-gold text-sm mt-1 block">
                          {m.myPV}–{m.rivalPV}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {matches.length === 0 && (
              <div className="card text-center py-6">
                <p className="text-wh-muted text-sm">No hay partidas registradas</p>
              </div>
            )}
          </div>
        </div>
      )}

      {!selectedJugador && (
        <div className="card text-center py-10">
          <p className="text-wh-muted">Selecciona un jugador para ver sus partidas</p>
        </div>
      )}
    </div>
  )
}
