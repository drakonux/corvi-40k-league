import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { computeStandings } from '../lib/standings'

function LigaActivaCard({ liga }) {
  return (
    <Link
      to={`/liga/${liga.id}`}
      className="block card border-gold/40 hover:border-gold transition-all group relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gold/5 group-hover:bg-gold/10 transition-all" />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-400/10 border border-green-400/30 rounded-full px-2.5 py-0.5 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Liga Activa
            </span>
            <h2 className="font-cinzel text-2xl text-gold font-bold">{liga.nombre}</h2>
            {liga.temporada && (
              <p className="text-wh-muted text-sm mt-1">Temporada {liga.temporada}</p>
            )}
          </div>
          {liga.logo_url && (
            <img src={liga.logo_url} alt={liga.nombre} className="w-16 h-16 object-contain" />
          )}
        </div>
        <div className="flex items-center gap-2 text-gold group-hover:text-gold-light transition-colors mt-4">
          <span className="font-inter text-sm font-semibold">Ver clasificación y rondas</span>
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  )
}

function LigaArchivoCard({ liga, champion }) {
  return (
    <Link
      to={`/liga/${liga.id}`}
      className="block card hover:border-wh-text/30 transition-all group"
    >
      <div className="flex items-start gap-3">
        {liga.logo_url && (
          <img src={liga.logo_url} alt={liga.nombre} className="w-12 h-12 object-contain flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-cinzel text-wh-text font-semibold truncate group-hover:text-gold transition-colors">
            {liga.nombre}
          </h3>
          {liga.temporada && (
            <p className="text-xs text-wh-muted mt-0.5">Temporada {liga.temporada}</p>
          )}
          {champion && (
            <p className="text-xs text-gold mt-1 flex items-center gap-1">
              <span>🏆</span>
              <span className="truncate">{champion.nombre}</span>
            </p>
          )}
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-gold bg-gold/10 border border-gold/30 rounded px-1.5 py-0.5 flex-shrink-0">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Finalizada
        </span>
      </div>
    </Link>
  )
}

export default function Home() {
  const [ligaActiva, setLigaActiva] = useState(null)
  const [ligasHistoricas, setLigasHistoricas] = useState([])
  const [champions, setChampions] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: ligas } = await supabase
        .from('ligas')
        .select('*')
        .order('created_at', { ascending: false })

      if (!ligas) { setLoading(false); return }

      const activa = ligas.find(l => l.estado === 'activa') || null
      const historicas = ligas.filter(l => l.estado === 'finalizada')

      setLigaActiva(activa)
      setLigasHistoricas(historicas)

      // Compute champions for historical ligas
      const champMap = {}
      for (const liga of historicas) {
        const champ = await getChampion(liga.id)
        if (champ) champMap[liga.id] = champ
      }
      setChampions(champMap)
      setLoading(false)
    }
    load()
  }, [])

  async function getChampion(ligaId) {
    const [{ data: participaciones }, { data: rondas }] = await Promise.all([
      supabase.from('participaciones').select('jugador_id, jugadores(nombre, faccion)').eq('liga_id', ligaId),
      supabase.from('rondas').select('id').eq('liga_id', ligaId),
    ])

    if (!rondas || rondas.length === 0) return null
    const rondaIds = rondas.map(r => r.id)

    const { data: enfrentamientos } = await supabase
      .from('enfrentamientos')
      .select('id, jugador1_id, jugador2_id')
      .in('ronda_id', rondaIds)

    if (!enfrentamientos || enfrentamientos.length === 0) return null
    const enfIds = enfrentamientos.map(e => e.id)

    const { data: resultados } = await supabase
      .from('resultados')
      .select('enfrentamiento_id, pv1, pv2')
      .in('enfrentamiento_id', enfIds)

    const standings = computeStandings(participaciones || [], enfrentamientos, resultados || [])
    return standings[0]?.jugador || null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 fade-in">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="Corvi 40K Leagues"
            className="w-24 h-24 object-contain"
          />
        </div>
        <h1 className="font-cinzel text-4xl md:text-5xl font-black text-gold gold-glow mb-3 tracking-widest uppercase">
          Corvi 40K Leagues
        </h1>
        <p className="text-wh-muted font-inter text-base">
          Ligas de Warhammer 40,000 · Tienda Corvi Juegos
        </p>
        <div className="flex justify-center mt-4">
          <div className="h-px w-32 bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
        </div>
      </div>

      {/* Liga activa */}
      {ligaActiva ? (
        <section className="mb-10">
          <h2 className="section-title">Liga en curso</h2>
          <LigaActivaCard liga={ligaActiva} />
        </section>
      ) : (
        <section className="mb-10">
          <div className="card text-center py-10">
            <p className="text-wh-muted font-cinzel">No hay ninguna liga activa actualmente</p>
          </div>
        </section>
      )}

      {/* Archivo histórico */}
      {ligasHistoricas.length > 0 && (
        <section>
          <h2 className="section-title">Archivo histórico</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {ligasHistoricas.map(liga => (
              <LigaArchivoCard
                key={liga.id}
                liga={liga}
                champion={champions[liga.id]}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
