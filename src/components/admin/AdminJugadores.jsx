import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { FACTIONS, FACTION_COLORS } from '../../lib/standings'

export default function AdminJugadores() {
  const [jugadores, setJugadores] = useState([])
  const [ligas, setLigas] = useState([])
  const [nombre, setNombre] = useState('')
  const [faccion, setFaccion] = useState(FACTIONS[0])
  const [asignLigaId, setAsignLigaId] = useState('')
  const [asignJugadorId, setAsignJugadorId] = useState('')
  const [asignFaccion, setAsignFaccion] = useState('')
  const [asignImage, setAsignImage] = useState('')
  const [participaciones, setParticipaciones] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  async function loadData() {
    const [{ data: jugs }, { data: ligs }, { data: parts }] = await Promise.all([
      supabase.from('jugadores').select('*').order('nombre'),
      supabase.from('ligas').select('id, nombre, estado').order('created_at', { ascending: false }),
      supabase.from('participaciones').select('id, liga_id, jugador_id'),
    ])
    setJugadores(jugs || [])
    setLigas(ligs || [])
    setParticipaciones(parts || [])
  }

  useEffect(() => { loadData() }, [])

  function flash(text, isError = false) {
    setMsg({ text, isError })
    setTimeout(() => setMsg(null), 3000)
  }

  async function handleCreateJugador(e) {
    e.preventDefault()
    if (!nombre.trim()) return
    setLoading(true)
    const { error } = await supabase.from('jugadores').insert({ nombre: nombre.trim(), faccion })
    if (error) flash(error.message, true)
    else { flash('Jugador creado'); setNombre('') }
    await loadData()
    setLoading(false)
  }

  // Al elegir jugador, la facción de la participación arranca con su army global.
  function handleSelectJugador(jugadorId) {
    setAsignJugadorId(jugadorId)
    const jug = jugadores.find(j => j.id === jugadorId)
    setAsignFaccion(jug?.faccion || '')
    setAsignImage(jug?.faction_image || '')
  }

  async function handleAsignar(e) {
    e.preventDefault()
    if (!asignLigaId || !asignJugadorId) return
    setLoading(true)
    const { error } = await supabase.from('participaciones').insert({
      liga_id: asignLigaId,
      jugador_id: asignJugadorId,
      faccion: asignFaccion || null,
      faction_image: asignImage.trim() || null,
    })
    if (error) {
      if (error.code === '23505') flash('El jugador ya está en esta liga', true)
      else flash(error.message, true)
    } else {
      flash('Jugador asignado a la liga')
      setAsignImage('')
    }
    await loadData()
    setLoading(false)
  }

  async function handleRemoveParticipacion(partId) {
    const { error } = await supabase.from('participaciones').delete().eq('id', partId)
    if (error) flash(error.message, true)
    else await loadData()
  }

  const ligaNombre = {}
  for (const l of ligas) ligaNombre[l.id] = l.nombre

  return (
    <div className="space-y-6">
      {msg && (
        <div className={`text-sm px-4 py-2 rounded border ${
          msg.isError
            ? 'text-red-400 bg-red-400/10 border-red-400/30'
            : 'text-green-400 bg-green-400/10 border-green-400/30'
        }`}>
          {msg.text}
        </div>
      )}

      {/* Create jugador */}
      <div className="card">
        <h3 className="section-title">Nuevo Jugador</h3>
        <form onSubmit={handleCreateJugador} className="flex flex-col sm:flex-row gap-3">
          <input
            className="input-field"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Nombre del jugador"
            required
          />
          <select
            className="select-field sm:w-56"
            value={faccion}
            onChange={e => setFaccion(e.target.value)}
          >
            {FACTIONS.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <button type="submit" className="btn-gold flex-shrink-0" disabled={loading}>
            Crear
          </button>
        </form>
      </div>

      {/* Assign to liga */}
      <div className="card">
        <h3 className="section-title">Asignar a Liga</h3>
        <p className="text-xs text-wh-muted mb-3">
          La facción y la imagen se guardan por liga: así el histórico refleja el army con el que jugó cada uno.
        </p>
        <form onSubmit={handleAsignar} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              className="select-field"
              value={asignJugadorId}
              onChange={e => handleSelectJugador(e.target.value)}
              required
            >
              <option value="">Selecciona jugador...</option>
              {jugadores.map(j => (
                <option key={j.id} value={j.id}>{j.nombre}</option>
              ))}
            </select>
            <select
              className="select-field"
              value={asignLigaId}
              onChange={e => setAsignLigaId(e.target.value)}
              required
            >
              <option value="">Selecciona liga...</option>
              {ligas.map(l => (
                <option key={l.id} value={l.id}>{l.nombre}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              className="select-field"
              value={asignFaccion}
              onChange={e => setAsignFaccion(e.target.value)}
            >
              <option value="">Facción (por liga)...</option>
              {FACTIONS.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <input
              className="input-field"
              value={asignImage}
              onChange={e => setAsignImage(e.target.value)}
              placeholder="Imagen (ej. votann-guerra.png)"
            />
            <button type="submit" className="btn-gold flex-shrink-0" disabled={loading}>
              Asignar
            </button>
          </div>
        </form>
      </div>

      {/* Jugadores list */}
      <div className="card">
        <h3 className="section-title">Jugadores ({jugadores.length})</h3>
        <div className="space-y-2">
          {jugadores.map(j => {
            const color = FACTION_COLORS[j.faccion] || '#6b6b6b'
            const jParts = participaciones.filter(p => p.jugador_id === j.id)
            return (
              <div key={j.id} className="bg-wh-surface/50 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm text-wh-text">{j.nombre}</p>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ color, backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
                    >
                      {j.faccion}
                    </span>
                  </div>
                </div>
                {jParts.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {jParts.map(p => (
                      <span key={p.id} className="inline-flex items-center gap-1 text-xs bg-wh-card border border-wh-border rounded px-2 py-0.5">
                        {ligaNombre[p.liga_id] || p.liga_id}
                        <button
                          onClick={() => handleRemoveParticipacion(p.id)}
                          className="text-wh-muted hover:text-red-400 transition-colors ml-1"
                          title="Quitar de liga"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          {jugadores.length === 0 && (
            <p className="text-wh-muted text-sm">No hay jugadores</p>
          )}
        </div>
      </div>
    </div>
  )
}
