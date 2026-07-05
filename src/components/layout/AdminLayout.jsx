import React, { useState, useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'

// ─── Canvas Falling Stars (Bintang Jatuh Tipis) ──────────────────────────────
function FallingStars() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationId
    let stars = []
    let backgroundStars = []

    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth || window.innerWidth
      canvas.height = canvas.parentElement.clientHeight || window.innerHeight
      initBgStars()
    }

    const initBgStars = () => {
      backgroundStars = []
      const count = Math.floor((canvas.width * canvas.height) / 12000)
      for (let i = 0; i < count; i++) {
        backgroundStars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 0.7 + 0.2,
          alpha: Math.random(),
          speed: Math.random() * 0.015 + 0.005
        })
      }
    }

    const createShootingStar = () => {
      return {
        x: Math.random() * canvas.width * 0.8,
        y: Math.random() * canvas.height * 0.3,
        length: Math.random() * 60 + 30,
        speed: Math.random() * 4 + 3,
        dx: Math.random() * 1.5 + 2.5,
        dy: Math.random() * 1.5 + 1.2,
        alpha: 1,
        thickness: Math.random() * 0.6 + 0.3
      }
    }

    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 1. Draw twinkling background stars
      backgroundStars.forEach((s) => {
        s.alpha += s.speed
        if (s.alpha > 1 || s.alpha < 0) s.speed = -s.speed
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, s.alpha * 0.35)})`
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      // 2. Spawn shooting stars
      if (Math.random() < 0.006 && stars.length < 2) {
        stars.push(createShootingStar())
      }

      // 3. Draw shooting stars
      stars.forEach((s, idx) => {
        s.x += s.dx
        s.y += s.dy
        s.alpha -= 0.012

        if (s.alpha <= 0 || s.x > canvas.width || s.y > canvas.height) {
          stars.splice(idx, 1)
          return
        }

        const gradient = ctx.createLinearGradient(
          s.x, s.y,
          s.x - s.dx * (s.length / 5),
          s.y - s.dy * (s.length / 5)
        )
        gradient.addColorStop(0, `rgba(255, 255, 255, ${s.alpha * 0.65})`)
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

        ctx.strokeStyle = gradient
        ctx.lineWidth = s.thickness
        ctx.beginPath()
        ctx.moveTo(s.x, s.y)
        ctx.lineTo(
          s.x - s.dx * (s.length / 5),
          s.y - s.dy * (s.length / 5)
        )
        ctx.stroke()
      })

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
    />
  )
}

export default function AdminLayout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark')

  // Sync dengan element document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }

    // Ketika unmount layout admin (misal saat logout), pastikan class dark dihapus agar halaman luar normal
    return () => {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Tutup sidebar otomatis ketika berpindah halaman di mobile
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-[#f8fafc] text-on-surface antialiased font-body overflow-x-hidden relative transition-colors duration-300">
      {/* Efek Bintang Jatuh (Hanya saat Dark Mode) */}
      {darkMode && <FallingStars />}

      {/* Shared Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Backdrop overlay saat sidebar terbuka di mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="md:ml-64 min-h-screen flex-1 flex flex-col relative overflow-x-hidden">
        {/* Shared Header */}
        <AdminHeader
          onMenuClick={() => setSidebarOpen(true)}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        />

        {/* Dynamic Page Content Inject */}
        <section className="flex-1 overflow-x-hidden">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="min-h-full overflow-x-hidden"
          >
            <Outlet />
          </motion.div>
        </section>

        {/* Shared Footer */}
        <footer className="mt-auto border-t border-outline-variant/30 bg-white py-3.5 px-8 z-10 w-full">
          <p className="text-xs text-slate-400 text-center">
            © 2026 SiPena — Admin Portal
          </p>
        </footer>
      </main>
    </div>
  )
}