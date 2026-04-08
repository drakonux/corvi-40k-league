import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Clasificacion from '../components/liga/Clasificacion'
import Rondas from '../components/liga/Rondas'
import MiRonda from '../components/liga/MiRonda'

const TABS = ['Clasificación', 'Rondas', 'Mi Ronda']

export default function LigaPage() {
  const { id } = useParams()
  const [liga, setLiga] = useState(null)
  const [participaciones, setParticipaciones] = useState([])
  const [rondas, setRondas] = useState([])
  const [enfrentamientos, setEnfrentamientos] = useState([])
  const [resultados, setResultados] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)

      const { data: ligaData, error: ligaErr } = await supabase
        .from('ligas')
        .select('*')
        .eq('id', id)
        .single()

      if (ligaErr || !ligaData) {
        setError('Liga no encontrada')
        setLoading(false)
        return
      }
      setLiga(ligaData)

      const [
        { data: partsData },
        { data: rondasData },
      ] = await Promise.all([
        supabase
          .from('participaciones')
          .select('jugador_id, jugadores(id, nombre, faccion, faction_image)')
          .eq('liga_id', id),
        supabase
          .from('rondas')
          .select('id, liga_id, numero, mision, mision_url, despliegue, despliegue_url, layout, layout_url')
          .eq('liga_id', id)
          .order('numero'),
      ])

      setParticipaciones(partsData || [])
      setRondas(rondasData || [])

      if (rondasData && rondasData.length > 0) {
        const rondaIds = rondasData.map(r => r.id)
        const { data: enfsData } = await supabase
          .from('enfrentamientos')
          .select('*')
          .in('ronda_id', rondaIds)

        setEnfrentamientos(enfsData || [])

        if (enfsData && enfsData.length > 0) {
          const enfIds = enfsData.map(e => e.id)
          const { data: resData } = await supabase
            .from('resultados')
            .select('*')
            .in('enfrentamiento_id', enfIds)

          setResultados(resData || [])
        }
      }

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
        <p className="text-wh-muted font-cinzel text-lg">{error}</p>
        <Link to="/" className="btn-outline mt-4 inline-block">Volver al inicio</Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 fade-in">
      {/* Liga header */}
      <div className="mb-6">
        <Link to="/" className="text-wh-muted text-sm hover:text-gold transition-colors flex items-center gap-1 mb-6">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Inicio
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {liga.estado === 'activa' && (
                <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-400/10 border border-green-400/30 rounded-full px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Activa
                </span>
              )}
              {liga.estado === 'finalizada' && (
                <span className="text-xs text-wh-muted border border-wh-border rounded-full px-2 py-0.5">
                  Finalizada
                </span>
              )}
            </div>
            <h1 className="font-cinzel text-2xl md:text-3xl text-gold font-bold">{liga.nombre}</h1>
            {liga.temporada && (
              <p className="text-wh-muted text-sm mt-1">Temporada {liga.temporada}</p>
            )}
          </div>
          {liga.logo_url && (
            <img src={liga.logo_url} alt={liga.nombre} className="w-16 h-16 object-contain" />
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-wh-border mb-6 overflow-x-auto">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`tab-btn ${activeTab === i ? 'active' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 0 && (
        <Clasificacion
          participaciones={participaciones}
          enfrentamientos={enfrentamientos}
          resultados={resultados}
        />
      )}
      {activeTab === 1 && (
        <Rondas
          rondas={rondas}
          enfrentamientos={enfrentamientos}
          resultados={resultados}
          participaciones={participaciones}
        />
      )}
      {activeTab === 2 && (
        <MiRonda
          participaciones={participaciones}
          rondas={rondas}
          enfrentamientos={enfrentamientos}
          resultados={resultados}
        />
      )}
    </div>
  )
}
