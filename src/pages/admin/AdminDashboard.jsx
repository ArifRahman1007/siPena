import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { db, auth } from '../../firebase/config'

// ─── Hook: angka naik dari 0 ke target ───────────────────────────────────────
function useCountUp(target, duration = 900, enabled = true) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!enabled || target === 0) { setValue(target); return }
    let start = 0
    const steps = 40
    const increment = target / steps
    const interval = duration / steps
    const timer = setInterval(() => {
      start += increment
      if (start >= target) { setValue(target); clearInterval(timer) }
      else setValue(Math.floor(start))
    }, interval)
    return () => clearInterval(timer)
  }, [target, duration, enabled])
  return value
}

// ─── Animated progress bar ────────────────────────────────────────────────────
function AnimBar({ pct, color, delay = 0, ready }) {
  const [w, setW] = useState(0)
  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => setW(pct), delay)
    return () => clearTimeout(t)
  }, [pct, delay, ready])
  return (
    <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
      <div
        className={`h-full ${color} rounded-full`}
        style={{ width: `${w}%`, transition: 'width 0.9s cubic-bezier(0.34,1.2,0.64,1)' }}
      />
    </div>
  )
}

// ─── Animated Chart Bar ──────────────────────────────────────────────────────
function AnimChartBar({ height, count, dateLabel, label, delay = 0, ready }) {
  const [h, setH] = useState(0)
  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => setH(height), delay)
    return () => clearTimeout(t)
  }, [height, delay, ready])

  return (
    <div className="flex-1 flex flex-col items-center gap-1 group">
      <div className="relative w-full flex items-end h-[120px] md:h-[160px]">
        <div
          className="w-full bg-primary/20 hover:bg-primary rounded-t-lg transition-all duration-300 cursor-default relative"
          style={{
            height: `${h}%`,
            transition: 'height 0.8s cubic-bezier(0.34, 1.3, 0.64, 1)'
          }}
        >
          {/* Tooltip */}
          <div className="hidden group-hover:flex absolute -top-9 left-1/2 -translate-x-1/2 bg-on-surface text-white text-[10px] font-bold py-1 px-2.5 rounded-lg whitespace-nowrap items-center gap-1">
            {count} pendaftar
          </div>
        </div>
      </div>
      <span className="text-[8px] md:text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">{label}</span>
      <span className="text-[7px] md:text-[8px] text-outline">{dateLabel}</span>
    </div>
  )
}

