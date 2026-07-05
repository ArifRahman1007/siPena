import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../../firebase/config'

export default function AdminScanningHistory() {
  const [scanHistory, setScanHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('Semua')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const q = query(
      collection(db, 'scanHistory'),
      orderBy('scannedAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }))

        setScanHistory(data)
        setLoading(false)
        setTimeout(() => setReady(true), 60)
      },
      (error) => {
        console.error('Gagal mengambil riwayat scan:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const filteredHistory = useMemo(() => {
    return scanHistory.filter((item) => {
      const keyword = search.toLowerCase()

      const matchSearch =
        item.fullName?.toLowerCase().includes(keyword) ||
        item.registrationNumber?.toLowerCase().includes(keyword) ||
        item.applicationId?.toLowerCase().includes(keyword)

      const matchStatus =
        filterStatus === 'Semua' || item.scanStatus === filterStatus

      return matchSearch && matchStatus
    })
  }, [scanHistory, search, filterStatus])

  const stats = useMemo(() => {
    const total = scanHistory.length
    const valid = scanHistory.filter((item) => item.scanStatus === 'Valid').length
    const invalid = scanHistory.filter((item) => item.scanStatus === 'Tidak Valid').length

    return {
      total,
      valid,
      invalid
    }
  }, [scanHistory])

  const formatDateTime = (timestamp) => {
    if (!timestamp?.toDate) return '-'

    return timestamp.toDate().toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusClass = (scanStatus) => {
    if (scanStatus === 'Valid') {
      return 'bg-green-100 text-green-700'
    }

    return 'bg-red-100 text-red-700'
  }

  if (loading) {
    return (
      <div className="p-8 max-w-screen-2xl mx-auto">
        <div className="bg-surface-container-lowest p-10 rounded-[1.5rem] text-center shadow-[0px_12px_32px_rgba(26,28,28,0.06)]">
          <span className="material-symbols-outlined text-4xl text-primary mb-4">
            progress_activity
          </span>
          <p className="text-on-surface-variant font-medium">
            Memuat riwayat scan...
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
            Riwayat Validasi QR
          </h1>

          <p className="text-on-surface-variant mt-1 text-xs md:text-sm">
            Semua aktivitas pengecekan QR tersimpan otomatis dari Firebase.
          </p>
        </div>

        <Link
          to="/scanning"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs md:text-sm font-bold hover:opacity-90 active:scale-95 transition-all self-start lg:self-auto"
        >
          Scan QR Lagi
          <span className="material-symbols-outlined text-sm md:text-base">qr_code_scanner</span>
        </Link>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 md:mb-8">
        {[
          { label: 'Total Scan',  value: stats.total,   icon: 'history',  bg: 'bg-primary/10 text-primary' },
          { label: 'Valid',       value: stats.valid,   icon: 'verified', bg: 'bg-green-100 text-green-700' },
          { label: 'Tidak Valid', value: stats.invalid, icon: 'gpp_bad',  bg: 'bg-red-100 text-red-700', span: true },
        ].map((s, i) => (
          <div
            key={s.label}
            className={`${s.span ? 'col-span-2 sm:col-span-1' : ''} bg-surface-container-lowest rounded-xl md:rounded-2xl p-4 md:p-5 shadow-[0px_8px_24px_rgba(26,28,28,0.06)]`}
            style={{
              opacity: ready ? 1 : 0,
              transform: ready ? 'translateY(0)' : 'translateY(16px)',
              transition: `opacity 0.4s ease ${i * 80}ms, transform 0.4s ease ${i * 80}ms`
            }}
          >
            <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-3 md:mb-4`}>
              <span className="material-symbols-outlined text-base md:text-lg">{s.icon}</span>
            </div>
            <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{s.label}</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface mt-1">{s.value}</h2>
          </div>
        ))}
      </section>

      <section className="bg-surface-container-lowest rounded-xl md:rounded-2xl shadow-[0px_8px_24px_rgba(26,28,28,0.06)] overflow-hidden">
        <div className="p-4 md:p-5 border-b border-outline-variant/10 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base md:text-xl font-bold text-on-surface">
                Data Riwayat Scan
              </h3>

              <p className="text-xs text-on-surface-variant mt-0.5">
                Menampilkan {filteredHistory.length} dari {scanHistory.length} riwayat.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-base">
                search
              </span>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-4 py-1.5 w-full bg-slate-100/60 border border-slate-200/50 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-xs outline-none text-slate-700 placeholder:text-slate-400"
                placeholder="Cari nama, nomor, atau ID..."
                type="text"
              />
            </div>
          </div>

          {/* Filters (Horizontal scroll on mobile) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto max-w-full scrollbar-none">
            {['Semua', 'Valid', 'Tidak Valid'].map((filter) => (
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
        <div className="hidden md:block overflow-x-auto">
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
                  Status Scan
                </th>
                <th className="px-6 py-3 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant">
                  Status Pendaftar
                </th>
                <th className="px-6 py-3 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant">
                  Waktu Scan
                </th>
                <th className="px-6 py-3 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant text-right">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-outline-variant/10">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="w-14 h-14 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="material-symbols-outlined text-outline">
                        folder_open
                      </span>
                    </div>

                    <p className="font-bold text-on-surface">
                      Belum ada riwayat scan
                    </p>

                    <p className="text-sm text-on-surface-variant mt-1">
                      Riwayat akan muncul setelah admin melakukan cek QR.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-blue-50/50 transition-colors"
                    style={{
                      opacity: ready ? 1 : 0,
                      transform: ready ? 'translateY(0)' : 'translateY(8px)',
                      transition: `opacity 0.35s ease ${Math.min(index * 40, 320)}ms, transform 0.35s ease ${Math.min(index * 40, 320)}ms`
                    }}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold">
                          {(item.fullName || 'P').charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <p className="font-bold text-on-surface">
                            {item.fullName || 'Nama belum diisi'}
                          </p>

                          <p className="text-xs text-on-surface-variant break-all">
                            {item.applicationId}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5 font-mono text-sm text-on-surface">
                      {item.registrationNumber || '-'}
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${getStatusClass(
                          item.scanStatus
                        )}`}
                      >
                        {item.scanStatus || '-'}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-sm font-bold text-on-surface">
                      {item.status || '-'}
                    </td>

                    <td className="px-6 py-5 text-sm text-on-surface-variant">
                      {formatDateTime(item.scannedAt)}
                    </td>

                    <td className="px-6 py-5 text-right">
                      <Link
                        to={`/verification/detail?id=${item.applicationId}`}
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
          {filteredHistory.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-outline mb-2">folder_open</span>
              <p className="font-bold text-on-surface text-sm">Belum ada riwayat scan</p>
              <p className="text-xs text-on-surface-variant mt-1">Riwayat muncul setelah pengecekan QR.</p>
            </div>
          ) : (
            filteredHistory.map((item, index) => (
              <div
                key={item.id}
                className="p-4 flex flex-col gap-3"
                style={{
                  opacity: ready ? 1 : 0,
                  transform: ready ? 'translateY(0)' : 'translateY(10px)',
                  transition: `opacity 0.35s ease ${Math.min(index * 40, 300)}ms, transform 0.35s ease ${Math.min(index * 40, 300)}ms`
                }}
              >
                {/* Top: Avatar + Name + Scan Status */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-xs">
                      {(item.fullName || 'P').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-on-surface truncate max-w-[150px]">{item.fullName || 'Pendaftar'}</h4>
                      <p className="text-[9px] text-on-surface-variant truncate max-w-[140px]">{item.applicationId}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getStatusClass(item.scanStatus)}`}>
                    {item.scanStatus || '-'}
                  </span>
                </div>

                {/* Body Details Card */}
                <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-400 block">No. Registrasi</span>
                    <span className="font-mono font-semibold text-slate-700">{item.registrationNumber || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Status Pendaftar</span>
                    <span className="font-bold text-slate-700">{item.status || '-'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block">Waktu Validasi</span>
                    <span className="font-medium text-slate-700">{formatDateTime(item.scannedAt)}</span>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="flex justify-end pt-1">
                  <Link
                    to={`/verification/detail?id=${item.applicationId}`}
                    className="inline-flex items-center gap-0.5 text-[11px] font-bold text-primary hover:underline"
                  >
                    Detail Pendaftar
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