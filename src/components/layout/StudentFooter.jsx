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
          <Link className="text-outline hover:text-primary text-xs transition-colors" to="/kebijakan-privasi">Kebijakan Privasi</Link>
          <Link className="text-outline hover:text-primary text-xs transition-colors" to="/ketentuan-layanan">Ketentuan Layanan</Link>
          <a className="text-outline hover:text-primary text-xs transition-colors" href="https://wa.me/6285624963293?text=Halo%20Admin%20PPDB%20SiPena%2C%20saya%20butuh%20bantuan%20terkait%20pendaftaran." target="_blank" rel="noreferrer">Pusat Bantuan</a>
          <a className="text-outline hover:text-primary text-xs transition-colors" href="mailto:Syahputraradi7@gmail.com?subject=Tanya%20PPDB%20SiPena">Hubungi Dukungan</a>
        </div>
      </div>
    </footer>
  )
}