// ─── Stat Card Component ──────────────────────────────────────────────────────
function DashboardStatCard({ label, value, icon, iconBg, badge, badgeBg, delay, ready, borderClass }) {
  const displayedValue = useCountUp(value, 800, ready)
  return (
    <div
      className={`bg-surface-container-lowest ${borderClass || ''} p-3.5 rounded-xl shadow-[0px_8px_24px_rgba(26,28,28,0.06)] group hover:-translate-y-0.5 transition-transform duration-300`}
      style={{
        opacity: ready ? 1 : 0,
        transform: ready ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 0.4s ease ${delay}ms, transform 0.4s ease ${delay}ms, box-shadow 0.2s, translate 0.2s`
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <div className={`p-1.5 rounded-md ${iconBg}`}>
          <span className="material-symbols-outlined text-base">{icon}</span>
        </div>
        <span className={`text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded-full ${badgeBg}`}>{badge}</span>
      </div>
      <p className="text-[9px] md:text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">{label}</p>
      <h3 className="text-xl md:text-2xl font-extrabold text-on-surface">{displayedValue}</h3>
    </div>
  )
}

// ─── Acceptance Rate Counter ──────────────────────────────────────────────────
function AcceptanceRateCounter({ value, ready }) {
  const displayedValue = useCountUp(value, 1000, ready)
  return <span>{displayedValue}%</span>
}

export default function AdminDashboard() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [adminName, setAdminName] = useState('Admin')
  const [ready, setReady] = useState(false)

  // Ambil nama admin dari Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAdminName(user.displayName || user.email?.split('@')[0] || 'Admin')
      }
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    const q = query(
      collection(db, 'applications'),
      orderBy('updatedAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }))
        setApplications(data)
        setLoading(false)
        setTimeout(() => setReady(true), 80)
      },
      (error) => {
        console.error('Gagal mengambil data dashboard:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const stats = useMemo(() => {
    const total = applications.length
    const waiting = applications.filter((item) => item.status === 'Menunggu Verifikasi').length
    const accepted = applications.filter((item) => item.status === 'Diterima').length
    const revision = applications.filter((item) => item.status === 'Perlu Revisi').length
    const rejected = applications.filter((item) => item.status === 'Ditolak').length
    const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 0

    return { total, waiting, accepted, revision, rejected, acceptanceRate }
  }, [applications])

  const recentApplications = applications.slice(0, 5)

  const getName = (item) => {
    return (
      item?.personalData?.fullName ||
      item?.personalData?.name ||
      item?.personalData?.nama ||
      'Nama belum diisi'
    )
  }

  const getStatusClass = (status) => {
    if (status === 'Diterima') return 'bg-green-100/70 text-green-700'
    if (status === 'Ditolak') return 'bg-red-100/70 text-red-700'
    if (status === 'Perlu Revisi') return 'bg-orange-100/70 text-orange-700'
    return 'bg-primary-fixed text-primary'
  }

  const getStatusIcon = (status) => {
    if (status === 'Diterima') return 'verified'
    if (status === 'Ditolak') return 'cancel'
    if (status === 'Perlu Revisi') return 'assignment_return'
    return 'pending_actions'
  }

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return '-'
    return timestamp.toDate().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  // Chart: 7 hari terakhir (bukan per-hari-dalam-seminggu)
  const chartData = useMemo(() => {
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() - (6 - i))
      return {
        date: d,
        label: d.toLocaleDateString('id-ID', { weekday: 'short' }),
        dateLabel: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        count: 0
      }
    })

    applications.forEach((item) => {
      const timestamp = item.submittedAt || item.updatedAt
      if (!timestamp?.toDate) return
      const date = timestamp.toDate()

      for (const day of days) {
        const start = new Date(day.date)
        start.setHours(0, 0, 0, 0)
        const end = new Date(day.date)
        end.setHours(23, 59, 59, 999)
        if (date >= start && date <= end) {
          day.count++
          break
        }
      }
    })

    return days
  }, [applications])

  const maxChartValue = Math.max(...chartData.map((item) => item.count), 1)

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-screen-2xl mx-auto">
        <div className="bg-surface-container-lowest p-10 rounded-xl text-center shadow-[0px_12px_32px_rgba(26,28,28,0.06)]">
          <span className="material-symbols-outlined text-4xl text-primary mb-4">progress_activity</span>
          <p className="text-on-surface-variant font-medium">Memuat dashboard admin...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">

      {/* Header */}
      <div className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-3xl font-extrabold tracking-tight text-on-surface mb-1 leading-tight">
            Selamat datang, {adminName}
          </h2>
          <p className="text-xs md:text-sm text-on-surface-variant font-medium">
            Ringkasan data rekrutmen real-time dari Firestore.
          </p>
        </div>

        <Link
          to="/verification"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs md:text-sm font-bold hover:opacity-90 active:scale-95 transition-all self-start md:self-auto"
        >
          Buka Verifikasi
          <span className="material-symbols-outlined text-sm md:text-base">arrow_forward</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total Pendaftar', value: stats.total, icon: 'groups', iconBg: 'bg-primary/10 text-primary', badge: 'Semua', badgeBg: 'bg-primary/10 text-primary', borderClass: 'border-glow-blue' },
          { label: 'Menunggu', value: stats.waiting, icon: 'pending_actions', iconBg: 'bg-blue-100 text-blue-600', badge: 'Perlu Cek', badgeBg: 'bg-blue-100 text-blue-600', borderClass: 'border-glow-blue' },
          { label: 'Diterima', value: stats.accepted, icon: 'verified', iconBg: 'bg-green-100 text-green-700', badge: 'Lolos', badgeBg: 'bg-green-100 text-green-700', borderClass: 'border-glow-blue' },
          { label: 'Perlu Revisi', value: stats.revision, icon: 'assignment_return', iconBg: 'bg-orange-100 text-orange-700', badge: 'Revisi', badgeBg: 'bg-orange-100 text-orange-700', borderClass: 'border-glow-orange' },
          { label: 'Ditolak', value: stats.rejected, icon: 'cancel', iconBg: 'bg-red-100 text-red-700', badge: 'Tidak Lolos', badgeBg: 'bg-red-100 text-red-700', borderClass: 'border-glow-red' },
        ].map((stat, i) => (
          <DashboardStatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            iconBg={stat.iconBg}
            badge={stat.badge}
            badgeBg={stat.badgeBg}
            delay={i * 70}
            ready={ready}
            borderClass={stat.borderClass}
          />
        ))}
      </div>

      {/* Chart + Komposisi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-4 md:p-6 rounded-xl md:rounded-2xl shadow-[0px_8px_24px_rgba(26,28,28,0.06)] flex flex-col">
          <div className="flex justify-between items-start mb-6 md:mb-8">
            <div>
              <h4 className="text-base md:text-lg font-bold text-on-surface">Tren Registrasi</h4>
              <p className="text-xs md:text-sm text-on-surface-variant">Pendaftar masuk dalam 7 hari terakhir</p>
            </div>
            <span className="text-[10px] md:text-xs font-bold py-1 px-2.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Real-time
            </span>
          </div>

          <div className="flex items-end gap-1.5 md:gap-2 h-40 md:h-48 mt-auto relative">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="border-b border-outline-variant/20 w-full"></div>
              ))}
            </div>

            {chartData.map((item, index) => {
              const height = Math.max((item.count / maxChartValue) * 100, 5)
              return (
                <AnimChartBar
                  key={item.dateLabel}
                  height={height}
                  count={item.count}
                  dateLabel={item.dateLabel}
                  label={item.label}
                  delay={index * 60 + 100}
                  ready={ready}
                />
              )
            })}
          </div>
        </div>

        {/* Komposisi Status */}
        <div className="bg-surface-container-lowest p-4 md:p-6 rounded-xl md:rounded-2xl shadow-[0px_8px_24px_rgba(26,28,28,0.06)]">
          <h4 className="text-base md:text-lg font-bold text-on-surface mb-1">Komposisi Status</h4>
          <p className="text-xs md:text-sm text-on-surface-variant mb-4 md:mb-6">Perbandingan status saat ini</p>

          {/* Acceptance Rate Highlight */}
          <div className="bg-primary rounded-xl p-3.5 md:p-4 mb-4 md:mb-6 text-white relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-lg"></div>
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-80">Acceptance Rate</p>
            <h2 className="text-2xl md:text-4xl font-extrabold mt-1">
              <AcceptanceRateCounter value={stats.acceptanceRate} ready={ready} />
            </h2>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Menunggu', value: stats.waiting, color: 'bg-blue-500', delay: 150 },
              { label: 'Diterima', value: stats.accepted, color: 'bg-green-500', delay: 270 },
              { label: 'Perlu Revisi', value: stats.revision, color: 'bg-orange-500', delay: 390 },
              { label: 'Ditolak', value: stats.rejected, color: 'bg-red-500', delay: 510 },
            ].map((item) => {
              const pct = stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-on-surface">{item.label}</span>
                    <span className="text-on-surface-variant">{item.value} ({pct}%)</span>
                  </div>
                  <AnimBar pct={pct} color={item.color} delay={item.delay} ready={ready} />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Aktivitas Terbaru */}
      <div className="bg-surface-container-lowest rounded-xl md:rounded-2xl shadow-[0px_8px_24px_rgba(26,28,28,0.06)] overflow-hidden">
        <div className="p-4 md:p-5 flex justify-between items-center border-b border-outline-variant/10">
          <div>
            <h4 className="text-base md:text-lg font-bold text-on-surface">Aktivitas Terbaru</h4>
            <p className="text-xs md:text-sm text-on-surface-variant mt-0.5">5 data terbaru dari pendaftaran.</p>
          </div>
          <Link to="/verification" className="text-primary text-xs md:text-sm font-bold hover:underline flex items-center gap-1">
            Lihat Semua <span className="material-symbols-outlined text-sm md:text-base">arrow_forward</span>
          </Link>
        </div>

        <div className="divide-y divide-outline-variant/10">
          {recentApplications.length === 0 ? (
            <div className="p-8 md:p-10 text-center">
              <div className="w-12 h-12 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-outline">folder_open</span>
              </div>
              <h5 className="font-bold text-on-surface text-sm">Belum ada aktivitas</h5>
              <p className="text-xs text-on-surface-variant mt-1">Aktivitas akan muncul setelah siswa mengirim pendaftaran.</p>
            </div>
          ) : (
            recentApplications.map((item, index) => (
              <Link
                key={item.id}
                to={`/verification/detail?id=${item.id}`}
                className="p-3 md:p-4 flex items-center gap-3 md:gap-4 hover:bg-blue-50/50 transition-colors group"
                style={{
                  opacity: ready ? 1 : 0,
                  transform: ready ? 'translateY(0)' : 'translateY(8px)',
                  transition: `opacity 0.35s ease ${index * 60 + 200}ms, transform 0.35s ease ${index * 60 + 200}ms, background-color 0.2s`
                }}
              >
                <div className="h-9 w-9 md:h-11 md:w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-extrabold text-xs md:text-sm">
                  {getName(item).charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-semibold text-on-surface truncate">
                    {getName(item)}{' '}
                    <span className="font-normal text-on-surface-variant">
                      — {item.status || 'Menunggu Verifikasi'}
                    </span>
                  </p>
                  <p className="text-[10px] md:text-xs text-outline mt-0.5">
                    #{item.registrationNumber || item.id.slice(0, 8)} • {formatDate(item.updatedAt || item.submittedAt)}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${getStatusClass(item.status)}`}
                >
                  <span className="material-symbols-outlined text-[10px] md:text-sm">{getStatusIcon(item.status)}</span>
                  {item.status ? item.status.split(' ')[0] : 'Menunggu'}
                </span>
              </Link>
            ))
          )}
        </div>

        {stats.total > 5 && (
          <div className="p-4 border-t border-outline-variant/10 bg-surface-container-low/30">
            <Link to="/verification" className="w-full flex items-center justify-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-base">expand_more</span>
              Tampilkan {stats.total - 5} data lainnya
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}