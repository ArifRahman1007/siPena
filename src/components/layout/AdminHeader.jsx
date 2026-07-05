import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { toast } from 'sonner'
import { auth, db } from '../../firebase/config'
import logoYppt from '../../assets/logo.jpg'

export default function AdminHeader({ onMenuClick, darkMode, onToggleDarkMode }) {
  const navigate = useNavigate()
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAdminEmail(user.email || '')
        // Ambil nama dari Firestore
        try {
          const docSnap = await getDoc(doc(db, 'users', user.uid))
          if (docSnap.exists()) {
            setAdminName(docSnap.data().fullName || user.displayName || user.email)
          } else {
            setAdminName(user.displayName || user.email || 'Admin')
          }
        } catch {
          setAdminName(user.displayName || user.email || 'Admin')
        }
      }
    })
    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate('/admin-login')
    } catch (error) {
      console.error('Logout gagal:', error)
      toast.error('Logout gagal.')
    }
  }

  const initials = adminName
    ? adminName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD'

  return (
    <header className="layout-header sticky top-0 z-40 bg-white border-b border-outline-variant/30 shadow-[0px_4px_20px_rgba(0,0,0,0.01)]">
      <div className="flex justify-between items-center w-full px-4 md:px-8 py-3.5">
        <div className="flex items-center gap-3">
          {/* Tombol Hamburger (Hanya Mobile) */}
          <button
            onClick={onMenuClick}
            className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-2xl text-on-surface-variant">menu</span>
          </button>

          <div className="flex items-center gap-2.5 md:hidden">
            <img src={logoYppt} alt="Logo YPPT" className="w-7 h-7 rounded-lg object-cover" />
            <div className="flex flex-col">
              <h2 className="text-base font-extrabold tracking-tighter text-primary leading-none">
                SiPena
              </h2>
              <span className="text-[8px] uppercase tracking-wider font-bold text-outline mt-1 leading-none">
                SMK YPPT Garut
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Theme Switch Button */}
          <button
            onClick={onToggleDarkMode}
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200/50 hover:bg-slate-100 text-on-surface-variant hover:text-primary transition-all active:scale-95"
            title={darkMode ? 'Nyalakan Mode Terang' : 'Nyalakan Mode Gelap'}
          >
            <span className="material-symbols-outlined text-lg md:text-xl">
              {darkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* Admin Info */}
          {adminName && (
            <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50/80 border border-slate-100">
              <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center text-[10px] font-extrabold">
                {initials}
              </div>
              <div className="leading-tight">
                <p className="text-[11px] font-bold text-slate-800">{adminName}</p>
                <p className="text-[9px] text-slate-500">{adminEmail}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white hover:border-red-600 hover:shadow-lg hover:shadow-red-500/25 active:scale-95 transition-all duration-200 font-bold text-xs md:text-sm"
          >
            <span>Logout</span>
            <span className="material-symbols-outlined text-[16px] transition-transform duration-200 group-hover:translate-x-0.5">
              logout
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}