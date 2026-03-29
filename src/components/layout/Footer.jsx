export default function Footer() {
  return (
    <footer className="bg-wh-surface border-t border-wh-border mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-6 flex justify-center">
        <p className="text-xs text-wh-muted font-inter">
          Ligas de Warhammer 40,000 ·{' '}
          <a
            href="https://corvijuegos.com/"
            className="text-gold hover:text-gold-light transition-colors hover:underline"
          >
            Tienda Corvi Juegos
          </a>
        </p>
      </div>
    </footer>
  )
}
