import { Routes, Route } from 'react-router-dom'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Home from './pages/Home'
import LigaPage from './pages/LigaPage'
import JugadorPage from './pages/JugadorPage'
import AdminPage from './pages/AdminPage'

export default function App() {
  return (
    <div className="min-h-screen bg-wh-bg flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/liga/:id" element={<LigaPage />} />
          <Route path="/jugador/:id" element={<JugadorPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
