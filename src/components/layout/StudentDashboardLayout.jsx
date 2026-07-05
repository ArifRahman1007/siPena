import React from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase/config'
import StudentFooter from './StudentFooter'
import logoYppt from '../../assets/logo.jpg'

export default function StudentDashboardLayout() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      localStorage.removeItem('lastApplicationId')
      localStorage.removeItem('lastRegistrationNumber')
      localStorage.removeItem('revisionMode')
      navigate('/login-siswa')
    } catch (error) {
      console.error('Gagal logout:', error)
      alert('Gagal logout. Silakan coba lagi.')
    }
  }

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen flex flex-col font-body">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg shadow-[0px_12px_32px_rgba(26,28,28,0.06)]">
        <nav className="flex justify-between items-center w-full px-6 py-4 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3">
            <img src={logoYppt} alt="Logo YPPT" className="w-8 h-8 rounded-lg object-cover" />
            <div className="flex flex-col">
              <div className="text-lg md:text-xl font-extrabold tracking-tighter text-blue-700 dark:text-blue-400 leading-none">
                SiPena
              </div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">
                SMK YPPT Garut
              </p>
            </div>

            <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-slate-300"></span>

            <p className="hidden sm:block text-sm font-bold text-slate-500 uppercase tracking-widest">
              Dashboard Siswa
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/25 active:scale-95 transition-all duration-200"
          >
            <span className="material-symbols-outlined text-[20px] group-hover:translate-x-0.5 transition-transform">
              logout
            </span>
            <span>Logout</span>
          </button>
        </nav>
      </header>

      <div className="flex-grow flex flex-col">
        <Outlet />
      </div>

      <StudentFooter />
    </div>
  )
}