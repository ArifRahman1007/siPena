import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import heroLanding from '../../assets/hero-landing.png'
import logoYppt from '../../assets/logo.jpg'

// ─── Animasi ─────────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (delay = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
  }),
}

const inView = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatTanggal(val) {
  if (!val) return '—'
  try {
    return new Date(val).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch { return val }
}

function getStatus(openTime, closeTime) {
  const now = new Date()
  const open  = new Date(openTime)
  const close = new Date(closeTime)
  if (now < open)  return 'upcoming'
  if (now > close) return 'done'
  return 'active'
}

// ─── Data dokumen (statis, tidak perlu dinamis) ───────────────────────────────
const dokumen = [
  { icon: 'badge',           label: 'Akta Kelahiran',   desc: 'Scan/foto jelas, format JPG atau PDF' },
  { icon: 'family_restroom', label: 'Kartu Keluarga',   desc: 'Masih berlaku, semua anggota terlihat' },
  { icon: 'school',          label: 'Ijazah / SKHUN SD', desc: 'Atau surat keterangan lulus' },
  { icon: 'portrait',        label: 'Pas Foto 3×4',     desc: 'Latar merah, format JPG, maks 2 MB' },
  { icon: 'map',             label: 'Surat Domisili',   desc: 'Jika alamat berbeda dengan KK' },
]

// ─── Steps hero ───────────────────────────────────────────────────────────────
const steps = [
  { icon: 'person_add',   label: 'Buat akun' },
  { icon: 'edit_note',    label: 'Isi data diri' },
  { icon: 'upload_file',  label: 'Upload dokumen' },
  { icon: 'check_circle', label: 'Selesai' },
]

// ─── Komponen ─────────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()

  const [settings, setSettings] = useState(null)
  const [loadingSettings, setLoadingSettings] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'recruitment'))
        if (snap.exists()) setSettings(snap.data())
      } catch (e) {
        console.error('Gagal fetch settings:', e)
      } finally {
        setLoadingSettings(false)
      }
    }
    fetch()
  }, [])

  // Default fallback jika Firestore kosong / offline
  const defaultSettings = {
    periodName: 'Tahun Ajaran 2025/2026',
    openTime: '2025-05-01',
    closeTime: '2025-07-31',
    registrationOpen: true
  }

  const currentSettings = settings || defaultSettings

  // Susun jadwal dari data Firestore atau default
  const jadwal = currentSettings ? [
    {
      label: 'Pembukaan Pendaftaran',
      tanggal: formatTanggal(currentSettings.openTime),
      status: getStatus(currentSettings.openTime, currentSettings.openTime),
    },
    {
      label: 'Batas Akhir Pendaftaran',
      tanggal: formatTanggal(currentSettings.closeTime),
      status: getStatus(currentSettings.openTime, currentSettings.closeTime),
    },
    {
      label: 'Status Pendaftaran',
      tanggal: currentSettings.registrationOpen ? 'Dibuka' : 'Ditutup',
      status: currentSettings.registrationOpen ? 'active' : 'done',
      isBadge: true,
    },
  ] : []

  const statusColor = {
    upcoming: 'text-on-surface-variant',
    active:   'text-green-600 font-bold',
    done:     'text-outline line-through',
  }

  return (
    <div className="bg-background w-full">

      {/* ══════════════════════════════════════════════════════ HERO */}
      <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">

        {/* Blur orbs */}
        <motion.div
          className="absolute inset-0 z-0 pointer-events-none"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
        >
          <div className="absolute top-[-8%] left-[-8%] w-[35%] h-[55%] bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-5%] right-[50%] w-[25%] h-[40%] bg-primary/5 rounded-full blur-[80px]" />
        </motion.div>

        {/* Hero image — fade ke bawah agar transisi ke section berikutnya mulus */}
        <motion.div
          className="absolute right-0 top-0 w-full h-full lg:w-1/2 pointer-events-none z-0"
          initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
        >
          <img
            className="w-full h-full object-cover object-center opacity-30 lg:opacity-100"
            alt="Foto gedung sekolah"
            src={heroLanding}
          />
          {/* Gradient kiri — agar konten hero terbaca */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent lg:from-background lg:via-background/50 lg:to-transparent" />
          {/* Gradient bawah — agar gambar tidak "kepotong" saat scroll */}
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background to-transparent" />
        </motion.div>

        {/* Konten hero */}
        <div className="relative z-10 w-full max-w-7xl px-6 md:px-12 flex flex-col items-center lg:items-start">

          <motion.div
            className="mb-6 flex items-center gap-2.5"
            initial="hidden" animate="show" variants={fadeUp} custom={0.1}
          >
            <img src={logoYppt} alt="Logo SMK YPPT Garut" className="w-10 h-10 rounded-xl object-contain bg-white p-0.5 shadow-md" />
            <span className="text-on-surface-variant text-sm font-semibold tracking-wide">SMK YPPT Garut</span>
          </motion.div>

          <motion.h1
            className="text-primary font-headline text-5xl md:text-6xl font-extrabold tracking-tight mb-3 text-center lg:text-left leading-tight"
            initial="hidden" animate="show" variants={fadeUp} custom={0.2}
          >
            SiPena
          </motion.h1>

          <motion.p
            className="text-on-surface-variant text-base md:text-lg font-normal max-w-md text-center lg:text-left mb-10 leading-relaxed"
            initial="hidden" animate="show" variants={fadeUp} custom={0.3}
          >
            Langkah awal mencetak generasi unggul, kompeten, dan siap kerja. Daftarkan diri Anda di SMK YPPT Garut melalui proses penerimaan yang praktis, transparan, dan terintegrasi.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 w-full max-w-xs lg:max-w-none"
            initial="hidden" animate="show" variants={fadeUp} custom={0.4}
          >
            <motion.button
              id="btn-daftar"
              onClick={() => navigate('/login-siswa')}
              className="bg-primary text-on-primary font-semibold text-base py-3 px-8 rounded-xl shadow hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              whileHover={{ scale: 1.03, boxShadow: '0 8px 24px rgba(0,80,203,0.25)' }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              Mulai Daftar
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </motion.button>

            <motion.button
              id="btn-masuk"
              onClick={() => navigate('/login-siswa')}
              className="bg-surface text-on-surface font-semibold text-base py-3 px-8 rounded-xl border border-outline-variant hover:bg-surface-variant/50 transition-colors"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              Sudah punya akun
            </motion.button>
          </motion.div>

          {/* Steps */}
          <div className="mt-14 flex flex-col lg:flex-row gap-4 lg:gap-8">
            {steps.map((step, i) => (
              <React.Fragment key={i}>
                <motion.div
                  className="flex items-center gap-2 text-on-surface-variant text-sm"
                  initial="hidden" animate="show" variants={fadeUp} custom={0.5 + i * 0.1}
                >
                  <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {step.icon}
                  </span>
                  <span>{step.label}</span>
                </motion.div>
                {i < 3 && (
                  <motion.span
                    className="hidden lg:inline text-outline-variant self-center"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
                  >
                    →
                  </motion.span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-on-surface-variant/40"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.6 }}
        >
          <motion.span
            className="material-symbols-outlined text-2xl"
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          >
            keyboard_arrow_down
          </motion.span>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════ JADWAL PENDAFTARAN */}
      <section className="w-full py-20 px-6 md:px-12 bg-surface border-t border-outline-variant/10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="mb-12 text-center"
            initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} variants={inView}
          >
            <span className="inline-flex items-center gap-2 text-primary text-sm font-semibold tracking-wide uppercase mb-3">
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
              Jadwal
            </span>
            <h2 className="text-on-surface text-3xl font-bold tracking-tight">Jadwal Pendaftaran</h2>
            <p className="text-on-surface-variant mt-2 text-base">
              {currentSettings?.periodName ?? 'Tahun Ajaran 2025/2026'}
            </p>
          </motion.div>

          {/* Loading state */}
          {loadingSettings ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="relative">
              {/* Garis timeline */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-outline-variant/30 hidden sm:block" />

              <div className="flex flex-col gap-4">
                {jadwal.map((item, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-6 pl-0 sm:pl-16 relative"
                    initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.5 }}
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      show: { opacity: 1, x: 0, transition: { duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] } }
                    }}
                  >
                    {/* Dot timeline */}
                    <div className={`hidden sm:flex absolute left-0 w-10 h-10 rounded-full border items-center justify-center ${
                      item.status === 'active' ? 'bg-green-50 border-green-300' :
                      item.status === 'done'   ? 'bg-surface-variant border-outline-variant/30' :
                      'bg-primary/10 border-primary/20'
                    }`}>
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        item.status === 'active' ? 'bg-green-500 animate-pulse' :
                        item.status === 'done'   ? 'bg-outline-variant' :
                        'bg-primary'
                      }`} />
                    </div>

                    <div className="flex-1 bg-background rounded-2xl border border-outline-variant/20 px-5 py-4 flex items-center justify-between gap-4 hover:border-primary/30 hover:shadow-sm transition-all duration-200">
                      <span className="text-on-surface font-medium text-sm sm:text-base">{item.label}</span>
                      {item.isBadge ? (
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                          item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {item.tanggal}
                        </span>
                      ) : (
                        <span className={`text-sm font-semibold whitespace-nowrap ${statusColor[item.status] ?? 'text-primary'}`}>
                          {item.tanggal}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════ SYARAT DOKUMEN */}
      <section className="w-full py-20 px-6 md:px-12 bg-background border-t border-outline-variant/10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="mb-12 text-center"
            initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} variants={inView}
          >
            <span className="inline-flex items-center gap-2 text-primary text-sm font-semibold tracking-wide uppercase mb-3">
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>folder_open</span>
              Persyaratan
            </span>
            <h2 className="text-on-surface text-3xl font-bold tracking-tight">Dokumen yang Diperlukan</h2>
            <p className="text-on-surface-variant mt-2 text-base">Siapkan dokumen berikut sebelum mendaftar</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {dokumen.map((item, i) => (
              <motion.div
                key={i}
                className="flex items-start gap-4 p-5 rounded-2xl border border-outline-variant/20 bg-surface hover:border-primary/30 hover:shadow-sm transition-all duration-200"
                initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] } }
                }}
                whileHover={{ y: -2 }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                </div>
                <div>
                  <p className="text-on-surface font-semibold text-sm">{item.label}</p>
                  <p className="text-on-surface-variant text-xs mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}

            {/* CTA card */}
            <motion.div
              className="flex items-center justify-between p-5 rounded-2xl bg-primary text-on-primary col-span-1 sm:col-span-2 cursor-pointer"
              initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { duration: 0.45, delay: 0.35 } }
              }}
              onClick={() => navigate('/login-siswa')}
              whileHover={{ scale: 1.01, boxShadow: '0 8px 28px rgba(0,80,203,0.3)' }}
              whileTap={{ scale: 0.99 }}
            >
              <div>
                <p className="font-bold text-base">Siap mendaftar?</p>
                <p className="text-on-primary/70 text-sm">Upload dokumen langsung melalui portal</p>
              </div>
              <span className="material-symbols-outlined text-3xl">arrow_forward</span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════ KONTAK */}
      <section className="w-full py-20 px-6 md:px-12 bg-surface border-t border-outline-variant/10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="mb-12 text-center"
            initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} variants={inView}
          >
            <span className="inline-flex items-center gap-2 text-primary text-sm font-semibold tracking-wide uppercase mb-3">
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>contact_support</span>
              Hubungi Kami
            </span>
            <h2 className="text-on-surface text-3xl font-bold tracking-tight">Ada Pertanyaan?</h2>
            <p className="text-on-surface-variant mt-2 text-base">Tim kami siap membantu proses pendaftaranmu</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {[
              { icon: 'phone',       label: 'Telepon',  value: '(0262) 123-4567',              href: 'tel:+62621234567' },
              { icon: 'chat',        label: 'WhatsApp', value: '0856-2496-3293',               href: 'https://wa.me/6285624963293' },
              { icon: 'location_on', label: 'Alamat',   value: 'Jl. Nusa Indah No. 33, Garut',  href: 'https://maps.google.com/?q=SMK+YPPT+Garut' },
            ].map((item, i) => (
              <motion.a
                key={i}
                href={item.href}
                className="flex flex-row items-center text-left gap-4 p-4 rounded-xl border border-outline-variant/20 bg-background hover:border-primary/30 hover:shadow-sm transition-all duration-200 no-underline"
                initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.1 } }
                }}
                whileHover={{ y: -2 }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                </div>
                <div>
                  <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">{item.label}</p>
                  <p className="text-on-surface font-bold text-xs sm:text-sm mt-0.5 leading-snug">{item.value}</p>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════ FOOTER */}
      <footer className="w-full py-5 px-6 border-t border-outline-variant/10 bg-surface">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <span className="text-on-surface-variant/50 text-xs">© {new Date().getFullYear()} SiPena</span>
          <Link to="/admin-login" className="text-outline/50 hover:text-primary text-xs transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
            Login Admin
          </Link>
        </div>
      </footer>

    </div>
  )
}
