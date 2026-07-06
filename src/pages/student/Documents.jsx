import React, { useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { toast } from 'sonner'
import { uploadToCloudinary, deleteFromCloudinary } from '../../utils/cloudinaryUpload'

const STEPS = [
  { label: 'Data Pribadi', icon: 'person' },
  { label: 'Orang Tua', icon: 'family_restroom' },
  { label: 'Berkas', icon: 'folder_open' },
  { label: 'Tinjau', icon: 'fact_check' },
]

function StepProgress({ current }) {
  return (
    <div className="mb-10">
      <div className="flex items-start justify-between relative">
        <div className="absolute top-4 left-0 right-0 flex px-[10%]">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`flex-1 h-0.5 mx-1 transition-all duration-500 ${
                i < current - 1
                  ? 'bg-primary'
                  : i === current - 1
                  ? 'bg-gradient-to-r from-primary to-outline-variant/40'
                  : 'bg-outline-variant/30'
              }`}
            />
          ))}
        </div>

        {STEPS.map((step, i) => {
          const status = i + 1 < current ? 'done' : i + 1 === current ? 'active' : 'upcoming'
          return (
            <div key={i} className="flex flex-col items-center gap-2 z-10 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  status === 'done'
                    ? 'bg-primary shadow-md shadow-primary/30'
                    : status === 'active'
                    ? 'bg-primary ring-4 ring-primary/20 shadow-lg shadow-primary/30'
                    : 'bg-surface-container-high border-2 border-outline-variant/40'
                }`}
              >
                {status === 'done' ? (
                  <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                ) : (
                  <span className={`material-symbols-outlined text-base ${status === 'active' ? 'text-white' : 'text-outline'}`}>
                    {step.icon}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-bold tracking-wide text-center leading-tight ${
                status === 'active' ? 'text-primary' : status === 'done' ? 'text-on-surface-variant' : 'text-outline'
              }`}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-6 h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-700"
          style={{ width: `${((current - 1) / (STEPS.length - 1)) * 100}%` }}
        />
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-outline font-medium">
        <span>Langkah {current} dari {STEPS.length}</span>
        <span>{Math.round(((current - 1) / (STEPS.length - 1)) * 100)}% selesai</span>
      </div>
    </div>
  )
}

