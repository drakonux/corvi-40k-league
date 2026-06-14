import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1BjadrC3EaSqrDjaMj-mqd8WFKQzYFukERDYTthESGRE/gviz/tq?tqx=out:csv&sheet=Resultados'

function normalize(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

export default function AdminResultados() {
  const [ligas, setLigas] = useState([])
  const [ligaId, setLigaId] = useState('')
  const [rondas, setRondas] = useState([])
  const [rondaId, setRondaId] = useState('')
  const [enfrentamientos, setEnfrentamientos] = useState([])
  const [resultados, setResultados] = useState([])
  const [jugadores, setJugadores] = useState({})
  const [pvValues, setPvValues] = useState({})
  const [savingId, setSavingId] = useState(null)
  const [msg, setMsg] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState(null)

  async function loadLigas() {
    const { data } = await supabase.from('ligas').select('id, nombre').order('created_at', { ascending: false })
    setLigas(data || [])
  }

  async function loadRondas(id) {
    const { data } = await supabase.from('rondas').select('id, numero, mision').eq('liga_id', id).order('numero')
    setRondas(data || [])
    setRondaId('')
    setEnfrentamientos([])
    setResultados([])
    setPvValues({})

    // Load jugadores
    const { data: parts } = await supabase
      .from('participaciones')
      .select('jugador_id, jugadores(id, nombre, faccion)')
      .eq('liga_id', id)

    const jugMap = {}
    for (const p of (parts || [])) {
      if (p.jugadores) jugMap[p.jugadores.id] = p.jugadores
    }
    setJugadores(jugMap)
  }

  async function loadRondaEnfs(id) {
    const { data: enfs } = await supabase
      .from('enfrentamientos')
      .select('id, jugador1_id, jugador2_id')
      .eq('ronda_id', id)

    setEnfrentamientos(enfs || [])

    if (enfs && enfs.length > 0) {
      const { data: ress } = await supabase
        .from('resultados')
        .select('id, enfrentamiento_id, pv1, pv2, estado')
        .in('enfrentamiento_id', enfs.map(e => e.id))

      setResultados(ress || [])

      // Pre-fill PV values from existing results
      const pvMap = {}
      for (const r of (ress || [])) {
        pvMap[r.enfrentamiento_id] = { pv1: r.pv1?.toString() ?? '', pv2: r.pv2?.toString() ?? '', estado: r.estado || 'jugado' }
      }
      setPvValues(pvMap)
    } else {
      setResultados([])
      setPvValues({})
    }
  }

  useEffect(() => { loadLigas() }, [])

  useEffect(() => {
    if (ligaId) loadRondas(ligaId)
    else { setRondas([]); setJugadores({}) }
  }, [ligaId])

  useEffect(() => {
    if (rondaId) loadRondaEnfs(rondaId)
    else { setEnfrentamientos([]); setResultados([]) }
  }, [rondaId])

  function flash(text, isError = false) {
    setMsg({ text, isError })
    setTimeout(() => setMsg(null), 3000)
  }

  function getExistingResult(enfId) {
    return resultados.find(r => r.enfrentamiento_id === enfId)
  }

  async function handleSaveResult(enf) {
    const vals = pvValues[enf.id] || {}
    const pv1 = parseInt(vals.pv1)
    const pv2 = parseInt(vals.pv2)

    if (isNaN(pv1) || isNaN(pv2) || pv1 < 0 || pv2 < 0) {
      flash('Introduce puntos de victoria válidos (≥ 0)', true)
      return
    }

    const estado = vals.estado === 'suspendido' ? 'suspendido' : 'jugado'

    setSavingId(enf.id)
    const existing = getExistingResult(enf.id)

    if (existing) {
      const { error } = await supabase
        .from('resultados')
        .update({ pv1, pv2, estado, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
      if (error) flash(error.message, true)
      else flash('Resultado actualizado')
    } else {
      const { error } = await supabase
        .from('resultados')
        .insert({ enfrentamiento_id: enf.id, pv1, pv2, estado })
      if (error) flash(error.message, true)
      else flash('Resultado guardado')
    }

    await loadRondaEnfs(rondaId)
    setSavingId(null)
  }

  async function handleDeleteResult(enfId) {
    const existing = getExistingResult(enfId)
    if (!existing) return
    const { error } = await supabase.from('resultados').delete().eq('id', existing.id)
    if (error) flash(error.message, true)
    else {
      flash('Resultado eliminado')
      setPvValues(v => ({ ...v, [enfId]: { pv1: '', pv2: '' } }))
      await loadRondaEnfs(rondaId)
    }
  }

  async function syncFromSheets() {
    if (!ligaId) return
    setSyncing(true)
    setSyncMsg(null)

    try {
      const res = await fetch(SHEET_URL)
      if (!res.ok) throw new Error(`Error al obtener el sheet (${res.status})`)
      const text = await res.text()

      // Parse CSV: rows[0] = headers, rows[1..] = player data
      const rows = text.split('\n').map(r =>
        r.split(',').map(c => c.replace(/^"|"$/g, '').trim())
      )
      const headers = rows[0]

      // Build pvMatrix: normalizedPlayerName -> { roundNum: pv }
      const pvMatrix = {}
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        if (!row[0]) continue
        const playerNorm = normalize(row[0])
        pvMatrix[playerNorm] = {}
        for (let j = 1; j < headers.length; j++) {
          const roundNum = parseInt(headers[j].replace('Ronda ', ''))
          const pv = parseInt(row[j])
          if (!isNaN(roundNum) && !isNaN(pv)) pvMatrix[playerNorm][roundNum] = pv
        }
      }

      // Load all rondas + enfrentamientos for this liga
      const { data: allRondas } = await supabase.from('rondas').select('id, numero').eq('liga_id', ligaId)
      const { data: allEnfs } = await supabase.from('enfrentamientos')
        .select('id, ronda_id, jugador1_id, jugador2_id')
        .in('ronda_id', allRondas.map(r => r.id))

      // Load jugadores for this liga (normalized name -> id)
      const { data: parts } = await supabase.from('participaciones')
        .select('jugador_id, jugadores(id, nombre)')
        .eq('liga_id', ligaId)

      const jugNormMap = {}
      for (const p of parts || []) {
        if (p.jugadores) jugNormMap[normalize(p.jugadores.nombre)] = p.jugadores.id
      }

      // Build upserts
      const upserts = []
      let skipped = 0

      for (const enf of allEnfs) {
        const ronda = allRondas.find(r => r.id === enf.ronda_id)
        if (!ronda) continue

        const j1Norm = Object.entries(jugNormMap).find(([, id]) => id === enf.jugador1_id)?.[0]
        const j2Norm = Object.entries(jugNormMap).find(([, id]) => id === enf.jugador2_id)?.[0]

        const pv1 = pvMatrix[j1Norm]?.[ronda.numero]
        const pv2 = pvMatrix[j2Norm]?.[ronda.numero]

        if (pv1 === undefined || pv2 === undefined) { skipped++; continue }

        upserts.push({ enfrentamiento_id: enf.id, pv1, pv2, updated_at: new Date().toISOString() })
      }

      if (upserts.length > 0) {
        const { error } = await supabase.from('resultados')
          .upsert(upserts, { onConflict: 'enfrentamiento_id' })
        if (error) throw error
      }

      setSyncMsg({
        text: `✓ ${upserts.length} resultados sincronizados · ${skipped} pendientes`,
        isError: false,
      })
      if (rondaId) await loadRondaEnfs(rondaId)
    } catch (err) {
      setSyncMsg({ text: err.message, isError: true })
    }
    setSyncing(false)
  }

  function getMatchOutcome(pv1, pv2) {
    if (pv1 > pv2) return { j1: 'Victoria', j2: 'Derrota' }
    if (pv2 > pv1) return { j1: 'Derrota', j2: 'Victoria' }
    return { j1: 'Empate', j2: 'Empate' }
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

      {/* Sync from Google Sheets */}
      <div className="card">
        <h3 className="section-title">Sincronizar desde Google Sheets</h3>
        <p className="text-xs text-wh-muted mb-3">
          Lee la hoja "Resultados" del spreadsheet de la liga y actualiza todos los resultados automáticamente.
        </p>
        {syncMsg && (
          <div className={`text-sm px-3 py-2 rounded border mb-3 ${
            syncMsg.isError
              ? 'text-red-400 bg-red-400/10 border-red-400/30'
              : 'text-green-400 bg-green-400/10 border-green-400/30'
          }`}>
            {syncMsg.text}
          </div>
        )}
        <button
          onClick={syncFromSheets}
          disabled={syncing || !ligaId}
          className="btn-gold flex items-center gap-2"
        >
          {syncing ? (
            <>
              <div className="w-4 h-4 border-2 border-wh-bg border-t-transparent rounded-full animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sincronizar resultados
            </>
          )}
        </button>
        {!ligaId && <p className="text-xs text-wh-muted mt-2">Selecciona una liga primero</p>}
      </div>

      {/* Selectors */}
      <div className="card">
        <h3 className="section-title">Seleccionar Ronda</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-wh-muted mb-1">Liga</label>
            <select className="select-field" value={ligaId} onChange={e => setLigaId(e.target.value)}>
              <option value="">Selecciona liga...</option>
              {ligas.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-wh-muted mb-1">Ronda</label>
            <select
              className="select-field"
              value={rondaId}
              onChange={e => setRondaId(e.target.value)}
              disabled={!ligaId}
            >
              <option value="">Selecciona ronda...</option>
              {rondas.map(r => <option key={r.id} value={r.id}>Ronda {r.numero} · {r.mision}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Match results */}
      {rondaId && enfrentamientos.length > 0 && (
        <div className="card">
          <h3 className="section-title">Resultados</h3>
          <div className="space-y-4">
            {enfrentamientos.map(enf => {
              const j1 = jugadores[enf.jugador1_id]
              const j2 = jugadores[enf.jugador2_id]
              const vals = pvValues[enf.id] || { pv1: '', pv2: '', estado: 'jugado' }
              const existing = getExistingResult(enf.id)
              const isSaving = savingId === enf.id
              const isSuspendida = vals.estado === 'suspendido'

              const pv1Num = parseInt(vals.pv1)
              const pv2Num = parseInt(vals.pv2)
              const hasValidValues = !isNaN(pv1Num) && !isNaN(pv2Num) && pv1Num >= 0 && pv2Num >= 0
              const outcome = hasValidValues ? getMatchOutcome(pv1Num, pv2Num) : null

              return (
                <div key={enf.id} className="bg-wh-surface/50 rounded-lg p-4">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex-1 text-center">
                      <p className="font-semibold text-sm text-wh-text">{j1?.nombre || 'J1'}</p>
                      <p className="text-xs text-wh-muted">{j1?.faccion || ''}</p>
                      {isSuspendida ? (
                        <span className="text-xs font-medium mt-1 inline-block text-yellow-400">Suspendido</span>
                      ) : outcome && (
                        <span className={`text-xs font-medium mt-1 inline-block ${
                          outcome.j1 === 'Victoria' ? 'text-green-400' :
                          outcome.j1 === 'Derrota' ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {outcome.j1}
                        </span>
                      )}
                    </div>
                    <span className="text-wh-muted font-cinzel text-sm flex-shrink-0">VS</span>
                    <div className="flex-1 text-center">
                      <p className="font-semibold text-sm text-wh-text">{j2?.nombre || 'J2'}</p>
                      <p className="text-xs text-wh-muted">{j2?.faccion || ''}</p>
                      {isSuspendida ? (
                        <span className="text-xs font-medium mt-1 inline-block text-yellow-400">Suspendido</span>
                      ) : outcome && (
                        <span className={`text-xs font-medium mt-1 inline-block ${
                          outcome.j2 === 'Victoria' ? 'text-green-400' :
                          outcome.j2 === 'Derrota' ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {outcome.j2}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* PV inputs */}
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      className="input-field text-center font-cinzel text-lg font-bold text-gold"
                      value={vals.pv1}
                      onChange={e => setPvValues(v => ({ ...v, [enf.id]: { ...v[enf.id], pv1: e.target.value } }))}
                      placeholder="PV"
                      min="0"
                      max="100"
                    />
                    <span className="text-wh-muted font-cinzel flex-shrink-0">–</span>
                    <input
                      type="number"
                      className="input-field text-center font-cinzel text-lg font-bold text-gold"
                      value={vals.pv2}
                      onChange={e => setPvValues(v => ({ ...v, [enf.id]: { ...v[enf.id], pv2: e.target.value } }))}
                      placeholder="PV"
                      min="0"
                      max="100"
                    />
                  </div>

                  {/* Suspendida control */}
                  <div className="mt-3 pt-3 border-t border-wh-border/40">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isSuspendida}
                        onChange={e => setPvValues(v => ({ ...v, [enf.id]: { ...v[enf.id], estado: e.target.checked ? 'suspendido' : 'jugado' } }))}
                        className="accent-yellow-400 w-4 h-4"
                      />
                      <span className="text-xs font-medium text-yellow-400">Partida suspendida (walkover)</span>
                    </label>
                    {isSuspendida && (
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setPvValues(v => ({ ...v, [enf.id]: { ...v[enf.id], pv1: '100', pv2: '0', estado: 'suspendido' } }))}
                          className="flex-1 text-xs py-1 rounded border border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/10 transition-colors"
                        >
                          Gana {j1?.nombre || 'J1'} (100–0)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPvValues(v => ({ ...v, [enf.id]: { ...v[enf.id], pv1: '0', pv2: '100', estado: 'suspendido' } }))}
                          className="flex-1 text-xs py-1 rounded border border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/10 transition-colors"
                        >
                          Gana {j2?.nombre || 'J2'} (0–100)
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleSaveResult(enf)}
                      disabled={isSaving}
                      className="btn-gold flex-1 text-sm py-1.5"
                    >
                      {isSaving ? 'Guardando...' : existing ? 'Actualizar' : 'Guardar'}
                    </button>
                    {existing && (
                      <button
                        onClick={() => handleDeleteResult(enf.id)}
                        className="btn-danger text-sm py-1.5 px-3"
                        title="Eliminar resultado"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {existing && (
                    <p className="text-xs text-wh-muted mt-2 text-center">
                      Último guardado: {new Date(existing.updated_at).toLocaleString('es-ES')}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {rondaId && enfrentamientos.length === 0 && (
        <div className="card text-center py-8">
          <p className="text-wh-muted">No hay enfrentamientos en esta ronda</p>
        </div>
      )}
    </div>
  )
}
