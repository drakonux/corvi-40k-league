import { FACTION_COLORS, computeStandings } from '../../lib/standings'
import { Link } from 'react-router-dom'

function getInitials(nombre) {
  if (!nombre) return ''
  const parts = nombre.trim().split(' ')
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getShortName(nombre) {
  if (!nombre) return ''
  const parts = nombre.trim().split(' ')
  if (parts.length === 1) return parts[0]
  return `${parts[0]}.${parts[parts.length - 1][0]}`
}

function PodiumPlace({ standing, pos }) {
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' }
  const heights = { 1: 'h-28', 2: 'h-20', 3: 'h-16' }
  const order = { 1: 'order-2', 2: 'order-1', 3: 'order-3' }
  const factionColor = FACTION_COLORS[standing.jugador?.faccion] || '#c9a84c'

  return (
    <div className={`flex flex-col items-center ${order[pos]}`}>
      <Link to={`/jugador/${standing.jugador_id}`} className="group">
        <div
          className="w-14 h-14 rounded-full border-2 flex items-center justify-center text-xs font-bold font-cinzel mb-2 transition-transform group-hover:scale-110"
          style={{ borderColor: factionColor, color: factionColor, backgroundColor: `${factionColor}15` }}
        >
          {getInitials(standing.jugador?.nombre)}
        </div>
      </Link>
      <p className="text-xs text-wh-text font-semibold text-center max-w-16 leading-tight">
        {getShortName(standing.jugador?.nombre)}
      </p>
      <p className="text-gold font-cinzel font-bold text-sm">{standing.PG}G · {standing.PV}PV</p>
      <div
        className={`w-16 ${heights[pos]} mt-2 rounded-t flex items-center justify-center`}
        style={{ backgroundColor: `${factionColor}25`, borderTop: `2px solid ${factionColor}60` }}
      >
        <span className="text-2xl">{medals[pos]}</span>
      </div>
    </div>
  )
}

export default function Clasificacion({ participaciones, enfrentamientos, resultados }) {
  const standings = computeStandings(participaciones, enfrentamientos, resultados)
  const top3 = standings.slice(0, 3)

  if (standings.length === 0) {
    return (
      <div className="card text-center py-10">
        <p className="text-wh-muted">No hay participantes registrados</p>
      </div>
    )
  }

  return (
    <div className="fade-in">
      {/* Podio */}
      {top3.length >= 2 && (
        <div className="card mb-6">
          <h3 className="section-title text-center mb-6">Podio</h3>
          <div className="flex justify-center items-end gap-4">
            {top3.map((s, i) => (
              <PodiumPlace key={s.jugador_id} standing={s} pos={i + 1} />
            ))}
          </div>
        </div>
      )}

      {/* Tabla clasificación */}
      <div className="card overflow-hidden">
        <h3 className="section-title mb-4">Clasificación</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-wh-border">
                <th className="text-left py-2 px-3 text-wh-muted font-medium w-8">#</th>
                <th className="text-left py-2 px-3 text-wh-muted font-medium">Jugador</th>
                <th className="text-left py-2 px-3 text-wh-muted font-medium hidden sm:table-cell">Facción</th>
                <th className="text-center py-2 px-2 text-wh-muted font-medium">PJ</th>
                <th className="text-center py-2 px-2 text-wh-muted font-medium">G</th>
                <th className="text-center py-2 px-2 text-wh-muted font-medium hidden sm:table-cell">E</th>
                <th className="text-center py-2 px-2 text-wh-muted font-medium hidden sm:table-cell">P</th>
                <th className="text-center py-2 px-2 text-gold font-semibold">PV</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, idx) => {
                const factionColor = FACTION_COLORS[s.jugador?.faccion] || '#6b6b6b'
                const isTop3 = idx < 3
                return (
                  <tr
                    key={s.jugador_id}
                    className={`border-b border-wh-border/50 transition-colors hover:bg-wh-surface/50 ${
                      isTop3 ? 'bg-wh-surface/20' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <span className="font-cinzel font-bold text-xs text-wh-muted">
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <Link
                        to={`/jugador/${s.jugador_id}`}
                        className="font-semibold text-wh-text hover:text-gold transition-colors hover:underline"
                      >
                        {s.jugador?.nombre || 'Desconocido'}
                      </Link>
                    </td>
                    <td className="py-3 px-3 hidden sm:table-cell">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full border"
                        style={{ color: factionColor, borderColor: `${factionColor}40`, backgroundColor: `${factionColor}10` }}
                      >
                        {s.jugador?.faccion || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center text-wh-muted">{s.PJ}</td>
                    <td className="py-3 px-2 text-center text-wh-text">{s.PG}</td>
                    <td className="py-3 px-2 text-center text-wh-text hidden sm:table-cell">{s.PE}</td>
                    <td className="py-3 px-2 text-center text-wh-text hidden sm:table-cell">{s.PP}</td>
                    <td className="py-3 px-2 text-center">
                      <span className="font-cinzel font-bold text-gold">{s.PV}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-wh-muted mt-3 px-3">
          Clasificación por victorias. En caso de empate, se decide por Puntos de Victoria (PV)
        </p>
      </div>
    </div>
  )
}
