import React from 'react'
import { Link } from 'react-router-dom'

export default function Success() {
  let registrationNumber =
    localStorage.getItem('lastRegistrationNumber') || 'Belum tersedia'

  if (registrationNumber && registrationNumber.startsWith('RH-')) {
    registrationNumber = registrationNumber.replace('RH-', 'SPN-')
  }

  const applicationId =
    localStorage.getItem('lastApplicationId') || 'Belum tersedia'

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-20 bg-surface">
      <section className="w-full max-w-3xl bg-surface-container-lowest rounded-[2rem] p-8 md:p-12 shadow-[0px_20px_60px_rgba(26,28,28,0.08)] text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>

        <div className="w-24 h-24 mx-auto rounded-full bg-green-500/10 text-green-600 flex items-center justify-center mb-8">
          <span
            className="material-symbols-outlined text-5xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
        </div>

        <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-5">
          Pendaftaran Berhasil
        </p>

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface mb-4">
          Data kamu sudah terkirim.
        </h1>

        <p className="text-on-surface-variant text-lg leading-relaxed max-w-2xl mx-auto mb-10">
          Pendaftaran sudah masuk ke sistem dan menunggu proses verifikasi admin.
          Simpan nomor pendaftaran berikut untuk mengecek status kamu.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-10">
          <div className="bg-surface-container p-5 rounded-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
              Nomor Pendaftaran
            </p>
            <p className="text-xl font-extrabold text-on-surface font-mono">
              {registrationNumber}
            </p>
          </div>

          <div className="bg-surface-container p-5 rounded-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
              Status Awal
            </p>
            <p className="text-xl font-extrabold text-primary">
              Menunggu Verifikasi
            </p>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 text-left mb-10">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-primary">
              info
            </span>

            <div>
              <h3 className="font-bold text-on-surface mb-1">
                Langkah berikutnya
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Admin akan memeriksa data dan dokumen kamu. Setelah status
                berubah, kamu bisa melihat hasilnya melalui dashboard siswa.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-7 py-4 rounded-xl bg-primary text-on-primary font-bold hover:opacity-90 active:scale-95 transition-all inline-flex items-center justify-center gap-2"
          >
            Buka Dashboard
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>

          <Link
            to="/"
            className="w-full sm:w-auto px-7 py-4 rounded-xl bg-surface-container text-on-surface font-bold hover:bg-surface-container-high active:scale-95 transition-all inline-flex items-center justify-center gap-2"
          >
            Kembali ke Beranda
          </Link>
        </div>


      </section>
    </main>
  )
}