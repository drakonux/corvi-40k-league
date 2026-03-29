import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function Header() {
  const { user, isAdmin, signOut } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (path) => location.pathname === path

  return (
    <header className="bg-wh-surface border-b border-wh-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="Corvi 40K Leagues"
            className="w-8 h-8 object-contain"
          />
          <span className="font-cinzel text-lg font-bold text-gold group-hover:text-gold-light transition-colors tracking-widest uppercase">
            Corvi 40K Leagues
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/"
            className={`font-inter text-sm font-medium transition-colors ${
              isActive('/') ? 'text-gold' : 'text-wh-muted hover:text-wh-text'
            }`}
          >
            Inicio
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className={`font-inter text-sm font-medium transition-colors ${
                isActive('/admin') ? 'text-gold' : 'text-wh-muted hover:text-wh-text'
              }`}
            >
              Admin
            </Link>
          )}
          {user && (
            <button
              onClick={signOut}
              className="text-sm text-wh-muted hover:text-crimson-light transition-colors"
            >
              Cerrar sesión
            </button>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-wh-muted hover:text-gold transition-colors p-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-wh-surface border-t border-wh-border px-4 py-3 flex flex-col gap-3">
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="text-sm text-wh-text hover:text-gold transition-colors"
          >
            Inicio
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMenuOpen(false)}
              className="text-sm text-wh-text hover:text-gold transition-colors"
            >
              Admin
            </Link>
          )}
          {user && (
            <button
              onClick={() => { signOut(); setMenuOpen(false) }}
              className="text-sm text-left text-wh-muted hover:text-crimson-light transition-colors"
            >
              Cerrar sesión
            </button>
          )}
        </div>
      )}
    </header>
  )
}
