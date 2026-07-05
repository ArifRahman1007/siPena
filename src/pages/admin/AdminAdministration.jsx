import React, { useState, useEffect } from 'react'
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, serverTimestamp } from 'firebase/firestore'
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { toast } from 'sonner'
import { db, auth } from '../../firebase/config'

export default function AdminAdministration() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [ready, setReady] = useState(false)
  const [settings, setSettings] = useState({
    periodName: 'Periode Penerimaan 2025/2026',
    openTime: '2025-07-01T08:00',
    closeTime: '2025-09-30T23:59',
    registrationOpen: true,
    minGrade: 80.0,
    quota: 2500,
    otpEnabled: true,
    whatsappGroupLink: 'https://wa.me/6289987654310'
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'recruitment')
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          setSettings({
            periodName: data.periodName || 'Periode Penerimaan 2025/2026',
            openTime: data.openTime || '2025-07-01T08:00',
            closeTime: data.closeTime || '2025-09-30T23:59',
            registrationOpen: data.registrationOpen !== undefined ? data.registrationOpen : true,
            minGrade: data.minGrade ?? 80.0,
            quota: data.quota || 2500,
            otpEnabled: data.otpEnabled !== undefined ? data.otpEnabled : true,
            whatsappGroupLink: data.whatsappGroupLink || 'https://wa.me/6289987654310'
          })
        } else {
          // Buat nilai default di Firestore jika belum ada
          await setDoc(docRef, {
            periodName: 'Periode Penerimaan 2025/2026',
            openTime: '2025-07-01T08:00',
            closeTime: '2025-09-30T23:59',
            registrationOpen: true,
            minGrade: 80.0,
            quota: 2500,
            otpEnabled: true,
            whatsappGroupLink: 'https://wa.me/6289987654310',
            updatedAt: serverTimestamp()
          })
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
        toast.error('Gagal memuat konfigurasi sistem.')
      } finally {
        setLoading(false)
        setTimeout(() => setReady(true), 80)
      }
    }
    fetchSettings()
  }, [])

  const handleSaveSettings = async () => {
    if (saving) return
    setSaving(true)
    try {
      const docRef = doc(db, 'settings', 'recruitment')
      await updateDoc(docRef, {
        periodName: settings.periodName,
        openTime: settings.openTime,
        closeTime: settings.closeTime,
        minGrade: Number(settings.minGrade),
        quota: Number(settings.quota),
        otpEnabled: settings.otpEnabled,
        whatsappGroupLink: settings.whatsappGroupLink || 'https://wa.me/6289987654310',
        updatedAt: serverTimestamp()
      })
      toast.success('Pengaturan administrasi berhasil disimpan!')
    } catch (error) {
      console.error('Error updating settings:', error)
      toast.error('Gagal menyimpan perubahan. Cek koneksi internet.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleForceStop = async () => {
    if (saving) return
    const action = settings.registrationOpen ? 'menonaktifkan (Force Stop)' : 'mengaktifkan kembali'

    toast(`Konfirmasi: ${action} pendaftaran baru?`, {
      action: {
        label: 'Ya, Lanjutkan',
        onClick: async () => {
          setSaving(true)
          try {
            const docRef = doc(db, 'settings', 'recruitment')
            const newStatus = !settings.registrationOpen
            await updateDoc(docRef, {
              registrationOpen: newStatus,
              updatedAt: serverTimestamp()
            })
            setSettings(prev => ({ ...prev, registrationOpen: newStatus }))
            toast.success(`Pendaftaran berhasil ${newStatus ? 'diaktifkan kembali' : 'dinonaktifkan (Force Stop)'}!`)
          } catch (error) {
            console.error('Error toggling registrationOpen:', error)
            toast.error('Gagal mengubah status pendaftaran.')
          } finally {
            setSaving(false)
          }
        }
      },
      cancel: {
        label: 'Batal',
        onClick: () => {}
      }
    })
  }

  const isLive = (() => {
    if (!settings.registrationOpen) return false
    const now = new Date()
    const openDate = new Date(settings.openTime)
    const closeDate = new Date(settings.closeTime)
    return now >= openDate && now <= closeDate
  })()

  const formatDateTime = (val) => {
    if (!val) return '-'
    try {
      return new Date(val).toLocaleString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    } catch {
      return val
    }
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-on-surface-variant font-semibold">Memuat konfigurasi sistem...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-on-surface mb-1">Administrasi Sistem</h1>
        <p className="text-on-surface-variant text-sm">
          Kelola periode rekrutmen, kuota penerimaan, dan pengaturan sistem.
        </p>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {[
          {
            key: 'status',
            content: (
              <>
                <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl" />
                <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Status Sistem</p>
                <h2 className="text-3xl font-extrabold">{isLive ? 'AKTIF' : 'NONAKTIF'}</h2>
                <p className="text-sm mt-2 opacity-90">
                  {isLive ? 'Pendaftaran sedang berjalan.' : settings.registrationOpen ? 'Di luar jadwal waktu.' : 'Force Stop diaktifkan.'}
                </p>
              </>
            ),
            className: `rounded-2xl p-5 shadow-[0px_12px_32px_rgba(26,28,28,0.06)] relative overflow-hidden ${isLive ? 'bg-green-500 text-white' : 'bg-error text-white'}`
          },
          {
            key: 'open',
            content: (
              <>
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined">event</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Pembukaan</p>
                <p className="text-sm font-bold text-on-surface mt-1">{formatDateTime(settings.openTime)}</p>
              </>
            ),
            className: 'bg-surface-container-lowest rounded-2xl p-5 shadow-[0px_12px_32px_rgba(26,28,28,0.06)]'
          },
          {
            key: 'close',
            content: (
              <>
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined">event_busy</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Penutupan</p>
                <p className="text-sm font-bold text-on-surface mt-1">{formatDateTime(settings.closeTime)}</p>
              </>
            ),
            className: 'bg-surface-container-lowest rounded-2xl p-5 shadow-[0px_12px_32px_rgba(26,28,28,0.06)]'
          }
        ].map((card, i) => (
          <div
            key={card.key}
            className={card.className}
            style={{
              opacity: ready ? 1 : 0,
              transform: ready ? 'translateY(0)' : 'translateY(18px)',
              transition: `opacity 0.45s ease ${i * 80}ms, transform 0.45s ease ${i * 80}ms`
            }}
          >
            {card.content}
          </div>
        ))}
      </div>

      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        style={{
          opacity: ready ? 1 : 0,
          transform: ready ? 'translateY(0)' : 'translateY(14px)',
          transition: 'opacity 0.5s ease 0.25s, transform 0.5s ease 0.25s'
        }}
      >
        {/* Periode Penerimaan */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0px_12px_32px_rgba(26,28,28,0.06)] border border-outline-variant/15 relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-1 ${isLive ? 'bg-green-500' : 'bg-error'}`}></div>

          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold text-on-surface">Periode Penerimaan</h3>
              <p className="text-xs text-on-surface-variant mt-1">Atur nama dan jadwal periode rekrutmen.</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              isLive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {isLive ? 'Aktif' : 'Tidak Aktif'}
            </span>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Nama Periode</label>
              <input
                type="text"
                value={settings.periodName}
                onChange={(e) => setSettings(prev => ({ ...prev, periodName: e.target.value }))}
                className="w-full bg-surface-container-high rounded-xl border-none focus:ring-2 focus:ring-primary/20 text-base font-bold text-on-surface py-3 px-4 outline-none"
                placeholder="Contoh: Periode Penerimaan 2025/2026"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Waktu Pembukaan</label>
                <input
                  type="datetime-local"
                  value={settings.openTime}
                  onChange={(e) => setSettings(prev => ({ ...prev, openTime: e.target.value }))}
                  className="w-full bg-surface-container-high rounded-xl border-none focus:ring-2 focus:ring-primary/20 text-sm py-3 px-4 font-medium text-on-surface outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Waktu Penutupan</label>
                <input
                  type="datetime-local"
                  value={settings.closeTime}
                  onChange={(e) => setSettings(prev => ({ ...prev, closeTime: e.target.value }))}
                  className="w-full bg-surface-container-high rounded-xl border-none focus:ring-2 focus:ring-primary/20 text-sm py-3 px-4 font-medium text-on-surface outline-none"
                />
              </div>
            </div>
          </div>

          {/* Force Stop */}
          <div className="mt-6 flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-200/50">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-red-600">power_settings_new</span>
              <div>
                <p className="font-bold text-on-surface text-sm">Force Stop Registration</p>
                <p className="text-xs text-on-surface-variant">Matikan/nyalakan pendaftaran secara instan.</p>
              </div>
            </div>
            <button
              onClick={handleToggleForceStop}
              disabled={saving}
              className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-60 ${
                settings.registrationOpen
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {settings.registrationOpen ? 'Force Stop' : 'Aktifkan'}
            </button>
          </div>
        </div>

        {/* Konfigurasi Akademik */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0px_12px_32px_rgba(26,28,28,0.06)] border border-outline-variant/15">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-on-surface">Konfigurasi Akademik</h3>
            <p className="text-xs text-on-surface-variant mt-1">Atur kuota, nilai minimum, dan fitur keamanan.</p>
          </div>

          <div className="space-y-5">
            {/* Grid 2 kolom: Nilai Minimum + Kuota */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Nilai Minimum</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={settings.minGrade}
                    onChange={(e) => setSettings(prev => ({ ...prev, minGrade: e.target.value }))}
                    className="w-full bg-surface-container-high rounded-xl border-none font-bold text-on-surface py-3 px-4 pr-14 focus:ring-2 focus:ring-primary/30 outline-none text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-outline pointer-events-none">/ 100</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Target Kuota</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={settings.quota}
                    onChange={(e) => setSettings(prev => ({ ...prev, quota: e.target.value }))}
                    className="w-full bg-surface-container-high rounded-xl border-none font-bold text-on-surface py-3 px-4 pr-16 focus:ring-2 focus:ring-primary/30 outline-none text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-outline pointer-events-none">siswa</span>
                </div>
              </div>
            </div>

            {/* OTP Toggle */}
            <div className="flex justify-between items-center pt-1 border-t border-outline-variant/20">
              <div>
                <h4 className="font-bold text-on-surface text-sm">Verifikasi 2 Langkah (OTP)</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">Wajibkan PIN OTP email ke pendaftar.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.otpEnabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, otpEnabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Link WhatsApp Group */}
            <div className="space-y-2 pt-4 border-t border-outline-variant/20">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Link WhatsApp Group Koordinasi</label>
              <div className="relative">
                <input
                  type="url"
                  value={settings.whatsappGroupLink}
                  onChange={(e) => setSettings(prev => ({ ...prev, whatsappGroupLink: e.target.value }))}
                  className="w-full bg-surface-container-high rounded-xl border-none font-semibold text-on-surface py-3 px-4 focus:ring-2 focus:ring-primary/30 outline-none text-sm"
                  placeholder="https://chat.whatsapp.com/... atau https://wa.me/..."
                />
              </div>
              <p className="text-[10px] text-on-surface-variant">Tautan ini digunakan oleh calon siswa baru untuk bergabung ke grup WhatsApp resmi koordinasi.</p>
            </div>
          </div>

        </div>
      </div>

      {/* Tombol Simpan — full width, di luar kedua card */}
      <button
        onClick={handleSaveSettings}
        disabled={saving}
        className="mt-6 bg-primary text-white hover:opacity-90 disabled:opacity-60 font-bold py-3.5 px-8 rounded-xl text-sm transition-all w-full flex items-center justify-center gap-2"
      >
        {saving ? (
          <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Menyimpan...</>
        ) : (
          <><span className="material-symbols-outlined text-lg">save</span>Simpan Perubahan</>
        )}
      </button>

      {/* ─── Kelola Admin ─────────────────────────────────────────── */}
      <AdminManager />
    </div>
  )
}

// ─── Komponen Kelola Admin ────────────────────────────────────────────────────
function AdminManager() {
  const [admins, setAdmins] = useState([])
  const [loadingAdmins, setLoadingAdmins] = useState(true)
  const [form, setForm] = useState({ email: '', fullName: '' })
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const fetchAdmins = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')))
      setAdmins(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) {
      console.error('Gagal fetch admin:', e)
    } finally {
      setLoadingAdmins(false)
    }
  }

  useEffect(() => { fetchAdmins() }, [])

  const handleAddAdmin = async (e) => {
    e.preventDefault()
    if (!form.email || !form.fullName) {
      toast.error('Nama dan email wajib diisi.')
      return
    }

    setAdding(true)
    try {
      // Buat akun dengan password acak — admin baru tidak tahu ini
      const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!'
      const credential = await createUserWithEmailAndPassword(auth, form.email, tempPassword)
      const uid = credential.user.uid

      // Simpan role admin ke Firestore
      await setDoc(doc(db, 'users', uid), {
        uid,
        email: form.email,
        fullName: form.fullName,
        role: 'admin',
        createdAt: serverTimestamp()
      })

      // Kirim email reset password — admin baru set password sendiri
      await sendPasswordResetEmail(auth, form.email)

      toast.success(`Admin "${form.fullName}" ditambahkan! Email aktivasi telah dikirim ke ${form.email}`)
      setForm({ email: '', fullName: '' })
      setShowForm(false)
      fetchAdmins()
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Email sudah terdaftar. Gunakan email lain.')
      } else {
        toast.error('Gagal menambahkan admin: ' + error.message)
      }
      console.error(error)
    } finally {
      setAdding(false)
    }
  }

  const handleRevokeAdmin = async (adminId, adminName) => {
    toast(`Cabut akses admin "${adminName}"?`, {
      action: {
        label: 'Ya, Cabut',
        onClick: async () => {
          try {
            await updateDoc(doc(db, 'users', adminId), { role: 'revoked' })
            toast.success(`Akses admin "${adminName}" dicabut.`)
            fetchAdmins()
          } catch (e) {
            toast.error('Gagal mencabut akses.')
          }
        }
      },
      cancel: { label: 'Batal', onClick: () => {} }
    })
  }

  return (
    <div className="mt-8 bg-surface-container-lowest p-6 rounded-2xl shadow-[0px_12px_32px_rgba(26,28,28,0.06)] border border-outline-variant/15">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-on-surface">Kelola Admin</h3>
          <p className="text-xs text-on-surface-variant mt-1">Tambah atau cabut akses akun admin.</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-base">{showForm ? 'close' : 'person_add'}</span>
          {showForm ? 'Batal' : 'Tambah Admin'}
        </button>
      </div>

      {/* Form tambah admin */}
      {showForm && (
        <form onSubmit={handleAddAdmin} className="mb-6 p-5 rounded-xl bg-primary/5 border border-primary/10 space-y-4">
          <p className="text-sm font-bold text-on-surface">Data Admin Baru</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Nama Lengkap</label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                placeholder="Hakim Rahman"
                className="w-full bg-white rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="admin@sekolah.com"
                className="w-full bg-white rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-on-surface-variant bg-white border border-outline-variant/20 rounded-xl px-4 py-3">
            <span className="material-symbols-outlined text-primary text-base">mail</span>
            Admin baru akan menerima email untuk mengatur password mereka sendiri.
          </div>
          <button
            type="submit"
            disabled={adding}
            className="px-6 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-all flex items-center gap-2"
          >
            {adding ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Menambahkan...</>
            ) : (
              <><span className="material-symbols-outlined text-base">check</span>Simpan Admin</>
            )}
          </button>
        </form>
      )}

      {/* Daftar admin */}
      {loadingAdmins ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : admins.length === 0 ? (
        <p className="text-sm text-on-surface-variant text-center py-6">Belum ada data admin.</p>
      ) : (
        <div className="space-y-3">
          {admins.map((admin) => (
            <div key={admin.id} className="flex items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-outline-variant/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {(admin.fullName || admin.email || 'A')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm text-on-surface">{admin.fullName || '—'}</p>
                  <p className="text-xs text-on-surface-variant">{admin.email}</p>
                </div>
              </div>
              <button
                onClick={() => handleRevokeAdmin(admin.id, admin.fullName || admin.email)}
                className="text-xs text-red-500 hover:text-red-700 font-bold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">person_remove</span>
                Cabut Akses
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
