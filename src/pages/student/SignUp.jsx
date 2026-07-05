import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      <main className="flex-grow flex items-center justify-center p-6 md:p-8 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[120px]"></div>
        
        {/* Registration Card */}
        <div className="w-full max-w-[400px] z-10">
          {/* Brand Anchor */}
          <div className="text-center mb-10">
            <h1 className="text-xl font-extrabold tracking-tighter text-primary mb-2">SiPena</h1>
            <p className="text-on-surface-variant font-medium tracking-tight">Buat akun untuk memulai pendaftaran siswa baru.</p>
          </div>
          
          {/* Luminary Card Structure */}
          <div className="bg-surface-container-lowest rounded-xl shadow-[0px_12px_32px_rgba(26,28,28,0.06)] p-6 md:p-8">
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); navigate('/step1'); }}>
              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold tracking-wide text-on-surface ml-1">Email Address</label>
                <div className="relative">
                  <input className="w-full bg-surface-container-high border-none rounded-lg px-4 py-2.5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 transition-all outline-none" placeholder="name@company.com" type="email" />
                </div>
              </div>
              
              {/* HP Number (Phone) */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold tracking-wide text-on-surface ml-1">HP Number</label>
                <div className="relative flex">
                  <span className="inline-flex items-center px-4 bg-surface-container rounded-l-lg text-on-surface-variant text-sm font-medium border-r border-outline-variant/20">
                      +62
                  </span>
                  <input className="w-full bg-surface-container-high border-none rounded-r-lg px-4 py-2.5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 transition-all outline-none" placeholder="812 3456 7890" type="tel" />
                </div>
              </div>
              
              {/* Password Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold tracking-wide text-on-surface ml-1">Password</label>
                <div className="relative">
                  <input className="w-full bg-surface-container-high border-none rounded-lg px-4 py-2.5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 transition-all outline-none" placeholder="••••••••" type={showPassword ? "text" : "password"} />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors" type="button">
                    <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
              
              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold tracking-wide text-on-surface ml-1">Confirm Password</label>
                <div className="relative">
                  <input className="w-full bg-surface-container-high border-none rounded-lg px-4 py-2.5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 transition-all outline-none" placeholder="••••••••" type="password" />
                </div>
              </div>
              
              {/* Terms Checkbox */}
              <div className="flex items-start gap-3 pt-2">
                <div className="flex items-center h-5">
                  <input className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20 cursor-pointer" id="terms" type="checkbox" />
                </div>
                <label className="text-sm text-on-surface-variant leading-relaxed cursor-pointer select-none" htmlFor="terms">
                  I agree to the <span className="text-primary font-semibold hover:underline decoration-primary/30">Terms of Service</span> and <span className="text-primary font-semibold hover:underline decoration-primary/30">Privacy Policy</span>.
                </label>
              </div>
              
              {/* Primary Action Button */}
              <div className="pt-4">
                <button className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold py-2.5 rounded-full shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all duration-200" type="submit">
                  Buat Akun
                </button>
              </div>
            </form>
            
            {/* Footer Link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-on-surface-variant">
                  Sudah punya akun? <Link className="text-primary font-bold hover:underline decoration-primary/30 transition-all" to="#">Masuk di sini</Link>
              </p>
            </div>
          </div>
          
          {/* Social Proof / Footer Note */}
          <div className="mt-12 flex flex-col items-center">
            <div className="flex -space-x-3 mb-4">
              <img alt="User" className="w-10 h-10 rounded-full border-2 border-surface-container-lowest" data-alt="Close up portrait of a professional woman..." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwIxvkndc4oh90iSXI3zFtsrK49bi89cEK3UKxNCLgtjZLwLmfNOOK5Fv3S5KjJChh6QYoBCIzrud_pdS6ABrSoJXsfN9PCS-TSjkZVyP9gdt3lp7g5bIEV_40FIviefZeJRAvgnRUcB7AJ1RtbkQKIQ5tsuzbgnXKbSRd0YXoGNHH9XIcXagrP6vzYEW-0geLt-3_iNnSShF7uaI8ESqw6pScfbuF10iAd_nGH7dC3GtM_DlLQMazimyn_-q46dy9ol1jjhIM173w" />
              <img alt="User" className="w-10 h-10 rounded-full border-2 border-surface-container-lowest" data-alt="Portrait of a young creative professional man..." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAzkL-Dm8S5K8SZYz1arrGo6MS0vLOlk4wuyz9RfEMp96fiZ528UnxnOByvxYO-k79WTcJrRcXvm0bX1jlEWKoNMlhGSj815beq3c7uGrSW8t9ZBKEdafT0bdg0GQRVzUmvv4eMT6RlghrFPz818JmvMIV5Bkyqihj0qmPDd-KNRqAAT8I0qk92flcWTeO-uzJleWQe11aVq5oSXBzWkardX9UnM2JGSk6ozSKyKQ2TYZQsS-54WqoIR03QIClaIBuojF635jp1mtGx" />
              <img alt="User" className="w-10 h-10 rounded-full border-2 border-surface-container-lowest" data-alt="Diverse professional woman smiling warmly..." src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6txeJmKPxOIxBfFfFR-43zQkDTz6zdaAMFg1p-xpBsFRIk488LIm3czi0dtyU-9bmkJqEPmwq2vsisN4aYmpvF0GsOfDuAvJHj3pnSu7IaJXTlShGXK3yAUnTx3Cz42RIbh4ZyDxV-Z6s7Bxyt8Ow73el72XSNG6n_viWbyKa6Ly4net94c9o9ZcTalWqMgwsmMpGOU2UGfPutb10p3V4hD7NqiRaMSwBovFVUhboNm7EE8IwCJYp-37pCONG-WT1NslBtG-rNLpP" />
            </div>
            <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-outline">Trusted by 500+ Institutions</p>
          </div>
        </div>
      </main>

      {/* Footer Component Anchor */}
      <footer className="bg-slate-50 py-12 relative z-10 w-full">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0 text-center md:text-left">
            <span className="font-bold text-slate-900 tracking-tight">SiPena</span>
            <p className="font-sans text-xs tracking-normal text-slate-500 mt-1">© 2026 SiPena. Sistem Penerimaan Peserta Didik Baru.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <Link className="text-slate-500 hover:text-blue-600 font-sans text-xs transition-colors" to="#">Privacy Policy</Link>
            <Link className="text-slate-500 hover:text-blue-600 font-sans text-xs transition-colors" to="#">Terms of Service</Link>
            <Link className="text-slate-500 hover:text-blue-600 font-sans text-xs transition-colors" to="#">Help Center</Link>
            <Link className="text-slate-500 hover:text-blue-600 font-sans text-xs transition-colors" to="#">Contact Support</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
