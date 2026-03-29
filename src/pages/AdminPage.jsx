import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import AdminLigas from '../components/admin/AdminLigas'
import AdminJugadores from '../components/admin/AdminJugadores'
import AdminRondas from '../components/admin/AdminRondas'
import AdminResultados from '../components/admin/AdminResultados'

const TABS = ['Ligas', 'Jugadores', 'Rondas', 'Resultados']

export default function AdminPage() {
  const { user, loading, isAdmin, signIn, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState(0)
  const navigate = useNavigate()

  // Redirect non-admin authenticated users
  useEffect(() => {
    if (!loading && user && !isAdmin) {
      signOut().then(() => navigate('/'))
    }
  }, [user, loading, isAdmin])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Not logged in
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="card">
          <div className="flex justify-center mb-6">
            <svg className="w-14 h-14" viewBox="0 0 40 40" fill="none">
              <polygon points="20,3 37,32 3,32" stroke="#c9a84c" strokeWidth="2.5" fill="none" />
              <circle cx="20" cy="20" r="6" fill="#8b0000" />
            </svg>
          </div>
          <h1 className="font-cinzel text-xl font-bold text-gold mb-2">Panel de Administración</h1>
          <p className="text-wh-muted text-sm mb-6">
            Acceso restringido. Inicia sesión con tu cuenta de GitHub autorizada.
          </p>
          <button
            onClick={signIn}
            className="btn-gold w-full flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
            </svg>
            Iniciar sesión con GitHub
          </button>
        </div>
      </div>
    )
  }

  // Authenticated but not admin
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="card">
          <p className="text-red-400 font-cinzel mb-2">Acceso denegado</p>
          <p className="text-wh-muted text-sm">Tu cuenta no tiene permisos de administrador.</p>
          <button onClick={signOut} className="btn-outline mt-4">Cerrar sesión</button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-cinzel text-2xl font-bold text-gold">Panel Admin</h1>
          <p className="text-xs text-wh-muted mt-0.5">{user.email}</p>
        </div>
        <button onClick={signOut} className="btn-outline text-sm">
          Cerrar sesión
        </button>
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

      {/* Content */}
      {activeTab === 0 && <AdminLigas />}
      {activeTab === 1 && <AdminJugadores />}
      {activeTab === 2 && <AdminRondas />}
      {activeTab === 3 && <AdminResultados />}
    </div>
  )
}
