import React from 'react'
import { Link } from 'react-router-dom'

export default function StudentFooter() {
  return (
    <footer className="bg-surface border-t border-outline-variant/50 w-full py-12 mt-auto z-10 relative">
      <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start">
          <span className="font-bold text-on-surface text-lg mb-2">SiPena</span>
          <p className="font-sans text-xs tracking-normal text-outline">© 2026 SiPena. Sistem Penerimaan Peserta Didik Baru.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          <Link className="text-outline hover:text-primary text-xs transition-colors" to="#">Privacy Policy</Link>
          <Link className="text-outline hover:text-primary text-xs transition-colors" to="#">Terms of Service</Link>
          <Link className="text-outline hover:text-primary text-xs transition-colors" to="#">Help Center</Link>
          <Link className="text-outline hover:text-primary text-xs transition-colors" to="#">Contact Support</Link>
        </div>
      </div>
    </footer>
  )
}
