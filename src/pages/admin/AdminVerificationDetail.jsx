import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { toast } from 'sonner'
import { db } from '../../firebase/config'

// ─── Modal Konfirmasi Aksi Verifikasi ────────────────────────────────────────
function ConfirmModal({ isOpen, type, onConfirm, onCancel }) {
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (isOpen) setNotes('')
  }, [isOpen])

  if (!isOpen) return null

  const config = {
    Diterima: {
      icon: 'check_circle',
      iconClass: 'text-green-600',
      bgClass: 'bg-green-500/10',
      title: 'Terima Pendaftar',
      desc: 'Apakah Anda yakin ingin menerima pendaftar ini? Status akan berubah menjadi Diterima.',
      confirmClass: 'bg-green-600 hover:bg-green-700 text-white',
      confirmLabel: 'Ya, Terima',
      showNotes: false
    },
    'Perlu Revisi': {
      icon: 'assignment_return',
      iconClass: 'text-orange-600',
      bgClass: 'bg-orange-500/10',
      title: 'Kembalikan untuk Revisi',
      desc: 'Tulis alasan revisi yang akan dikirim ke siswa:',
      confirmClass: 'bg-orange-500 hover:bg-orange-600 text-white',
      confirmLabel: 'Kirim Revisi',
      showNotes: true,
      notesPlaceholder: 'Contoh: Ada data yang tidak sesuai, mohon perbaiki NISN dan foto profil.'
    },
    Ditolak: {
      icon: 'cancel',
      iconClass: 'text-red-600',
      bgClass: 'bg-red-500/10',
      title: 'Tolak Pendaftar',
      desc: 'Tulis alasan penolakan yang akan dikirim ke siswa:',
      confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
      confirmLabel: 'Tolak Pendaftaran',
      showNotes: true,
      notesPlaceholder: 'Contoh: Dokumen tidak lengkap atau tidak memenuhi persyaratan.'
    }
  }

  const c = config[type]
  if (!c) return null

  const handleConfirm = () => {
    if (c.showNotes && !notes.trim()) {
      toast.error('Catatan wajib diisi.')
      return
    }
    onConfirm(notes.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
        <div className={`w-16 h-16 rounded-2xl ${c.bgClass} ${c.iconClass} flex items-center justify-center mb-6 mx-auto`}>
          <span className="material-symbols-outlined text-4xl">{c.icon}</span>
        </div>

        <h3 className="text-xl font-extrabold text-on-surface text-center mb-2">{c.title}</h3>
        <p className="text-sm text-on-surface-variant text-center mb-6 leading-relaxed">{c.desc}</p>

        {c.showNotes && (
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant outline-none focus:ring-2 focus:ring-primary/20 text-sm resize-none mb-6"
            placeholder={c.notesPlaceholder}
            autoFocus
          />
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-surface-container text-on-surface font-bold hover:bg-surface-container-high active:scale-95 transition-all"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 py-3 rounded-xl font-bold active:scale-95 transition-all ${c.confirmClass}`}
          >
            {c.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tab definitions ─────────────────────────────────────────────────────────
const TABS = [
  { key: 'personal', label: 'Data Pribadi', icon: 'person' },
  { key: 'documents', label: 'Dokumen', icon: 'description' },
  { key: 'notes', label: 'Catatan', icon: 'comment' }
]

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AdminVerificationDetail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const applicationId = searchParams.get('id')

  const [application, setApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [savingChecklist, setSavingChecklist] = useState(false)
  const [activeTab, setActiveTab] = useState('personal')
  const [modal, setModal] = useState({ open: false, type: null })

  const [reviewChecklist, setReviewChecklist] = useState({
    identityValid: false,
    parentDataValid: false,
    documentsReadable: false
  })

  useEffect(() => {
    const fetchApplication = async () => {
      if (!applicationId) {
        toast.error('ID pendaftar tidak ditemukan.')
        navigate('/verification')
        return
      }

      try {
        const docRef = doc(db, 'applications', applicationId)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const applicationData = { id: docSnap.id, ...docSnap.data() }
          setApplication(applicationData)
          setReviewChecklist({
            identityValid: applicationData.reviewChecklist?.identityValid || applicationData.reviewChecklist?.nikValid || false,
            parentDataValid: applicationData.reviewChecklist?.parentDataValid || false,
            documentsReadable: applicationData.reviewChecklist?.documentsReadable || false
          })
        } else {
          toast.error('Data pendaftar tidak ditemukan.')
          navigate('/verification')
        }
      } catch (error) {
        console.error('Gagal mengambil detail pendaftar:', error)
        toast.error('Gagal mengambil detail pendaftar.')
      } finally {
        setLoading(false)
      }
    }

    fetchApplication()
  }, [applicationId, navigate])

  const handleChecklistChange = async (fieldName) => {
    if (!applicationId || savingChecklist) return
    const nextChecklist = { ...reviewChecklist, [fieldName]: !reviewChecklist[fieldName] }
    setReviewChecklist(nextChecklist)
    setSavingChecklist(true)
    try {
      await updateDoc(doc(db, 'applications', applicationId), {
        reviewChecklist: nextChecklist,
        reviewedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Gagal menyimpan checklist:', error)
      toast.error('Checklist gagal disimpan.')
      setReviewChecklist(reviewChecklist)
    } finally {
      setSavingChecklist(false)
    }
  }

  const executeUpdateStatus = async (newStatus, adminNotes) => {
    setModal({ open: false, type: null })
    if (!applicationId || updating) return
    setUpdating(true)
    try {
      const updatePayload = {
        status: newStatus,
        updatedAt: serverTimestamp(),
        notes: newStatus === 'Diterima'
          ? 'Pendaftaran telah diterima. Silakan lanjutkan ke tahap validasi QR.'
          : adminNotes
      }
      await updateDoc(doc(db, 'applications', applicationId), updatePayload)
      toast.success(`Status berhasil diubah menjadi ${newStatus}`)
      navigate('/verification')
    } catch (error) {
      console.error('Gagal mengubah status:', error)
      toast.error('Gagal mengubah status di Firebase.')
    } finally {
      setUpdating(false)
    }
  }

  const openModal = (type) => {
    if (type === 'Diterima' && !isChecklistComplete) {
      toast.error('Lengkapi semua checklist terlebih dahulu sebelum menerima pendaftar.')
      return
    }
    setModal({ open: true, type })
  }

  const getStatusClass = (status) => {
    if (status === 'Diterima') return 'bg-green-500/10 text-green-600'
    if (status === 'Ditolak') return 'bg-red-500/10 text-red-600'
    if (status === 'Perlu Revisi') return 'bg-orange-500/10 text-orange-600'
    return 'bg-primary/10 text-primary'
  }

  const getDocumentName = (fieldName) => {
    const document = documents?.[fieldName]
    if (!document) return 'Belum diunggah'
    if (typeof document === 'string') return document
    return document.originalFilename || document.publicId || document.url || 'Dokumen tersedia'
  }

  const getDocumentUrl = (fieldName) => {
    const document = documents?.[fieldName]
    if (!document) return null
    if (typeof document === 'string') return null
    return document.url || null
  }

  const personalData = application?.personalData || {}
  const parentData = application?.parentData || {}
  const documents = application?.documents || {}

  const fullName =
    personalData.fullName || personalData.name || personalData.nama || 'Nama belum diisi'

  const accountEmail =
    application?.studentEmail || application?.userEmail || application?.email || personalData.email || '-'

  const registrationNumber = application?.registrationNumber || application?.id || 'Belum ada nomor'

  const getStatusBorderClass = (status) => {
    if (status === 'Diterima') return 'border-glow-blue'
    if (status === 'Ditolak') return 'border-glow-red'
    if (status === 'Perlu Revisi') return 'border-glow-orange'
    return 'border-glow-blue'
  }

  const isChecklistComplete =
    reviewChecklist.identityValid && reviewChecklist.parentDataValid && reviewChecklist.documentsReadable

  const documentItems = [
    { label: 'Pas Foto Profil', field: 'photo', icon: 'account_circle' },
    { label: 'Kartu Pelajar / Rapor', field: 'reportCard', icon: 'badge' },
    { label: 'Surat Keterangan Sehat', field: 'healthCert', icon: 'medical_services' },
    { label: 'Sertifikat Pendukung', field: 'extraCert', icon: 'workspace_premium' }
  ]

  const checklistItems = [
    { key: 'identityValid', label: 'Data NISN sesuai dengan dokumen' },
    { key: 'parentDataValid', label: 'Data orang tua sesuai dengan dokumen' },
    { key: 'documentsReadable', label: 'Dokumen pendukung terbaca jelas' }
  ]

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-on-surface-variant font-medium">Memuat detail pendaftar...</p>
        </div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="p-8">
        <p className="text-on-surface-variant">Data tidak ditemukan.</p>
      </div>
    )
  }

  return (
    <>
      <ConfirmModal
        isOpen={modal.open}
        type={modal.type}
        onConfirm={(notes) => executeUpdateStatus(modal.type, notes)}
        onCancel={() => setModal({ open: false, type: null })}
      />

      <div className="px-8 py-8">
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            <button
              onClick={() => navigate('/verification')}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors mb-4"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Kembali ke Verifikasi
            </button>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-primary px-3 py-1 bg-primary/10 rounded-full">
                #{registrationNumber}
              </span>
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${getStatusClass(application.status)}`}>
                <span className="w-2 h-2 rounded-full bg-current"></span>
                {application.status || 'Menunggu Verifikasi'}
              </span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">{fullName}</h1>
            <p className="text-on-surface-variant mt-2">{accountEmail}</p>
          </div>

          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg ring-4 ring-primary/10">
              <span className="text-2xl font-extrabold text-white tracking-tight">{fullName.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </header>

        {/* Tab Navigation — Fungsional */}
        <div className="flex items-center gap-1 mb-8 p-1.5 bg-slate-100 rounded-2xl w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === tab.key
                  ? 'bg-white shadow-sm text-primary'
                  : 'text-slate-500 hover:bg-white/70 hover:text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-lg" style={activeTab === tab.key ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Content Area */}
          <div className="lg:col-span-8 space-y-6">

            {/* Tab: Data Pribadi */}
            {activeTab === 'personal' && (
              <>
                <section className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-[0px_12px_32px_rgba(26,28,28,0.08)] border-t-4 border-primary/40">
                  <h2 className="text-xl font-bold mb-6 text-on-surface">Informasi Personal</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-10">
                    <div className="md:col-span-2">
                      <p className="text-xs font-extrabold uppercase tracking-widest text-on-surface-variant mb-1.5">Nama Lengkap</p>
                      <p className="text-base font-medium text-on-surface">{fullName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-widest text-on-surface-variant mb-1.5">NIK / NISN</p>
                      <p className="text-base font-medium text-on-surface">{personalData.nisn || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-widest text-on-surface-variant mb-1.5">Tanggal Lahir</p>
                      <p className="text-base font-medium text-on-surface">
                        {personalData.dob
                          ? new Date(personalData.dob).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-widest text-on-surface-variant mb-1.5">Jenis Kelamin</p>
                      <p className="text-base font-medium text-on-surface">
                        {personalData.gender === 'L' ? 'Laki-laki' : personalData.gender === 'P' ? 'Perempuan' : personalData.gender || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-widest text-on-surface-variant mb-1.5">Nomor Telepon</p>
                      <p className="text-base font-medium text-on-surface">{personalData.phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-widest text-on-surface-variant mb-1.5">Email Akun</p>
                      <p className="text-base font-medium text-on-surface break-all">{accountEmail}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs font-extrabold uppercase tracking-widest text-on-surface-variant mb-1.5">Alamat Lengkap</p>
                      <p className="text-base font-medium text-on-surface">{personalData.address || '-'}</p>
                    </div>
                  </div>
                </section>

                <section className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-[0px_12px_32px_rgba(26,28,28,0.08)]">
                  <h2 className="text-xl font-bold mb-6 text-on-surface">Data Orang Tua</h2>
                  {/* Ayah */}
                  <p className="text-xs font-extrabold uppercase tracking-widest text-primary mb-4">Ayah</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-10 mb-8">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-widest text-on-surface-variant mb-1.5">Nama Ayah</p>
                      <p className="text-base font-medium text-on-surface">{parentData.fatherName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-widest text-on-surface-variant mb-1.5">No. HP Ayah</p>
                      <p className="text-base font-medium text-on-surface">{parentData.fatherPhone || '-'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs font-extrabold uppercase tracking-widest text-on-surface-variant mb-1.5">Pekerjaan Ayah</p>
                      <p className="text-base font-medium text-on-surface">{parentData.fatherJob || '-'}</p>
                    </div>
                  </div>
                  {/* Ibu */}
                  <div className="h-px bg-outline-variant/15 mb-6" />
                  <p className="text-xs font-extrabold uppercase tracking-widest text-primary mb-4">Ibu</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-10">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-widest text-on-surface-variant mb-1.5">Nama Ibu</p>
                      <p className="text-base font-medium text-on-surface">{parentData.motherName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-widest text-on-surface-variant mb-1.5">No. HP Ibu</p>
                      <p className="text-base font-medium text-on-surface">{parentData.motherPhone || '-'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs font-extrabold uppercase tracking-widest text-on-surface-variant mb-1.5">Pekerjaan Ibu</p>
                      <p className="text-base font-medium text-on-surface">{parentData.motherJob || '-'}</p>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* Tab: Dokumen */}
            {activeTab === 'documents' && (
              <section className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-[0px_12px_32px_rgba(26,28,28,0.08)]">
                <h2 className="text-xl font-bold mb-6 text-on-surface">Dokumen Pendaftaran</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documentItems.map((item) => {
                    const documentUrl = getDocumentUrl(item.field)
                    const documentName = getDocumentName(item.field)
                    const isUploaded = documentName !== 'Belum diunggah'

                    return (
                      <div
                        key={item.field}
                        className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isUploaded ? 'bg-green-500/10 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                            <span className="material-symbols-outlined">{item.icon}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-on-surface">{item.label}</p>
                            <p className={`text-xs truncate max-w-[200px] ${isUploaded ? 'text-green-600' : 'text-on-surface-variant'}`}>
                              {documentName}
                            </p>
                          </div>
                        </div>
                        {documentUrl ? (
                          <a
                            href={documentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all flex-shrink-0"
                          >
                            Lihat
                          </a>
                        ) : (
                          <span className="text-xs font-bold text-slate-400 flex-shrink-0">
                            {isUploaded ? '—' : 'Kosong'}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Tab: Catatan */}
            {activeTab === 'notes' && (
              <section className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-[0px_12px_32px_rgba(26,28,28,0.08)]">
                <h2 className="text-xl font-bold mb-6 text-on-surface">Catatan Admin</h2>
                {application.notes ? (
                  <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                    <p className="text-sm text-on-surface leading-relaxed">{application.notes}</p>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-surface-container-low rounded-2xl">
                    <span className="material-symbols-outlined text-3xl text-outline mb-2">comment</span>
                    <p className="text-sm text-on-surface-variant">Belum ada catatan dari admin.</p>
                  </div>
                )}

                {application.reviewedAt && (
                  <p className="text-xs text-outline mt-4">
                    Terakhir direview:{' '}
                    {application.reviewedAt?.toDate?.()?.toLocaleString('id-ID') || '-'}
                  </p>
                )}
              </section>
            )}
          </div>

          {/* Panel Verifikasi (Sticky) */}
          <div className="lg:col-span-4">
            <div className={`bg-white/90 ${getStatusBorderClass(application.status)} backdrop-blur-xl rounded-2xl p-5 shadow-[0px_8px_24px_rgba(26,28,28,0.08)] border border-outline-variant/20 sticky top-8`}>

              {/* ── STATUS FINAL (Diterima / Ditolak) ── */}
              {(application.status === 'Diterima' || application.status === 'Ditolak') ? (
                <>
                  {/* Status card */}
                  <div className={`rounded-xl p-4 mb-4 text-center ${
                    application.status === 'Diterima'
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-2 ${
                      application.status === 'Diterima' ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {application.status === 'Diterima' ? 'check_circle' : 'cancel'}
                      </span>
                    </div>
                    <p className={`font-bold text-base ${
                      application.status === 'Diterima' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {application.status === 'Diterima' ? 'Pendaftar Diterima' : 'Pendaftar Ditolak'}
                    </p>
                    {application.updatedAt && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {application.updatedAt?.toDate?.()?.toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </p>
                    )}
                  </div>

                  {/* Catatan keputusan */}
                  {application.notes && (
                    <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Catatan</p>
                      <p className="text-xs text-slate-700 leading-relaxed">{application.notes}</p>
                    </div>
                  )}

                  {/* Tombol ubah status — tersembunyi, untuk koreksi */}
                  <details className="group">
                    <summary className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer select-none flex items-center gap-1 transition-colors">
                      <span className="material-symbols-outlined text-sm">tune</span>
                      Perlu ubah keputusan?
                    </summary>
                    <div className="mt-3 space-y-2 pt-3 border-t border-slate-100">
                      {application.status === 'Diterima' ? (
                        <>
                          <button
                            onClick={() => openModal('Perlu Revisi')}
                            disabled={updating}
                            className="w-full py-2.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 font-bold text-xs flex items-center justify-center gap-2 hover:bg-orange-100 active:scale-[0.98] transition-all disabled:opacity-60"
                          >
                            <span className="material-symbols-outlined text-sm">assignment_return</span>
                            Kembalikan untuk Revisi
                          </button>
                          <button
                            onClick={() => openModal('Ditolak')}
                            disabled={updating}
                            className="w-full py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-100 active:scale-[0.98] transition-all disabled:opacity-60"
                          >
                            <span className="material-symbols-outlined text-sm">cancel</span>
                            Tolak
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => openModal('Diterima')}
                            disabled={updating || !isChecklistComplete}
                            className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                              isChecklistComplete
                                ? 'bg-green-500 text-white hover:bg-green-600 active:scale-[0.98]'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            Terima
                          </button>
                          <button
                            onClick={() => openModal('Perlu Revisi')}
                            disabled={updating}
                            className="w-full py-2.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 font-bold text-xs flex items-center justify-center gap-2 hover:bg-orange-100 active:scale-[0.98] transition-all disabled:opacity-60"
                          >
                            <span className="material-symbols-outlined text-sm">assignment_return</span>
                            Kembalikan untuk Revisi
                          </button>
                        </>
                      )}
                    </div>
                  </details>
                </>
              ) : (
                /* ── MASIH PERLU DIPROSES ── */
                <>
                  {/* Panel Header */}
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-base text-primary">verified_user</span>
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-on-surface leading-tight">Panel Verifikasi</h2>
                      <p className="text-xs text-on-surface-variant">Tentukan keputusan pendaftaran</p>
                    </div>
                  </div>

                  {/* Tombol Utama: Terima */}
                  <button
                    onClick={() => openModal('Diterima')}
                    disabled={updating || !isChecklistComplete}
                    className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all mb-2 ${
                      isChecklistComplete
                        ? 'bg-green-500 text-white hover:bg-green-600 active:scale-[0.98] shadow-md shadow-green-500/20'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    {updating ? 'Memproses...' : 'Terima'}
                  </button>

                  {/* Tombol Sekunder: Revisi & Tolak */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <button
                      onClick={() => openModal('Perlu Revisi')}
                      disabled={updating}
                      className="py-2.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-orange-100 active:scale-[0.98] transition-all disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-sm">assignment_return</span>
                      Revisi
                    </button>
                    <button
                      onClick={() => openModal('Ditolak')}
                      disabled={updating}
                      className="py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-red-100 active:scale-[0.98] transition-all disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-sm">cancel</span>
                      Tolak
                    </button>
                  </div>

                  <div className="h-px bg-outline-variant/20 mb-4" />

                  {/* Checklist */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-0">Quick Review</p>
                      {savingChecklist && (
                        <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0"></span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {checklistItems.map((item) => (
                        <label key={item.key} className="flex items-center gap-2.5 cursor-pointer group p-2 rounded-xl hover:bg-slate-50 transition-colors">
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            reviewChecklist[item.key]
                              ? 'bg-primary border-primary'
                              : 'border-outline-variant bg-white quick-review-checkbox'
                          }`}>
                            {reviewChecklist[item.key] && (
                              <svg viewBox="0 0 12 10" fill="none" className="w-3 h-3">
                                <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={reviewChecklist[item.key]}
                            disabled={savingChecklist}
                            onChange={() => handleChecklistChange(item.key)}
                          />
                          <span className={`text-xs leading-snug transition-colors ${
                            reviewChecklist[item.key] ? 'text-on-surface font-medium' : 'text-on-surface-variant'
                          }`}>
                            {item.label}
                          </span>
                        </label>
                      ))}
                    </div>

                    <div className={`mt-3 rounded-xl px-3 py-2 text-xs leading-relaxed flex items-center gap-2 ${
                      isChecklistComplete
                        ? 'bg-green-500/10 text-green-700'
                        : 'bg-amber-500/10 text-amber-700'
                    }`}>
                      <span className="material-symbols-outlined text-sm flex-shrink-0">
                        {isChecklistComplete ? 'check_circle' : 'info'}
                      </span>
                      {isChecklistComplete
                        ? 'Siap diterima.'
                        : 'Centang semua poin untuk mengaktifkan tombol Terima.'}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}