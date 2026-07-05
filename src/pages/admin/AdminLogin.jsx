import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { toast } from 'sonner'
import { auth, db } from '../../firebase/config'

export default function AdminLogin() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Auto-redirect jika sudah login sebagai admin
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          navigate('/admin', { replace: true })
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // SCRIPT AUTO-PROMOSI ADMIN (Hanya untuk UID kamu)
      // Ini akan otomatis membuat data di Firestore jika belum ada
      if (user.uid === 'uITFo1uFOIeiN12VtKZv68QvoOg2') {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          role: 'admin',
          fullName: 'Super Admin',
          updatedAt: serverTimestamp()
        }, { merge: true })
      }

      // Verifikasi role setelah login
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        toast.success('Login Admin berhasil! Role diperbarui.')
        navigate('/admin', { replace: true })
      } else {
        await signOut(auth)
        toast.error('Akses ditolak. Akun ini bukan akun Admin.')
      }
    } catch (error) {
      console.error('Login admin gagal:', error)
      toast.error('Login gagal. Cek email atau password admin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-20 bg-surface">
      <section className="w-full max-w-md bg-surface-container-lowest rounded-[2rem] p-8 shadow-[0px_20px_60px_rgba(26,28,28,0.08)]">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <dotlottie-wc
              src="https://lottie.host/67805a79-46de-4bf9-b1e2-a99fd9bd77e4/wtvG85D4Ug.lottie"
              style={{ width: '90px', height: '90px' }}
              autoplay
              loop
            ></dotlottie-wc>
          </div>

          <h1 className="text-3xl font-extrabold text-on-surface">
            Login Admin
          </h1>

          <p className="text-on-surface-variant mt-2">
            Masuk untuk mengelola data pendaftar.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">
              Email Admin
            </label>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="admin@ypptgarut.sch.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">
              Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-primary text-on-primary font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
          >
            {loading ? 'Memproses...' : 'Masuk sebagai Admin'}
          </button>
        </form>

        <button
          onClick={() => navigate('/')}
          className="w-full mt-4 py-3 rounded-xl bg-surface-container text-on-surface font-bold hover:bg-surface-container-high transition-all"
        >
          Kembali ke Beranda
        </button>
      </section>
    </main>
  )
}