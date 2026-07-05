import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { toast } from 'sonner'
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore'
import { db } from '../../firebase/config'

export default function AdminScanning() {
  const navigate = useNavigate()

  const scannerRef = useRef(null)
  const isScanningRef = useRef(false)
  const hasScannedRef = useRef(false)

  const [scanInput, setScanInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Trigger entrance animation immediately on mount
    const t = setTimeout(() => setReady(true), 60)
    return () => {
      clearTimeout(t)
      stopCamera()
    }
  }, [])

  const getName = (item) => {
    return (
      item?.personalData?.fullName ||
      item?.personalData?.name ||
      item?.personalData?.nama ||
      item?.studentName ||
      'Nama belum diisi'
    )
  }

  const getQrDataFromInput = (value) => {
    const trimmedValue = value.trim()

    if (!trimmedValue) {
      return {
        applicationId: '',
        registrationNumber: ''
      }
    }

    // Untuk QR dari dashboard siswa
    if (trimmedValue.startsWith('SIPENA:')) {
      const applicationId = trimmedValue.replace('SIPENA:', '').trim()

      return {
        applicationId,
        registrationNumber: ''
      }
    }

    if (trimmedValue.startsWith('RECRUITHUB:')) {
      const applicationId = trimmedValue.replace('RECRUITHUB:', '').trim()

      return {
        applicationId,
        registrationNumber: ''
      }
    }

    // Untuk QR format JSON
    try {
      const parsed = JSON.parse(trimmedValue)

      return {
        applicationId: parsed.applicationId || parsed.appId || parsed.id || '',
        registrationNumber: parsed.registrationNumber || parsed.nomorRegistrasi || ''
      }
    } catch (error) {
      // Untuk input manual applicationId atau nomor registrasi
      return {
        applicationId: trimmedValue,
        registrationNumber: trimmedValue
      }
    }
  }

  const saveScanHistory = async ({ application, scanStatus }) => {
    await addDoc(collection(db, 'scanHistory'), {
      applicationId: application.id,
      registrationNumber: application.registrationNumber || '',
      fullName: getName(application),
      status: application.status || 'Menunggu Verifikasi',
      scanStatus,
      notes: application.notes || '',
      scannedAt: serverTimestamp()
    })
  }

  const handleCheckQr = async (valueFromCamera = null) => {
    const inputValue = valueFromCamera || scanInput
    const qrData = getQrDataFromInput(inputValue)

    if (!qrData.applicationId && !qrData.registrationNumber) {
      toast.error('Masukkan Application ID atau QR Payload terlebih dahulu.')
      return
    }

    setLoading(true)
    setScanResult(null)

    try {
      let docSnap = null
      let applicationId = qrData.applicationId

      if (applicationId) {
        const docRef = doc(db, 'applications', applicationId)
        docSnap = await getDoc(docRef)
      }

      if (!docSnap || !docSnap.exists()) {
        const registrationQuery = query(
          collection(db, 'applications'),
          where('registrationNumber', '==', qrData.registrationNumber || qrData.applicationId)
        )

        const registrationSnapshot = await getDocs(registrationQuery)

        if (!registrationSnapshot.empty) {
          docSnap = registrationSnapshot.docs[0]
          applicationId = docSnap.id
        }
      }

      if (!docSnap || !docSnap.exists()) {
        setScanResult({
          valid: false,
          title: 'QR Tidak Ditemukan',
          message: 'QR terbaca, tetapi data pendaftar tidak ditemukan di Firebase.',
          application: null
        })

        return
      }

      const application = {
        id: docSnap.id,
        ...docSnap.data()
      }

      const isAccepted = application.status === 'Diterima'
      const scanStatus = isAccepted ? 'Valid' : 'Tidak Valid'
      const docRef = doc(db, 'applications', docSnap.id)

      // ANTI SCAN GANDA
      // Jika QR sudah pernah valid, tampilkan hasil saja.
      // Jangan simpan lagi ke scanHistory.
      if (isAccepted && application.isFinalAccepted === true) {
        setScanResult({
          valid: true,
          title: 'Sudah Diterima dan Tervalidasi',
          message: `Data ${getName(application)} sudah pernah divalidasi sebelumnya. Scan ulang tidak disimpan ke riwayat.`,
          application
        })
        return
      }

      await updateDoc(docRef, {
        scannedAt: isAccepted ? serverTimestamp() : application.scannedAt || null,
        scanStatus,
        finalStatus: isAccepted
          ? 'Diterima dan Tervalidasi'
          : application.finalStatus || '',
        isFinalAccepted: isAccepted
          ? true
          : application.isFinalAccepted || false,
        finalAcceptedAt: isAccepted
          ? serverTimestamp()
          : application.finalAcceptedAt || null,
        updatedAt: serverTimestamp()
      })

      // History hanya tersimpan saat scan pertama
      await saveScanHistory({
        application,
        scanStatus
      })

      setScanResult({
        valid: isAccepted,
        title: isAccepted ? 'QR Valid' : 'QR Tidak Valid',
        message: isAccepted
          ? 'Pendaftar sudah diterima dan QR berhasil diverifikasi.'
          : `QR terbaca, tetapi belum valid karena status pendaftar saat ini: ${
              application.status || 'Menunggu Verifikasi'
            }.`,
        application
      })
    } catch (error) {
      console.error('Gagal memeriksa QR:', error)

      setScanResult({
        valid: false,
        title: 'Gagal Memeriksa QR',
        message: 'QR terbaca, tetapi sistem gagal memeriksa data. Cek koneksi atau Firestore rules.',
        application: null
      })
    } finally {
      setLoading(false)
    }
  }

  const startCamera = async () => {
    if (isScanningRef.current) return

    setCameraLoading(true)
    hasScannedRef.current = false

    try {
      const html5QrCode = new Html5Qrcode('qr-reader')
      scannerRef.current = html5QrCode

      const cameras = await Html5Qrcode.getCameras()

      if (!cameras || cameras.length === 0) {
        toast.error('Kamera tidak ditemukan di perangkat ini.')
        setCameraLoading(false)
        return
      }

      const backCamera =
        cameras.find((camera) =>
          camera.label.toLowerCase().includes('back')
        ) || cameras[0]

      await html5QrCode.start(
        backCamera.id,
        {
          fps: 20,
          qrbox: {
            width: 300,
            height: 300
          },
          aspectRatio: 1.777778,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        },
        async (decodedText) => {
          if (hasScannedRef.current) return

          hasScannedRef.current = true
          setScanInput(decodedText)

          await handleCheckQr(decodedText)

          setTimeout(() => {
            hasScannedRef.current = false
          }, 1500)
        },
        () => {
          // Error scan kecil diabaikan agar kamera tetap jalan.
        }
      )

      isScanningRef.current = true
      setCameraActive(true)
    } catch (error) {
      console.error('Gagal membuka kamera:', error)
      toast.error('Gagal membuka kamera. Pastikan izin kamera sudah diberikan.')
    } finally {
      setCameraLoading(false)
    }
  }

  const stopCamera = async () => {
    try {
      if (scannerRef.current && isScanningRef.current) {
        await scannerRef.current.stop()
        await scannerRef.current.clear()
      }
    } catch (error) {
      console.warn('Kamera sudah berhenti atau belum aktif:', error)
    } finally {
      scannerRef.current = null
      isScanningRef.current = false
      setCameraActive(false)
      setCameraLoading(false)
    }
  }

  const handleUseLastApplication = () => {
    const lastApplicationId = localStorage.getItem('lastApplicationId')

    if (!lastApplicationId) {
      toast.error('Tidak ada applicationId terakhir di browser ini.')
      return
    }

    setScanInput(lastApplicationId)
  }

  return (
    <div className="p-8">
      <header className="mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-on-surface">
            Validasi QR Pendaftar
          </h1>

          <p className="text-on-surface-variant mt-1 text-sm max-w-2xl">
            Scan QR siswa menggunakan kamera, atau masukkan Application ID secara manual.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-nowrap">
          <Link
            to="/verification"
            className="group inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-100 text-slate-700 text-xs font-bold whitespace-nowrap border border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 transition-all duration-200"
          >
            <span className="material-symbols-outlined text-[17px] group-hover:scale-110 transition-transform">
              verified_user
            </span>
            <span>Verifikasi</span>
          </Link>

          <button
            onClick={() => navigate('/scanning/history')}
            className="group inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full bg-blue-600 text-white text-xs font-bold whitespace-nowrap hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/25 active:scale-95 transition-all duration-200"
          >
            <span>Riwayat</span>
            <span className="material-symbols-outlined text-[17px] group-hover:rotate-[-12deg] transition-transform">
              history
            </span>
          </button>
        </div>
      </header>

      <div
        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        style={{
          opacity: ready ? 1 : 0,
          transform: ready ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <section className="lg:col-span-5 bg-surface-container-lowest rounded-2xl p-6 shadow-[0px_12px_32px_rgba(26,28,28,0.06)]">
          <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5">
            <span className="material-symbols-outlined text-4xl">
              qr_code_scanner
            </span>
          </div>

          <h2 className="text-2xl font-extrabold text-on-surface mb-3">
            Scan QR Pendaftar
          </h2>

          <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
            Klik mulai kamera, lalu arahkan kamera ke QR siswa. Jika kamera bermasalah,
            gunakan input manual sebagai backup demo.
          </p>

          <div className="rounded-2xl bg-surface-container p-4 mb-5">
            <div className="relative w-full h-[330px] overflow-hidden rounded-2xl bg-black">
              <div
                id="qr-reader"
                className="w-full h-full overflow-hidden rounded-2xl"
              ></div>

              {cameraActive && (
                <>
                  <div className="absolute inset-0 pointer-events-none bg-black/20"></div>

                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="relative w-[250px] h-[250px]">
                      <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-2xl"></div>
                      <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-2xl"></div>
                      <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-2xl"></div>
                      <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-2xl"></div>

                      <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.9)] animate-pulse"></div>
                    </div>
                  </div>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs font-bold px-4 py-2 rounded-full pointer-events-none">
                    Arahkan QR ke dalam kotak
                  </div>
                </>
              )}

              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="material-symbols-outlined text-5xl text-white/60 mb-3">
                    photo_camera
                  </span>

                  <p className="text-sm text-white/70 font-medium">
                    Kamera belum aktif
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {!cameraActive ? (
              <button
                onClick={startCamera}
                disabled={cameraLoading || loading}
                className="flex-1 py-4 rounded-xl bg-primary text-on-primary font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
              >
                {cameraLoading ? 'Membuka Kamera...' : 'Mulai Kamera'}
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="flex-1 py-4 rounded-xl bg-red-500 text-white font-bold hover:opacity-90 active:scale-95 transition-all"
              >
                Stop Kamera
              </button>
            )}

            <button
              onClick={() => {
                hasScannedRef.current = false
                setScanInput('')
                setScanResult(null)
                setLoading(false)
              }}
              className="flex-1 py-4 rounded-xl bg-surface-container text-on-surface font-bold hover:bg-surface-container-high transition-all"
            >
              Reset Scan
            </button>
          </div>

          <label className="block text-sm font-bold text-on-surface mb-2">
            Application ID / QR Payload Manual
          </label>

          <textarea
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant outline-none focus:ring-2 focus:ring-primary/20 text-sm resize-none"
            placeholder='Contoh: {"applicationId":"abc123","registrationNumber":"SPN-2026-123456"}'
          />

          <div className="flex flex-col sm:flex-row gap-3 mt-5">
            <button
              onClick={() => handleCheckQr()}
              disabled={loading}
              className="flex-1 py-4 rounded-xl bg-primary text-on-primary font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
            >
              {loading ? 'Memeriksa...' : 'Cek Manual'}
            </button>

            <button
              onClick={handleUseLastApplication}
              className="flex-1 py-4 rounded-xl bg-surface-container text-on-surface font-bold hover:bg-surface-container-high transition-all"
            >
              Pakai ID Terakhir
            </button>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Catatan: QR valid hanya jika data ditemukan di Firestore dan status pendaftar adalah
              <span className="font-bold text-primary"> Diterima</span>.
            </p>
          </div>
        </section>

        <section className="lg:col-span-7">
          {!scanResult ? (
            <div className="h-full min-h-[420px] bg-surface-container-lowest rounded-2xl p-6 shadow-[0px_12px_32px_rgba(26,28,28,0.06)] flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-surface-container text-outline flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-4xl">
                  document_scanner
                </span>
              </div>

              <h2 className="text-2xl font-extrabold text-on-surface mb-3">
                Belum Ada Hasil Scan
              </h2>

              <p className="text-on-surface-variant max-w-md">
                Scan QR menggunakan kamera atau masukkan Application ID secara manual.
              </p>
            </div>
          ) : (
            <div
              className={`bg-surface-container-lowest rounded-2xl p-6 shadow-[0px_12px_32px_rgba(26,28,28,0.06)] border ${
                scanResult.valid ? 'border-green-500/30' : 'border-red-500/30'
              }`}
            >
              <div
                className={`w-16 h-16 rounded-xl flex items-center justify-center mb-5 ${
                  scanResult.valid
                    ? 'bg-green-500/10 text-green-600'
                    : 'bg-red-500/10 text-red-600'
                }`}
              >
                <span className="material-symbols-outlined text-5xl">
                  {scanResult.valid ? 'verified' : 'gpp_bad'}
                </span>
              </div>

              <h2 className="text-3xl font-extrabold text-on-surface mb-3">
                {scanResult.title}
              </h2>

              <p className="text-on-surface-variant mb-8">
                {scanResult.message}
              </p>

              {scanResult.application && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-surface-container">
                    <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                      Nama Pendaftar
                    </p>
                    <p className="text-lg font-extrabold text-on-surface">
                      {getName(scanResult.application)}
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-surface-container">
                    <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                      Nomor Registrasi
                    </p>
                    <p className="text-lg font-extrabold text-on-surface font-mono">
                      {scanResult.application.registrationNumber || scanResult.application.id}
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-surface-container">
                    <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                      Status Pendaftar
                    </p>
                    <p
                      className={`text-lg font-extrabold ${
                        scanResult.valid ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {scanResult.application.status || 'Menunggu Verifikasi'}
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-surface-container">
                    <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                      Application ID
                    </p>
                    <p className="text-sm font-bold text-on-surface break-all">
                      {scanResult.application.id}
                    </p>
                  </div>

                  {scanResult.application.notes && (
                    <div className="md:col-span-2 p-5 rounded-2xl bg-surface-container">
                      <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                        Catatan Admin
                      </p>
                      <p className="text-sm text-on-surface-variant leading-relaxed">
                        {scanResult.application.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <button
                  onClick={() => {
                    setScanInput('')
                    setScanResult(null)
                    setLoading(false)
                    hasScannedRef.current = false
                  }}
                  className="flex-1 py-4 rounded-xl bg-primary text-on-primary font-bold hover:opacity-90 active:scale-95 transition-all"
                >
                  Scan Ulang
                </button>

                {scanResult.application && (
                  <Link
                    to={`/verification/detail?id=${scanResult.application.id}`}
                    className="flex-1 py-4 rounded-xl bg-surface-container text-on-surface font-bold hover:bg-surface-container-high transition-all text-center"
                  >
                    Lihat Detail Pendaftar
                  </Link>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}