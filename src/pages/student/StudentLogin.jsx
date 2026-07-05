import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth'
import { doc, getDoc, getDocs, setDoc, collection, query, where, serverTimestamp } from 'firebase/firestore'
import { toast } from 'sonner'
import { auth, db, googleProvider } from '../../firebase/config'

export default function StudentLogin() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  // Auto-fill email dari register jika user klik "Lupa Password?"
  useEffect(() => {
    const savedEmail = sessionStorage.getItem('resetEmail')
    if (savedEmail) {
      setEmail(savedEmail)
      setResetMode(true)
      sessionStorage.removeItem('resetEmail')
    }
  }, [])

  // Auto-redirect jika sudah login sebagai siswa
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists() && userDoc.data().role === 'student') {
          navigate('/dashboard', { replace: true })
        }
      }
    })
    return () => unsubscribe()
  }, [navigate])

  const handleLogin = async (e) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Email dan password wajib diisi.')
      return
    }

    setLoading(true)

    try {
      // Step 1: Login ke Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password)
      const user = userCredential.user

      // Step 2: Cek dokumen Firestore (pisah try-catch agar error Firestore tidak
      // tercampur dengan error Auth dan tidak tampil pesan "cek internet" palsu)
      let userDoc = null
      let userRole = null

      try {
        // Cari dulu by UID (cara normal dari register via app)
        const docByUid = await getDoc(doc(db, 'users', user.uid))

        if (docByUid.exists()) {
          userDoc = docByUid
          userRole = docByUid.data().role
        } else {
          // Fallback: cari by field email (untuk dokumen yang dibuat manual di Firestore)
          const q = query(
            collection(db, 'users'),
            where('email', '==', user.email)
          )
          const snapshot = await getDocs(q)

          if (!snapshot.empty) {
            userDoc = snapshot.docs[0]
            userRole = snapshot.docs[0].data().role
            console.info('User ditemukan via email fallback. Doc ID:', snapshot.docs[0].id)
          }
        }
      } catch (firestoreError) {
        console.warn('Gagal baca Firestore users:', firestoreError.code)
        // Firestore rules mungkin memblokir — tetap izinkan masuk karena Auth berhasil
        toast.success('Login berhasil!')
        navigate('/dashboard', { replace: true })
        return
      }

      if (userDoc && userRole === 'student') {
        toast.success('Login berhasil!')
        navigate('/dashboard', { replace: true })
      } else if (!userDoc) {
        // Akun ada di Auth tapi dokumen Firestore belum ada (orphan account)
        // Buat ulang dokumen Firestore-nya
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            fullName: user.displayName || 'Siswa',
            email: user.email,
            role: 'student',
            createdAt: serverTimestamp()
          })
          toast.success('Akun ditemukan! Silakan lengkapi data pendaftaran.')
          navigate('/step1', { replace: true })
        } catch {
          // Kalau setDoc juga gagal, tetap masuk ke dashboard
          toast.success('Login berhasil!')
          navigate('/dashboard', { replace: true })
        }
      } else {
        await signOut(auth)
        toast.error('Akses ditolak. Akun ini bukan akun Siswa.')
      }
    } catch (error) {
      console.error('Login siswa gagal:', error.code, error.message)

      // Firebase v9+ menggunakan auth/invalid-credential untuk password salah
      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/user-not-found'
      ) {
        toast.error('Email atau password salah. Gunakan "Lupa password?" jika perlu.')
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Akun sementara dikunci karena terlalu banyak percobaan. Gunakan "Lupa password?" untuk reset.')
      } else if (error.code === 'auth/network-request-failed') {
        toast.error('Koneksi internet bermasalah. Periksa koneksi dan coba lagi.')
      } else if (error.code === 'auth/user-disabled') {
        toast.error('Akun ini telah dinonaktifkan. Hubungi admin.')
      } else {
        toast.error(`Login gagal (${error.code || 'unknown'}). Coba lagi atau gunakan fitur reset password.`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user

      const userDocRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        const role = userDoc.data().role
        if (role === 'student') {
          toast.success('Login berhasil!')
          navigate('/dashboard', { replace: true })
        } else {
          await signOut(auth)
          toast.error('Akses ditolak. Akun ini bukan akun Siswa.')
        }
      } else {
        // User Google baru — buat dokumen Firestore
        await setDoc(userDocRef, {
          uid: user.uid,
          fullName: user.displayName || 'Siswa',
          email: user.email,
          role: 'student',
          photoURL: user.photoURL || null,
          provider: 'google',
          createdAt: serverTimestamp()
        })
        toast.success('Akun Google terhubung! Silakan lengkapi data pendaftaran.')
        navigate('/step1', { replace: true })
      }
    } catch (error) {
      console.error('Google login gagal:', error)
      if (error.code === 'auth/popup-closed-by-user') {
        // User menutup popup, tidak perlu toast
      } else if (error.code === 'auth/network-request-failed') {
        toast.error('Koneksi internet bermasalah. Coba lagi.')
      } else {
        toast.error('Login dengan Google gagal. Coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()

    if (!email.trim()) {
      toast.error('Masukkan email terlebih dahulu.')
      return
    }

    setResetLoading(true)

    try {
      await sendPasswordResetEmail(auth, email.trim())
      toast.success('Link reset password sudah dikirim! Cek email kamu (termasuk folder spam).')
      setResetMode(false)
    } catch (error) {
      console.error('Reset password gagal:', error)
      if (error.code === 'auth/user-not-found') {
        toast.error('Email tidak terdaftar.')
      } else {
        toast.error('Gagal mengirim email reset. Coba lagi.')
      }
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-6 bg-surface">
      <section className="w-full max-w-sm bg-surface-container-lowest rounded-2xl px-6 py-5 shadow-[0px_8px_32px_rgba(26,28,28,0.10)]">
        <div className="text-center mb-4">
          <div className="flex justify-center mb-1">
            <dotlottie-wc
              src="https://lottie.host/f86dbdce-6ed1-4ce5-826a-0d5f4299d980/h1FDGZRW0f.lottie"
              style={{ width: '90px', height: '90px' }}
              autoplay
              loop
            ></dotlottie-wc>
          </div>

          <h1 className="text-lg font-bold text-on-surface">
            {resetMode ? 'Reset Password' : 'Login Siswa'}
          </h1>

          <p className="text-xs text-on-surface-variant mt-0.5">
            {resetMode
              ? 'Masukkan email untuk menerima link reset.'
              : 'Masuk untuk melihat status pendaftaran.'}
          </p>
        </div>

        {resetMode ? (
          /* ── Mode Reset Password ── */
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">
                Email
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={resetLoading}
              className="w-full py-2.5 text-sm rounded-xl bg-primary text-on-primary font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {resetLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  Mengirim...
                </>
              ) : (
                'Kirim Link Reset'
              )}
            </button>

            <button
              type="button"
              onClick={() => setResetMode(false)}
              className="w-full py-2 text-sm rounded-xl bg-surface-container text-on-surface font-bold hover:bg-surface-container-high active:scale-95 transition-all"
            >
              Kembali ke Login
            </button>
          </form>
        ) : (
          /* ── Mode Login Normal ── */
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Email
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 text-sm rounded-xl bg-surface-container border border-outline-variant outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-on-surface">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setResetMode(true)}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  Lupa password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-3 py-2 pr-10 text-sm rounded-xl bg-surface-container border border-outline-variant outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm rounded-xl bg-primary text-on-primary font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  Memproses...
                </>
              ) : (
                'Login'
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-outline-variant/40" />
              <span className="text-xs text-on-surface-variant font-medium">atau</span>
              <div className="flex-1 h-px bg-outline-variant/40" />
            </div>

            {/* Tombol Google */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-2 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest hover:bg-surface-container active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2 font-semibold text-on-surface"
            >
              <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Lanjutkan dengan Google
            </button>
          </form>
        )}

        {!resetMode && (
          <p className="text-center text-xs text-on-surface-variant mt-4">
            Belum punya akun?{' '}
            <Link to="/register-siswa" className="font-bold text-primary hover:underline">
              Daftar di sini
            </Link>
          </p>
        )}

        <div className="mt-4 pt-3 border-t border-outline-variant/30 text-center">
          <Link
            to="/admin-login"
            className="inline-flex items-center gap-1.5 text-xs text-outline hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
            Masuk sebagai Admin
          </Link>
        </div>
      </section>
    </main>
  )
}