export default function Documents() {
  const navigate = useNavigate()
  const { formData, updateFormData } = useOutletContext()
  const [uploadingField, setUploadingField] = useState(null)

  const documents = formData?.documents || {}

  const getDocumentName = (fieldName) => {
    const value = documents?.[fieldName]
    if (!value) return ''
    if (typeof value === 'string') return value
    return value.originalFilename || value.publicId || 'File berhasil diunggah'
  }

  const isUploaded = (fieldName) => Boolean(documents?.[fieldName])

  const handleFileUpload = async (fieldName, file) => {
    if (!file) return

    const maxSize = 5 * 1024 * 1024
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']

    if (!allowedTypes.includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan JPG, PNG, atau PDF.')
      return
    }
    if (file.size > maxSize) {
      toast.error('Ukuran file maksimal 5MB.')
      return
    }

    try {
      setUploadingField(fieldName)
      const uploadedFile = await uploadToCloudinary(file, `recruit-hub/${fieldName}`)
      updateFormData('documents', fieldName, uploadedFile)
      toast.success('File berhasil diunggah.')
    } catch (error) {
      console.error(error)
      toast.error('Gagal upload file. Cek koneksi internet.')
    } finally {
      setUploadingField(null)
    }
  }

  const handleFileDelete = async (fieldName) => {
    const docInfo = documents?.[fieldName]
    if (!docInfo) return

    const deleteToken = typeof docInfo === 'object' ? docInfo?.deleteToken : null

    // Optimistically remove from state
    updateFormData('documents', fieldName, null)
    toast.success('File berhasil dihapus dari formulir.')

    if (deleteToken) {
      try {
        await deleteFromCloudinary(deleteToken)
      } catch (error) {
        console.error('Gagal menghapus file dari Cloudinary:', error)
      }
    }
  }

  const uploadCards = [
    {
      field: 'photo',
      title: 'Pas Foto Profil',
      desc: 'Rasio 3x4 disarankan',
      icon: 'account_circle',
      emptyIcon: 'add_a_photo',
      required: true,
      color: 'primary'
    },
    {
      field: 'reportCard',
      title: 'Kartu Pelajar / Rapor',
      desc: 'Wajib halaman depan',
      icon: 'badge',
      emptyIcon: 'upload_file',
      required: true,
      color: 'secondary'
    },
    {
      field: 'healthCert',
      title: 'Surat Keterangan Sehat',
      desc: 'Maks. 3 bulan terakhir',
      icon: 'medical_services',
      emptyIcon: 'health_and_safety',
      required: true,
      color: 'tertiary'
    },
    {
      field: 'extraCert',
      title: 'Sertifikat Pendukung',
      desc: 'Piagam, Lomba, atau Organisasi',
      icon: 'military_tech',
      emptyIcon: 'workspace_premium',
      required: false,
      color: 'outline'
    },
  ]

  const colorMap = {
    primary: { bg: 'bg-primary/10', text: 'text-primary', ring: 'ring-primary/20', border: 'border-primary/30' },
    secondary: { bg: 'bg-secondary/10', text: 'text-secondary', ring: 'ring-secondary/20', border: 'border-secondary/30' },
    tertiary: { bg: 'bg-green-500/10', text: 'text-green-600', ring: 'ring-green-500/20', border: 'border-green-500/30' },
    outline: { bg: 'bg-outline/10', text: 'text-outline', ring: 'ring-outline/20', border: 'border-outline/30' },
  }

  return (
    <>
      <main className="flex-grow pt-24 pb-28 px-4 md:px-6 max-w-2xl mx-auto w-full">
        <StepProgress current={3} />

        <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-[0px_16px_48px_rgba(26,28,28,0.07)] border border-outline-variant/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[4rem] pointer-events-none" />

          {/* Header card */}
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-outline-variant/20">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-2xl">folder_open</span>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-on-surface leading-tight">Dokumen &amp; Berkas</h1>
              <p className="text-xs text-on-surface-variant mt-0.5">Format JPG, PNG, atau PDF — maks. 5MB per file</p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-3 bg-primary/5 border border-primary/15 rounded-2xl px-4 py-3 mb-6">
            <span className="material-symbols-outlined text-primary text-lg shrink-0 mt-0.5">info</span>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Pastikan semua dokumen terbaca jelas dan tidak buram. Dokumen bertanda{' '}
              <span className="font-bold text-on-surface">wajib</span> harus diunggah sebelum melanjutkan.
            </p>
          </div>

          {/* Upload Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {uploadCards.map((card) => {
              const uploaded = isUploaded(card.field)
              const fileName = getDocumentName(card.field)
              const isUploading = uploadingField === card.field
              const colors = colorMap[card.color]

              return (
                <div key={card.field} className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`material-symbols-outlined text-[18px] ${colors.text}`}>{card.icon}</span>
                    <span className="text-sm font-semibold text-on-surface">{card.title}</span>
                    {!card.required && (
                      <span className="text-[10px] font-medium text-outline bg-surface-container px-1.5 py-0.5 rounded-full ml-auto">
                        Opsional
                      </span>
                    )}
                  </div>

                  <label
                    className={`group relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer overflow-hidden transition-all duration-300 ${
                      uploaded
                        ? 'border-green-400 bg-green-500/5 hover:border-green-500'
                        : isUploading
                        ? 'border-primary/40 bg-primary/5 opacity-70 pointer-events-none'
                        : `border-outline-variant/50 bg-surface-container/30 hover:border-primary/60 hover:bg-primary/3`
                    }`}
                  >
                    {/* Ikon status */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 transition-all ${
                      uploaded ? 'bg-green-500/15' : isUploading ? 'bg-primary/10' : `${colors.bg} group-hover:scale-110`
                    }`}>
                      {isUploading ? (
                        <span className="material-symbols-outlined text-primary text-2xl animate-spin">progress_activity</span>
                      ) : uploaded ? (
                        <span className="material-symbols-outlined text-green-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      ) : (
                        <span className={`material-symbols-outlined text-2xl ${colors.text}`}>{card.emptyIcon}</span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-on-surface text-center px-4 truncate w-full text-center">
                      {isUploading ? 'Mengunggah...' : uploaded ? (fileName || 'File tersimpan') : 'Klik untuk unggah'}
                    </p>
                    <p className="text-[11px] text-outline mt-0.5">
                      {uploaded ? '✓ Berhasil disimpan' : card.desc}
                    </p>

                    {uploaded && (
                      <div className="mt-2 flex items-center gap-3">
                        {(typeof documents[card.field] === 'string' || documents[card.field]?.url) && (
                          <a
                            href={typeof documents[card.field] === 'string' ? documents[card.field] : documents[card.field].url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                            Lihat file
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleFileDelete(card.field)
                          }}
                          className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                          Hapus file
                        </button>
                      </div>
                    )}

                    <input
                      className="hidden"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      disabled={isUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(card.field, file)
                        e.target.value = ''
                      }}
                    />
                  </label>
                </div>
              )
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-3 pt-5 border-t border-outline-variant/20">
            <button
              onClick={() => navigate(-1)}
              disabled={Boolean(uploadingField)}
              className="w-full md:w-auto px-6 py-2.5 text-primary font-semibold text-sm hover:bg-primary/5 rounded-xl transition-all flex items-center justify-center gap-2 border border-primary/20 hover:border-primary/40 disabled:opacity-50"
              type="button"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Kembali
            </button>
            <button
              onClick={() => navigate('/step4')}
              disabled={Boolean(uploadingField)}
              className="w-full md:w-auto px-8 py-3 bg-primary text-white font-bold text-sm rounded-xl shadow-md shadow-primary/25 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              type="button"
            >
              {uploadingField ? 'Tunggu Upload...' : 'Lanjut'}
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-on-surface-variant">
            Butuh bantuan?{' '}
            <Link className="text-primary font-semibold hover:underline" to="#">Hubungi Pusat Bantuan</Link>
          </p>
        </div>
      </main>
    </>
  )
}