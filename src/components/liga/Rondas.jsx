import { getCurrentRound } from '../../lib/standings'

export default function Rondas({ rondas, enfrentamientos, resultados, participaciones }) {
  const currentRound = getCurrentRound(rondas, enfrentamientos, resultados)

  // Build a map jugador_id → nombre
  const jugadorNombre = {}
  for (const p of (participaciones || [])) {
    if (p.jugadores) jugadorNombre[p.jugador_id] = p.jugadores.nombre
  }

  function getResult(enfId) {
    return (resultados || []).find(r => r.enfrentamiento_id === enfId)
  }

  function getMatchLabel(enf) {
    const j1 = jugadorNombre[enf.jugador1_id] || 'J1'
    const j2 = jugadorNombre[enf.jugador2_id] || 'J2'
    const res = getResult(enf.id)

    if (!res) {
      return { j1, j2, label: null, pending: true }
    }
    return { j1, j2, pv1: res.pv1, pv2: res.pv2, pending: false }
  }

  if (!rondas || rondas.length === 0) {
    return (
      <div className="card text-center py-10">
        <p className="text-wh-muted">No hay rondas registradas</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 fade-in">
      {[...rondas].sort((a, b) => a.numero - b.numero).map(ronda => {
        const rondasEnfs = enfrentamientos.filter(e => e.ronda_id === ronda.id)

        return (
          <div key={ronda.id} className="card">
            {/* Round header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-cinzel text-xs font-bold px-2 py-0.5 rounded bg-wh-surface text-wh-muted border border-wh-border">
                    Ronda {ronda.numero}
                  </span>
                </div>
                {ronda.mision_url ? (
                  <a href={ronda.mision_url} target="_blank" rel="noopener noreferrer"
                    className="font-cinzel text-gold text-lg font-bold hover:text-gold-light transition-colors flex items-center gap-1 hover:underline">
                    {ronda.mision}
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : (
                  <h3 className="font-cinzel text-gold text-lg font-bold">{ronda.mision}</h3>
                )}
              </div>
            </div>

            {/* Mission details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 text-sm">
              <div>
                <p className="text-wh-muted text-xs uppercase tracking-wide mb-0.5">Despliegue</p>
                {ronda.despliegue_url ? (
                  <a href={ronda.despliegue_url} target="_blank" rel="noopener noreferrer"
                    className="text-gold hover:text-gold-light transition-colors font-medium flex items-center gap-1 hover:underline">
                    {ronda.despliegue}
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : (
                  <p className="text-wh-text font-medium">{ronda.despliegue}</p>
                )}
              </div>
              <div>
                <p className="text-wh-muted text-xs uppercase tracking-wide mb-0.5">Layout</p>
                {ronda.layout_url ? (
                  <a
                    href={ronda.layout_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold hover:text-gold-light transition-colors font-medium flex items-center gap-1 hover:underline"
                >
                    {ronda.layout}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : (
                  <p className="text-wh-text font-medium">{ronda.layout}</p>
                )}
              </div>
            </div>

            {/* Matches */}
            <div className="space-y-2">
              {rondasEnfs.map(enf => {
                const { j1, j2, pv1, pv2, pending } = getMatchLabel(enf)
                return (
                  <div
                    key={enf.id}
                    className="flex items-center bg-wh-surface/50 rounded px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-wh-text truncate flex-1 text-left">{j1}</span>
                    <div className="w-24 flex justify-center flex-shrink-0">
                      {pending ? (
                        <span className="text-xs text-wh-muted border border-wh-border rounded px-2 py-0.5">
                          Pendiente
                        </span>
                      ) : (
                        <span className="font-cinzel font-bold text-gold text-sm">
                          {pv1} – {pv2}
                        </span>
                      )}
                    </div>
                    <span className="font-medium text-wh-text truncate flex-1 text-right">{j2}</span>
                  </div>
                )
              })}
              {rondasEnfs.length === 0 && (
                <p className="text-xs text-wh-muted text-center py-2">Sin enfrentamientos</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
