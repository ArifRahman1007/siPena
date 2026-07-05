import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../../firebase/config'
import XLSX from 'xlsx-js-style'

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

// ─── Stat Card dengan animasi slide + count-up ────────────────────────────────
function StatCard({ label, value, icon, iconBg, span, delay, ready, borderClass }) {
  const displayed = useCountUp(value, 800, ready)
  return (
    <div
      className={`${span ? 'col-span-2 sm:col-span-3 lg:col-span-2' : ''} ${borderClass || ''} bg-surface-container-lowest rounded-xl md:rounded-2xl p-4 md:p-5 shadow-[0px_8px_24px_rgba(26,28,28,0.06)]`}
      style={{
        opacity: ready ? 1 : 0,
        transform: ready ? 'translateY(0)' : 'translateY(18px)',
        transition: `opacity 0.45s ease ${delay}ms, transform 0.45s ease ${delay}ms`
      }}
    >
      <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center mb-3`}>
        <span className="material-symbols-outlined text-base md:text-lg">{icon}</span>
      </div>
      <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
      <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface mt-1">{displayed}</h2>
    </div>
  )
}

// ─── Acceptance Rate counter ───────────────────────────────────────────────────
function AcceptanceCounter({ target, ready }) {
  return <span>{useCountUp(target, 1000, ready)}</span>
}

export default function AdminReports() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [ready, setReady] = useState(false) // trigger animasi setelah data loaded
  const [filterStatus, setFilterStatus] = useState('Semua')

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
        // Delay kecil agar DOM render dulu sebelum animasi jalan
        setTimeout(() => setReady(true), 80)
      },
      (error) => {
        console.error('Gagal mengambil laporan:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const stats = useMemo(() => {
    const total = applications.length

    const waiting = applications.filter(
      (item) => item.status === 'Menunggu Verifikasi'
    ).length

    const accepted = applications.filter(
      (item) => item.status === 'Diterima'
    ).length

    const revision = applications.filter(
      (item) => item.status === 'Perlu Revisi'
    ).length

    const rejected = applications.filter(
      (item) => item.status === 'Ditolak'
    ).length

    const acceptanceRate =
      total > 0 ? Math.round((accepted / total) * 100) : 0

    return {
      total,
      waiting,
      accepted,
      revision,
      rejected,
      acceptanceRate
    }
  }, [applications])

  const filteredApplications = useMemo(() => {
    return applications.filter((item) => {
      const name =
        item?.personalData?.fullName ||
        item?.personalData?.name ||
        item?.personalData?.nama ||
        ''

      const registrationNumber = item?.registrationNumber || ''

      const keyword = search.toLowerCase()

      const matchSearch =
        name.toLowerCase().includes(keyword) ||
        registrationNumber.toLowerCase().includes(keyword)

      const matchStatus =
        filterStatus === 'Semua' || item.status === filterStatus

      return matchSearch && matchStatus
    })
  }, [applications, search, filterStatus])

  const getName = (item) => {
    return (
      item?.personalData?.fullName ||
      item?.personalData?.name ||
      item?.personalData?.nama ||
      'Nama belum diisi'
    )
  }

  const getStatusClass = (status) => {
    if (status === 'Diterima') {
      return 'bg-green-100 text-green-700'
    }

    if (status === 'Ditolak') {
      return 'bg-red-100 text-red-700'
    }

    if (status === 'Perlu Revisi') {
      return 'bg-orange-100 text-orange-700'
    }

    return 'bg-primary/10 text-primary'
  }

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return '-'

    return timestamp.toDate().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const exportToExcel = () => {
    // 1. Siapkan data objek
    const data = filteredApplications.map((item) => {
      return {
        'Nomor Pendaftaran': item.registrationNumber || item.id,
        'Nama': getName(item),
        'NISN': item?.personalData?.nisn || '',
        'No HP': item?.personalData?.phone || '',
        'Status': item.status || 'Menunggu Verifikasi',
        'Catatan': item.notes || '',
        'Tanggal Submit': formatDate(item.submittedAt),
        'Terakhir Update': formatDate(item.updatedAt)
      }
    })

    // 2. Buat worksheet
    const worksheet = XLSX.utils.json_to_sheet(data)

    // Border tipis abu-abu untuk semua sel
    const thinBorder = {
      top: { style: 'thin', color: { rgb: 'CBD5E1' } },
      bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
      left: { style: 'thin', color: { rgb: 'CBD5E1' } },
      right: { style: 'thin', color: { rgb: 'CBD5E1' } }
    }

    // 3. Modifikasi style tiap sel langsung
    if (worksheet['!ref']) {
      const range = XLSX.utils.decode_range(worksheet['!ref'])

      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C })
          if (!worksheet[cellRef]) continue

          // Default styling data sel
          worksheet[cellRef].s = {
            border: thinBorder,
            font: { name: 'Arial', sz: 10, color: { rgb: '334155' } },
            alignment: { vertical: 'center' }
          }

          if (R === 0) {
            // Styling Header (Biru Tua SiPena #360589)
            worksheet[cellRef].s = {
              fill: { fgColor: { rgb: '360589' } },
              font: { name: 'Arial', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
              border: thinBorder,
              alignment: { vertical: 'center', horizontal: 'left' }
            }
          } else {
            // Kolom tertentu (Registrasi, NISN, No HP) diformat Text ('s') agar aman dari autotrim nol
            if (C === 0 || C === 2 || C === 3) {
              worksheet[cellRef].t = 's'
            }

            // Zebra Striping (Baris genap pakai background abu-abu sangat muda)
            if (R % 2 === 0) {
              worksheet[cellRef].s.fill = { fgColor: { rgb: 'F8FAFC' } }
            }

            // Styling kolom Status (Kolom indeks 4)
            if (C === 4) {
              const statusVal = worksheet[cellRef].v
              let bg = 'E0F2FE' // Default: Menunggu Verifikasi
              let fg = '075985'

              if (statusVal === 'Diterima') {
                bg = 'D1FAE5'
                fg = '065F46'
              } else if (statusVal === 'Ditolak') {
                bg = 'FEE2E2'
                fg = '991B1B'
              } else if (statusVal === 'Perlu Revisi') {
                bg = 'FFEDD5'
                fg = '9A3412'
              }

              worksheet[cellRef].s = {
                ...worksheet[cellRef].s,
                fill: { fgColor: { rgb: bg } },
                font: { name: 'Arial', sz: 10, bold: true, color: { rgb: fg } },
                alignment: { vertical: 'center', horizontal: 'center' }
              }
            }
          }
        }
      }
    }

    // 4. Atur lebar kolom
    worksheet['!cols'] = [
      { wch: 22 }, // Nomor Pendaftaran
      { wch: 28 }, // Nama
      { wch: 15 }, // NISN
      { wch: 15 }, // No HP
      { wch: 20 }, // Status
      { wch: 32 }, // Catatan
      { wch: 18 }, // Tanggal Submit
      { wch: 18 }  // Terakhir Update
    ]

    // 5. Buat workbook baru dan unduh
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Pendaftar')
    XLSX.writeFile(workbook, 'laporan-recruit-hub.xlsx')
  }

  if (loading) {
    return (
      <div className="p-8 max-w-screen-2xl mx-auto">
        <div className="bg-surface-container-lowest p-10 rounded-[1.5rem] text-center shadow-[0px_12px_32px_rgba(26,28,28,0.06)]">
          <span className="material-symbols-outlined text-4xl text-primary mb-4">
            progress_activity
          </span>
          <p className="text-on-surface-variant font-medium">
            Memuat laporan pendaftaran...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <header className="mb-6 md:mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-on-surface">
            Laporan Rekrutmen
          </h1>

          <p className="text-on-surface-variant mt-1 text-xs md:text-sm">
            Data pendaftar dan statistik rekrutmen.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            onClick={exportToExcel}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs md:text-sm font-bold hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-sm md:text-base">download</span>
            Export Excel
          </button>

          <Link
            to="/verification"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-container text-on-surface text-xs md:text-sm font-bold hover:bg-surface-container-high transition-all"
          >
            Buka Verifikasi
            <span className="material-symbols-outlined text-sm md:text-base">arrow_forward</span>
          </Link>
        </div>
      </header>

      {/* ── Stat Cards (slide-in stagger) ── */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 md:mb-8">
        {[
          { label: 'Total Pendaftar', value: stats.total,    icon: 'analytics',         iconBg: 'bg-primary/10 text-primary',      span: true,  borderClass: 'border-glow-blue' },
          { label: 'Menunggu',        value: stats.waiting,  icon: 'pending_actions',    iconBg: 'bg-primary/10 text-primary',      span: false, borderClass: 'border-glow-blue' },
          { label: 'Diterima',        value: stats.accepted, icon: 'verified',           iconBg: 'bg-green-100 text-green-700',     span: false, borderClass: 'border-glow-blue' },
          { label: 'Revisi',          value: stats.revision, icon: 'assignment_return',  iconBg: 'bg-orange-100 text-orange-700',   span: false, borderClass: 'border-glow-orange' },
          { label: 'Ditolak',         value: stats.rejected, icon: 'cancel',             iconBg: 'bg-red-100 text-red-700',         span: false, borderClass: 'border-glow-red' },
        ].map((s, i) => (
          <StatCard key={s.label} {...s} delay={i * 70} ready={ready} />
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 mb-6 md:mb-8">
        {/* Acceptance Rate Card */}
        <div
          className="lg:col-span-1 bg-primary text-on-primary rounded-xl md:rounded-2xl p-4 md:p-6 shadow-[0px_8px_24px_rgba(26,28,28,0.06)] relative overflow-hidden"
          style={{
            opacity: ready ? 1 : 0,
            transform: ready ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease'
          }}
        >
          <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-white/10 rounded-full blur-2xl" />
          <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-80">Acceptance Rate</p>
          <h2 className="text-3xl md:text-5xl font-extrabold mt-2 md:mt-3">
            <AcceptanceCounter target={stats.acceptanceRate} ready={ready} />%
          </h2>
          <p className="text-[10px] md:text-xs mt-3 md:mt-4 opacity-90 leading-relaxed">
            Persentase pendaftar diterima dibandingkan total.
          </p>
        </div>

        {/* Distribusi Status */}
        <div
          className="lg:col-span-2 bg-surface-container-lowest rounded-xl md:rounded-2xl p-4 md:p-6 shadow-[0px_8px_24px_rgba(26,28,28,0.06)]"
          style={{
            opacity: ready ? 1 : 0,
            transform: ready ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s'
          }}
        >
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <div>
              <h3 className="text-base md:text-lg font-bold text-on-surface">Distribusi Status</h3>
              <p className="text-[10px] md:text-xs text-on-surface-variant mt-0.5">Perbandingan status pendaftar saat ini.</p>
            </div>
          </div>

          <div className="space-y-4 md:space-y-5">
            {[
              { label: 'Menunggu Verifikasi', value: stats.waiting,  color: 'bg-primary',     delay: 200 },
              { label: 'Diterima',            value: stats.accepted, color: 'bg-green-500',   delay: 350 },
              { label: 'Perlu Revisi',        value: stats.revision, color: 'bg-orange-500',  delay: 500 },
              { label: 'Ditolak',             value: stats.rejected, color: 'bg-red-500',     delay: 650 }
            ].map((item) => {
              const percentage = stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0
              return (
                <div key={item.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] md:text-xs font-bold text-on-surface">{item.label}</span>
                    <span className="text-[10px] md:text-xs text-on-surface-variant">{item.value} data • {percentage}%</span>
                  </div>
                  <AnimBar pct={percentage} color={item.color} delay={item.delay} ready={ready} />
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-xl md:rounded-2xl shadow-[0px_8px_24px_rgba(26,28,28,0.06)] overflow-hidden">
        <div className="p-4 md:p-5 border-b border-outline-variant/10 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base md:text-xl font-bold text-on-surface">
                Tabel Data Pendaftar
              </h3>

              <p className="text-xs md:text-sm text-on-surface-variant mt-0.5">
                Menampilkan {filteredApplications.length} dari {applications.length} data.
              </p>
            </div>

            <div className="relative w-full sm:w-60">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-base">
                search
              </span>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-4 py-1.5 w-full bg-slate-100/60 border border-slate-200/50 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-xs outline-none text-slate-700 placeholder:text-slate-400"
                placeholder="Cari nama atau nomor..."
                type="text"
              />
            </div>
          </div>

          {/* Filters (Horizontal scroll on mobile) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto max-w-full scrollbar-none">
            {['Semua', 'Menunggu Verifikasi', 'Diterima', 'Perlu Revisi', 'Ditolak'].map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterStatus(filter)}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all whitespace-nowrap ${
                  filterStatus === filter
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-slate-600 hover:bg-white/70'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop View Table */}
        <div className="hidden md:block overflow-x-auto scrollbar-thin">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant">
                  Pendaftar
                </th>
                <th className="px-6 py-3 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant">
                  No. Registrasi
                </th>
                <th className="px-6 py-3 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant">
                  Kontak
                </th>
                <th className="px-6 py-3 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant">
                  Update
                </th>
                <th className="px-6 py-3 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant text-right">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-outline-variant/10">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="w-14 h-14 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="material-symbols-outlined text-outline">
                        folder_open
                      </span>
                    </div>

                    <p className="font-bold text-on-surface">
                      Data tidak ditemukan
                    </p>

                    <p className="text-sm text-on-surface-variant mt-1">
                      Coba ubah kata kunci pencarian atau filter status.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredApplications.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-blue-50/50 transition-colors"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold">
                          {getName(item).charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <p className="font-bold text-on-surface">
                            {getName(item)}
                          </p>

                          <p className="text-xs text-on-surface-variant">
                            NISN: {item?.personalData?.nisn || '-'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5 font-mono text-sm text-on-surface">
                      {item.registrationNumber || item.id.slice(0, 8)}
                    </td>

                    <td className="px-6 py-5">
                      <p className="text-sm font-medium text-on-surface">
                        {item?.personalData?.phone || '-'}
                      </p>

                      <p className="text-xs text-on-surface-variant">
                        {item?.personalData?.email || '-'}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${getStatusClass(
                          item.status
                        )}`}
                      >
                        {item.status || 'Menunggu Verifikasi'}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-sm text-on-surface-variant">
                      {formatDate(item.updatedAt || item.submittedAt)}
                    </td>

                    <td className="px-6 py-5 text-right">
                      <Link
                        to={`/verification/detail?id=${item.id}`}
                        className="inline-flex items-center gap-1 text-primary font-bold text-sm hover:underline"
                      >
                        Detail
                        <span className="material-symbols-outlined text-base">
                          arrow_forward
                        </span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View Card List (No scroll required) */}
        <div className="block md:hidden divide-y divide-outline-variant/10">
          {filteredApplications.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-outline mb-2">folder_open</span>
              <p className="font-bold text-on-surface text-sm">Data tidak ditemukan</p>
              <p className="text-xs text-on-surface-variant mt-1">Coba ubah kata pencarian atau filter status.</p>
            </div>
          ) : (
            filteredApplications.map((item) => (
              <div key={item.id} className="p-4 flex flex-col gap-3">
                {/* Top: Avatar + Name + Status */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-xs">
                      {getName(item).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-on-surface truncate max-w-[150px]">{getName(item)}</h4>
                      <p className="text-[10px] text-on-surface-variant">NISN: {item?.personalData?.nisn || '-'}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getStatusClass(item.status)}`}>
                    {item.status ? item.status.split(' ')[0] : 'Menunggu'}
                  </span>
                </div>

                {/* Body Details Card */}
                <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-400 block">No. Registrasi</span>
                    <span className="font-mono font-semibold text-slate-700">{item.registrationNumber || item.id.slice(0, 8)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Terakhir Update</span>
                    <span className="font-medium text-slate-700">{formatDate(item.updatedAt || item.submittedAt)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block">Kontak</span>
                    <span className="font-medium text-slate-700">
                      {item?.personalData?.phone || '-'} • {item?.personalData?.email || '-'}
                    </span>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="flex justify-end pt-1">
                  <Link
                    to={`/verification/detail?id=${item.id}`}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                  >
                    Detail Selengkapnya
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}