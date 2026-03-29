import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const EMPTY_RONDA = { numero: '', mision: '', mision_url: '', despliegue: '', despliegue_url: '', layout: '', layout_url: 'https://gdmissions.app/' }

export default function AdminRondas() {
  const [ligas, setLigas] = useState([])
  const [ligaId, setLigaId] = useState('')
  const [rondas, setRondas] = useState([])
  const [jugadores, setJugadores] = useState([])
  const [enfrentamientos, setEnfrentamientos] = useState([])
  const [rondaForm, setRondaForm] = useState(EMPTY_RONDA)
  const [enfsForm, setEnfsForm] = useState([{ jugador1_id: '', jugador2_id: '' }])
  const [activeRondaId, setActiveRondaId] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  async function loadLigas() {
    const { data } = await supabase.from('ligas').select('id, nombre, estado').order('created_at', { ascending: false })
    setLigas(data || [])
  }

  async function loadLigaData(id) {
    const [{ data: rondasData }, { data: partsData }] = await Promise.all([
      supabase.from('rondas').select('*').eq('liga_id', id).order('numero'),
      supabase.from('participaciones').select('jugador_id, jugadores(id, nombre)').eq('liga_id', id),
    ])
    setRondas(rondasData || [])
    setJugadores((partsData || []).map(p => p.jugadores).filter(Boolean))

    if (rondasData && rondasData.length > 0) {
      const { data: enfsData } = await supabase
        .from('enfrentamientos')
        .select('id, ronda_id, jugador1_id, jugador2_id')
        .in('ronda_id', rondasData.map(r => r.id))
      setEnfrentamientos(enfsData || [])
    } else {
      setEnfrentamientos([])
    }
  }

  useEffect(() => { loadLigas() }, [])

  useEffect(() => {
    if (ligaId) loadLigaData(ligaId)
    else { setRondas([]); setJugadores([]); setEnfrentamientos([]) }
  }, [ligaId])

  function flash(text, isError = false) {
    setMsg({ text, isError })
    setTimeout(() => setMsg(null), 3000)
  }

  async function handleCreateRonda(e) {
    e.preventDefault()
    if (!ligaId || !rondaForm.numero) return
    setLoading(true)

    try {
      const { data: rondaData, error: rErr } = await supabase
        .from('rondas')
        .insert({
          liga_id: ligaId,
          numero: parseInt(rondaForm.numero),
          mision: rondaForm.mision || null,
          mision_url: rondaForm.mision_url || null,
          despliegue_url: rondaForm.despliegue_url || null,
          despliegue: rondaForm.despliegue || null,
          layout: rondaForm.layout || null,
          layout_url: rondaForm.layout_url || null,
        })
        .select()
        .single()

      if (rErr) throw rErr

      // Create enfrentamientos
      const validEnfs = enfsForm.filter(e => e.jugador1_id && e.jugador2_id && e.jugador1_id !== e.jugador2_id)
      if (validEnfs.length > 0) {
        const { error: enfErr } = await supabase
          .from('enfrentamientos')
          .insert(validEnfs.map(e => ({
            ronda_id: rondaData.id,
            jugador1_id: e.jugador1_id,
            jugador2_id: e.jugador2_id,
          })))
        if (enfErr) throw enfErr
      }

      flash(`Ronda ${rondaForm.numero} creada con ${validEnfs.length} enfrentamientos`)
      setRondaForm(EMPTY_RONDA)
      setEnfsForm([{ jugador1_id: '', jugador2_id: '' }])
      await loadLigaData(ligaId)
    } catch (err) {
      flash(err.message, true)
    }
    setLoading(false)
  }

  async function handleAddEnfrentamiento(e) {
    e.preventDefault()
    if (!activeRondaId) return
    const validEnfs = enfsForm.filter(e => e.jugador1_id && e.jugador2_id && e.jugador1_id !== e.jugador2_id)
    if (validEnfs.length === 0) return
    setLoading(true)

    const { error } = await supabase.from('enfrentamientos').insert(
      validEnfs.map(e => ({
        ronda_id: activeRondaId,
        jugador1_id: e.jugador1_id,
        jugador2_id: e.jugador2_id,
      }))
    )
    if (error) flash(error.message, true)
    else {
      flash('Enfrentamientos añadidos')
      setEnfsForm([{ jugador1_id: '', jugador2_id: '' }])
      await loadLigaData(ligaId)
    }
    setLoading(false)
  }

  async function handleDeleteEnf(id) {
    const { error } = await supabase.from('enfrentamientos').delete().eq('id', id)
    if (error) flash(error.message, true)
    else await loadLigaData(ligaId)
  }

  function jugadorNombre(id) {
    return jugadores.find(j => j.id === id)?.nombre || id
  }

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

      {/* Select liga */}
      <div className="card">
        <h3 className="section-title">Seleccionar Liga</h3>
        <select
          className="select-field"
          value={ligaId}
          onChange={e => setLigaId(e.target.value)}
        >
          <option value="">Selecciona una liga...</option>
          {ligas.map(l => (
            <option key={l.id} value={l.id}>{l.nombre}</option>
          ))}
        </select>
      </div>

      {ligaId && (
        <>
          {/* Create ronda */}
          <div className="card">
            <h3 className="section-title">Nueva Ronda</h3>
            <form onSubmit={handleCreateRonda} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-wh-muted mb-1">Número *</label>
                  <input
                    type="number"
                    className="input-field"
                    value={rondaForm.numero}
                    onChange={e => setRondaForm(f => ({ ...f, numero: e.target.value }))}
                    placeholder={rondas.length + 1}
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-wh-muted mb-1">Misión</label>
                  <input
                    className="input-field"
                    value={rondaForm.mision}
                    onChange={e => setRondaForm(f => ({ ...f, mision: e.target.value }))}
                    placeholder="Purgar el Enemigo"
                  />
                </div>
                <div>
                  <label className="block text-xs text-wh-muted mb-1">URL Misión</label>
                  <input
                    className="input-field"
                    value={rondaForm.mision_url}
                    onChange={e => setRondaForm(f => ({ ...f, mision_url: e.target.value }))}
                    placeholder="https://gdmissions.app/primary-missions/..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-wh-muted mb-1">Despliegue</label>
                  <input
                    className="input-field"
                    value={rondaForm.despliegue}
                    onChange={e => setRondaForm(f => ({ ...f, despliegue: e.target.value }))}
                    placeholder="Crisol de Batalla"
                  />
                </div>
                <div>
                  <label className="block text-xs text-wh-muted mb-1">URL Despliegue</label>
                  <input
                    className="input-field"
                    value={rondaForm.despliegue_url}
                    onChange={e => setRondaForm(f => ({ ...f, despliegue_url: e.target.value }))}
                    placeholder="https://gdmissions.app/deployment-zones/..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-wh-muted mb-1">Layout</label>
                  <input
                    className="input-field"
                    value={rondaForm.layout}
                    onChange={e => setRondaForm(f => ({ ...f, layout: e.target.value }))}
                    placeholder="Layout 2"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-wh-muted mb-1">URL del Layout</label>
                  <input
                    className="input-field"
                    value={rondaForm.layout_url}
                    onChange={e => setRondaForm(f => ({ ...f, layout_url: e.target.value }))}
                    placeholder="https://gdmissions.app/"
                  />
                </div>
              </div>

              {/* Enfrentamientos inline */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-wh-muted">Enfrentamientos</label>
                  <button
                    type="button"
                    onClick={() => setEnfsForm(f => [...f, { jugador1_id: '', jugador2_id: '' }])}
                    className="text-xs text-gold hover:text-gold-light"
                  >
                    + Añadir enfrentamiento
                  </button>
                </div>
                <div className="space-y-2">
                  {enfsForm.map((enf, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <select
                        className="select-field"
                        value={enf.jugador1_id}
                        onChange={e => {
                          const next = [...enfsForm]
                          next[i] = { ...next[i], jugador1_id: e.target.value }
                          setEnfsForm(next)
                        }}
                      >
                        <option value="">Jugador 1...</option>
                        {jugadores.map(j => <option key={j.id} value={j.id}>{j.nombre}</option>)}
                      </select>
                      <span className="text-wh-muted text-xs flex-shrink-0">vs</span>
                      <select
                        className="select-field"
                        value={enf.jugador2_id}
                        onChange={e => {
                          const next = [...enfsForm]
                          next[i] = { ...next[i], jugador2_id: e.target.value }
                          setEnfsForm(next)
                        }}
                      >
                        <option value="">Jugador 2...</option>
                        {jugadores.map(j => <option key={j.id} value={j.id}>{j.nombre}</option>)}
                      </select>
                      {enfsForm.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setEnfsForm(f => f.filter((_, idx) => idx !== i))}
                          className="text-wh-muted hover:text-red-400 flex-shrink-0"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn-gold" disabled={loading}>
                Crear Ronda
              </button>
            </form>
          </div>

          {/* Rondas list */}
          {rondas.length > 0 && (
            <div className="card">
              <h3 className="section-title">Rondas existentes</h3>
              <div className="space-y-3">
                {rondas.map(r => {
                  const rondasEnfs = enfrentamientos.filter(e => e.ronda_id === r.id)
                  return (
                    <div key={r.id} className="bg-wh-surface/50 rounded-lg px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-cinzel text-sm font-bold text-gold">
                          Ronda {r.numero} · {r.mision}
                        </p>
                        <button
                          onClick={() => setActiveRondaId(activeRondaId === r.id ? '' : r.id)}
                          className="text-xs text-wh-muted hover:text-gold transition-colors"
                        >
                          {activeRondaId === r.id ? 'Cerrar' : '+ Enfrentamiento'}
                        </button>
                      </div>
                      <div className="space-y-1">
                        {rondasEnfs.map(e => (
                          <div key={e.id} className="flex items-center justify-between text-xs text-wh-text bg-wh-card rounded px-3 py-1.5">
                            <span>{jugadorNombre(e.jugador1_id)} vs {jugadorNombre(e.jugador2_id)}</span>
                            <button
                              onClick={() => handleDeleteEnf(e.id)}
                              className="text-wh-muted hover:text-red-400 transition-colors ml-2"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {rondasEnfs.length === 0 && (
                          <p className="text-xs text-wh-muted">Sin enfrentamientos</p>
                        )}
                      </div>

                      {/* Add enfs to existing ronda */}
                      {activeRondaId === r.id && (
                        <form onSubmit={handleAddEnfrentamiento} className="mt-3 space-y-2">
                          {enfsForm.map((enf, i) => (
                            <div key={i} className="flex gap-2 items-center">
                              <select
                                className="select-field text-xs"
                                value={enf.jugador1_id}
                                onChange={e => {
                                  const next = [...enfsForm]
                                  next[i] = { ...next[i], jugador1_id: e.target.value }
                                  setEnfsForm(next)
                                }}
                              >
                                <option value="">J1...</option>
                                {jugadores.map(j => <option key={j.id} value={j.id}>{j.nombre}</option>)}
                              </select>
                              <span className="text-wh-muted text-xs">vs</span>
                              <select
                                className="select-field text-xs"
                                value={enf.jugador2_id}
                                onChange={e => {
                                  const next = [...enfsForm]
                                  next[i] = { ...next[i], jugador2_id: e.target.value }
                                  setEnfsForm(next)
                                }}
                              >
                                <option value="">J2...</option>
                                {jugadores.map(j => <option key={j.id} value={j.id}>{j.nombre}</option>)}
                              </select>
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <button type="submit" className="btn-gold text-xs py-1" disabled={loading}>
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={() => setEnfsForm(f => [...f, { jugador1_id: '', jugador2_id: '' }])}
                              className="text-xs text-gold hover:text-gold-light"
                            >
                              + Otro
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
