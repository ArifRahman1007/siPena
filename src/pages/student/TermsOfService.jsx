import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function TermsOfService() {
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
          Ketentuan Layanan
        </h1>
        <p className="text-xs text-on-surface-variant mb-8 uppercase tracking-widest font-bold">
          Sistem PPDB SiPena SMK YPPT Garut
        </p>

        <div className="space-y-6 text-sm text-on-surface-variant leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-on-surface">1. Ketentuan Umum Pendaftaran</h2>
            <p>
              Pendaftaran Penerimaan Peserta Didik Baru (PPDB) SMK YPPT Garut dilakukan secara daring melalui sistem SiPena. Calon siswa wajib mengikuti seluruh prosedur pengisian data pribadi, data orang tua/wali, serta mengunggah berkas persyaratan sesuai ketentuan yang berlaku.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-on-surface">2. Akurasi & Kebenaran Data</h2>
            <p>
              Calon siswa bertanggung jawab penuh atas kebenaran, akurasi, dan keaslian seluruh data serta dokumen yang diunggah ke dalam sistem. Pengunggahan dokumen palsu atau manipulasi informasi lainnya dapat mengakibatkan pembatalan pendaftaran atau diskualifikasi secara sepihak oleh panitia.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-on-surface">3. Batas Waktu & Proses Verifikasi</h2>
            <p>
              Pengisian formulir pendaftaran dan pengunggahan berkas harus diselesaikan sebelum batas waktu periode pendaftaran berakhir. Berkas yang dikirim akan melalui proses verifikasi oleh tim panitia dalam waktu 3-5 hari kerja. Hasil seleksi administrasi akan diumumkan secara transparan melalui dashboard masing-masing siswa.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-on-surface">4. Keputusan Hasil Seleksi</h2>
            <p>
              Keputusan hasil seleksi administrasi maupun validasi akhir yang ditetapkan oleh Panitia PPDB SMK YPPT Garut bersifat mutlak, sah secara hukum, dan tidak dapat diganggu gugat oleh pihak manapun.
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
