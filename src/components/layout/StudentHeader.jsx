import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../../firebase/config'

export default function StudentHeader() {
  const [user, setUser] = useState(null)
  const location = useLocation()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return () => unsub()
  }, [])

  // Inisial dari displayName atau email
  const initials = user
    ? (user.displayName
        ? user.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        : user.email?.[0]?.toUpperCase() ?? 'S')
    : 'S'

  return (
    <header className="bg-white/90 backdrop-blur-lg shadow-[0px_12px_32px_rgba(26,28,28,0.06)] fixed top-0 w-full z-50">
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-screen-2xl mx-auto">
        <Link to="/dashboard" className="text-2xl font-extrabold tracking-tighter text-primary">
          SiPena
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className={`hidden md:inline text-sm font-semibold transition-colors py-1 ${
              location.pathname === '/dashboard'
                ? 'text-primary border-b-2 border-primary'
                : 'text-outline hover:text-primary'
            }`}
          >
            Pendaftaran
          </Link>

          {/* Avatar inisial — tidak pakai foto palsu */}
          <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center ring-2 ring-primary/20 cursor-pointer select-none">
            <span className="text-white text-sm font-bold">{initials}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
