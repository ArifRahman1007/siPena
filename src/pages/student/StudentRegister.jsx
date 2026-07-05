import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, updateProfile, signOut, signInWithPopup } from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { toast } from 'sonner'
import { auth, db, googleProvider } from '../../firebase/config'

export default function StudentRegister() {
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailExists, setEmailExists] = useState(false)

  const getFirebaseErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return null // ditangani khusus lewat UI banner
      case 'auth/invalid-email':
        return 'Format email tidak valid. Periksa kembali email yang dimasukkan.'
      case 'auth/weak-password':
        return 'Password terlalu lemah. Gunakan minimal 6 karakter.'
      case 'auth/operation-not-allowed':
        return 'Pendaftaran akun sementara dinonaktifkan. Hubungi admin.'
      case 'auth/network-request-failed':
        return 'Koneksi internet bermasalah. Periksa koneksi dan coba lagi.'
      default:
        return 'Gagal membuat akun. Coba beberapa saat lagi.'
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      toast.error('Semua kolom wajib diisi.')
      return
    }

    if (password.length < 6) {
      toast.error('Password minimal 6 karakter.')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok.')
      return
    }

    setEmailExists(false)
    setLoading(true)

    try {
      // Sign out terlebih dahulu jika ada user yang sedang login
      // agar tidak terjadi konflik auth state (misalnya masih login sebagai admin)
      if (auth.currentUser) {
        await signOut(auth)
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      )

      const user = userCredential.user

      // 1. Update Profile Auth
      await updateProfile(user, {
        displayName: fullName.trim()
      })

      // 2. Simpan ke Firestore users collection
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        fullName: fullName.trim(),
        email: email.trim(),
        role: 'student',
        createdAt: serverTimestamp()
      })

      localStorage.setItem('studentName', fullName.trim())

      toast.success('Akun berhasil dibuat! Silakan lengkapi data pendaftaran.')
      navigate('/step1')
    } catch (error) {
      console.error('Gagal daftar siswa:', error)
      if (error.code === 'auth/email-already-in-use') {
        setEmailExists(true)
      } else {
        const message = getFirebaseErrorMessage(error.code)
        if (message) toast.error(message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    setLoading(true)
    try {
      if (auth.currentUser) {
        await signOut(auth)
      }

      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user

      const userDocRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        // Akun sudah ada, langsung arahkan ke dashboard
        toast.info('Akun Google kamu sudah terdaftar. Dialihkan ke dashboard...')
        navigate('/dashboard', { replace: true })
      } else {
        // Buat dokumen Firestore baru
        await setDoc(userDocRef, {
          uid: user.uid,
          fullName: user.displayName || 'Siswa',
          email: user.email,
          role: 'student',
          photoURL: user.photoURL || null,
          provider: 'google',
          createdAt: serverTimestamp()
        })
        localStorage.setItem('studentName', user.displayName || 'Siswa')
        toast.success('Akun Google terhubung! Silakan lengkapi data pendaftaran.')
        navigate('/step1')
      }
    } catch (error) {
      console.error('Google register gagal:', error)
      if (error.code === 'auth/popup-closed-by-user') {
        // User menutup popup, tidak perlu toast
      } else if (error.code === 'auth/network-request-failed') {
        toast.error('Koneksi internet bermasalah. Coba lagi.')
      } else {
        toast.error('Daftar dengan Google gagal. Coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-6 bg-surface">
      <section className="w-full max-w-sm bg-surface-container-lowest rounded-2xl px-6 py-5 shadow-[0px_8px_32px_rgba(26,28,28,0.10)]">
        {/* Banner: email sudah terdaftar */}
        {emailExists && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-600 text-xl mt-0.5">info</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-800 mb-1">
                  Email ini sudah pernah didaftarkan
                </p>
                <p className="text-xs text-amber-700 mb-3 leading-relaxed">
                  Akun dengan email <span className="font-mono font-bold">{email}</span> sudah ada.
                  Silakan login langsung, atau reset password jika kamu lupa.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <a
                    href={`/login-siswa`}
                    className="flex-1 py-2 px-3 rounded-xl bg-primary text-on-primary text-xs font-bold text-center hover:opacity-90 transition-opacity"
                  >
                    Login Sekarang
                  </a>
                  <a
                    href={`/login-siswa`}
                    onClick={() => sessionStorage.setItem('resetEmail', email)}
                    className="flex-1 py-2 px-3 rounded-xl bg-amber-100 text-amber-800 text-xs font-bold text-center hover:bg-amber-200 transition-colors"
                  >
                    Lupa Password?
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mb-4">
          <div className="flex justify-center mb-1">
            <dotlottie-wc
              src="https://lottie.host/fed5f240-c8e4-4abe-a6b8-a1b49165c0ae/r3LCpt8YHS.lottie"
              style={{ width: '90px', height: '90px' }}
              autoplay
              loop
            ></dotlottie-wc>
          </div>

          <h1 className="text-lg font-bold text-on-surface">
            Daftar Akun Siswa
          </h1>

          <p className="text-xs text-on-surface-variant mt-0.5">
            Buat akun untuk mengirim dan memantau pendaftaran.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-3">
          {/* Nama Lengkap */}
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">
              Nama Lengkap
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 text-sm rounded-xl bg-surface-container border border-outline-variant outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Masukkan nama lengkap"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
            />
          </div>

          {/* Email */}
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

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full px-3 py-2 pr-10 text-sm rounded-xl bg-surface-container border border-outline-variant outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
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

          {/* Konfirmasi Password */}
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">
              Konfirmasi Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className={`w-full px-4 py-3 pr-12 rounded-xl bg-surface-container border outline-none focus:ring-2 transition-colors ${
                  confirmPassword && confirmPassword !== password
                    ? 'border-red-400 focus:ring-red-200'
                    : confirmPassword && confirmPassword === password
                      ? 'border-green-400 focus:ring-green-200'
                      : 'border-outline-variant focus:ring-primary/20'
                }`}
                placeholder="Ulangi password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                tabIndex={-1}
              >
                <span className="material-symbols-outlined text-xl">
                  {showConfirmPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {confirmPassword && confirmPassword !== password && (
              <p className="text-xs text-red-500 mt-1.5 font-medium">
                Password tidak cocok
              </p>
            )}
            {confirmPassword && confirmPassword === password && (
              <p className="text-xs text-green-600 mt-1.5 font-medium">
                Password cocok ✓
              </p>
            )}
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
              'Daftar Sekarang'
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
            onClick={handleGoogleRegister}
            disabled={loading}
            className="w-full py-2 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest hover:bg-surface-container active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2 font-semibold text-on-surface"
          >
            <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Daftar dengan Google
          </button>
        </form>

        <p className="text-center text-xs text-on-surface-variant mt-4">
          Sudah punya akun?{' '}
          <Link to="/login-siswa" className="font-bold text-primary hover:underline">
            Login di sini
          </Link>
        </p>
      </section>
    </main>
  )
}