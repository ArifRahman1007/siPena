import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function PrivacyPolicy() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen bg-surface py-16 px-4 md:px-8 flex items-center justify-center font-body text-on-surface">
      <div className="w-full max-w-3xl bg-surface-container-lowest rounded-3xl p-6 md:p-10 shadow-[0px_16px_48px_rgba(26,28,28,0.05)] border border-outline-variant/20">
        
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-primary font-semibold text-sm hover:underline"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Kembali
        </button>

        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface mb-2">
          Kebijakan Privasi
        </h1>
        <p className="text-xs text-on-surface-variant mb-8 uppercase tracking-widest font-bold">
          Sistem PPDB SiPena SMK YPPT Garut
        </p>

        <div className="space-y-6 text-sm text-on-surface-variant leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-on-surface">1. Pengumpulan Informasi</h2>
            <p>
              Kami mengumpulkan informasi pribadi yang Anda masukkan secara sukarela saat melakukan registrasi dan pengisian formulir pendaftaran. Informasi ini meliputi nama lengkap, NISN, NIK, tempat dan tanggal lahir, alamat domisili, informasi kontak orang tua/wali, serta dokumen pendukung seperti pas foto, rapor, dan surat keterangan sehat.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-on-surface">2. Penggunaan Data</h2>
            <p>
              Seluruh data yang dikumpulkan hanya akan digunakan oleh Panitia Penerimaan Peserta Didik Baru (PPDB) SMK YPPT Garut untuk keperluan seleksi administrasi, verifikasi berkas, dan proses pendaftaran masuk sekolah. Kami tidak akan menjual, menyewakan, atau menyebarluaskan data Anda kepada pihak ketiga.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-on-surface">3. Keamanan Data</h2>
            <p>
              Kami berkomitmen untuk menjaga keamanan informasi Anda. Data Anda disimpan secara aman dalam sistem database terenkripsi (Firebase). Akses terhadap data pribadi ini dibatasi hanya untuk panitia dan staf administrasi yang berwenang.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-on-surface">4. Hak Calon Siswa</h2>
            <p>
              Anda berhak memeriksa kembali, memperbarui, atau memperbaiki kesalahan data pribadi Anda selama periode pendaftaran masih dibuka. Jika pendaftaran telah dikirimkan (*submitted*) dan memerlukan perbaikan data, Anda dapat menghubungi admin panitia PPDB melalui kontak bantuan yang tersedia.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-outline-variant/30 text-center text-xs text-outline">
          Terakhir diperbarui: Juli 2026 • Panitia PPDB SMK YPPT Garut
        </div>

      </div>
    </main>
  )
}
