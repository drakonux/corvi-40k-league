import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const EMPTY_FORM = {
  nombre: '',
  temporada: '',
  fecha_inicio: '',
  fecha_fin: '',
  logo_url: '',
  estado: 'activa',
}

export default function AdminLigas() {
  const [ligas, setLigas] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  async function loadLigas() {
    const { data } = await supabase.from('ligas').select('*').order('created_at', { ascending: false })
    setLigas(data || [])
  }

  useEffect(() => { loadLigas() }, [])

  function flash(text, isError = false) {
    setMsg({ text, isError })
    setTimeout(() => setMsg(null), 3000)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre.trim()) return
    setLoading(true)

    try {
      if (editId) {
        const { error } = await supabase.from('ligas').update({
          nombre: form.nombre,
          temporada: form.temporada || null,
          fecha_inicio: form.fecha_inicio || null,
          fecha_fin: form.fecha_fin || null,
          logo_url: form.logo_url || null,
          estado: form.estado,
        }).eq('id', editId)
        if (error) throw error
        flash('Liga actualizada')
      } else {
        const { error } = await supabase.from('ligas').insert({
          nombre: form.nombre,
          temporada: form.temporada || null,
          fecha_inicio: form.fecha_inicio || null,
          fecha_fin: form.fecha_fin || null,
          logo_url: form.logo_url || null,
          estado: form.estado,
        })
        if (error) throw error
        flash('Liga creada')
      }

      setForm(EMPTY_FORM)
      setEditId(null)
      await loadLigas()
    } catch (err) {
      flash(err.message, true)
    }
    setLoading(false)
  }

  async function handleActivar(id) {
    setLoading(true)
    try {
      // Deactivate all
      await supabase.from('ligas').update({ estado: 'finalizada' }).neq('id', id)
      // Activate selected
      const { error } = await supabase.from('ligas').update({ estado: 'activa' }).eq('id', id)
      if (error) throw error
      flash('Liga marcada como activa')
      await loadLigas()
    } catch (err) {
      flash(err.message, true)
    }
    setLoading(false)
  }

  function handleEdit(liga) {
    setEditId(liga.id)
    setForm({
      nombre: liga.nombre || '',
      temporada: liga.temporada || '',
      fecha_inicio: liga.fecha_inicio || '',
      fecha_fin: liga.fecha_fin || '',
      logo_url: liga.logo_url || '',
      estado: liga.estado || 'activa',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleCancel() {
    setEditId(null)
    setForm(EMPTY_FORM)
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

      {/* Form */}
      <div className="card">
        <h3 className="section-title">{editId ? 'Editar Liga' : 'Nueva Liga'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-wh-muted mb-1">Nombre *</label>
              <input
                className="input-field"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="GDM CA-2025"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-wh-muted mb-1">Temporada</label>
              <input
                className="input-field"
                value={form.temporada}
                onChange={e => setForm(f => ({ ...f, temporada: e.target.value }))}
                placeholder="2025"
              />
            </div>
            <div>
              <label className="block text-xs text-wh-muted mb-1">Fecha inicio</label>
              <input
                type="date"
                className="input-field"
                value={form.fecha_inicio}
                onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-wh-muted mb-1">Fecha fin</label>
              <input
                type="date"
                className="input-field"
                value={form.fecha_fin}
                onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-wh-muted mb-1">URL Logo</label>
              <input
                className="input-field"
                value={form.logo_url}
                onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-xs text-wh-muted mb-1">Estado</label>
              <select
                className="select-field"
                value={form.estado}
                onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
              >
                <option value="activa">Activa</option>
                <option value="finalizada">Finalizada</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-gold" disabled={loading}>
              {editId ? 'Guardar cambios' : 'Crear liga'}
            </button>
            {editId && (
              <button type="button" onClick={handleCancel} className="btn-outline">
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List */}
      <div className="card">
        <h3 className="section-title">Ligas</h3>
        {ligas.length === 0 ? (
          <p className="text-wh-muted text-sm">No hay ligas</p>
        ) : (
          <div className="space-y-2">
            {ligas.map(l => (
              <div key={l.id} className="flex items-center justify-between bg-wh-surface/50 rounded px-4 py-3 gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-cinzel text-sm font-semibold text-wh-text truncate">{l.nombre}</p>
                  {l.temporada && <p className="text-xs text-wh-muted">T. {l.temporada}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    l.estado === 'activa'
                      ? 'text-green-400 bg-green-400/10 border-green-400/30'
                      : 'text-wh-muted border-wh-border'
                  }`}>
                    {l.estado}
                  </span>
                  {l.estado !== 'activa' && (
                    <button
                      onClick={() => handleActivar(l.id)}
                      disabled={loading}
                      className="text-xs text-gold hover:text-gold-light transition-colors"
                    >
                      Activar
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(l)}
                    className="text-xs text-wh-muted hover:text-wh-text transition-colors"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
