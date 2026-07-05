import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import logoYppt from '../../assets/logo.jpg'

export default function AdminSidebar({ isOpen, onClose }) {
  const location = useLocation()
  const currentPath = location.pathname

  const navItems = [
    { name: 'Dashboard',    path: '/admin',           icon: 'dashboard' },
    { name: 'Verifikasi',   path: '/verification',    icon: 'verified_user' },
    { name: 'QR Scanning',  path: '/scanning',         icon: 'qr_code_scanner' },
    { name: 'Riwayat Scan', path: '/scanning/history', icon: 'history' },
    { name: 'Administrasi', path: '/administration',   icon: 'admin_panel_settings' },
    { name: 'Laporan',      path: '/reports',          icon: 'analytics' }
  ]

  const checkIsActive = (path) => {
    if (path === '/scanning') return currentPath === '/scanning'
    return currentPath === path || currentPath.startsWith(path + '/')
  }

  return (
    <aside className={`layout-sidebar fixed left-0 top-0 h-full flex flex-col bg-white w-64 border-r border-outline-variant/30 z-50 transition-transform duration-300 md:translate-x-0 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      {/* Logo & Close (Mobile) */}
      <div className="px-6 pt-6 pb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logoYppt} alt="Logo YPPT" className="w-8 h-8 rounded-lg object-cover" />
          <div className="flex flex-col">
            <h1 className="text-lg font-extrabold text-primary tracking-tight leading-none">SiPena</h1>
            <p className="text-[9px] font-bold uppercase tracking-wider text-outline mt-1 leading-none">SMK YPPT Garut</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="md:hidden w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">close</span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = checkIsActive(item.path)
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-white shadow-sm shadow-primary/10 translate-x-1'
                  : 'text-slate-600 hover:bg-blue-50/60 hover:text-primary hover:translate-x-1'
              }`}
            >
              <span
                className="material-symbols-outlined text-lg md:text-xl transition-transform duration-150 group-hover:scale-105"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-outline-variant/30">
        <p className="text-[10px] text-outline text-center">© 2026 SiPena</p>
      </div>
    </aside>
  )
}