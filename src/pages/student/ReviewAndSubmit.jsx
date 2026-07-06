import React, { useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore'
import { db, auth } from '../../firebase/config'

export default function ReviewAndSubmit() {
  const navigate = useNavigate()
  const outletContext = useOutletContext()
  const formData = outletContext?.formData || {
    personalData: {},
    parentData: {},
    documents: {}
  }

  const [agreed, setAgreed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDraftSaving, setIsDraftSaving] = useState(false)
  const getDocumentName = (fieldName) => {
  const document = formData?.documents?.[fieldName]

  if (!document) return 'Belum diunggah'

  if (typeof document === 'string') return document

  return document.originalFilename || document.publicId || 'File berhasil diunggah'
}

const getDocumentUrl = (fieldName) => {
  const document = formData?.documents?.[fieldName]

  if (!document) return null
  if (typeof document === 'string') return document

  return document.url || document.secureUrl
}

  const handleSubmit = async () => {
  if (!agreed || isSubmitting) return

  setIsSubmitting(true)

  const currentUser = auth.currentUser

  if (!currentUser) {
    alert('Kamu harus login dulu sebelum mengirim pendaftaran.')
    setIsSubmitting(false)
    navigate('/login-siswa')
    return
  }

  try {
    const revisionMode = localStorage.getItem('revisionMode') === 'true'
    const existingRegistrationNumber = localStorage.getItem('lastRegistrationNumber')

    const existingQuery = query(
      collection(db, 'applications'),
      where('userId', '==', currentUser.uid)
    )

    const existingSnapshot = await getDocs(existingQuery)
    const existingDoc = existingSnapshot.empty ? null : existingSnapshot.docs[0]
    const existingData = existingDoc ? existingDoc.data() : null

    const registrationNumber =
      existingData?.registrationNumber ||
      existingRegistrationNumber ||
      `SPN-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`

    const mergedPersonalData = {
      ...(existingData?.personalData || {}),
      ...(formData.personalData || {})
    }

    const mergedParentData = {
      ...(existingData?.parentData || {}),
      ...(formData.parentData || {})
    }

    const mergedDocuments = {
      ...(existingData?.documents || {}),
      ...(formData.documents || {})
    }

    const studentName =
      mergedPersonalData.fullName ||
      mergedPersonalData.name ||
      existingData?.studentName ||
      currentUser.displayName ||
      'Calon Peserta'

    if (existingDoc) {
      const docRef = doc(db, 'applications', existingDoc.id)

      await updateDoc(docRef, {
        userId: currentUser.uid,
        studentEmail: currentUser.email,
        studentName,
        registrationNumber,
        personalData: mergedPersonalData,
        parentData: mergedParentData,
        documents: mergedDocuments,
        status: 'Menunggu Verifikasi',
        notes: '',
        updatedAt: serverTimestamp(),
        resubmittedAt: revisionMode
          ? serverTimestamp()
          : existingData?.resubmittedAt || null
      })

      localStorage.setItem('lastApplicationId', existingDoc.id)
      localStorage.setItem('lastRegistrationNumber', registrationNumber)
      localStorage.removeItem('revisionMode')
    } else {
      const docRef = await addDoc(collection(db, 'applications'), {
        userId: currentUser.uid,
        studentEmail: currentUser.email,
        studentName,
        registrationNumber,
        personalData: mergedPersonalData,
        parentData: mergedParentData,
        documents: mergedDocuments,
        status: 'Menunggu Verifikasi',
        notes: '',
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      localStorage.setItem('lastApplicationId', docRef.id)
      localStorage.setItem('lastRegistrationNumber', registrationNumber)
    }

    navigate('/success')
  } catch (error) {
    console.error('Gagal mengirim pendaftaran:', error)
    alert('Data gagal dikirim ke Firebase. Cek koneksi internet atau aturan Firestore.')
  } finally {
    setIsSubmitting(false)
  }
}

  const handleSaveDraft = async () => {
    if (isDraftSaving) return

    const currentUser = auth.currentUser
    if (!currentUser) {
      alert('Kamu harus login dulu untuk menyimpan draft.')
      navigate('/login-siswa')
      return
    }

    setIsDraftSaving(true)
    try {
      const existingQuery = query(
        collection(db, 'applications'),
        where('userId', '==', currentUser.uid)
      )
      const existingSnapshot = await getDocs(existingQuery)
      const existingDoc = existingSnapshot.empty ? null : existingSnapshot.docs[0]
      const existingData = existingDoc ? existingDoc.data() : null

      const registrationNumber =
        existingData?.registrationNumber ||
        localStorage.getItem('lastRegistrationNumber') ||
        `SPN-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`

      const draftPayload = {
        userId: currentUser.uid,
        studentEmail: currentUser.email,
        studentName: formData.personalData?.fullName || currentUser.displayName || 'Calon Peserta',
        registrationNumber,
        personalData: formData.personalData || {},
        parentData: formData.parentData || {},
        documents: formData.documents || {},
        status: 'Draft',
        notes: '',
        isDraft: true,
        updatedAt: serverTimestamp()
      }

      if (existingDoc) {
        const docRef = doc(db, 'applications', existingDoc.id)
        await updateDoc(docRef, draftPayload)
        localStorage.setItem('lastApplicationId', existingDoc.id)
      } else {
        const docRef = await addDoc(collection(db, 'applications'), {
          ...draftPayload,
          submittedAt: serverTimestamp()
        })
        localStorage.setItem('lastApplicationId', docRef.id)
      }

      localStorage.setItem('lastRegistrationNumber', registrationNumber)
      alert('Draft berhasil disimpan!')
    } catch (error) {
      console.error('Gagal menyimpan draft:', error)
      alert('Gagal menyimpan draft. Cek koneksi internet.')
    } finally {
      setIsDraftSaving(false)
    }
  }

  return (
    <>
      <main className="pt-24 pb-32 px-4 md:px-8 max-w-5xl mx-auto">
        <section className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="space-y-2">
              <span className="text-primary font-bold tracking-widest text-xs uppercase">
                Langkah 4 dari 4
              </span>

              <h1 className="text-2xl md:text-xl font-extrabold tracking-tight text-on-surface">
                Tinjau &amp; Kirim
              </h1>

              <p className="text-on-surface-variant max-w-xl body-md">
                Silakan periksa kembali seluruh data Anda sebelum mengirimkan pendaftaran.
                Data yang dikirim akan diproses oleh admin.
              </p>
            </div>

            <div className="w-full md:w-64 h-3 bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-primary-gradient w-[100%] rounded-full"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-8 space-y-6">
              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_4px_12px_rgba(26,28,28,0.03)] border-t-2 border-primary-fixed-dim">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold tracking-tight">
                    Data Pribadi
                  </h2>

                  <button
                    onClick={() => navigate('/step1')}
                    className="text-primary font-semibold text-sm hover:underline"
                  >
                    Ubah Data
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-6">
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                      Nama Lengkap
                    </p>
                    <p className="text-on-surface font-medium">
                      {formData.personalData?.fullName || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                      Email
                    </p>
                    <p className="text-on-surface font-medium">
                      {auth.currentUser?.email || formData.personalData?.email || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                      NISN
                    </p>
                    <p className="text-on-surface font-medium">
                      {formData.personalData?.nisn || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                      Tempat, Tanggal Lahir
                    </p>
                    <p className="text-on-surface font-medium">
                      {formData.personalData?.dob || '-'}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                      Alamat Domisili
                    </p>
                    <p className="text-on-surface font-medium">
                      {formData.personalData?.address || '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_4px_12px_rgba(26,28,28,0.03)]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold tracking-tight">
                    Data Orang Tua
                  </h2>

                  <button
                    onClick={() => navigate('/step2')}
                    className="text-primary font-semibold text-sm hover:underline"
                  >
                    Ubah Data
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-6">
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                      Nama Ayah
                    </p>
                    <p className="text-on-surface font-medium">
                      {formData.parentData?.fatherName || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                      Pekerjaan Ayah
                    </p>
                    <p className="text-on-surface font-medium">
                      {formData.parentData?.fatherJob || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                      Nama Ibu
                    </p>
                    <p className="text-on-surface font-medium">
                      {formData.parentData?.motherName || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                      No. Telepon Orang Tua
                    </p>
                    <p className="text-on-surface font-medium">
                      {formData.parentData?.fatherPhone ||
                        formData.parentData?.motherPhone ||
                        '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_4px_12px_rgba(26,28,28,0.03)]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold tracking-tight">
                    Dokumen yang Diunggah
                  </h2>

                  <button
                    onClick={() => navigate('/step3')}
                    className="text-primary font-semibold text-sm hover:underline"
                  >
                    Ubah Data
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.documents?.photo && (
                    <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg">
                      <div className="flex items-center space-x-4">
                        <span className="material-symbols-outlined text-primary">
                          image
                        </span>

                        <div>
                      <p className="font-medium text-sm">
                        {getDocumentName('photo')}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        Berhasil diunggah
                      </p>

                      {getDocumentUrl('photo') && (
                        <a
                          href={getDocumentUrl('photo')}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          Lihat file
                        </a>
                      )}
                    </div>
                      </div>

                      <span className="bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                        Siap
                      </span>
                    </div>
                  )}

                  {formData.documents?.reportCard && (
                    <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg">
                      <div className="flex items-center space-x-4">
                        <span className="material-symbols-outlined text-primary">
                          description
                        </span>

                        <div>
                          <p className="font-medium text-sm">
                            {getDocumentName('reportCard')}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            Berhasil diunggah
                          </p>
                        </div>
                      </div>

                      <span className="bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                        Siap
                      </span>
                    </div>
                  )}

                  {formData.documents?.healthCert && (
                    <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg">
                      <div className="flex items-center space-x-4">
                        <span className="material-symbols-outlined text-primary">
                          medical_services
                        </span>

                        <div>
                          <p className="font-medium text-sm">
                            {getDocumentName('healthCert')}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            Berhasil diunggah
                          </p>
                        </div>
                      </div>

                      <span className="bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                        Siap
                      </span>
                    </div>
                  )}

                  {!formData.documents?.photo &&
                    !formData.documents?.reportCard &&
                    !formData.documents?.healthCert && (
                      <p className="text-sm text-on-surface-variant italic">
                        Belum ada dokumen yang diunggah.
                      </p>
                    )}
                </div>
              </div>
            </div>

            <div className="md:col-span-4">
              <div className="sticky top-24 space-y-4">
                <div className="bg-surface-container-highest p-6 rounded-2xl shadow-xl">
                  <h3 className="text-lg font-bold mb-4">
                    Pernyataan Pendaftaran
                  </h3>

                  <div className="flex gap-4 mb-6">
                    <input
                      className="mt-1 rounded text-primary focus:ring-primary w-5 h-5 border-outline cursor-pointer"
                      id="declaration"
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                    />

                    <label
                      className="text-sm text-on-surface-variant leading-relaxed"
                      htmlFor="declaration"
                    >
                      Saya menyatakan bahwa seluruh data yang saya masukkan adalah benar
                      dan dapat dipertanggungjawabkan sesuai dengan dokumen asli yang
                      saya miliki.
                    </label>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleSubmit}
                      disabled={!agreed || isSubmitting}
                      className={`w-full font-bold py-2.5 px-6 rounded-xl shadow-lg active:scale-95 duration-200 flex items-center justify-center gap-2 ${
                        agreed && !isSubmitting
                          ? 'bg-secondary-gradient text-white hover:opacity-90'
                          : 'bg-surface-container-high text-on-surface-variant cursor-not-allowed'
                      }`}
                    >
                      <span>
                        {isSubmitting ? 'Mengirim Data...' : 'Kirim Pendaftaran'}
                      </span>

                      {!isSubmitting && (
                        <span className="material-symbols-outlined">send</span>
                      )}

                      {isSubmitting && (
                        <span className="material-symbols-outlined animate-spin">
                          refresh
                        </span>
                      )}
                    </button>

                    <button
                      onClick={handleSaveDraft}
                      disabled={isDraftSaving || isSubmitting}
                      className="w-full bg-surface-container-high border border-outline-variant text-on-surface font-semibold py-2.5 px-6 rounded-xl hover:bg-surface-container-highest transition-colors active:scale-95 duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isDraftSaving ? 'Menyimpan Draft...' : 'Simpan sebagai Draft'}
                    </button>
                  </div>

                  <div className="mt-6 pt-6 border-t border-outline-variant/30 text-center">
                    <p className="text-xs text-on-surface-variant">
                      Butuh bantuan? Hubungi{' '}
                      <Link className="text-primary font-bold" to="#">
                        Pusat Bantuan
                      </Link>
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl">
                  <div className="flex gap-3">
                    <span className="material-symbols-outlined text-blue-600">
                      info
                    </span>

                    <p className="text-xs text-blue-800 dark:text-blue-300 font-medium">
                      Pendaftaran akan diproses dalam waktu 3-5 hari kerja setelah
                      pengiriman. Anda dapat memantau status melalui dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}