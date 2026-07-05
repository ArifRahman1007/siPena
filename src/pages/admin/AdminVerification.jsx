import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, limit, onSnapshot, orderBy, query, startAfter } from 'firebase/firestore'
import { db } from '../../firebase/config'

const PAGE_SIZE = 30

export default function AdminVerification() {
  const navigate = useNavigate()

  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [lastDoc, setLastDoc] = useState(null)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('Semua')
  const [ready, setReady] = useState(false)

  // Real-time listener untuk batch pertama
  useEffect(() => {
    setLoading(true)

    const q = query(
      collection(db, 'applications'),
      orderBy('submittedAt', 'desc'),
      limit(PAGE_SIZE)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }))

        setApplications(data)
        setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null)
        setHasMore(snapshot.docs.length === PAGE_SIZE)
        setLoading(false)
        setTimeout(() => setReady(true), 60)
      },
      (error) => {
        console.error('Gagal mengambil data pendaftar:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  // Load more (tanpa real-time untuk halaman berikutnya)
  const handleLoadMore = async () => {
    if (!lastDoc || loadingMore) return

    setLoadingMore(true)

    try {
      const { getDocs } = await import('firebase/firestore')
      const q = query(
        collection(db, 'applications'),
        orderBy('submittedAt', 'desc'),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      )

      const snapshot = await getDocs(q)
      const newData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))

      setApplications((prev) => {
        // Hindari duplikat
        const existingIds = new Set(prev.map((item) => item.id))
        const unique = newData.filter((item) => !existingIds.has(item.id))
        return [...prev, ...unique]
      })

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null)
      setHasMore(snapshot.docs.length === PAGE_SIZE)
    } catch (error) {
      console.error('Gagal memuat lebih banyak data:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  const filteredApplications = useMemo(() => {
    return applications.filter((item) => {
      const name = item?.personalData?.fullName?.toLowerCase() || ''
      const regNumber = item?.registrationNumber?.toLowerCase() || ''
      const keyword = search.toLowerCase()

      const matchSearch =
        name.includes(keyword) ||
        regNumber.includes(keyword)

      const matchFilter =
        activeFilter === 'Semua' ||
        item.status === activeFilter

      return matchSearch && matchFilter
    })
  }, [applications, search, activeFilter])

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return '-'

    return timestamp.toDate().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusClass = (status) => {
    if (status === 'Diterima' || status === 'Terverifikasi') {
      return 'bg-green-500/10 text-green-600'
    }

    if (status === 'Ditolak') {
      return 'bg-red-500/10 text-red-600'
    }

    if (status === 'Perlu Revisi') {
      return 'bg-orange-500/10 text-orange-600'
    }

    return 'bg-blue-500/10 text-blue-600'
  }

  const getStatusBorderClass = (status) => {
    if (status === 'Diterima') return 'border-glow-blue'
    if (status === 'Ditolak') return 'border-glow-red'
    if (status === 'Perlu Revisi') return 'border-glow-orange'
    return 'border-glow-blue'
  }

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Verifikasi Data Pendaftar
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tinjau dan validasi data pendaftar yang masuk.
          </p>
        </div>

        {search && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
            <span className="material-symbols-outlined text-sm">manage_search</span>
            Hasil untuk &quot;{search}&quot;
          </div>
        )}
      </header>

      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 md:mb-8">
        {/* Search (expanding to the right) */}
        <div className="flex justify-start shrink-0">
          <div
            className={`group relative flex items-center overflow-hidden rounded-full border transition-all duration-300 ease-out ${
              search.length > 0
                ? 'w-64 bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/20'
                : 'w-12 bg-white border-slate-200 hover:w-64 focus-within:w-64 hover:bg-blue-600 hover:border-blue-600 focus-within:bg-blue-600 focus-within:border-blue-600 hover:shadow-lg hover:shadow-blue-500/20 focus-within:shadow-lg focus-within:shadow-blue-500/20'
            }`}
          >
            <div className={`h-11 w-11 shrink-0 flex items-center justify-center rounded-full transition-colors pointer-events-none ${
              search.length > 0 ? 'text-white' : 'text-slate-400 group-hover:text-white group-focus-within:text-white'
            }`}>
              <span className="material-symbols-outlined text-[20px]">
                search
              </span>
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 bg-transparent pr-10 text-xs font-semibold outline-none border-none focus:outline-none focus:ring-0 w-full text-white placeholder:text-blue-100/70"
              placeholder="Cari nama..."
              type="text"
            />

            {search.length > 0 && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full text-white/80 hover:bg-white/20 hover:text-white active:scale-90 transition-all"
                aria-label="Hapus pencarian"
              >
                <span className="material-symbols-outlined text-xs">
                  close
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Filters (Horizontally scrollable on mobile) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto max-w-full scrollbar-none">
          {['Semua', 'Menunggu Verifikasi', 'Diterima', 'Perlu Revisi', 'Ditolak'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all whitespace-nowrap ${
                activeFilter === filter
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-slate-600 hover:bg-white/70'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-10 rounded-2xl text-center shadow-sm">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500 text-sm">Memuat data pendaftar...</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl text-center shadow-sm">
          <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">folder_open</span>
          <h3 className="text-base font-bold text-slate-700">Belum ada data pendaftar</h3>
          <p className="text-sm text-slate-400 mt-1">Data muncul setelah siswa mengirim formulir.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-4">
            <p className="text-sm text-slate-500">
              Menampilkan <span className="font-bold text-slate-700">{filteredApplications.length}</span> pendaftar
              {activeFilter !== 'Semua' && <span> • Filter: <span className="font-bold">{activeFilter}</span></span>}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredApplications.map((item, index) => (
              <div
                key={item.id}
                className={`bg-white ${getStatusBorderClass(item.status)} p-4 rounded-2xl shadow-[0px_4px_16px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:shadow-[0px_8px_24px_rgba(15,23,42,0.10)] transition-all duration-200 group`}
                style={{
                  opacity: ready ? 1 : 0,
                  transform: ready ? 'translateY(0)' : 'translateY(16px)',
                  transition: `opacity 0.4s ease ${Math.min(index * 50, 400)}ms, transform 0.4s ease ${Math.min(index * 50, 400)}ms, box-shadow 0.2s, translate 0.2s`
                }}
              >
                {/* Top: avatar + status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-extrabold text-sm flex-shrink-0">
                      {(item?.personalData?.fullName || 'P').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                        {item?.personalData?.fullName || 'Nama belum diisi'}
                      </h4>
                      <span className="text-[10px] font-medium text-slate-400">
                        Daftar {formatDate(item.submittedAt)}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide flex-shrink-0 ${getStatusClass(item.status)}`}>
                    {(item.status || 'Menunggu').split(' ')[0]}
                  </span>
                </div>

                {/* Info rows */}
                <div className="space-y-1.5 mb-3 border-t border-slate-100 pt-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Submit</span>
                    <span className="font-medium text-slate-700">{formatDate(item.submittedAt)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">NISN</span>
                    <span className="font-medium text-slate-700">{item?.personalData?.nisn || '-'}</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/verification/detail?id=${item.id}`)}
                  className="w-full py-2 px-3 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  Periksa Data
                </button>
              </div>
            ))}
          </div>

          {hasMore && !search && activeFilter === 'Semua' && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-60 shadow-sm"
              >
                {loadingMore ? (
                  <><span className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></span>Memuat...</>
                ) : (
                  <><span className="material-symbols-outlined text-base">expand_more</span>Muat Lebih Banyak</>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}