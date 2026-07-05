import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore'
import { db, auth } from '../../firebase/config'
import StudentHeader from './StudentHeader'
import StudentFooter from './StudentFooter'

export default function RegistrationLayout() {
  const [formData, setFormData] = useState({
    personalData: {
      fullName: '',
      nisn: '',
      dob: '',
      gender: '',
      phone: '',
      address: ''
    },
    parentData: {
      fatherName: '',
      fatherPhone: '',
      fatherJob: '',
      motherName: '',
      motherPhone: '',
      motherJob: ''
    },
    documents: {
      photo: null,
      reportCard: null,
      healthCert: null,
      extraCert: null
    }
  });

  const [checking, setChecking] = useState(true)
  const [isAllowed, setIsAllowed] = useState(false)
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    const user = auth.currentUser
    if (!user) {
      setChecking(false)
      return
    }

    // 1. Listen ke settings pendaftaran secara real-time
    const settingsRef = doc(db, 'settings', 'recruitment')
    const unsubscribeSettings = onSnapshot(settingsRef, async (settingsDoc) => {
      let currentSettings = {
        registrationOpen: true,
        openTime: '2024-05-01T08:00',
        closeTime: '2024-08-30T23:59',
        periodName: 'Periode Penerimaan 2024/2025'
      }

      if (settingsDoc.exists()) {
        currentSettings = settingsDoc.data()
      }
      setSettings(currentSettings)

      // 2. Cek apakah user sudah memiliki dokumen pendaftaran (termasuk draft)
      try {
        const q = query(
          collection(db, 'applications'),
          where('userId', '==', user.uid)
        )
        const snap = await getDocs(q)
        const hasApp = !snap.empty

        if (hasApp) {
          // Boleh lanjut melengkapi jika sudah punya data / draft sebelumnya
          setIsAllowed(true)
          const appData = snap.docs[0].data()
          setFormData({
            personalData: {
              fullName: appData.personalData?.fullName || '',
              nisn: appData.personalData?.nisn || '',
              dob: appData.personalData?.dob || '',
              gender: appData.personalData?.gender || '',
              phone: appData.personalData?.phone || '',
              address: appData.personalData?.address || ''
            },
            parentData: {
              fatherName: appData.parentData?.fatherName || '',
              fatherPhone: appData.parentData?.fatherPhone || '',
              fatherJob: appData.parentData?.fatherJob || '',
              motherName: appData.parentData?.motherName || '',
              motherPhone: appData.parentData?.motherPhone || '',
              motherJob: appData.parentData?.motherJob || ''
            },
            documents: {
              photo: appData.documents?.photo || null,
              reportCard: appData.documents?.reportCard || null,
              healthCert: appData.documents?.healthCert || null,
              extraCert: appData.documents?.extraCert || null
            }
          })
        } else {
          // Hanya izinkan pendaftar baru jika flag aktif & berada di rentang waktu
          const now = new Date()
          const openDate = new Date(currentSettings.openTime)
          const closeDate = new Date(currentSettings.closeTime)
          const withinTime = now >= openDate && now <= closeDate
          const active = currentSettings.registrationOpen && withinTime
          setIsAllowed(active)
        }
      } catch (error) {
        console.error('Error checking application permission:', error)
      } finally {
        setChecking(false)
      }
    })

    return () => unsubscribeSettings()
  }, [])

  const updateFormData = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  if (checking) {
    return (
      <div className="bg-surface text-on-surface antialiased min-h-screen flex flex-col font-body">
        <StudentHeader />
        <div className="flex-grow flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-on-surface-variant font-medium">Memeriksa status pendaftaran...</p>
          </div>
        </div>
        <StudentFooter />
      </div>
    )
  }

  if (!isAllowed) {
    return (
      <div className="bg-surface text-on-surface antialiased min-h-screen flex flex-col font-body">
        <StudentHeader />
        <main className="flex-grow flex items-center justify-center px-4 py-20 relative overflow-hidden">
          {/* Decorative mesh bg */}
          <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(#0050cb 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="relative z-10 w-full max-w-lg bg-surface-container-lowest rounded-[2rem] p-8 md:p-10 shadow-[0px_20px_50px_rgba(0,0,0,0.04)] border border-outline-variant/15 text-center space-y-6">
            <div className="w-20 h-20 bg-error-container/20 text-error rounded-full flex items-center justify-center mx-auto mb-2 border border-error/10">
              <span className="material-symbols-outlined text-4xl">lock</span>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold tracking-tight text-on-surface">Pendaftaran Ditutup</h2>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Mohon maaf, periode pendaftaran untuk {settings?.periodName || 'Periode Ini'} saat ini sedang tidak aktif atau telah ditutup.
              </p>
            </div>

            <div className="bg-surface-container-high/50 p-4 rounded-2xl border border-outline-variant/20 text-left space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold text-on-surface-variant">
                <span>Waktu Pembukaan:</span>
                <span className="text-on-surface font-bold">
                  {settings?.openTime ? new Date(settings.openTime).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold text-on-surface-variant">
                <span>Waktu Penutupan:</span>
                <span className="text-on-surface font-bold">
                  {settings?.closeTime ? new Date(settings.closeTime).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                </span>
              </div>
            </div>

            <p className="text-xs text-outline">
              Hubungi panitia penerimaan jika Anda merasa ini adalah kesalahan atau memerlukan bantuan lebih lanjut.
            </p>

            <div className="pt-2">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full bg-primary hover:bg-primary-container text-white font-bold py-3 px-6 rounded-xl text-sm transition-all active:scale-95 shadow-md shadow-primary/10"
              >
                Kembali ke Dashboard
              </button>
            </div>
          </div>
        </main>
        <StudentFooter />
      </div>
    )
  }

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen flex flex-col font-body">
      {/* Centralized Student Navigation */}
      <StudentHeader />

      {/* Renders specific step form (PersonalData, ParentData, Docs, etc) and passes context */}
      <Outlet context={{ formData, updateFormData }} />

      {/* Centralized Student Footer & Mobile BottomNav */}
      <StudentFooter />
    </div>
  )
}

